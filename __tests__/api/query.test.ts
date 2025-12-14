import { NextRequest } from "next/server";
import { POST } from "@/app/api/query/route";

const mockAuth = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

const mockQueryCodebase = jest.fn();
jest.mock("@/lib/rag", () => ({
  queryCodebase: mockQueryCodebase,
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  project: {
    findFirst: jest.fn(),
  },
  sourceCodeEmbiddings: {
    count: jest.fn(),
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

    mockPrisma.sourceCodeEmbiddings.count.mockResolvedValue(10);
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

  it("returns 400 if project is not indexed", async () => {
    mockPrisma.project.findFirst.mockResolvedValue({
      id: "proj1",
      userId: "user123",
      name: "Test Project",
    });

    mockPrisma.sourceCodeEmbiddings.count.mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/query", {
      method: "POST",
      body: JSON.stringify({
        projectId: "proj1",
        question: "Test question",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Project not indexed yet");
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
