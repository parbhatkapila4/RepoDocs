jest.mock("octokit", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      repos: {
        get: jest.fn(),
        listLanguages: jest.fn(),
        getAllTopics: jest.fn(),
        getReadme: jest.fn(),
        getContent: jest.fn(),
      },
      git: { getTree: jest.fn() },
      search: { repos: jest.fn() },
    },
  })),
}));

jest.mock("@langchain/community/document_loaders/web/github", () => ({
  GithubRepoLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    sourceCodeEmbeddings: { count: jest.fn() },
  },
}));

jest.mock("../../src/lib/gemini", () => ({
  getGenerateEmbeddings: jest.fn(),
}));

jest.mock("../../src/lib/openrouter", () => ({
  openrouterChatCompletion: jest.fn(),
}));

import prisma from "../../src/lib/prisma";
import { getGenerateEmbeddings } from "../../src/lib/gemini";
import { openrouterChatCompletion } from "../../src/lib/openrouter";
import { searchCodebase, queryCodebase } from "../../src/lib/rag";

const mockQueryRaw = prisma.$queryRaw as unknown as jest.Mock;
const mockGetGenerateEmbeddings = getGenerateEmbeddings as unknown as jest.Mock;
const mockOpenrouterChatCompletion =
  openrouterChatCompletion as unknown as jest.Mock;

describe("RAG System", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("searchCodebase", () => {
    it("should return relevant code snippets based on query", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockResults = [
        {
          id: "1",
          fileName: "test.ts",
          sourceCode: "const x = 1;",
          Summary: "Test summary",
          similarity: 0.95,
        },
      ];

      mockGetGenerateEmbeddings.mockResolvedValue(mockEmbedding);
      mockQueryRaw.mockResolvedValue(mockResults);

      const result = await searchCodebase("project1", "test query", 5);

      expect(result).toHaveLength(1);
      expect(result[0].fileName).toBe("test.ts");
      expect(result[0].similarity).toBe(0.95);
      expect(mockGetGenerateEmbeddings).toHaveBeenCalledWith("test query");
      expect(mockQueryRaw).toHaveBeenCalled();
    });

    it("should handle empty results gracefully", async () => {
      mockGetGenerateEmbeddings.mockResolvedValue([0.1, 0.2, 0.3]);
      mockQueryRaw.mockResolvedValue([]);

      const result = await searchCodebase("project1", "test query", 5);

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it("forwards the limit to the SQL query", async () => {
      mockGetGenerateEmbeddings.mockResolvedValue([0.1, 0.2, 0.3]);
      mockQueryRaw.mockResolvedValue([]);

      await searchCodebase("project1", "test query", 3);

      const sqlArgs = mockQueryRaw.mock.calls[0];
      const flat = JSON.stringify(sqlArgs);
      expect(flat).toContain("3");
    });

    it("should handle embedding generation failure", async () => {
      mockGetGenerateEmbeddings.mockResolvedValue(null);

      await expect(searchCodebase("project1", "test query")).rejects.toThrow(
        "Failed to search codebase"
      );
    });

    it("should handle database errors", async () => {
      mockGetGenerateEmbeddings.mockResolvedValue([0.1, 0.2, 0.3]);
      mockQueryRaw.mockRejectedValue(new Error("Database error"));

      await expect(searchCodebase("project1", "test query")).rejects.toThrow(
        "Failed to search codebase"
      );
    });
  });

  describe("queryCodebase", () => {
    it("should generate answer with source references", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockAnswer = "This is a test answer";

      mockGetGenerateEmbeddings.mockResolvedValue(mockEmbedding);
      mockQueryRaw.mockResolvedValue([
        {
          id: "1",
          fileName: "test.ts",
          sourceCode: "const x = 1;",
          Summary: "Test summary",
          similarity: 0.95,
        },
      ]);
      mockOpenrouterChatCompletion.mockResolvedValue({
        content: mockAnswer,
        model: "google/gemini-2.5-flash",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      const result = await queryCodebase(
        "project1",
        "What does this code do?"
      );

      expect(result).toHaveProperty("answer");
      expect(result).toHaveProperty("sources");
      expect(result.answer).toBe(mockAnswer);
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].fileName).toBe("test.ts");
    });

    it("should handle empty search results", async () => {
      mockGetGenerateEmbeddings.mockResolvedValue([0.1, 0.2, 0.3]);
      mockQueryRaw.mockResolvedValue([]);

      const result = await queryCodebase("project1", "test question");

      expect(result.answer).toContain("couldn't find any relevant code");
      expect(result.sources).toHaveLength(0);
      expect(mockOpenrouterChatCompletion).not.toHaveBeenCalled();
    });

    it("should handle conversation history", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockSearchResults = [
        {
          id: "1",
          fileName: "test.ts",
          sourceCode: "const x = 1;",
          Summary: "Test summary",
          similarity: 0.95,
        },
      ];
      const mockAnswer = "Follow-up answer";
      const conversationHistory = [
        { role: "user" as const, content: "First question" },
        { role: "assistant" as const, content: "First answer" },
      ];

      mockGetGenerateEmbeddings.mockResolvedValue(mockEmbedding);
      mockQueryRaw.mockResolvedValue(mockSearchResults);
      mockOpenrouterChatCompletion.mockResolvedValue({
        content: mockAnswer,
        model: "google/gemini-2.5-flash",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      const result = await queryCodebase(
        "project1",
        "Follow-up question",
        conversationHistory
      );

      expect(result.answer).toBe(mockAnswer);
      expect(mockOpenrouterChatCompletion).toHaveBeenCalled();
      const callArgs = mockOpenrouterChatCompletion.mock.calls[0][0];
      expect(callArgs.messages.length).toBeGreaterThan(2);
    });

    it("should handle errors gracefully", async () => {
      mockGetGenerateEmbeddings.mockRejectedValue(new Error("API error"));

      await expect(
        queryCodebase("project1", "test question")
      ).rejects.toThrow("Failed to process your question");
    });
  });
});
