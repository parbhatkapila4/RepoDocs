import { createHash } from "crypto";

const sha = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

const OLD_CONTENT = "export const rate = 0.05;\n";
const NEW_CONTENT = "export const rate = 0.07;\n";
const FILE = "src/pricing.ts";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    project: { update: jest.fn().mockResolvedValue({}), findUnique: jest.fn() },
    indexingJob: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    sourceCodeEmbeddings: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock("@/lib/github/tarball", () => ({ loadGithubRepository: jest.fn() }));
jest.mock("@/lib/github/refs", () => ({
  resolveGithubDefaultBranch: jest.fn().mockResolvedValue("main"),
  fetchBranchHeadSha: jest.fn().mockResolvedValue("f".repeat(40)),
}));
jest.mock("@/lib/github/repo-info", () => ({
  getGitHubRepositoryInfo: jest.fn().mockResolvedValue(null),
}));
jest.mock("@google/genai", () => ({ GoogleGenAI: jest.fn() }));
jest.mock("@/lib/gemini", () => ({
  EmptySummaryError: jest.requireActual("@/lib/gemini").EmptySummaryError,
  getSummariseCode: jest.fn(),
  getGenerateEmbeddings: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  generateReadmeFromCodebase: jest.fn().mockResolvedValue("readme"),
}));
jest.mock("@/lib/github-octokit", () => ({ createGitHubOctokit: jest.fn() }));
jest.mock("@/lib/github/repo-access", () => ({
  ...jest.requireActual("@/lib/github/repo-access"),
  resolveRepoToken: jest.fn(
    async (_url: string, token?: string | null) => token ?? undefined,
  ),
}));
jest.mock("@/lib/query-metrics", () => ({
  recordQueryMetrics: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/db-text", () => ({ sanitizeTextForDb: (s: string) => s }));
jest.mock("@/lib/cache", () => ({
  cache: { invalidateProject: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock("@/lib/errors", () => ({
  retryAsync: jest.fn(<T>(fn: () => Promise<T>) => fn()),
  logError: jest.fn(),
}));

import prisma from "@/lib/prisma";
import { loadGithubRepository } from "@/lib/github/tarball";
import { EmptySummaryError, getSummariseCode } from "@/lib/gemini";
import { retryAsync } from "@/lib/errors";
import { isRetryableOpenRouterError } from "@/lib/openrouter";
import { recordQueryMetrics } from "@/lib/query-metrics";
import {
  RepoTokenRequiredError,
  resolveRepoToken,
} from "@/lib/github/repo-access";
import { indexGithubRepository } from "@/lib/indexing/index-repository";

const embFindMany = prisma.sourceCodeEmbeddings.findMany as jest.Mock;
const embUpsert = prisma.sourceCodeEmbeddings.upsert as jest.Mock;
const embCreate = prisma.sourceCodeEmbeddings.create as jest.Mock;
const jobFindUnique = prisma.indexingJob.findUnique as jest.Mock;
const projFindUnique = prisma.project.findUnique as jest.Mock;
const loadRepo = loadGithubRepository as jest.Mock;
const summarise = getSummariseCode as jest.Mock;
const retry = retryAsync as jest.Mock;
const recordMetrics = recordQueryMetrics as jest.Mock;
const resolveToken = resolveRepoToken as jest.Mock;
const REPO = "https://github.com/acme/ledger";

beforeEach(() => {
  jest.clearAllMocks();

  jobFindUnique.mockResolvedValue({
    projectId: "proj-1",
    phase: "full",
    resumeAfter: null,
    lastCommitSha: null,
  });
  projFindUnique.mockResolvedValue({ name: "ledger", repoUrl: "u" });

  embUpsert.mockResolvedValue({ id: "row-1" });
  summarise.mockResolvedValue({
    content: "Pricing constants for the ledger.",
    promptTokens: 100,
    completionTokens: 20,
    totalTokens: 120,
    modelUsed: "google/gemini-2.5-flash",
  });
});

describe("re-index with a changed file", () => {
  it("re-summarises the edited file and replaces its row with the new hash", async () => {
    embFindMany.mockResolvedValue([
      { fileName: FILE, contentHash: sha(OLD_CONTENT) },
    ]);
    loadRepo.mockResolvedValue([
      { pageContent: NEW_CONTENT, metadata: { source: FILE } },
    ]);

    const result = await indexGithubRepository(
      "proj-1",
      "https://github.com/acme/ledger",
      "tok",
    );

    expect(result.successCount).toBe(1);
    expect(summarise).toHaveBeenCalledTimes(1);

    expect(embCreate).not.toHaveBeenCalled();
    expect(embUpsert).toHaveBeenCalledTimes(1);

    const args = embUpsert.mock.calls[0][0];
    expect(args.where).toEqual({
      projectId_fileName: { projectId: "proj-1", fileName: FILE },
    });
    expect(args.update.contentHash).toBe(sha(NEW_CONTENT));
    expect(args.update.contentHash).not.toBe(sha(OLD_CONTENT));
    expect(args.create.contentHash).toBe(sha(NEW_CONTENT));
  });

  it("does not re-summarise a file whose content is unchanged", async () => {
    embFindMany.mockResolvedValue([
      { fileName: FILE, contentHash: sha(OLD_CONTENT) },
    ]);
    loadRepo.mockResolvedValue([
      { pageContent: OLD_CONTENT, metadata: { source: FILE } },
    ]);

    const result = await indexGithubRepository(
      "proj-1",
      "https://github.com/acme/ledger",
      "tok",
    );

    expect(summarise).not.toHaveBeenCalled();
    expect(embUpsert).not.toHaveBeenCalled();
    expect(result.successCount).toBe(0);
  });

  it("treats a pre-existing NULL hash as up to date and does not re-pay", async () => {
    embFindMany.mockResolvedValue([{ fileName: FILE, contentHash: null }]);
    loadRepo.mockResolvedValue([
      { pageContent: NEW_CONTENT, metadata: { source: FILE } },
    ]);

    await indexGithubRepository("proj-1", "https://github.com/acme/ledger", "tok");

    expect(summarise).not.toHaveBeenCalled();
    expect(embUpsert).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });
});

describe("summary retries", () => {
  it("retries summaries twice, skipping errors that can't succeed on retry", async () => {
    embFindMany.mockResolvedValue([]);
    loadRepo.mockResolvedValue([
      { pageContent: NEW_CONTENT, metadata: { source: FILE } },
    ]);

    await indexGithubRepository("proj-1", "https://github.com/acme/ledger", "tok");

    expect(retryAsync).toHaveBeenCalledWith(expect.any(Function), {
      maxRetries: 2,
      initialDelay: 500,
      retryIf: isRetryableOpenRouterError,
    });
  });

  describe("empty replies", () => {
    beforeEach(() => {
      retry.mockImplementation(
        async <T>(
          fn: () => Promise<T>,
          opts?: { maxRetries?: number; retryIf?: (e: unknown) => boolean },
        ) => {
          for (let attempt = 0; ; attempt++) {
            try {
              return await fn();
            } catch (error) {
              const exhausted = attempt >= (opts?.maxRetries ?? 0);
              if (exhausted || (opts?.retryIf && !opts.retryIf(error))) {
                throw error;
              }
            }
          }
        },
      );
    });
    afterEach(() => {
      retry.mockImplementation(<T>(fn: () => Promise<T>) => fn());
    });

    it("writes a cost row for every empty attempt, without counting any attempt twice", async () => {
      const emptyUsage = {
        promptTokens: 2000,
        completionTokens: 0,
        totalTokens: 2000,
        modelUsed: "google/gemini-2.5-flash-lite",
      };
      summarise
        .mockRejectedValueOnce(new EmptySummaryError(FILE, emptyUsage))
        .mockRejectedValueOnce(new EmptySummaryError(FILE, emptyUsage))
        .mockResolvedValueOnce({
          content: "Pricing constants for the ledger.",
          promptTokens: 2100,
          completionTokens: 40,
          totalTokens: 2140,
          modelUsed: "google/gemini-2.5-flash-lite",
        });
      embFindMany.mockResolvedValue([]);
      loadRepo.mockResolvedValue([
        { pageContent: NEW_CONTENT, metadata: { source: FILE } },
      ]);

      const result = await indexGithubRepository("proj-1", REPO, "tok");

      expect(result.successCount).toBe(1);
      const rows = recordMetrics.mock.calls.map((c) => c[1]);
      expect(rows).toHaveLength(3);
      const emptyRows = rows.filter((r) => !r.success);
      expect(emptyRows).toHaveLength(2);
      for (const row of emptyRows) {
        expect(row.routeType).toBe("indexing");
        expect(row.promptTokens).toBe(2000);
        expect(row.estimatedCostUsd).toBeGreaterThan(0);
        expect(row.errorMessage).toContain("empty summary");
      }
      const fileRow = rows.find((r) => r.success);
      expect(fileRow.promptTokens).toBe(2100);
    });

    it("still records the empty attempts when every attempt comes back empty", async () => {
      const emptyUsage = {
        promptTokens: 2000,
        completionTokens: 0,
        totalTokens: 2000,
        modelUsed: "google/gemini-2.5-flash-lite",
      };
      summarise.mockRejectedValue(new EmptySummaryError(FILE, emptyUsage));
      embFindMany.mockResolvedValue([]);
      loadRepo.mockResolvedValue([
        { pageContent: NEW_CONTENT, metadata: { source: FILE } },
      ]);

      await expect(
        indexGithubRepository("proj-1", REPO, "tok"),
      ).rejects.toThrow();

      const rows = recordMetrics.mock.calls.map((c) => c[1]);
      expect(rows.filter((r) => r.estimatedCostUsd > 0)).toHaveLength(3);
      const fileRow = rows.at(-1);
      expect(fileRow.success).toBe(false);
      expect(fileRow.estimatedCostUsd).toBe(0);
    });
  });
});

describe("private repositories", () => {
  it("refuses a private repo without the project's own token before downloading anything", async () => {
    resolveToken.mockRejectedValueOnce(new RepoTokenRequiredError());

    await expect(
      indexGithubRepository("proj-1", REPO, undefined),
    ).rejects.toBeInstanceOf(RepoTokenRequiredError);
    expect(resolveToken).toHaveBeenCalledWith(REPO, undefined);
    expect(loadRepo).not.toHaveBeenCalled();
    expect(summarise).not.toHaveBeenCalled();
  });

  it("downloads a public repo with the token the guard resolved", async () => {
    resolveToken.mockResolvedValueOnce("server-token");
    embFindMany.mockResolvedValue([]);
    loadRepo.mockResolvedValue([
      { pageContent: NEW_CONTENT, metadata: { source: FILE } },
    ]);

    await indexGithubRepository("proj-1", REPO, undefined);

    expect(loadRepo).toHaveBeenCalledWith(REPO, "server-token", "f".repeat(40));
  });
});
