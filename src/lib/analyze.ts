import { log } from "./logger";
import prisma from "@/lib/prisma";
import { getGenerateEmbeddings } from "./gemini";
import { openrouterChatCompletion } from "./openrouter";
import { searchCodebase } from "./rag";
import { searchRepoMemory } from "./memory";
import { estimateCostUsd } from "./cost";
import { recordQueryMetrics, type QueryMetricsPayload } from "./query-metrics";
import type {
  ParsedDiffResult,
  DiffAnalysisMetrics,
  AnalyzeDiffReturn,
} from "./diff";

const HUNK_MAX_LEN = 800;
const SUMMARY_MAX_CHARS_PER_FILE = 300;
const SUMMARY_TOTAL_MAX = 500;
const RELATED_CODE_MAX_CHARS = 600;

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

export const DIFF_ANALYSIS_SYSTEM_PROMPT = `You are a senior engineer reviewing a git/PR diff against the rest of the codebase. You receive three inputs:
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

export function buildDriftSystemPrompt(
  baselineSha: string,
  commitCount: number
): string {
  return `You are a senior engineer reviewing the CUMULATIVE DRIFT in a codebase since RepoDoc last indexed it. RepoDoc's index - embeddings, generated docs, and repository memory - was built at baseline commit ${baselineSha}. Since then, ${commitCount} commit(s) have landed on the indexed branch. The diff below is the NET change from that baseline to the current HEAD: it shows how far the codebase has moved from what RepoDoc currently understands.

${DIFF_ANALYSIS_SYSTEM_PROMPT}

Drift note: where the changes touch files or areas that appear in the retrieved indexed code or repository memory, explicitly call out (in possibleRegressions and/or architecturalImpact) that RepoDoc's existing understanding of those areas may now be STALE and should be re-indexed.`;
}

export interface AnalyzeOptions {
  systemPrompt?: string;
}

export async function analyzeParsedDiff(
  parsed: ParsedDiffResult,
  projectId: string,
  options?: AnalyzeOptions
): Promise<AnalyzeDiffReturn> {
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
            `[${i + 1}] ${c.fileName}\nSummary: ${c.summary}\nCode:\n${c.sourceCode.slice(0, RELATED_CODE_MAX_CHARS)}${c.sourceCode.length > RELATED_CODE_MAX_CHARS ? "..." : ""}`
        )
        .join("\n\n---\n\n")
      : "(No related code retrieved)";

  const memorySection =
    memories.length > 0
      ? memories.map((m) => `[${m.type}] ${m.content}`).join("\n")
      : "(No relevant repository memory)";

  const systemPrompt = options?.systemPrompt ?? DIFF_ANALYSIS_SYSTEM_PROMPT;

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

export function recordAnalysisSuccess(
  routeType: QueryMetricsPayload["routeType"],
  projectId: string,
  result: AnalyzeDiffReturn,
  latencyMs: number
): void {
  const promptTokens = result._metrics?.promptTokens ?? 0;
  const completionTokens = result._metrics?.completionTokens ?? 0;
  const totalTokens = result._metrics?.totalTokens ?? 0;
  const modelUsed = result._metrics?.modelUsed ?? "unknown";
  const retrievalCount = result._metrics?.retrievalCount ?? 0;
  const memoryHitCount = result._metrics?.memoryHitCount ?? 0;
  const estimatedCostUsd = estimateCostUsd(
    promptTokens,
    completionTokens,
    modelUsed
  );

  log.debug("[QueryMetrics] Recording success", { projectId, routeType, latencyMs });
  void recordQueryMetrics(prisma, {
    projectId,
    routeType,
    modelUsed,
    promptTokens,
    completionTokens,
    totalTokens,
    retrievalCount,
    memoryHitCount,
    latencyMs,
    estimatedCostUsd,
    success: true,
    avgMemorySimilarity: result._metrics?.avgMemorySimilarity ?? undefined,
  }).catch((err) => console.error("[QueryMetrics]", err));
}

export function recordAnalysisFailure(
  routeType: QueryMetricsPayload["routeType"],
  projectId: string,
  latencyMs: number,
  errorMessage: string
): void {
  log.debug("[QueryMetrics] Recording failure", { projectId, routeType, latencyMs, success: false });
  void recordQueryMetrics(prisma, {
    projectId,
    routeType,
    modelUsed: "unknown",
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    retrievalCount: 0,
    memoryHitCount: 0,
    latencyMs,
    estimatedCostUsd: 0,
    success: false,
    errorMessage,
  }).catch((err) => console.error("[QueryMetrics]", err));
}
