jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
  clerkClient: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: { project: { findFirst: jest.fn(), update: jest.fn() } },
}));
jest.mock("@/lib/get-db-user-id", () => ({ getDbUserId: jest.fn() }));
jest.mock("@/lib/indexing-worker-kick", () => ({
  kickIndexingWorker: jest.fn(),
}));
jest.mock("@/lib/baseline-mirror", () => ({
  mirrorBaselineIfPending: jest.fn(),
}));
jest.mock("@/lib/github", () => ({
  resolveGithubDefaultBranch: jest.fn(),
  fetchBranchHeadSha: jest.fn(),
}));
jest.mock("@/lib/github-octokit", () => ({ createGitHubOctokit: jest.fn() }));
jest.mock("@/lib/github/repo-access", () => ({
  ...jest.requireActual("@/lib/github/repo-access"),
  resolveRepoToken: jest.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import { fetchBranchHeadSha, resolveGithubDefaultBranch } from "@/lib/github";
import {
  REPO_TOKEN_REQUIRED_MESSAGE,
  RepoTokenRequiredError,
  resolveRepoToken,
} from "@/lib/github/repo-access";
import { setProjectBaselineNow } from "@/lib/actions-indexing";

const REPO = "https://github.com/acme/ledger";
const resolveToken = resolveRepoToken as jest.Mock;
const resolveBranch = resolveGithubDefaultBranch as jest.Mock;
const headSha = fetchBranchHeadSha as jest.Mock;
const projectUpdate = prisma.project.update as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (auth as unknown as jest.Mock).mockResolvedValue({ userId: "clerk-1" });
  (getDbUserId as jest.Mock).mockResolvedValue("db-1");
  (prisma.project.findFirst as jest.Mock).mockResolvedValue({
    id: "proj-1",
    repoUrl: REPO,
    githubToken: null,
    indexedCommitSha: null,
    indexedBranch: null,
    indexedAt: null,
  });
});

describe("setProjectBaselineNow repo access", () => {
  it("refuses a private repo without the project's own token and reads nothing", async () => {
    resolveToken.mockRejectedValue(new RepoTokenRequiredError());

    await expect(setProjectBaselineNow("proj-1")).resolves.toEqual({
      success: false,
      error: REPO_TOKEN_REQUIRED_MESSAGE,
    });
    expect(resolveToken).toHaveBeenCalledWith(REPO, null);
    expect(resolveBranch).not.toHaveBeenCalled();
    expect(headSha).not.toHaveBeenCalled();
    expect(projectUpdate).not.toHaveBeenCalled();
  });

  it("pins the baseline with the token the guard resolved", async () => {
    resolveToken.mockResolvedValue("server-token");
    resolveBranch.mockResolvedValue("main");
    headSha.mockResolvedValue("a".repeat(40));
    projectUpdate.mockResolvedValue({});

    await expect(setProjectBaselineNow("proj-1")).resolves.toMatchObject({
      success: true,
      indexedCommitSha: "a".repeat(40),
      indexedBranch: "main",
    });
    expect(resolveBranch).toHaveBeenCalledWith(REPO, "server-token");
    expect(headSha).toHaveBeenCalledWith(REPO, "main", "server-token");
  });
});
