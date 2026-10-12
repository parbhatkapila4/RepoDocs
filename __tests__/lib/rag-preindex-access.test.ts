jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));
jest.mock("@/lib/gemini", () => ({ getGenerateEmbeddings: jest.fn() }));
jest.mock("@/lib/openrouter", () => ({ openrouterChatCompletion: jest.fn() }));
jest.mock("@/lib/memory", () => ({ searchRepoMemory: jest.fn() }));
jest.mock("@/lib/github", () => ({
  parseGithubOwnerRepo: jest.fn(),
  getGitHubRepositoryInfo: jest.fn(),
  fetchRepositoryReadmeRaw: jest.fn(),
  isHighValueFile: jest.fn(() => false),
  listGithubRepoPathsForPreindex: jest.fn(),
  fetchGithubPreindexFileContents: jest.fn(),
}));
jest.mock("@/lib/architecture", () => ({
  buildQuickDependencyGraphFromGitTree: jest.fn(),
}));
jest.mock("@/lib/github-octokit", () => ({ createGitHubOctokit: jest.fn() }));
jest.mock("@/lib/github/repo-access", () => ({
  ...jest.requireActual("@/lib/github/repo-access"),
  resolveRepoToken: jest.fn(),
}));

import { openrouterChatCompletion } from "@/lib/openrouter";
import {
  fetchGithubPreindexFileContents,
  fetchRepositoryReadmeRaw,
  getGitHubRepositoryInfo,
  listGithubRepoPathsForPreindex,
} from "@/lib/github";
import { buildQuickDependencyGraphFromGitTree } from "@/lib/architecture";
import {
  RepoTokenRequiredError,
  resolveRepoToken,
} from "@/lib/github/repo-access";
import { queryCodebasePreindex } from "@/lib/rag";

const resolveToken = resolveRepoToken as jest.Mock;
const getRepoInfo = getGitHubRepositoryInfo as jest.Mock;
const listPaths = listGithubRepoPathsForPreindex as jest.Mock;
const fetchContents = fetchGithubPreindexFileContents as jest.Mock;
const fetchReadme = fetchRepositoryReadmeRaw as jest.Mock;
const buildGraph = buildQuickDependencyGraphFromGitTree as jest.Mock;
const chat = openrouterChatCompletion as jest.Mock;

const REPO = "https://github.com/acme/ledger";

beforeEach(() => jest.clearAllMocks());

describe("pre-index chat repo access", () => {
  it("refuses a private repo without the project's own token before reading anything", async () => {
    resolveToken.mockRejectedValue(new RepoTokenRequiredError());

    await expect(
      queryCodebasePreindex(REPO, null, "how does auth work?"),
    ).rejects.toBeInstanceOf(RepoTokenRequiredError);
    expect(resolveToken).toHaveBeenCalledWith(REPO, null);
    for (const read of [getRepoInfo, listPaths, fetchContents, fetchReadme, buildGraph, chat]) {
      expect(read).not.toHaveBeenCalled();
    }
  });

  it("reads a public repo with the token the guard resolved", async () => {
    resolveToken.mockResolvedValue("server-token");
    getRepoInfo.mockResolvedValue(null);
    listPaths.mockResolvedValue({
      paths: ["README.md"],
      defaultBranch: "main",
      owner: "acme",
      repo: "ledger",
      truncated: false,
    });
    fetchContents.mockResolvedValue([
      { path: "README.md", text: "# Ledger", truncated: false },
    ]);
    fetchReadme.mockResolvedValue(null);
    chat.mockResolvedValue({
      content: "It's a ledger.",
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      model: "google/gemini-2.5-flash",
    });

    const result = await queryCodebasePreindex(REPO, null, "what is this?");

    expect(result.answer).toBe("It's a ledger.");
    expect(getRepoInfo).toHaveBeenCalledWith(REPO, "server-token");
    expect(listPaths).toHaveBeenCalledWith(REPO, "server-token");
    expect(fetchContents.mock.calls[0][4]).toBe("server-token");
    expect(fetchReadme).toHaveBeenCalledWith(REPO, "server-token", 10_000);
  });
});
