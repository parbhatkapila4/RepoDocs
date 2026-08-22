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

import { gzipSync } from "zlib";
import * as tar from "tar-stream";
import {
  getGitHubRepositoryInfo,
  loadGithubRepository,
} from "../../src/lib/github";
import { Octokit } from "octokit";

const octokitMock = new (Octokit as unknown as jest.Mock)();
const reposGet = octokitMock.rest.repos.get as jest.Mock;
const reposListLanguages = octokitMock.rest.repos.listLanguages as jest.Mock;
const reposGetAllTopics = octokitMock.rest.repos.getAllTopics as jest.Mock;
const fetchMock = jest.fn();
const realFetch = global.fetch;

async function tarGzBuffer(
  files: { name: string; content: string }[],
): Promise<Blob> {
  const pack = tar.pack();
  const chunks: Buffer[] = [];
  pack.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    pack.on("end", () => resolve(Buffer.concat(chunks)));
    pack.on("error", reject);
  });
  for (const f of files) pack.entry({ name: f.name }, f.content);
  pack.finalize();
  return new Blob([new Uint8Array(gzipSync(await done))]);
}

describe("GitHub Integration", () => {
  beforeEach(() => {
    reposGet.mockReset();
    reposListLanguages.mockReset();
    reposGetAllTopics.mockReset();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = realFetch;
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
      reposListLanguages.mockResolvedValue({ data: {} });
      reposGetAllTopics.mockResolvedValue({ data: { names: [] } });

      const result = await getGitHubRepositoryInfo(
        "https://github.com/nonexistent/repo-12345",
      );
      expect(result).toBeNull();
    });
  });

  describe("loadGithubRepository", () => {
    it("downloads one tarball at the resolved default branch, bypassing the fetch cache", async () => {
      const repoUrl = "https://github.com/test/repo";
      reposGet.mockResolvedValue({
        data: { default_branch: "master" },
      });
      fetchMock.mockResolvedValue(
        new Response(
          await tarGzBuffer([
            { name: "test-repo-abc123/test.ts", content: "test content" },
          ]),
        ),
      );

      const result = await loadGithubRepository(repoUrl);

      expect(result).toEqual([
        { pageContent: "test content", metadata: { source: "test.ts" } },
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain("/repos/test/repo/tarball/master");
      expect(init.cache).toBe("no-store");
    });

    it("pins to an explicit ref and sends the token", async () => {
      fetchMock.mockResolvedValue(
        new Response(
          await tarGzBuffer([{ name: "p-r-9f31c2e/src/a.ts", content: "a" }]),
        ),
      );

      await loadGithubRepository(
        "https://github.com/private/repo",
        "test-token",
        "9f31c2e",
      );

      expect(reposGet).not.toHaveBeenCalled();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain("/repos/private/repo/tarball/9f31c2e");
      expect(init.headers.Authorization).toBe("token test-token");
    });

    it("serves repeat loads of an immutable SHA from the doc cache", async () => {
      const sha = "a".repeat(40);
      fetchMock.mockResolvedValue(
        new Response(
          await tarGzBuffer([
            { name: `c-d-${sha.slice(0, 7)}/x.ts`, content: "cached" },
          ]),
        ),
      );

      const first = await loadGithubRepository(
        "https://github.com/cache/demo",
        undefined,
        sha,
      );
      const second = await loadGithubRepository(
        "https://github.com/cache/demo",
        undefined,
        sha,
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(second).toBe(first);
      expect(second[0].pageContent).toBe("cached");
    });
  });
});
