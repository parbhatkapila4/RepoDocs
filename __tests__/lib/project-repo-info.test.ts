jest.mock("@/lib/github", () => ({ getGitHubRepositoryInfo: jest.fn() }));
jest.mock("@/lib/github-octokit", () => ({ createGitHubOctokit: jest.fn() }));
jest.mock("@/lib/github/repo-access", () => ({
  ...jest.requireActual("@/lib/github/repo-access"),
  resolveRepoToken: jest.fn(),
}));

import { getGitHubRepositoryInfo } from "@/lib/github";
import {
  RepoTokenRequiredError,
  resolveRepoToken,
} from "@/lib/github/repo-access";
import { fetchRepoInfoForProject } from "@/lib/project-repo-info";

const REPO = "https://github.com/acme/ledger";
const resolveToken = resolveRepoToken as jest.Mock;
const getRepoInfo = getGitHubRepositoryInfo as jest.Mock;
const project = { name: "ledger", repoUrl: REPO, githubToken: null };

beforeEach(() => jest.clearAllMocks());

describe("fetchRepoInfoForProject", () => {
  it("refuses a private repo without the project's own token instead of falling back to the server token", async () => {
    resolveToken.mockRejectedValue(new RepoTokenRequiredError());

    await expect(fetchRepoInfoForProject(project)).rejects.toBeInstanceOf(
      RepoTokenRequiredError,
    );
    expect(getRepoInfo).not.toHaveBeenCalled();
  });

  it("makes one GitHub call, with the token the guard resolved", async () => {
    resolveToken.mockResolvedValue("server-token");
    getRepoInfo.mockResolvedValue({ fullName: "acme/ledger" });

    await expect(fetchRepoInfoForProject(project)).resolves.toEqual({
      fullName: "acme/ledger",
    });
    expect(getRepoInfo).toHaveBeenCalledTimes(1);
    expect(getRepoInfo).toHaveBeenCalledWith(REPO, "server-token");
  });

  it("falls back to the project's own details, not a second GitHub call, when GitHub returns nothing", async () => {
    resolveToken.mockResolvedValue("user-token");
    getRepoInfo.mockResolvedValue(null);

    await expect(
      fetchRepoInfoForProject({ ...project, githubToken: "user-token" }),
    ).resolves.toMatchObject({ name: "ledger", htmlUrl: REPO });
    expect(resolveToken).toHaveBeenCalledWith(REPO, "user-token");
    expect(getRepoInfo).toHaveBeenCalledTimes(1);
  });
});
