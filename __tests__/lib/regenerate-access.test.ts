jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
  clerkClient: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    project: { findFirst: jest.fn() },
    sourceCodeEmbeddings: { findMany: jest.fn() },
    indexingJob: { upsert: jest.fn() },
  },
}));
jest.mock("@/lib/get-db-user-id", () => ({ getDbUserId: jest.fn() }));
jest.mock("@/lib/queries", () => ({
  createProjectWithAuth: jest.fn(),
  deleteProject: jest.fn(),
}));
jest.mock("@/lib/indexing-worker-kick", () => ({
  kickIndexingWorker: jest.fn(),
}));
jest.mock("@/lib/indexing-worker-run", () => ({ MAX_ATTEMPTS: 5 }));
jest.mock("@/lib/github", () => ({ getGitHubRepositoryInfo: jest.fn() }));
jest.mock("@/lib/project-repo-info", () => ({
  fetchRepoInfoForProject: jest.fn(),
}));
jest.mock("@/lib/github-rate-limit-status", () => ({
  githubCoreQuotaRecovered: jest.fn(),
}));
jest.mock("@/lib/github-octokit", () => ({ createGitHubOctokit: jest.fn() }));

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import { fetchRepoInfoForProject } from "@/lib/project-repo-info";
import {
  REPO_TOKEN_REQUIRED_MESSAGE,
  RepoTokenRequiredError,
} from "@/lib/github/repo-access";
import { regenerateProjectDocs, regenerateProjectReadme } from "@/lib/actions";

beforeEach(() => {
  jest.clearAllMocks();
  (auth as unknown as jest.Mock).mockResolvedValue({ userId: "clerk-1" });
  (getDbUserId as jest.Mock).mockResolvedValue("db-1");
  (prisma.project.findFirst as jest.Mock).mockResolvedValue({
    id: "proj-1",
    name: "ledger",
    repoUrl: "https://github.com/acme/ledger",
    githubToken: null,
  });
  (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ plan: "professional" }]);
  (prisma.sourceCodeEmbeddings.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.indexingJob.upsert as jest.Mock).mockResolvedValue({});
  (fetchRepoInfoForProject as jest.Mock).mockRejectedValue(
    new RepoTokenRequiredError(),
  );
});

describe("README and docs regeneration on a private repo without a token", () => {
  it("surfaces the shared refusal message unchanged for the README", async () => {
    await expect(regenerateProjectReadme("proj-1")).rejects.toMatchObject({
      message: REPO_TOKEN_REQUIRED_MESSAGE,
    });
  });

  it("surfaces the shared refusal message unchanged for the docs", async () => {
    await expect(regenerateProjectDocs("proj-1")).rejects.toMatchObject({
      message: REPO_TOKEN_REQUIRED_MESSAGE,
    });
  });
});
