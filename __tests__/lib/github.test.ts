jest.mock("octokit", () => {
  const repos = {
    get: jest.fn(),
    listLanguages: jest.fn(),
    getAllTopics: jest.fn(),
    getReadme: jest.fn(),
    getContent: jest.fn(),
  };
  const search = { repos: jest.fn() };
  const git = { getTree: jest.fn() };
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: { repos, search },
      git,
    })),
  };
});

jest.mock("@langchain/community/document_loaders/web/github", () => ({
  GithubRepoLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue([]),
  })),
}));

import {
  getGitHubRepositoryInfo,
  loadGithubRepository,
} from "../../src/lib/github";
import { Octokit } from "octokit";
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";

const octokitMock = new (Octokit as unknown as jest.Mock)();
const reposGet = octokitMock.rest.repos.get as jest.Mock;
const reposListLanguages = octokitMock.rest.repos.listLanguages as jest.Mock;
const reposGetAllTopics = octokitMock.rest.repos.getAllTopics as jest.Mock;
const githubRepoLoaderMock = GithubRepoLoader as unknown as jest.Mock;

describe("GitHub Integration", () => {
  beforeEach(() => {
    reposGet.mockReset();
    reposListLanguages.mockReset();
    reposGetAllTopics.mockReset();
    githubRepoLoaderMock.mockClear();
  });

  describe("getGitHubRepositoryInfo", () => {
    it("successfully fetches repository information", async () => {
      const repoUrl = "https://github.com/test/repo";

      reposGet.mockResolvedValue({
        data: {
          id: 1,
          name: "repo",
          full_name: "test/repo",
          description: "Test repo",
          html_url: repoUrl,
          clone_url: repoUrl + ".git",
          ssh_url: "git@github.com:test/repo.git",
          language: "TypeScript",
          stargazers_count: 100,
          forks_count: 10,
          watchers_count: 50,
          open_issues_count: 5,
          size: 1000,
          default_branch: "main",
          created_at: "2026-05-01T00:00:00Z",
          updated_at: "2026-05-01T00:00:00Z",
          pushed_at: "2026-05-01T00:00:00Z",
          private: false,
          fork: false,
          archived: false,
          has_issues: true,
          has_projects: false,
          has_wiki: false,
          has_pages: false,
          has_downloads: false,
          disabled: false,
          visibility: "public",
          network_count: 0,
          subscribers_count: 10,
          owner: {
            login: "test",
            id: 1,
            avatar_url: "https://github.com/test.png",
            html_url: "https://github.com/test",
            type: "User",
          },
          license: null,
        },
      });
      reposListLanguages.mockResolvedValue({
        data: { TypeScript: 1000, JavaScript: 500 },
      });
      reposGetAllTopics.mockResolvedValue({
        data: { names: ["test", "repo"] },
      });

      const result = await getGitHubRepositoryInfo(repoUrl);

      expect(result).toBeDefined();
      expect(result?.name).toBe("repo");
      expect(result?.fullName).toBe("test/repo");
    });

    it("handles invalid repository URLs", async () => {
      const result = await getGitHubRepositoryInfo("not-a-url");
      expect(result).toBeNull();
    });

    it("handles non-existent repositories", async () => {
      reposGet.mockRejectedValue({ status: 404, message: "Not Found" });

      const result = await getGitHubRepositoryInfo(
        "https://github.com/nonexistent/repo-12345"
      );
      expect(result).toBeNull();
    });
  });

  describe("loadGithubRepository", () => {
    it("successfully loads a repository", async () => {
      const repoUrl = "https://github.com/test/repo";
      reposGet.mockResolvedValue({
        data: { default_branch: "master" },
      });
      githubRepoLoaderMock.mockImplementation(() => ({
        load: jest.fn().mockResolvedValue([
          { pageContent: "test content", metadata: { source: "test.ts" } },
        ]),
      }));

      const result = await loadGithubRepository(repoUrl);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(githubRepoLoaderMock).toHaveBeenCalledWith(
        repoUrl,
        expect.objectContaining({ branch: "master" })
      );
    });

    it("handles private repositories with a token", async () => {
      const privateRepoUrl = "https://github.com/private/repo";
      const token = "test-token";
      reposGet.mockResolvedValue({
        data: { default_branch: "main" },
      });
      githubRepoLoaderMock.mockImplementation(() => ({
        load: jest.fn().mockResolvedValue([]),
      }));

      await loadGithubRepository(privateRepoUrl, token);

      expect(githubRepoLoaderMock).toHaveBeenCalledWith(
        privateRepoUrl,
        expect.objectContaining({
          accessToken: token,
          branch: "main",
        })
      );
    });
  });
});
