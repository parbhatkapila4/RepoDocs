jest.mock("@clerk/nextjs/server", () => ({ auth: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));
jest.mock("@/lib/rate-limiter", () => ({
  rateLimit: jest.fn(),
  getRateLimitIdentifier: jest.fn(),
  rateLimitResponse: jest.fn(),
  RATE_LIMITS: { API: { windowMs: 60_000, maxRequests: 20 } },
}));
jest.mock("@/lib/api-guards", () => ({
  ...jest.requireActual("@/lib/api-guards"),
  requireAuthAndRateLimit: jest.fn(),
  requireOwnedProjectWithinBudget: jest.fn(),
}));
jest.mock("@/lib/github", () => ({
  parseGithubOwnerRepo: jest.fn(() => ({ owner: "acme", repo: "ledger" })),
  compareCommitsBasehead: jest.fn(),
}));
jest.mock("@/lib/analyze", () => ({
  analyzeParsedDiff: jest.fn(),
  buildDriftSystemPrompt: jest.fn(),
  recordAnalysisSuccess: jest.fn(),
  recordAnalysisFailure: jest.fn(),
}));
jest.mock("@/lib/github-octokit", () => ({ createGitHubOctokit: jest.fn() }));
jest.mock("@/lib/github/repo-access", () => ({
  ...jest.requireActual("@/lib/github/repo-access"),
  resolveRepoToken: jest.fn(),
}));

import { NextRequest } from "next/server";
import {
  requireAuthAndRateLimit,
  requireOwnedProjectWithinBudget,
} from "@/lib/api-guards";
import { compareCommitsBasehead } from "@/lib/github";
import { analyzeParsedDiff } from "@/lib/analyze";
import {
  REPO_TOKEN_REQUIRED_MESSAGE,
  RepoTokenRequiredError,
  resolveRepoToken,
} from "@/lib/github/repo-access";
import { POST } from "@/app/api/repo-changes/route";

const REPO = "https://github.com/acme/ledger";
const BASE = "b".repeat(40);
const resolveToken = resolveRepoToken as jest.Mock;
const compare = compareCommitsBasehead as jest.Mock;

function request() {
  return new NextRequest("http://localhost:3000/api/repo-changes", {
    method: "POST",
    body: JSON.stringify({ projectId: "proj-1" }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (requireAuthAndRateLimit as jest.Mock).mockResolvedValue({
    userId: "clerk-1",
    dbUserId: "db-1",
  });
  (requireOwnedProjectWithinBudget as jest.Mock).mockResolvedValue({
    project: {
      id: "proj-1",
      repoUrl: REPO,
      githubToken: null,
      indexedCommitSha: BASE,
      indexedBranch: "main",
    },
  });
});

describe("/api/repo-changes repo access", () => {
  it("refuses with 403 and the shared message, before comparing anything", async () => {
    resolveToken.mockRejectedValue(new RepoTokenRequiredError());

    const response = await POST(request());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      reason: "repo_token_required",
      message: REPO_TOKEN_REQUIRED_MESSAGE,
    });
    expect(compare).not.toHaveBeenCalled();
    expect(analyzeParsedDiff).not.toHaveBeenCalled();
  });

  it("compares a public repo with the token the guard resolved", async () => {
    resolveToken.mockResolvedValue("server-token");
    compare.mockResolvedValue({
      ok: true,
      data: {
        ahead_by: 0,
        total_commits: 0,
        base_sha: BASE,
        head_sha: BASE,
        commits: [],
        files: [],
      },
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(compare).toHaveBeenCalledWith(
      "acme",
      "ledger",
      `${BASE}...main`,
      "server-token",
    );
  });
});
