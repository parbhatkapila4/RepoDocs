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
  RepoTokenRequiredError,
  resolveRepoToken,
} from "@/lib/github/repo-access";
import * as actions from "@/lib/actions";

const REPO = "https://github.com/acme/ledger";
const mockAuth = auth as unknown as jest.Mock;
const findProject = prisma.project.findFirst as jest.Mock;
const resolveToken = resolveRepoToken as jest.Mock;
const getRepoInfo = getGitHubRepositoryInfo as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "clerk-1" });
  (getDbUserId as jest.Mock).mockResolvedValue("db-1");
  findProject.mockResolvedValue({ repoUrl: REPO, githubToken: "user-token" });
});

describe("getProjectRepositoryInfo", () => {
  it("returns repository data for the caller's project, never the token", async () => {
    resolveToken.mockResolvedValue("user-token");
    getRepoInfo.mockResolvedValue({ fullName: "acme/ledger", isPrivate: true });

    const info = await actions.getProjectRepositoryInfo("proj-1");

    expect(info).toEqual({ fullName: "acme/ledger", isPrivate: true });
    expect(JSON.stringify(info)).not.toContain("user-token");
    expect(findProject).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "proj-1", userId: "db-1", deletedAt: null },
      }),
    );
    expect(resolveToken).toHaveBeenCalledWith(REPO, "user-token");
    expect(getRepoInfo).toHaveBeenCalledWith(REPO, "user-token");
  });

  it("returns null without a session, before looking anything up", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(actions.getProjectRepositoryInfo("proj-1")).resolves.toBeNull();
    expect(findProject).not.toHaveBeenCalled();
    expect(getRepoInfo).not.toHaveBeenCalled();
  });

  it("returns null for a private repo without the project's own token", async () => {
    findProject.mockResolvedValue({ repoUrl: REPO, githubToken: null });
    resolveToken.mockRejectedValue(new RepoTokenRequiredError());

    await expect(actions.getProjectRepositoryInfo("proj-1")).resolves.toBeNull();
    expect(getRepoInfo).not.toHaveBeenCalled();
  });

  it("no longer exposes an action that returns the decrypted token", () => {
    expect("getProjectWithToken" in actions).toBe(false);
  });
});
