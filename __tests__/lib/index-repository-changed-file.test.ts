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
jest.mock("@/lib/gemini", () => ({
  getSummariseCode: jest.fn(),
  getGenerateEmbeddings: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  generateReadmeFromCodebase: jest.fn().mockResolvedValue("readme"),
}));
jest.mock("@/lib/query-metrics", () => ({
  recordQueryMetrics: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/db-text", () => ({ sanitizeTextForDb: (s: string) => s }));
jest.mock("@/lib/cache", () => ({
  cache: { invalidateProject: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock("@/lib/errors", () => ({
  retryAsync: <T>(fn: () => Promise<T>) => fn(),
  logError: jest.fn(),
}));

import prisma from "@/lib/prisma";
import { loadGithubRepository } from "@/lib/github/tarball";
import { getSummariseCode } from "@/lib/gemini";
import { indexGithubRepository } from "@/lib/indexing/index-repository";

const embFindMany = prisma.sourceCodeEmbeddings.findMany as jest.Mock;
const embUpsert = prisma.sourceCodeEmbeddings.upsert as jest.Mock;
const embCreate = prisma.sourceCodeEmbeddings.create as jest.Mock;
const jobFindUnique = prisma.indexingJob.findUnique as jest.Mock;
const projFindUnique = prisma.project.findUnique as jest.Mock;
const loadRepo = loadGithubRepository as jest.Mock;
const summarise = getSummariseCode as jest.Mock;

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
