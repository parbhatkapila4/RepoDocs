jest.mock("@clerk/nextjs/server", () => ({ auth: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    project: { findFirst: jest.fn() },
    sourceCodeEmbeddings: { count: jest.fn() },
    indexingJob: { findUnique: jest.fn(), upsert: jest.fn() },
  },
}));
jest.mock("@/lib/get-db-user-id", () => ({ getDbUserId: jest.fn() }));
jest.mock("@/lib/rate-limiter", () => ({
  rateLimit: jest.fn(),
  getRateLimitIdentifier: jest.fn(() => "user:clerk-1"),
  rateLimitResponse: jest.fn(),
  RATE_LIMITS: { API: { windowMs: 60_000, maxRequests: 20 } },
}));
jest.mock("@/lib/api-guards", () => ({
  ...jest.requireActual("@/lib/api-guards"),
  requirePaidPlan: jest.fn(),
}));
jest.mock("@/lib/architecture", () => ({
  buildDependencyGraph: jest.fn(),
  buildQuickDependencyGraphFromGitTree: jest.fn(),
}));
jest.mock("@/lib/query-metrics", () => ({
  recordQueryMetrics: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/indexing-worker-kick", () => ({
  kickIndexingWorker: jest.fn(),
}));
jest.mock("@/lib/github-octokit", () => ({ createGitHubOctokit: jest.fn() }));
jest.mock("@/lib/github/repo-access", () => ({
  ...jest.requireActual("@/lib/github/repo-access"),
  resolveRepoToken: jest.fn(),
}));

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import { rateLimit } from "@/lib/rate-limiter";
import { requirePaidPlan } from "@/lib/api-guards";
import {
  buildDependencyGraph,
  buildQuickDependencyGraphFromGitTree,
} from "@/lib/architecture";
import { kickIndexingWorker } from "@/lib/indexing-worker-kick";
import {
  REPO_TOKEN_REQUIRED_MESSAGE,
  RepoTokenRequiredError,
  resolveRepoToken,
} from "@/lib/github/repo-access";
import { GET } from "@/app/api/architecture/route";

const REPO = "https://github.com/acme/ledger";
const resolveToken = resolveRepoToken as jest.Mock;
const quickGraph = buildQuickDependencyGraphFromGitTree as jest.Mock;
const jobUpsert = prisma.indexingJob.upsert as jest.Mock;

function request() {
  return new NextRequest(
    "http://localhost:3000/api/architecture?projectId=proj-1",
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (auth as unknown as jest.Mock).mockResolvedValue({ userId: "clerk-1" });
  (rateLimit as jest.Mock).mockResolvedValue({
    success: true,
    remaining: 19,
    resetTime: Date.now() + 60_000,
  });
  (getDbUserId as jest.Mock).mockResolvedValue("db-1");
  (requirePaidPlan as jest.Mock).mockResolvedValue({ plan: "professional" });
  (prisma.project.findFirst as jest.Mock).mockResolvedValue({
    id: "proj-1",
    repoUrl: REPO,
    githubToken: null,
  });
  (buildDependencyGraph as jest.Mock).mockResolvedValue({
    nodes: [],
    edges: [],
  });
  (prisma.sourceCodeEmbeddings.count as jest.Mock).mockResolvedValue(0);
  (prisma.indexingJob.findUnique as jest.Mock).mockResolvedValue({
    status: "failed",
    progress: 0,
    error: REPO_TOKEN_REQUIRED_MESSAGE,
    updatedAt: new Date(),
  });
});

describe("/api/architecture repo access", () => {
  it("refuses an unindexed private repo with 403 and doesn't re-queue the worker", async () => {
    resolveToken.mockRejectedValue(new RepoTokenRequiredError());

    const response = await GET(request());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      reason: "repo_token_required",
      message: REPO_TOKEN_REQUIRED_MESSAGE,
    });
    expect(quickGraph).not.toHaveBeenCalled();
    expect(jobUpsert).not.toHaveBeenCalled();
    expect(kickIndexingWorker).not.toHaveBeenCalled();
  });

  it("builds the quick graph of a public repo with the token the guard resolved", async () => {
    jest.useFakeTimers();
    try {
      resolveToken.mockResolvedValue("server-token");
      quickGraph.mockResolvedValue({
        nodes: [{ id: "src/a.ts", path: "src/a.ts" }],
        edges: [],
      });

      const response = await GET(request());

      expect(response.status).toBe(200);
      expect(quickGraph).toHaveBeenCalledWith(REPO, "server-token");
    } finally {
      jest.useRealTimers();
    }
  });
});
