jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
  clerkClient: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: { user: { findUnique: jest.fn() } },
}));
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
import { deleteProject } from "@/lib/queries";
import { deleteUserProject } from "@/lib/actions";

const mockAuth = auth as unknown as jest.Mock;
const findUser = prisma.user.findUnique as jest.Mock;
const mockDeleteProject = deleteProject as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("deleteUserProject", () => {
  it("deletes through deleteProject, which also cancels the project's indexing job", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    findUser.mockResolvedValue({ id: "db-1" });
    mockDeleteProject.mockResolvedValue({ id: "proj-1" });

    await expect(deleteUserProject("proj-1")).resolves.toBeUndefined();
    expect(mockDeleteProject).toHaveBeenCalledWith("proj-1", "db-1");
  });

  it("deletes nothing without a session", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(deleteUserProject("proj-1")).rejects.toThrow(
      "Failed to delete project",
    );
    expect(mockDeleteProject).not.toHaveBeenCalled();
  });
});
