import { searchCodebase, queryCodebase } from "@/lib/rag";

const mockQueryRaw = jest.fn();
const mockPrisma = {
  $queryRaw: mockQueryRaw,
  sourceCodeEmbiddings: {
    count: jest.fn(),
  },
};

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: mockPrisma,
}));

const mockGetGenerateEmbeddings = jest.fn();
jest.mock("@/lib/gemini", () => ({
  getGenerateEmbeddings: mockGetGenerateEmbeddings,
}));

const mockOpenrouterChatCompletion = jest.fn();
jest.mock("@/lib/openrouter", () => ({
  openrouterChatCompletion: mockOpenrouterChatCompletion,
}));

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
      const mockEmbedding = [0.1, 0.2, 0.3];

      mockGetGenerateEmbeddings.mockResolvedValue(mockEmbedding);
      mockQueryRaw.mockResolvedValue([]);

      const result = await searchCodebase("project1", "test query", 5);

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should limit results to specified number", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockResults = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        fileName: `test${i}.ts`,
        sourceCode: `const x${i} = ${i};`,
        Summary: `Summary ${i}`,
        similarity: 0.9 - i * 0.1,
      }));

      mockGetGenerateEmbeddings.mockResolvedValue(mockEmbedding);
      mockQueryRaw.mockResolvedValue(mockResults);

      const result = await searchCodebase("project1", "test query", 3);

      expect(result).toHaveLength(3);
      expect(mockQueryRaw).toHaveBeenCalled();
    });

    it("should handle embedding generation failure", async () => {
      mockGetGenerateEmbeddings.mockResolvedValue(null);

      await expect(searchCodebase("project1", "test query")).rejects.toThrow(
        "Failed to search codebase"
      );
    });

    it("should handle database errors", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];

      mockGetGenerateEmbeddings.mockResolvedValue(mockEmbedding);
      mockQueryRaw.mockRejectedValue(new Error("Database error"));

      await expect(searchCodebase("project1", "test query")).rejects.toThrow(
        "Failed to search codebase"
      );
    });
  });

  describe("queryCodebase", () => {
    it("should generate answer with source references", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockSearchResults = [
        {
          fileName: "test.ts",
          sourceCode: "const x = 1;",
          summary: "Test summary",
          similarity: 0.95,
        },
      ];
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
      mockOpenrouterChatCompletion.mockResolvedValue(mockAnswer);

      const result = await queryCodebase("project1", "What does this code do?");

      expect(result).toHaveProperty("answer");
      expect(result).toHaveProperty("sources");
      expect(result.answer).toBe(mockAnswer);
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].fileName).toBe("test.ts");
    });

    it("should handle empty search results", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];

      mockGetGenerateEmbeddings.mockResolvedValue(mockEmbedding);
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
      mockOpenrouterChatCompletion.mockResolvedValue(mockAnswer);

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

      await expect(queryCodebase("project1", "test question")).rejects.toThrow(
        "Failed to process your question"
      );
    });
  });
});
