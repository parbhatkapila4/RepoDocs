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
import { createProjectWithAuth, deleteProject } from "@/lib/queries";
import { createProject, deleteUserProject } from "@/lib/actions";

const STORED_TOKEN = "enc:v1:c3RvcmVkLXRva2Vu";
const fullRow = {
  id: "proj-1",
  name: "ledger",
  repoUrl: "https://github.com/acme/ledger",
  githubToken: STORED_TOKEN,
  userId: "db-1",
  deletedAt: null,
  createdAt: new Date("2026-10-01T00:00:00Z"),
  updatedAt: new Date("2026-10-01T00:00:00Z"),
};

function expectNoToken(returned: unknown) {
  const serialized = JSON.stringify(returned ?? null);
  expect(serialized).not.toContain("githubToken");
  expect(serialized).not.toContain(STORED_TOKEN);
}

beforeEach(() => jest.clearAllMocks());

describe("server actions never return the project's githubToken", () => {
  it("createProject returns only the new project's id", async () => {
    (createProjectWithAuth as jest.Mock).mockResolvedValue(fullRow);

    const returned = await createProject(
      "ledger",
      "https://github.com/acme/ledger",
      "ghp_typedIntoTheForm",
    );

    expect(returned).toEqual({ project: { id: "proj-1" } });
    expectNoToken(returned);
  });

  it("deleteUserProject returns nothing", async () => {
    (auth as unknown as jest.Mock).mockResolvedValue({ userId: "clerk-1" });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db-1" });
    (deleteProject as jest.Mock).mockResolvedValue(fullRow);

    const returned = await deleteUserProject("proj-1");

    expect(returned).toBeUndefined();
    expectNoToken(returned);
    expect(deleteProject).toHaveBeenCalledWith("proj-1", "db-1");
  });
});
