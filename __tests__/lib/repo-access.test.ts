jest.mock("@/lib/github-octokit", () => ({ createGitHubOctokit: jest.fn() }));

import { createGitHubOctokit } from "@/lib/github-octokit";
import { friendlyError } from "@/lib/friendly-error";
import {
  REPO_TOKEN_REQUIRED_MESSAGE,
  RepoTokenRequiredError,
  resolveRepoToken,
} from "@/lib/github/repo-access";

const createOctokit = createGitHubOctokit as jest.Mock;
const reposGet = jest.fn();
const REPO = "https://github.com/acme/ledger";
const realServerToken = process.env.GITHUB_TOKEN;

beforeEach(() => {
  jest.clearAllMocks();
  createOctokit.mockReturnValue({ rest: { repos: { get: reposGet } } });
  process.env.GITHUB_TOKEN = "server-token";
});
afterAll(() => {
  if (realServerToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = realServerToken;
});

describe("resolveRepoToken", () => {
  it("uses the project's own token as-is, without asking GitHub", async () => {
    await expect(resolveRepoToken(REPO, "user-token")).resolves.toBe(
      "user-token",
    );
    expect(reposGet).not.toHaveBeenCalled();
  });

  it("lends the server token to a public repo", async () => {
    reposGet.mockResolvedValue({ data: { private: false } });

    await expect(resolveRepoToken(REPO, null)).resolves.toBe("server-token");
    expect(createOctokit).toHaveBeenCalledWith("server-token");
    expect(reposGet).toHaveBeenCalledWith({ owner: "acme", repo: "ledger" });
  });

  it("refuses a private repo when the project has no token of its own", async () => {
    reposGet.mockResolvedValue({ data: { private: true } });

    await expect(resolveRepoToken(REPO, undefined)).rejects.toBeInstanceOf(
      RepoTokenRequiredError,
    );
  });

  it("gives a missing repo the same error, so private repos can't be probed", async () => {
    reposGet.mockRejectedValueOnce(
      Object.assign(new Error("Not Found"), { status: 404 }),
    );
    const missing = await resolveRepoToken(REPO, null).catch((e: unknown) => e);
    reposGet.mockResolvedValueOnce({ data: { private: true } });
    const hidden = await resolveRepoToken(REPO, null).catch((e: unknown) => e);

    expect(missing).toBeInstanceOf(RepoTokenRequiredError);
    expect(hidden).toBeInstanceOf(RepoTokenRequiredError);
    expect((missing as Error).message).toBe((hidden as Error).message);
  });

  it("rethrows rate limits and network errors so the caller retries", async () => {
    const rateLimited = Object.assign(new Error("API rate limit exceeded"), {
      status: 403,
    });
    reposGet.mockRejectedValue(rateLimited);

    await expect(resolveRepoToken(REPO, null)).rejects.toBe(rateLimited);
  });

  it("shows its message unchanged in the UI", () => {
    expect(REPO_TOKEN_REQUIRED_MESSAGE.length).toBeLessThanOrEqual(140);
    expect(friendlyError(new RepoTokenRequiredError())).toBe(
      REPO_TOKEN_REQUIRED_MESSAGE,
    );
  });
});
