import { getGenerateEmbeddings } from "./gemini";
import { openrouterChatCompletion } from "./openrouter";
import { searchCodebase } from "./rag";
import { searchRepoMemory } from "./memory";



export interface ParsedDiffFile {
  path: string;
  hunks: string[];
}

export interface ParsedDiffResult {
  files: ParsedDiffFile[];
}



export interface DiffAnalysisResult {
  summary: string;
  whatChanged: string[];
  impactedFiles: string[];
  impactedModules?: string[];
  architecturalImpact?: string;
  riskLevel: "low" | "medium" | "high";
  testsToUpdate?: string[];
  possibleRegressions?: string[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}


export interface DiffAnalysisMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  modelUsed: string;
  retrievalCount: number;
  memoryHitCount: number;
  avgMemorySimilarity: number | null;
}

export type AnalyzeDiffReturn = DiffAnalysisResult & { _metrics?: DiffAnalysisMetrics };



function stripPrefix(path: string): string {
  const s = path.trim();
  if (s.startsWith("a/")) return s.slice(2);
  if (s.startsWith("b/")) return s.slice(2);
  return s;
}

function looksLikeDiff(raw: string): boolean {
  const t = raw.trim();
  return (
    t.includes("diff --git") ||
    (t.includes("--- ") && t.includes("+++ ")) ||
    t.includes("@@ ")
  );
}


export function parseDiff(rawDiff: string): ParsedDiffResult {
  if (!rawDiff || typeof rawDiff !== "string") {
    return { files: [] };
  }

  const lines = rawDiff.split(/\r?\n/);

  if (!looksLikeDiff(rawDiff)) {
    return {
      files: [{ path: "pasted-content", hunks: [rawDiff.trim() || "(empty)"] }],
    };
  }

  const files: ParsedDiffFile[] = [];
  let currentPath: string | null = null;
  let currentHunks: string[] = [];
  let currentHunkLines: string[] = [];

  const flushHunk = () => {
    if (currentHunkLines.length > 0) {
      currentHunks.push(currentHunkLines.join("\n"));
      currentHunkLines = [];
    }
  };

  const flushFile = () => {
    flushHunk();
    if (currentPath !== null && currentHunks.length > 0) {
      files.push({ path: currentPath, hunks: [...currentHunks] });
    }
    currentPath = null;
    currentHunks = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];


    const gitMatch = line.match(/^diff --git\s+a\/(.+?)\s+b\/(.+)$/);
    if (gitMatch) {
      flushFile();
      currentPath = stripPrefix(gitMatch[2].trim());
      continue;
    }


    if (line.startsWith("+++ ")) {
      if (currentPath === null) {
        currentPath = stripPrefix(line.slice(4).trim());
      }
      continue;
    }


    if (line.startsWith("--- ")) continue;


    if (line.match(/^@@\s+-\d+/)) {
      flushHunk();
      currentHunkLines.push(line);
      continue;
    }


    if (currentHunkLines.length > 0) {
      currentHunkLines.push(line);
    }
  }

  flushFile();

  return { files };
}

const HUNK_MAX_LEN = 800;
const SUMMARY_MAX_CHARS_PER_FILE = 300;
const SUMMARY_TOTAL_MAX = 500;

function buildSummaryForRetrieval(parsed: ParsedDiffResult): string {
  const parts: string[] = [];
  let total = 0;
  for (const f of parsed.files) {
    parts.push(f.path);
    total += f.path.length + 1;
    const hunkText = f.hunks.join("\n");
    const slice = hunkText.slice(0, SUMMARY_MAX_CHARS_PER_FILE);
    parts.push(slice);
    total += slice.length;
    if (total >= SUMMARY_TOTAL_MAX) break;
  }
  return parts.join(" ").slice(0, SUMMARY_TOTAL_MAX);
}

function truncateHunk(hunk: string, maxLen: number): string {
  if (hunk.length <= maxLen) return hunk;
  return hunk.slice(0, maxLen) + "\n... (truncated)";
}




export async function analyzeDiff(
  projectId: string,
  rawDiff: string
): Promise<AnalyzeDiffReturn> {
  const parsed = parseDiff(rawDiff);

  if (parsed.files.length === 0) {
    return {
      summary: "No valid diff detected.",
      whatChanged: [],
      impactedFiles: [],
      riskLevel: "low",
    };
  }

  const summaryForRetrieval = buildSummaryForRetrieval(parsed);

  let queryEmbedding: number[] = [];
  try {
    const emb = await getGenerateEmbeddings(summaryForRetrieval);
    if (emb && emb.length > 0) queryEmbedding = emb;
  } catch (e) {
    console.error("[analyzeDiff] Embedding failed:", e);
  }

  let relevantCode: { fileName: string; sourceCode: string; summary: string; similarity: number }[] = [];
  try {
    relevantCode = await searchCodebase(projectId, summaryForRetrieval, 10);
  } catch (e) {
    console.error("[analyzeDiff] searchCodebase failed:", e);
  }

  let memories: { type: string; content: string; similarity?: number }[] = [];
  try {
    if (queryEmbedding.length > 0) {
      memories = await searchRepoMemory(projectId, queryEmbedding, 5);
    }
  } catch (e) {
    console.error("[analyzeDiff] searchRepoMemory failed:", e);
  }

  const diffSection = parsed.files
    .map((f) => {
      const hunkBlocks = f.hunks.map((h) => truncateHunk(h, HUNK_MAX_LEN));
      return `File: ${f.path}\n${hunkBlocks.join("\n---\n")}`;
    })
    .join("\n\n");

  const codeSection =
    relevantCode.length > 0
      ? relevantCode
        .map(
          (c, i) =>
            `[${i + 1}] ${c.fileName}\nSummary: ${c.summary}\nCode:\n${c.sourceCode.slice(0, 600)}${c.sourceCode.length > 600 ? "..." : ""}`
        )
        .join("\n\n---\n\n")
      : "(No related code retrieved)";

  const memorySection =
    memories.length > 0
      ? memories.map((m) => `[${m.type}] ${m.content}`).join("\n")
      : "(No relevant repository memory)";

  const systemPrompt = `You are a senior engineer reviewing a git/PR diff against the rest of the codebase. You receive three inputs:
1) The parsed diff (file paths and hunks)
2) Related files retrieved from the indexed codebase by semantic similarity (for grounding)
3) Repository memory (durable facts, decisions, relationships) retrieved from prior conversations

Use the related code and repo memory to ground your analysis. Do not reason about the diff in isolation. If a function's callers appear in the related code, your analysis must consider them.

Return a single JSON object with these exact keys. Output JSON only. No prose, no markdown fences, no leading or trailing text. Use empty arrays for empty list fields. Omit optional keys entirely (do not return null) when they don't apply.

Schema:
- summary (string, required): 1-2 sentence overall summary of what the diff does and why it matters.
- whatChanged (string[], required): bullet points of concrete changes. One sentence each.
- impactedFiles (string[], required): file paths that the diff modifies. Use the paths from the diff verbatim.
- impactedModules (string[], optional): logical modules or domains affected (e.g. "auth", "billing", "rag"). Only include when the change spans more than one file in the same area.
- architecturalImpact (string, optional): only populate if the diff touches module boundaries, shared utilities, infrastructure (queues, caches, schedulers), or cross-cutting concerns. For trivial within-file changes, OMIT this key entirely.
- riskLevel ("low" | "medium" | "high", required): assess based on:
    * Surface area: how many files and lines changed.
    * Public API: does the diff change exported function signatures, route shapes, or response contracts that external callers depend on?
    * Database schema: does the diff alter migrations, Prisma schema, or raw SQL?
    * Security-sensitive paths: does the diff touch auth, session, token handling, rate-limiting, or input validation code?
  Use "high" if any of: schema migration, public API breaking change, or auth/security code is touched. Use "medium" if surface area is large or the change crosses module boundaries. Otherwise "low".
- testsToUpdate (string[], optional): specific test files or test names that should be updated to cover this change. Only include when the related code or repo memory shows existing tests that touch the impacted code.
- possibleRegressions (string[], optional): reason about what could break DOWNSTREAM. Each entry should describe a specific failure mode (e.g. "callers of X passing the old signature will receive undefined") rather than restating what changed. Use the related code to find downstream callers; if none are visible, list known integration points (the chat endpoint, the indexing worker, the architecture extractor) that could be affected.

Return ONLY the JSON object.`;

  const userPrompt = `## Diff to analyze

${diffSection}

## Related code from codebase

${codeSection}

## Relevant repository memory

${memorySection}

Return the analysis as a single JSON object with keys: summary, whatChanged, impactedFiles, impactedModules (optional), architecturalImpact (optional), riskLevel, testsToUpdate (optional), possibleRegressions (optional).`;

  const chatResult = await openrouterChatCompletion({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  const trimmed = chatResult.content.trim();
  let jsonStr = trimmed;
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    jsonStr = codeBlock[1].trim();
  } else {
    const objMatch = trimmed.match(/\{[\s\S]*\}/);
    if (objMatch) jsonStr = objMatch[0];
  }

  const retrievalCount = relevantCode.length;
  const memoryHitCount = memories.length;
  const avgMemorySimilarity =
    memories.length > 0
      ? memories.reduce((s, m) => s + (m.similarity ?? 0), 0) / memories.length
      : null;
  const usage = chatResult.usage;
  const _metrics: DiffAnalysisMetrics = {
    promptTokens: usage?.prompt_tokens ?? 0,
    completionTokens: usage?.completion_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
    modelUsed: chatResult.model ?? "",
    retrievalCount,
    memoryHitCount,
    avgMemorySimilarity,
  };

  let parsedResult: unknown;
  try {
    parsedResult = JSON.parse(jsonStr);
  } catch (e) {
    console.error("[analyzeDiff] JSON parse failed:", e);
    return {
      summary: "Analysis could not be structured. Raw response: " + chatResult.content.slice(0, 500),
      whatChanged: [],
      impactedFiles: parsed.files.map((f) => f.path),
      riskLevel: "medium",
      _metrics,
    };
  }

  const obj = parsedResult as Record<string, unknown>;
  const riskLevel = obj.riskLevel === "low" || obj.riskLevel === "medium" || obj.riskLevel === "high"
    ? obj.riskLevel
    : "low";

  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    whatChanged: Array.isArray(obj.whatChanged) ? obj.whatChanged.map(String) : [],
    impactedFiles: Array.isArray(obj.impactedFiles) ? obj.impactedFiles.map(String) : [],
    impactedModules: Array.isArray(obj.impactedModules) ? obj.impactedModules.map(String) : undefined,
    architecturalImpact: typeof obj.architecturalImpact === "string" ? obj.architecturalImpact : undefined,
    riskLevel,
    testsToUpdate: Array.isArray(obj.testsToUpdate) ? obj.testsToUpdate.map(String) : undefined,
    possibleRegressions: Array.isArray(obj.possibleRegressions) ? obj.possibleRegressions.map(String) : undefined,
    usage: chatResult.usage,
    model: chatResult.model,
    _metrics,
  };
}
