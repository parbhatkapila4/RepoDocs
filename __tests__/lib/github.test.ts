import { getGitHubRepositoryInfo, loadGithubRepository } from "@/lib/github";

jest.mock("octokit", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      repos: {
        get: jest.fn(),
        listLanguages: jest.fn(),
        getAllTopics: jest.fn(),
      },
    },
  })),
}));

jest.mock("@langchain/community/document_loaders/web/github", () => ({
  GithubRepoLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue([]),
  })),
}));

describe("GitHub Integration", () => {
  describe("getGitHubRepositoryInfo", () => {
    it("successfully fetches repository information", async () => {
      const repoUrl = "https://github.com/test/repo";
      const { Octokit } = require("octokit");
      const mockOctokit = new Octokit();

      mockOctokit.rest.repos.get.mockResolvedValue({
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
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-12-01T00:00:00Z",
          pushed_at: "2023-12-01T00:00:00Z",
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

      mockOctokit.rest.repos.listLanguages.mockResolvedValue({
        data: { TypeScript: 1000, JavaScript: 500 },
      });

      mockOctokit.rest.repos.getAllTopics.mockResolvedValue({
        data: { names: ["test", "repo"] },
      });

      const result = await getGitHubRepositoryInfo(repoUrl);

      expect(result).toBeDefined();
      expect(result?.name).toBe("repo");
      expect(result?.fullName).toBe("test/repo");
    });

    it("handles invalid repository URLs", async () => {
      const invalidUrl = "not-a-url";

      const result = await getGitHubRepositoryInfo(invalidUrl);

      expect(result).toBeNull();
    });

    it("handles non-existent repositories", async () => {
      const nonExistentUrl = "https://github.com/nonexistent/repo-12345";
      const { Octokit } = require("octokit");
      const mockOctokit = new Octokit();

      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 404,
        message: "Not Found",
      });

      const result = await getGitHubRepositoryInfo(nonExistentUrl);

      expect(result).toBeNull();
    });
  });

  describe("loadGithubRepository", () => {
    it("successfully loads a repository", async () => {
      const repoUrl = "https://github.com/test/repo";
      const {
        GithubRepoLoader,
      } = require("@langchain/community/document_loaders/web/github");

      const mockLoader = {
        load: jest.fn().mockResolvedValue([
          {
            pageContent: "test content",
            metadata: { source: "test.ts" },
          },
        ]),
      };

      GithubRepoLoader.mockImplementation(() => mockLoader);

      const result = await loadGithubRepository(repoUrl);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(GithubRepoLoader).toHaveBeenCalledWith(
        repoUrl,
        expect.any(Object)
      );
    });

    it("handles private repositories with token", async () => {
      const privateRepoUrl = "https://github.com/private/repo";
      const token = "test-token";
      const {
        GithubRepoLoader,
      } = require("@langchain/community/document_loaders/web/github");

      const mockLoader = {
        load: jest.fn().mockResolvedValue([]),
      };

      GithubRepoLoader.mockImplementation(() => mockLoader);

      await loadGithubRepository(privateRepoUrl, token);

      expect(GithubRepoLoader).toHaveBeenCalledWith(
        privateRepoUrl,
        expect.objectContaining({
          accessToken: token,
        })
      );
    });
  });
});
