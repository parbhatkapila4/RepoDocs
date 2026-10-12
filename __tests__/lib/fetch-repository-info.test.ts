jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
  clerkClient: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: { project: { findFirst: jest.fn() } },
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
jest.mock("@/lib/github/repo-access", () => ({
  ...jest.requireActual("@/lib/github/repo-access"),
  resolveRepoToken: jest.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import { getGitHubRepositoryInfo } from "@/lib/github";
import {
  REPO_TOKEN_REQUIRED_MESSAGE,
  RepoTokenRequiredError,
  resolveRepoToken,
} from "@/lib/github/repo-access";
import { fetchRepositoryInfo } from "@/lib/actions";

const mockAuth = auth as unknown as jest.Mock;
const getRepoInfo = getGitHubRepositoryInfo as jest.Mock;
const resolveToken = resolveRepoToken as jest.Mock;
const findProject = prisma.project.findFirst as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (getDbUserId as jest.Mock).mockResolvedValue("db-1");
  findProject.mockResolvedValue(null);
  resolveToken.mockResolvedValue("server-token");
});

describe("fetchRepositoryInfo", () => {
  it("refuses without a session and never calls GitHub", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(
      fetchRepositoryInfo("https://github.com/acme/secret"),
    ).resolves.toEqual({ error: expect.stringContaining("sign in") });
    expect(getRepoInfo).not.toHaveBeenCalled();
  });

  it("returns repository details for a signed-in user", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    getRepoInfo.mockResolvedValue({ fullName: "acme/ledger" });

    await expect(
      fetchRepositoryInfo("https://github.com/acme/ledger"),
    ).resolves.toEqual({ data: { fullName: "acme/ledger" } });
  });

  it("refuses a private repo the caller has no token for, with the shared message", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    resolveToken.mockRejectedValue(new RepoTokenRequiredError());

    await expect(
      fetchRepositoryInfo("https://github.com/acme/secret"),
    ).resolves.toEqual({ error: REPO_TOKEN_REQUIRED_MESSAGE });
    expect(resolveToken).toHaveBeenCalledWith(
      "https://github.com/acme/secret",
      null,
    );
    expect(getRepoInfo).not.toHaveBeenCalled();
  });

  it("uses the caller's own project token for that repo when they have one", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    findProject.mockResolvedValue({ githubToken: "user-token" });
    resolveToken.mockResolvedValue("user-token");
    getRepoInfo.mockResolvedValue({ fullName: "acme/secret" });

    await expect(
      fetchRepositoryInfo("https://github.com/acme/secret"),
    ).resolves.toEqual({ data: { fullName: "acme/secret" } });
    expect(findProject).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "db-1",
          repoUrl: "https://github.com/acme/secret",
          deletedAt: null,
        }),
      }),
    );
    expect(resolveToken).toHaveBeenCalledWith(
      "https://github.com/acme/secret",
      "user-token",
    );
    expect(getRepoInfo).toHaveBeenCalledWith(
      "https://github.com/acme/secret",
      "user-token",
    );
  });
});
