jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

jest.mock("../../src/lib/get-db-user-id", () => ({
  getDbUserId: jest.fn(),
}));

jest.mock("../../src/lib/rate-limiter", () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true }),
  getRateLimitIdentifier: jest.fn().mockReturnValue("test-id"),
  rateLimitResponse: jest.fn(),
  RATE_LIMITS: { API: {} },
}));

jest.mock("../../src/lib/budget", () => ({
  isProjectOverBudget: jest.fn().mockResolvedValue(false),
  BUDGET_EXCEEDED_MESSAGE: "budget exceeded",
}));

jest.mock("../../src/lib/query-metrics", () => ({
  recordQueryMetrics: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/lib/memory", () => ({
  extractMemoriesFromConversation: jest.fn().mockResolvedValue([]),
  storeMemories: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/lib/secret-crypto", () => ({
  decryptSecret: jest.fn((value: string | null) => value),
}));

jest.mock("../../src/lib/query-cache", () => ({
  get: jest.fn().mockReturnValue(null),
  set: jest.fn(),
}));

jest.mock("../../src/lib/rag", () => ({
  queryCodebase: jest.fn(),
  queryCodebasePreindex: jest.fn(),
}));

jest.mock("../../src/lib/indexing-worker-kick", () => ({
  kickIndexingWorker: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: {
    project: { findFirst: jest.fn() },
    sourceCodeEmbeddings: { count: jest.fn() },
    user: { findUnique: jest.fn() },
    chatThread: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    chatMessage: { create: jest.fn() },
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
  },
}));

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDbUserId } from "../../src/lib/get-db-user-id";
import { queryCodebase, queryCodebasePreindex } from "../../src/lib/rag";
import prisma from "../../src/lib/prisma";
import { POST } from "../../src/app/api/query/route";

const mockAuth = auth as unknown as jest.Mock;
const mockGetDbUserId = getDbUserId as unknown as jest.Mock;
const mockQueryCodebase = queryCodebase as unknown as jest.Mock;
const mockQueryCodebasePreindex = queryCodebasePreindex as unknown as jest.Mock;
const mockPrisma = prisma as unknown as {
  project: { findFirst: jest.Mock };
  sourceCodeEmbeddings: { count: jest.Mock };
  user: { findUnique: jest.Mock };
  chatThread: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  chatMessage: { create: jest.Mock };
  $transaction: jest.Mock;
  $executeRaw: jest.Mock;
};

const threadRow = {
  id: "thread1",
  projectId: "proj1",
  title: "How does authentication work?",
  mode: "default",
  pinned: false,
  archived: false,
  lastMessageAt: new Date("2026-01-01T00:00:00Z"),
  lastMessagePreview: null,
  messageCount: 0,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

const messageRow = {
  id: "msg1",
  role: "assistant",
  content: "Test answer",
  sources: null,
  status: "complete",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

describe("/api/query", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user123" });
    mockGetDbUserId.mockResolvedValue("user123");
    mockPrisma.user.findUnique.mockResolvedValue({ plan: "professional" });
    mockPrisma.chatThread.create.mockResolvedValue(threadRow);
    mockPrisma.chatThread.findFirst.mockResolvedValue(threadRow);
    mockPrisma.$transaction.mockResolvedValue([messageRow, threadRow]);
  });

  it("returns 401 if user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest("http://localhost:3000/api/query", {
      method: "POST",
      body: JSON.stringify({
        projectId: "proj1",
        question: "Test question",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 if required fields are missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/query", {
      method: "POST",
      body: JSON.stringify({
        projectId: "proj1",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 402 for a free account - chat is a paid capability", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ plan: "starter" });

    const request = new NextRequest("http://localhost:3000/api/query", {
      method: "POST",
      body: JSON.stringify({
        projectId: "p1",
        question: "how does auth work?",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(402);
    expect(body.reason).toBe("upgrade_required");
    expect(body.feature).toBe("chat");
    expect(mockQueryCodebase).not.toHaveBeenCalled();
    expect(mockQueryCodebasePreindex).not.toHaveBeenCalled();
  });

  it("returns 404 if user is not found in database", async () => {
    mockGetDbUserId.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/query", {
      method: "POST",
      body: JSON.stringify({
        projectId: "proj1",
        question: "Test question",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("successfully processes a query", async () => {
    mockQueryCodebase.mockResolvedValue({
      answer: "Test answer",
      sources: [{ fileName: "test.ts", content: "test code", lineNumber: 1 }],
    });

    mockPrisma.project.findFirst.mockResolvedValue({
      id: "proj1",
      userId: "user123",
      name: "Test Project",
      monthlyCostLimitUsd: null,
    });

    mockPrisma.sourceCodeEmbeddings.count.mockResolvedValue(10);
    mockPrisma.$executeRaw.mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost:3000/api/query", {
      method: "POST",
      body: JSON.stringify({
        projectId: "proj1",
        question: "How does authentication work?",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("answer");
    expect(data).toHaveProperty("sources");
    expect(data).toHaveProperty("metadata");
    expect(data.answer).toBe("Test answer");
    expect(data.sources).toHaveLength(1);
  });

  it("uses pre-index fallback when embeddings count is zero", async () => {
    mockPrisma.project.findFirst.mockResolvedValue({
      id: "proj1",
      userId: "user123",
      name: "Test Project",
      repoUrl: "https://github.com/o/r",
      githubToken: null,
      monthlyCostLimitUsd: null,
    });

    mockPrisma.sourceCodeEmbeddings.count.mockResolvedValue(0);

    mockQueryCodebasePreindex.mockResolvedValue({
      answer: "Pre-index answer",
      sources: [
        {
          fileName: "README.md",
          sourceCode: "",
          summary: "x",
          similarity: 0.5,
        },
      ],
      promptTokens: 1,
      completionTokens: 2,
      totalTokens: 3,
      modelUsed: "google/gemini-2.5-flash",
    });

    const request = new NextRequest("http://localhost:3000/api/query", {
      method: "POST",
      body: JSON.stringify({
        projectId: "proj1",
        question: "Test question",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.answer).toBe("Pre-index answer");
    expect(data.metadata?.preindex).toBe(true);
    expect(mockQueryCodebasePreindex).toHaveBeenCalled();
  });

  it("returns 404 if project is not found or unauthorized", async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/query", {
      method: "POST",
      body: JSON.stringify({
        projectId: "proj1",
        question: "Test question",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  describe("chat history persistence", () => {
    const answeringProject = {
      id: "proj1",
      userId: "user123",
      name: "Test Project",
      monthlyCostLimitUsd: null,
    };

    const ask = (body: Record<string, unknown>) =>
      POST(
        new NextRequest("http://localhost:3000/api/query", {
          method: "POST",
          body: JSON.stringify({
            projectId: "proj1",
            question: "How does authentication work?",
            ...body,
          }),
        }),
      );

    beforeEach(() => {
      mockPrisma.project.findFirst.mockResolvedValue(answeringProject);
      mockPrisma.sourceCodeEmbeddings.count.mockResolvedValue(10);
      mockQueryCodebase.mockResolvedValue({
        answer: "Test answer",
        sources: [],
      });
    });

    it("opens a thread and writes both sides of the turn", async () => {
      const response = await ask({});
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.chatThread.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
      expect(data.thread).toEqual({
        id: "thread1",
        title: "How does authentication work?",
      });
    });

    it("reuses the thread the client names instead of opening a new one", async () => {
      await ask({ threadId: "thread1" });

      expect(mockPrisma.chatThread.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "thread1",
            userId: "user123",
            projectId: "proj1",
          }),
        }),
      );
      expect(mockPrisma.chatThread.create).not.toHaveBeenCalled();
    });

    it("404s when the named thread is not the caller's", async () => {
      mockPrisma.chatThread.findFirst.mockResolvedValue(null);

      const response = await ask({ threadId: "someone-elses" });

      expect(response.status).toBe(404);
      expect(mockQueryCodebase).not.toHaveBeenCalled();
    });

    it("still answers when the history store is unavailable", async () => {
      mockPrisma.chatThread.create.mockRejectedValue(new Error("db down"));

      const response = await ask({});
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.answer).toBe("Test answer");
      expect(data.thread).toBeNull();
    });

    it("does not lose the answer when appending a message fails", async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error("write failed"));

      const response = await ask({});
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.answer).toBe("Test answer");
      expect(data.messageId).toBeNull();
    });
  });
});
