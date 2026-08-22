jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    project: { findUnique: jest.fn() },
    sourceCodeEmbeddings: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  },
}));
jest.mock("@/lib/gemini", () => ({ getGenerateEmbeddings: jest.fn() }));
jest.mock("@/lib/openrouter", () => ({ openrouterChatCompletion: jest.fn() }));
jest.mock("@/lib/memory", () => ({ searchRepoMemory: jest.fn() }));
jest.mock("@/lib/secret-crypto", () => ({
  decryptSecret: (v: string | null) => v,
}));
jest.mock("@/lib/github", () => ({
  parseGithubOwnerRepo: jest.fn(() => ({ owner: "puny", repo: "demo" })),
  getGitHubRepositoryInfo: jest.fn(),
  fetchRepositoryReadmeRaw: jest.fn(),
  isHighValueFile: jest.fn(() => false),
  listGithubRepoPathsForPreindex: jest.fn(),
  fetchGithubPreindexFileContents: jest.fn(),
}));
jest.mock("@/lib/architecture", () => ({
  buildQuickDependencyGraphFromGitTree: jest.fn(),
}));

import prisma from "@/lib/prisma";
import { getGenerateEmbeddings } from "@/lib/gemini";
import { openrouterChatCompletion } from "@/lib/openrouter";
import { searchRepoMemory } from "@/lib/memory";
import {
  fetchGithubPreindexFileContents,
  listGithubRepoPathsForPreindex,
} from "@/lib/github";
import {
  extractFileMentions,
  queryCodebase,
  clearMentionResolutionCachesForTest,
} from "@/lib/rag";

describe("extractFileMentions", () => {
  it("finds explicit file paths in a question", () => {
    expect(
      extractFileMentions("explain src/lib/auth.ts and workers/tasks.py"),
    ).toEqual(["src/lib/auth.ts", "workers/tasks.py"]);
  });

  it("finds bare filenames", () => {
    expect(extractFileMentions("what does schema.prisma define?")).toEqual([
      "schema.prisma",
    ]);
  });

  it("ignores framework names and version numbers", () => {
    expect(
      extractFileMentions(
        "is this built with Next.js 16 and node.js v22.15.1?",
      ),
    ).toEqual([]);
  });

  it("dedupes case-insensitively and caps the count", () => {
    expect(
      extractFileMentions(
        "compare a.ts, A.ts, b.ts, c.ts, d.ts — which is the entrypoint?",
      ),
    ).toEqual(["a.ts", "b.ts", "c.ts"]);
  });

  it("returns nothing for capability meta-questions", () => {
    expect(
      extractFileMentions("so can you access the code of those files?"),
    ).toEqual([]);
  });

  it("ignores prose abbreviations and web domains", () => {
    expect(
      extractFileMentions(
        "explain the auth flow, e.g. login and sessions, i.e. the cookie part — it runs at repodoc.parbhat.dev behind github.com",
      ),
    ).toEqual([]);
  });
});

describe("queryCodebase named-file handling", () => {
  const queryRaw = prisma.$queryRaw as jest.Mock;
  const projectFindUnique = prisma.project.findUnique as jest.Mock;
  const embFindMany = prisma.sourceCodeEmbeddings.findMany as jest.Mock;
  const embCount = prisma.sourceCodeEmbeddings.count as jest.Mock;
  const embed = getGenerateEmbeddings as jest.Mock;
  const chat = openrouterChatCompletion as jest.Mock;
  const memory = searchRepoMemory as jest.Mock;
  const embFindFirst = prisma.sourceCodeEmbeddings.findFirst as jest.Mock;
  const liveFetch = fetchGithubPreindexFileContents as jest.Mock;
  const treeList = listGithubRepoPathsForPreindex as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    clearMentionResolutionCachesForTest();
    embed.mockResolvedValue([0.1, 0.2]);
    memory.mockResolvedValue([]);
    chat.mockResolvedValue({ content: "answer", usage: undefined });
    projectFindUnique.mockResolvedValue({
      name: "Ai-demo-video",
      repoUrl: "https://github.com/puny/demo",
      githubToken: "tok",
      indexedCommitSha: "0688975".padEnd(40, "0"),
    });
    embCount.mockResolvedValue(42);
    queryRaw.mockResolvedValue([
      {
        id: "1",
        fileName: "backend/app/__init__.py",
        sourceCode: "",
        Summary: "empty package marker",
        similarity: 0.4,
      },
    ]);
  });

  it("falls back to a live GitHub fetch when a named file is missing from the index", async () => {
    embFindMany.mockResolvedValue([]);
    liveFetch.mockResolvedValue([
      {
        path: "backend/app/workers/video_worker.py",
        text: "def process_video(): ...",
        truncated: false,
      },
    ]);

    const result = await queryCodebase(
      "p-1",
      "backend/app/workers/video_worker.py what code it has",
    );

    expect(liveFetch).toHaveBeenCalledWith(
      "puny",
      "demo",
      ["backend/app/workers/video_worker.py"],
      expect.any(String),
      "tok",
      expect.any(Number),
      expect.any(Number),
    );
    expect(result.sources[0].fileName).toBe(
      "backend/app/workers/video_worker.py",
    );
    const systemPrompt = chat.mock.calls[0][0].messages[0].content;
    expect(systemPrompt).toContain("def process_video");
    expect(systemPrompt).toContain("NEVER say you cannot access");
  });

  it("serves a named file from the index without a live fetch", async () => {
    embFindMany.mockResolvedValue([
      {
        fileName: "backend/app/workers/video_worker.py",
        sourceCode: "def process_video(): ...",
        Summary: "video worker",
      },
    ]);

    const result = await queryCodebase(
      "p-1",
      "explain backend/app/workers/video_worker.py",
    );

    expect(liveFetch).not.toHaveBeenCalled();
    expect(treeList).not.toHaveBeenCalled();
    expect(result.sources[0].fileName).toBe(
      "backend/app/workers/video_worker.py",
    );
    expect(result.sources[0].similarity).toBe(1);
  });

  it("resolves a bare filename to its full repo path via the GitHub tree", async () => {
    embFindMany.mockResolvedValue([]);
    treeList.mockResolvedValue({
      paths: ["backend/app/main.py", "backend/app/workers/video_worker.py"],
      defaultBranch: "main",
      owner: "puny",
      repo: "demo",
      truncated: false,
    });
    liveFetch.mockResolvedValue([
      {
        path: "backend/app/workers/video_worker.py",
        text: "def process_video(): ...",
        truncated: false,
      },
    ]);

    const result = await queryCodebase(
      "p-1",
      "what does video_worker.py actually do?",
    );

    expect(liveFetch).toHaveBeenCalledWith(
      "puny",
      "demo",
      ["backend/app/workers/video_worker.py"],
      expect.any(String),
      "tok",
      expect.any(Number),
      expect.any(Number),
    );
    expect(result.sources[0].fileName).toBe(
      "backend/app/workers/video_worker.py",
    );
  });

  it("retries at the branch head when a named file was added after indexing", async () => {
    embFindMany.mockResolvedValue([]);
    treeList.mockResolvedValue({
      paths: ["src/new-feature.ts"],
      defaultBranch: "main",
      owner: "puny",
      repo: "demo",
      truncated: false,
    });
    liveFetch.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        path: "src/new-feature.ts",
        text: "export const x = 1",
        truncated: false,
      },
    ]);

    const result = await queryCodebase("p-1", "explain src/new-feature.ts");

    expect(liveFetch).toHaveBeenNthCalledWith(
      1,
      "puny",
      "demo",
      ["src/new-feature.ts"],
      "0688975".padEnd(40, "0"),
      "tok",
      expect.any(Number),
      expect.any(Number),
    );
    expect(liveFetch).toHaveBeenNthCalledWith(
      2,
      "puny",
      "demo",
      ["src/new-feature.ts"],
      "main",
      "tok",
      expect.any(Number),
      expect.any(Number),
    );
    const src = result.sources.find((s) => s.fileName === "src/new-feature.ts");
    expect(src?.summary).toContain("after the repository was indexed");
  });

  it("does not let one ambiguous basename starve another mention", async () => {
    embFindFirst.mockResolvedValue(null);
    embFindMany.mockImplementation(
      ({ where }: { where: { fileName: { endsWith: string } } }) => {
        if (where.fileName.endsWith === "/page.tsx") {
          return Promise.resolve([
            { fileName: "app/a/page.tsx", sourceCode: "A", Summary: "page a" },
            { fileName: "app/b/page.tsx", sourceCode: "B", Summary: "page b" },
          ]);
        }
        if (where.fileName.endsWith === "/rag.ts") {
          return Promise.resolve([
            {
              fileName: "src/lib/rag.ts",
              sourceCode: "R",
              Summary: "rag core",
            },
          ]);
        }
        return Promise.resolve([]);
      },
    );

    const result = await queryCodebase(
      "p-1",
      "how does page.tsx call into rag.ts?",
    );

    const names = result.sources.map((s) => s.fileName);
    expect(names).toContain("src/lib/rag.ts");
    expect(names).toContain("app/a/page.tsx");
    expect(liveFetch).not.toHaveBeenCalled();
    expect(treeList).not.toHaveBeenCalled();
  });

  it("marks a truncated live-fetched file as continuing beyond the excerpt", async () => {
    embFindMany.mockResolvedValue([]);
    treeList.mockResolvedValue({
      paths: ["src/big.ts"],
      defaultBranch: "main",
      owner: "puny",
      repo: "demo",
      truncated: false,
    });
    liveFetch.mockResolvedValue([
      { path: "src/big.ts", text: "x".repeat(12_001), truncated: true },
    ]);

    await queryCodebase("p-1", "explain src/big.ts");
    expect(liveFetch.mock.calls[0][5]).toBe(12_001);
    const systemPrompt = chat.mock.calls[0][0].messages[0].content;
    expect(systemPrompt).toContain("(file continues beyond this excerpt)");
  });

  it("says a baseline-only file is gone from the current branch, not that it exists", async () => {
    embFindMany.mockResolvedValue([]);
    treeList.mockResolvedValue({
      paths: ["src/other.ts"],
      defaultBranch: "main",
      owner: "puny",
      repo: "demo",
      truncated: false,
    });
    liveFetch.mockResolvedValueOnce([
      { path: "src/legacy.ts", text: "old code", truncated: false },
    ]);

    const result = await queryCodebase("p-1", "explain src/legacy.ts");

    const src = result.sources.find((s) => s.fileName === "src/legacy.ts");
    expect(src?.summary).toContain("no longer appears on the current branch");
    expect(src?.summary).not.toContain("exists in the repository");
  });

  it("reuses the cached tree listing across questions in a conversation", async () => {
    embFindMany.mockResolvedValue([]);
    treeList.mockResolvedValue({
      paths: ["backend/app/workers/video_worker.py"],
      defaultBranch: "main",
      owner: "puny",
      repo: "demo",
      truncated: false,
    });
    liveFetch.mockResolvedValue([
      {
        path: "backend/app/workers/video_worker.py",
        text: "def process_video(): ...",
        truncated: false,
      },
    ]);

    await queryCodebase("p-1", "what does video_worker.py do?");
    await queryCodebase("p-1", "why does video_worker.py retry?");

    expect(treeList).toHaveBeenCalledTimes(1);
  });

  it("stops re-probing GitHub for a mention already proven unresolvable", async () => {
    embFindMany.mockResolvedValue([]);
    treeList.mockResolvedValue({
      paths: [],
      defaultBranch: "main",
      owner: "puny",
      repo: "demo",
      truncated: false,
    });
    liveFetch.mockResolvedValue([]);

    await queryCodebase("p-1", "explain utils/nothing.ts");
    const callsAfterFirst = liveFetch.mock.calls.length;
    await queryCodebase("p-1", "explain utils/nothing.ts again");

    expect(callsAfterFirst).toBeGreaterThan(0);
    expect(liveFetch.mock.calls.length).toBe(callsAfterFirst);
    expect(treeList).toHaveBeenCalledTimes(1);
  });

  it("proves a phantom path absent and hands the model the real nearby files", async () => {
    embFindMany.mockResolvedValue([]);
    treeList.mockResolvedValue({
      paths: [
        "backend/app/models/__init__.py",
        "backend/app/models/video.py",
        "backend/app/models/product.py",
      ],
      defaultBranch: "main",
      owner: "puny",
      repo: "demo",
      truncated: false,
    });
    liveFetch.mockResolvedValue([]);

    await queryCodebase("p-1", "explain backend/app/models/user.py");

    const systemPrompt = chat.mock.calls[0][0].messages[0].content;
    expect(systemPrompt).toContain("## NAMED FILES VERIFIED ABSENT");
    expect(systemPrompt).toContain("backend/app/models/user.py");
    expect(systemPrompt).toContain("backend/app/models/video.py");
    expect(systemPrompt).toContain("does not exist in the repository");
  });

  it("never declares a tree-matched file absent when only its content fetch failed", async () => {
    embFindMany.mockResolvedValue([]);
    treeList.mockResolvedValue({
      paths: ["backend/app/models/video.py"],
      defaultBranch: "main",
      owner: "puny",
      repo: "demo",
      truncated: false,
    });
    liveFetch.mockResolvedValue([]);

    await queryCodebase("p-1", "explain backend/app/models/video.py");

    const systemPrompt = chat.mock.calls[0][0].messages[0].content;
    expect(systemPrompt).not.toContain("## NAMED FILES VERIFIED ABSENT");
  });

  it("reports which named files could not be retrieved when nothing is found", async () => {
    embFindMany.mockResolvedValue([]);
    queryRaw.mockResolvedValue([]);
    treeList.mockResolvedValue(null);
    liveFetch.mockResolvedValue([]);

    const result = await queryCodebase("p-1", "explain src/ghost-file.ts");

    expect(result.sources).toEqual([]);
    expect(result.answer).toContain("src/ghost-file.ts");
    expect(result.answer).toContain("moved, renamed, or deleted");
  });
});
