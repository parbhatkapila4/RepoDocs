import { NextRequest } from "next/server";
import { POST } from "../../src/app/api/query/route";

const mockAuth = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

const mockQueryCodebase = jest.fn();
const mockQueryCodebasePreindex = jest.fn();
jest.mock("@/lib/rag", () => ({
  queryCodebase: mockQueryCodebase,
  queryCodebasePreindex: mockQueryCodebasePreindex,
}));

jest.mock("@/lib/indexing-worker-kick", () => ({
  kickIndexingWorker: jest.fn().mockResolvedValue(undefined),
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  project: {
    findFirst: jest.fn(),
  },
  sourceCodeEmbeddings: {
    count: jest.fn(),
  },
  queryMetrics: {
    create: jest.fn().mockResolvedValue({}),
  },
  $executeRaw: jest.fn(),
};

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: mockPrisma,
}));

describe("/api/query", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user123" });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user123" });
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  it("returns 404 if user is not found in database", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

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
    });

    mockPrisma.sourceCodeEmbeddings.count.mockResolvedValue(0);

    mockQueryCodebasePreindex.mockResolvedValue({
      answer: "Pre-index answer",
      sources: [{ fileName: "README.md", sourceCode: "", summary: "x", similarity: 0.5 }],
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
});
