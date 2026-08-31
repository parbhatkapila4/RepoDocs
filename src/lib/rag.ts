import prisma from "./prisma";
import { getGenerateEmbeddings } from "./gemini";
import { openrouterChatCompletion } from "./openrouter";
import { searchRepoMemory } from "./memory";
import {
  getGitHubRepositoryInfo,
  fetchRepositoryReadmeRaw,
  isHighValueFile,
  listGithubRepoPathsForPreindex,
  fetchGithubPreindexFileContents,
} from "./github";
import { buildQuickDependencyGraphFromGitTree } from "./architecture";

const PREINDEX_FETCH_FILES = 22;
const PREINDEX_PATH_LIST_CAP = 200;
const PREINDEX_EXCERPT_BUDGET = 90_000;

const PREINDEX_PREFERRED_LOWER = [
  "readme.md",
  "readme.markdown",
  "contributing.md",
  "package.json",
  "pnpm-workspace.yaml",
  "turbo.json",
  "tsconfig.json",
  "next.config.ts",
  "next.config.mjs",
  "next.config.js",
  "vite.config.ts",
  "vite.config.mts",
  "vitest.config.ts",
  "prisma/schema.prisma",
  "dockerfile",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "app/layout.tsx",
  "app/page.tsx",
];

function pickPreindexFetchPaths(
  allPaths: string[],
  maxFiles: number,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const byLower = new Map<string, string>();
  for (const p of allPaths) {
    byLower.set(p.replace(/\\/g, "/").toLowerCase(), p);
  }
  const push = (p: string) => {
    if (!p || seen.has(p)) return;
    seen.add(p);
    out.push(p);
  };
  for (const want of PREINDEX_PREFERRED_LOWER) {
    if (out.length >= maxFiles) break;
    const exact = byLower.get(want);
    if (exact) push(exact);
  }
  for (const p of allPaths) {
    if (out.length >= maxFiles) break;
    if (isHighValueFile(p)) push(p);
  }
  const need = maxFiles - out.length;
  if (need > 0 && allPaths.length > 0) {
    const stride = Math.max(1, Math.floor(allPaths.length / need));
    for (let i = 0; i < allPaths.length && out.length < maxFiles; i += stride) {
      push(allPaths[i]);
    }
  }
  for (const p of allPaths) {
    if (out.length >= maxFiles) break;
    push(p);
  }
  return out.slice(0, maxFiles);
}

export interface RAGQueryResult {
  answer: string;
  sources: {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[];
  tokensUsed?: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;

  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  modelUsed?: string;
  memoryHitCount?: number;
  avgMemorySimilarity?: number | null;
}

export async function searchCodebase(
  projectId: string,
  query: string,
  limit: number = 5,
): Promise<
  {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[]
> {
  try {
    const queryEmbedding = await getGenerateEmbeddings(query);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error("Failed to generate query embedding");
    }

    const results = await prisma.$queryRaw<
      {
        id: string;
        fileName: string;
        sourceCode: string;
        Summary: string;
        similarity: number;
      }[]
    >`
      SELECT 
        id,
        "fileName",
        "sourceCode",
        "Summary",
        1 - ("summaryEmbedding" <=> ${queryEmbedding}::vector) as similarity
      FROM "SourceCodeEmbeddings"
      WHERE "projectId" = ${projectId}
        AND "summaryEmbedding" IS NOT NULL
      ORDER BY "summaryEmbedding" <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    return results.map((r) => ({
      fileName: r.fileName,
      sourceCode: r.sourceCode,
      summary: r.Summary,
      similarity: r.similarity,
    }));
  } catch (error) {
    console.error("Error searching codebase:", error);
    throw new Error("Failed to search codebase");
  }
}

export type QueryCodebaseMode = "default" | "guidance";

export interface QueryCodebaseOptions {
  mode?: QueryCodebaseMode;
  identity?: {
    name: string;
    repoUrl: string | null;
    githubToken: string | null;
    indexedCommitSha: string | null;
    fileCount: number;
  };
}

const VECTOR_HIT_SLICE = 5_000;
const MENTIONED_FILE_SLICE = 12_000;
const MAX_MENTION_LOOKUPS = 3;
const FILE_MENTION_BLOCKLIST = new Set([
  "node.js",
  "next.js",
  "react.js",
  "vue.js",
  "nuxt.js",
  "express.js",
  "three.js",
  "d3.js",
  "socket.io",
]);
const DOMAIN_TLDS = new Set([
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "mil",
  "int",
  "io",
  "ai",
  "dev",
  "app",
  "co",
  "me",
  "info",
  "biz",
  "xyz",
  "site",
  "online",
]);

export function extractFileMentions(question: string): string[] {
  const matches =
    question.match(
      /[A-Za-z0-9_./-]*[A-Za-z0-9_-]\.[A-Za-z][A-Za-z0-9]{0,9}\b/g,
    ) ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of matches) {
    const m = raw.replace(/^\.\//, "").replace(/^\/+/, "");
    const lower = m.toLowerCase();
    if (FILE_MENTION_BLOCKLIST.has(lower)) continue;
    if (/^[a-z]\.[a-z]$/i.test(m)) continue;
    if (
      !m.includes("/") &&
      DOMAIN_TLDS.has(lower.slice(lower.lastIndexOf(".") + 1))
    )
      continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(m);
    if (out.length >= MAX_MENTION_LOOKUPS) break;
  }
  return out;
}
async function lookupMentionedFiles(
  projectId: string,
  mentions: string[],
): Promise<
  {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[]
> {
  if (mentions.length === 0) return [];
  try {
    const select = { fileName: true, sourceCode: true, Summary: true } as const;
    const perMention = await Promise.all(
      mentions.map(async (m) => {
        const [exact, suffix] = await Promise.all([
          prisma.sourceCodeEmbeddings.findFirst({
            where: {
              projectId,
              fileName: { equals: m, mode: "insensitive" as const },
            },
            select,
          }),
          prisma.sourceCodeEmbeddings.findMany({
            where: {
              projectId,
              fileName: { endsWith: `/${m}`, mode: "insensitive" as const },
            },
            select,
            take: 2,
            orderBy: { fileName: "asc" as const },
          }),
        ]);
        return exact ? [exact, ...suffix] : suffix;
      }),
    );

    const out: { fileName: string; sourceCode: string; Summary: string }[] = [];
    const seen = new Set<string>();
    const push = (r: {
      fileName: string;
      sourceCode: string;
      Summary: string;
    }) => {
      const k = r.fileName.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      out.push(r);
    };
    for (const rows of perMention) if (rows[0]) push(rows[0]);
    for (const rows of perMention) for (const r of rows.slice(1)) push(r);
    return out.slice(0, MAX_MENTION_LOOKUPS + 2).map((r) => ({
      fileName: r.fileName,
      sourceCode: r.sourceCode,
      summary: r.Summary,
      similarity: 1,
    }));
  } catch {
    return [];
  }
}

async function getProjectChatIdentity(projectId: string): Promise<{
  name: string;
  repoUrl: string | null;
  githubToken: string | null;
  indexedCommitSha: string | null;
  fileCount: number;
}> {
  try {
    const [project, fileCount] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          name: true,
          repoUrl: true,
          githubToken: true,
          indexedCommitSha: true,
        },
      }),
      prisma.sourceCodeEmbeddings.count({ where: { projectId } }),
    ]);
    return {
      name: project?.name ?? "this repository",
      repoUrl: project?.repoUrl ?? null,
      githubToken: project?.githubToken ?? null,
      indexedCommitSha: project?.indexedCommitSha ?? null,
      fileCount,
    };
  } catch {
    return {
      name: "this repository",
      repoUrl: null,
      githubToken: null,
      indexedCommitSha: null,
      fileCount: 0,
    };
  }
}
const MENTION_TREE_PATH_CAP = 4000;
const GITHUB_MENTION_FETCH_TIMEOUT_MS = 10_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}
const MENTION_CACHE_TTL_MS = 5 * 60 * 1000;
const MENTION_TREE_FAIL_TTL_MS = 60 * 1000;
type MentionTreeMeta = Awaited<
  ReturnType<typeof listGithubRepoPathsForPreindex>
>;
const mentionTreeCache = new Map<
  string,
  { meta: MentionTreeMeta; at: number }
>();
const mentionMissCache = new Map<
  string,
  { expiry: number; nearby: string[] }
>();
function nearbyPathsForMention(treePaths: string[], mention: string): string[] {
  const lower = mention.toLowerCase();
  const base = lower.slice(lower.lastIndexOf("/") + 1);
  const dotAt = base.lastIndexOf(".");
  const stem = dotAt > 0 ? base.slice(0, dotAt) : base;
  const dir = mention.includes("/")
    ? lower.slice(0, lower.lastIndexOf("/"))
    : null;
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (p: string) => {
    if (out.length >= 8 || seen.has(p)) return;
    seen.add(p);
    out.push(p);
  };
  if (dir) {
    for (const p of treePaths) {
      if (p.toLowerCase().startsWith(`${dir}/`)) push(p);
    }
  }
  if (stem.length >= 3) {
    for (const p of treePaths) {
      const pb = p.toLowerCase().slice(p.lastIndexOf("/") + 1);
      if (pb.includes(stem)) push(p);
    }
  }
  return out;
}

type LiveMentionFetchResult = {
  files: {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[];

  unresolved: { mention: string; nearby: string[] }[];
};

export function clearMentionResolutionCachesForTest(): void {
  mentionTreeCache.clear();
  mentionMissCache.clear();
}

async function getMentionTree(
  repoUrl: string,
  token: string | undefined,
): Promise<MentionTreeMeta> {
  const hit = mentionTreeCache.get(repoUrl);
  if (
    hit &&
    Date.now() - hit.at <
      (hit.meta ? MENTION_CACHE_TTL_MS : MENTION_TREE_FAIL_TTL_MS)
  ) {
    return hit.meta;
  }
  const meta = await listGithubRepoPathsForPreindex(
    repoUrl,
    token,
    MENTION_TREE_PATH_CAP,
    isMentionResolvablePath,
  );
  mentionTreeCache.set(repoUrl, { meta, at: Date.now() });
  if (mentionTreeCache.size > 50) {
    const oldest = mentionTreeCache.keys().next().value;
    if (oldest !== undefined) mentionTreeCache.delete(oldest);
  }
  return meta;
}
function isMentionResolvablePath(path: string): boolean {
  const lower = path.replace(/\\/g, "/").toLowerCase();
  return !(
    lower.includes("node_modules/") ||
    lower.includes(".git/") ||
    lower.includes(".next/") ||
    lower.includes("dist/") ||
    lower.includes("build/") ||
    lower.includes("/vendor/") ||
    lower.endsWith(".min.js") ||
    lower.endsWith(".map")
  );
}
async function fetchMissingMentionsFromGithub(
  identity: {
    repoUrl: string | null;
    githubToken: string | null;
    indexedCommitSha: string | null;
  },
  missingMentions: string[],
): Promise<LiveMentionFetchResult> {
  if (missingMentions.length === 0 || !identity.repoUrl) {
    return { files: [], unresolved: [] };
  }
  const repoUrl = identity.repoUrl;
  const now = Date.now();
  const cachedUnresolved: { mention: string; nearby: string[] }[] = [];
  const mentionsToTry: string[] = [];
  for (const m of missingMentions) {
    const hit = mentionMissCache.get(`${repoUrl}:${m.toLowerCase()}`);
    if (hit && hit.expiry > now) {
      cachedUnresolved.push({ mention: m, nearby: hit.nearby });
    } else {
      mentionsToTry.push(m);
    }
  }
  if (mentionsToTry.length === 0) {
    return { files: [], unresolved: cachedUnresolved };
  }
  try {
    const { parseGithubOwnerRepo } = await import("./github");
    const parsed = parseGithubOwnerRepo(repoUrl);
    if (!parsed) return { files: [], unresolved: cachedUnresolved };
    const { decryptSecret } = await import("./secret-crypto");
    const token =
      decryptSecret(identity.githubToken) || process.env.GITHUB_TOKEN;

    const treeMeta = await getMentionTree(repoUrl, token);
    const treePaths = treeMeta?.paths ?? [];

    const candidates: string[] = [];
    const seenCandidate = new Set<string>();
    const addCandidate = (p: string) => {
      const k = p.toLowerCase();
      if (seenCandidate.has(k)) return;
      seenCandidate.add(k);
      candidates.push(p);
    };
    const secondary: string[] = [];
    const fromTree = new Set<string>();
    const mentionHadTreeMatch = new Set<string>();
    for (const mention of mentionsToTry) {
      const lower = mention.toLowerCase();
      const matches = treePaths
        .filter((p) => {
          const pl = p.toLowerCase();
          return pl === lower || pl.endsWith(`/${lower}`);
        })
        // Exact path beats a same-suffix nested path.
        .sort((a, b) => {
          const ae = a.toLowerCase() === lower ? 0 : 1;
          const be = b.toLowerCase() === lower ? 0 : 1;
          return ae - be || a.length - b.length;
        });
      if (matches.length > 0) {
        mentionHadTreeMatch.add(lower);
        addCandidate(matches[0]);
        fromTree.add(matches[0]);
        if (matches[1]) {
          secondary.push(matches[1]);
          fromTree.add(matches[1]);
        }
      } else if (mention.includes("/")) {
        addCandidate(mention);
      }
    }
    for (const p of secondary) addCandidate(p);
    const capped = candidates.slice(0, MAX_MENTION_LOOKUPS);

    const baseRef = identity.indexedCommitSha;
    const fetchChars = MENTIONED_FILE_SLICE + 1;
    const atBaseline =
      baseRef && capped.length > 0
        ? await fetchGithubPreindexFileContents(
            parsed.owner,
            parsed.repo,
            capped,
            baseRef,
            token,
            fetchChars,
            MAX_MENTION_LOOKUPS,
          )
        : [];
    const foundAtBaseline = new Set(atBaseline.map((f) => f.path));
    const remaining = capped.filter((p) => !foundAtBaseline.has(p));
    const atHead =
      remaining.length > 0
        ? await fetchGithubPreindexFileContents(
            parsed.owner,
            parsed.repo,
            remaining,
            treeMeta?.defaultBranch ?? "HEAD",
            token,
            fetchChars,
            MAX_MENTION_LOOKUPS,
          )
        : [];
    const goneFromHead = (path: string) =>
      treeMeta != null && !treeMeta.truncated && !fromTree.has(path);
    const results = [
      ...atBaseline.map((f) => ({
        fileName: f.path,
        sourceCode: f.text,
        summary: goneFromHead(f.path)
          ? "Fetched live from GitHub at the indexed commit - this file existed when the repository was indexed but no longer appears on the current branch (likely moved, renamed, or deleted since; a re-index will reflect that)."
          : "Fetched live from GitHub at the indexed commit - this file exists in the repository but is not in the index (it may have failed or been filtered during indexing; a re-index will include it).",
        similarity: 1,
      })),
      ...atHead.map((f) => ({
        fileName: f.path,
        sourceCode: f.text,
        summary: baseRef
          ? "Fetched live from GitHub at the current branch head - this file was added or changed after the repository was indexed, so the index does not cover it yet (a re-index will)."
          : "Fetched live from GitHub - this file is not in the index yet (it may have failed indexing or been added after; a re-index will include it).",
        similarity: 1,
      })),
    ];
    const unresolved: { mention: string; nearby: string[] }[] = [
      ...cachedUnresolved,
    ];
    if (treeMeta) {
      const gotLower = new Set(results.map((f) => f.fileName.toLowerCase()));
      for (const m of mentionsToTry) {
        const lower = m.toLowerCase();
        const satisfied = [...gotLower].some(
          (f) => f === lower || f.endsWith(`/${lower}`),
        );
        const conclusive = !treeMeta.truncated || m.includes("/");
        if (!satisfied && conclusive && !mentionHadTreeMatch.has(lower)) {
          const nearby = nearbyPathsForMention(treePaths, m);
          unresolved.push({ mention: m, nearby });
          mentionMissCache.set(`${repoUrl}:${lower}`, {
            expiry: Date.now() + MENTION_CACHE_TTL_MS,
            nearby,
          });
        }
      }
      if (mentionMissCache.size > 500) mentionMissCache.clear();
    }

    return { files: results, unresolved };
  } catch {
    return { files: [], unresolved: cachedUnresolved };
  }
}

async function loadMemoryContext(
  projectId: string,
  question: string,
): Promise<{
  memoryContext: string;
  memoryHitCount: number;
  avgMemorySimilarity: number | null;
}> {
  try {
    const queryEmbedding = await getGenerateEmbeddings(question);
    if (queryEmbedding?.length) {
      const memories = await searchRepoMemory(projectId, queryEmbedding, 3);
      const avgMemorySimilarity =
        memories.length > 0
          ? memories.reduce((s, m) => s + m.similarity, 0) / memories.length
          : null;
      const memoryContext =
        memories.length > 0
          ? "\n\n## Repository memory (use to inform answers; code overrides when in conflict):\n" +
            memories.map((m) => `[Memory: ${m.type}] ${m.content}`).join("\n")
          : "";
      return {
        memoryContext,
        memoryHitCount: memories.length,
        avgMemorySimilarity,
      };
    }
  } catch {}
  return { memoryContext: "", memoryHitCount: 0, avgMemorySimilarity: null };
}

export async function queryCodebase(
  projectId: string,
  question: string,
  conversationHistory?: { role: "user" | "assistant"; content: string }[],
  options?: QueryCodebaseOptions,
): Promise<RAGQueryResult> {
  try {
    const mentions = extractFileMentions(question);
    const [vectorHits, indexedMentions, identity] = await Promise.all([
      searchCodebase(projectId, question, 5),
      lookupMentionedFiles(projectId, mentions),
      options?.identity
        ? Promise.resolve(options.identity)
        : getProjectChatIdentity(projectId),
    ]);

    const foundLower = new Set(
      indexedMentions.map((f) => f.fileName.toLowerCase()),
    );
    const missingMentions = mentions.filter(
      (m) =>
        ![...foundLower].some(
          (f) => f === m.toLowerCase() || f.endsWith(`/${m.toLowerCase()}`),
        ),
    );

    const memoryPromise = loadMemoryContext(projectId, question);
    const live = await withTimeout<LiveMentionFetchResult>(
      fetchMissingMentionsFromGithub(identity, missingMentions),
      GITHUB_MENTION_FETCH_TIMEOUT_MS,
      { files: [], unresolved: [] },
    );
    const liveMentions = live.files;
    const mentionedFiles = [...indexedMentions, ...liveMentions];
    const mentionedNames = new Set(
      mentionedFiles.map((f) => f.fileName.toLowerCase()),
    );
    const relevantCode = [
      ...mentionedFiles,
      ...vectorHits.filter(
        (f) => !mentionedNames.has(f.fileName.toLowerCase()),
      ),
    ];

    if (relevantCode.length === 0) {
      const absentNote = live.unresolved
        .map(
          (u) =>
            ` \`${u.mention}\` does not exist in this repository - I checked the file tree, the indexed commit, and the branch head.${
              u.nearby.length > 0
                ? ` Closest real files: ${u.nearby
                    .slice(0, 5)
                    .map((n) => `\`${n}\``)
                    .join(", ")}.`
                : ""
            }`,
        )
        .join("");
      const unproven = mentions.filter(
        (m) =>
          !live.unresolved.some(
            (u) => u.mention.toLowerCase() === m.toLowerCase(),
          ),
      );
      const mentionNote =
        unproven.length > 0
          ? ` I also looked for ${unproven
              .map((m) => `\`${m}\``)
              .join(
                ", ",
              )} by name in the index and on GitHub and couldn't retrieve ${
              unproven.length > 1 ? "them" : "it"
            } - the file may have been moved, renamed, or deleted; double-check the exact path or re-index the repository.`
          : "";
      return {
        answer:
          "I couldn't find any relevant code for your question. The repository might not be fully indexed yet, or your question might be too specific." +
          absentNote +
          mentionNote,
        sources: [],
        avgMemorySimilarity: null,
      };
    }

    const { memoryContext, memoryHitCount, avgMemorySimilarity } =
      await memoryPromise;

    const codeContext = relevantCode
      .map((code, idx) => {
        const explicitlyRequested = mentionedNames.has(
          code.fileName.toLowerCase(),
        );
        const slice = explicitlyRequested
          ? MENTIONED_FILE_SLICE
          : VECTOR_HIT_SLICE;
        const label = explicitlyRequested
          ? "explicitly requested by the user"
          : `retrieved by similarity: ${(code.similarity * 100).toFixed(1)}%`;
        return `
[Source ${idx + 1}: ${code.fileName}] (${label})
Summary: ${code.summary}

Code:
\`\`\`
${code.sourceCode.slice(0, slice)}${code.sourceCode.length > slice ? "\n... (file continues beyond this excerpt)" : ""}
\`\`\`
`;
      })
      .join("\n\n---\n\n");

    const guidanceBlock = `
## GUIDANCE MODE (user is asking where to make changes):
The user is asking where to make changes in the codebase. Respond in the following format. Do not generate full code unless the user explicitly asks for code.
(1) **Files to modify**: List the files in recommended order of changes.
(2) **Order of changes**: Brief step-by-step (e.g. add types first, then API, then UI).
(3) **Migration / backward-compatibility**: Any considerations for existing callers or data.
(4) **Risks**: What could break or what to watch for.
(5) **Tests to update**: Which test files or areas to touch.
Write like a senior engineer giving guidance before coding.`;

    const identityBlock = `You are RepoDoc's code assistant for the repository "${identity.name}"${identity.repoUrl ? ` (${identity.repoUrl})` : ""}.

THIS REPOSITORY IS INDEXED. ${identity.fileCount > 0 ? `${identity.fileCount} files were summarized, embedded, and stored${identity.indexedCommitSha ? ` at commit ${identity.indexedCommitSha.slice(0, 7)}` : ""}.` : "Its files were summarized, embedded, and stored."} The code below was pulled FROM THAT INDEX for this question - by semantic retrieval, plus a direct lookup of any file the user named.

Because you answer through that index:
- NEVER say you cannot access the repository or its files, and NEVER ask the user to paste code - you reach the entire indexed repo through retrieval.
- If the user asks whether you can see, read, or access the code: the answer is yes, via the index. Say so and summarize what was retrieved for this question.
- If a file the user needs is NOT among the sources below, don't claim it is inaccessible - say it wasn't retrieved for this question and that asking about the file by its full path will pull its contents in.
- If the user DID name a file and it is still not among the sources below, it could not be found in the index, at the indexed commit, or on the current branch head. Do NOT flatly deny the file exists - especially if you mentioned it earlier in this conversation; acknowledge that and say it could not be retrieved just now. Suggest double-checking the exact path (it may have been moved, renamed, or deleted) and offer re-indexing the repository. EXCEPTION: if the file is listed under "NAMED FILES VERIFIED ABSENT" below, it definitively does not exist - follow that section instead.
- Each source may be an excerpt of a longer file; when a source ends with "(file continues beyond this excerpt)", say the file continues rather than treating the cut as the end of the file.`;

    const baseSystemContent = `${identityBlock}

Your role is to help developers understand this codebase with professional, comprehensive, and crystal-clear explanations - like a senior engineer who knows the repository well.

## RETRIEVED SOURCES FOR THIS QUESTION:

${codeContext}
${memoryContext}

## CORE RESPONSIBILITIES:

1. **Professional Communication**: 
   - Use clear, professional language appropriate for technical documentation
   - Structure your responses logically with proper headings and sections
   - Maintain a helpful and knowledgeable tone throughout

2. **Comprehensive Detail**:
   - Provide thorough explanations that cover all aspects of the question
   - Include context about how components interact with each other
   - Explain the "why" behind code decisions, not just the "what"
   - Break down complex concepts into digestible parts
   - Include relevant examples and use cases when applicable

3. **Clarity and Precision**:
   - Start with a clear, direct answer to the user's question
   - Use structured formatting (headings, bullet points, code blocks)
   - Define technical terms when first introduced
   - Provide step-by-step explanations for complex processes
   - Use visual separators and formatting to improve readability

4. **Code Understanding**:
   - Analyze the provided code snippets thoroughly
   - Explain the purpose and functionality of each relevant section
   - Identify patterns, design decisions, and architectural choices
   - Point out relationships between different files and components
   - Highlight important implementation details

5. **Actionable Information**:
   - Provide specific file paths and line references when relevant
   - Include code examples that demonstrate concepts clearly
   - Offer practical insights about how to use or modify the code
   - Suggest best practices or improvements when appropriate
   - Explain potential edge cases or considerations

## RESPONSE STRUCTURE:

For each question, structure your response as follows:

1. **Direct Answer**: Start with a clear, concise answer to the question
2. **Detailed Explanation**: Provide comprehensive context and background
3. **Code Analysis**: Break down relevant code sections with explanations
4. **Examples**: Include practical examples or use cases when helpful
5. **References**: Always cite specific files and code locations
6. **Additional Context**: Include related information that might be helpful

## FORMATTING GUIDELINES:

- Use markdown formatting extensively (headings, code blocks, lists, tables)
- Format code examples with proper syntax highlighting
- Use code blocks for all code snippets, even inline code
- Create clear visual hierarchy with headings and sections
- Use bullet points or numbered lists for step-by-step processes
- Include file paths in code format: \`path/to/file.ts\`

## IMPORTANT RULES:

- **Accuracy First**: Ground every claim in the retrieved sources above. If something isn't in them, say so plainly instead of guessing
- **Be Thorough**: Don't skip details that would help the user fully understand the concept
- **Be Clear**: Avoid jargon without explanation. If you must use technical terms, define them
- **Cite Sources**: Always reference which files you're discussing: "In \`src/lib/auth.ts\`..."
- **Professional Tone**: Maintain a helpful, expert tone - like a senior engineer mentoring a colleague
- **Structure Matters**: Use clear sections, headings, and formatting to make responses easy to scan and understand
- **Context Awareness**: Consider the conversation history and build upon previous answers when relevant

## WHEN THE RETRIEVED SOURCES AREN'T ENOUGH:

If the sources above don't fully answer the question:
- State clearly what the retrieved code does show and what can be inferred from it
- Name the specific files or areas of the repo that would likely hold the answer
- Tell the user to ask about those files by path - naming a file pulls its contents into the next answer
- Never frame the gap as you lacking access to the repository; it is only a retrieval miss for this particular question

Remember: Your goal is to make the codebase as understandable as possible. Be detailed, be clear, be professional, and always prioritize the user's understanding.`;

    const unresolvedBlock =
      live.unresolved.length > 0
        ? `\n\n## NAMED FILES VERIFIED ABSENT:\n` +
          live.unresolved
            .map(
              (u) =>
                `- \`${u.mention}\` - checked against the repository's file tree and by direct retrieval at the indexed commit and the current branch head: this file does not exist in the repository.${
                  u.nearby.length > 0
                    ? ` Real files near that path: ${u.nearby
                        .map((n) => `\`${n}\``)
                        .join(", ")}.`
                    : ""
                }`,
            )
            .join("\n") +
          `\nFor these files: state plainly that the file does not exist in this repository - do NOT suggest re-checking capitalization, other commits, or re-indexing - and point the user to the real nearby files they probably meant.`
        : "";

    const systemContent =
      (options?.mode === "guidance"
        ? baseSystemContent + guidanceBlock
        : baseSystemContent) + unresolvedBlock;

    const messages: {
      role: "user" | "assistant" | "system";
      content: string;
    }[] = [
      {
        role: "system",
        content: systemContent,
      },
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    messages.push({
      role: "user",
      content: question,
    });

    const chatResult = await openrouterChatCompletion({
      model: "google/gemini-2.5-flash",
      messages,
      temperature: 0.3,
    });

    const usage = chatResult.usage;
    return {
      answer: chatResult.content,
      sources: relevantCode,
      usage: chatResult.usage,
      model: chatResult.model,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      modelUsed: chatResult.model,
      memoryHitCount,
      avgMemorySimilarity,
    };
  } catch (error) {
    console.error("Error in RAG query:", error);
    throw new Error("Failed to process your question. Please try again.");
  }
}

export async function queryCodebasePreindex(
  repoUrl: string,
  githubToken: string | null | undefined,
  question: string,
  conversationHistory?: { role: "user" | "assistant"; content: string }[],
  options?: QueryCodebaseOptions,
): Promise<RAGQueryResult> {
  const token = githubToken || undefined;
  const repoInfo = await getGitHubRepositoryInfo(repoUrl, token);
  const treeMeta = await listGithubRepoPathsForPreindex(repoUrl, token);

  let paths: string[] = treeMeta?.paths ?? [];
  const owner = treeMeta?.owner;
  const repoName = treeMeta?.repo;
  const branch = treeMeta?.defaultBranch ?? repoInfo?.defaultBranch ?? "main";

  if (paths.length === 0) {
    const graph = await buildQuickDependencyGraphFromGitTree(repoUrl, token);
    paths = graph.nodes.map((n) => n.path).slice(0, 220);
  }

  const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  const own = owner ?? urlMatch?.[1];
  const rep = repoName ?? urlMatch?.[2]?.replace(/\.git$/, "");

  const picked = pickPreindexFetchPaths(paths, PREINDEX_FETCH_FILES);
  const fetched =
    own && rep
      ? await fetchGithubPreindexFileContents(
          own,
          rep,
          picked,
          branch,
          token,
          7200,
          PREINDEX_FETCH_FILES,
        )
      : [];

  const readme = await fetchRepositoryReadmeRaw(repoUrl, token, 10_000);
  const hasReadmeInFetched = fetched.some((f) =>
    /^readme(\.|$)/i.test(f.path.split("/").pop() || ""),
  );
  const readmeSupplement =
    readme && !hasReadmeInFetched
      ? `\n## README (supplementary excerpt)\n${readme}\n`
      : "";

  const excerptParts: string[] = [];
  let excerptUsed = 0;
  for (const f of fetched) {
    const header = `\n## File: ${f.path}${f.truncated ? " (trimmed per file)" : ""}\n\`\`\`\n`;
    const footer = `\n\`\`\`\n`;
    const room =
      PREINDEX_EXCERPT_BUDGET - excerptUsed - header.length - footer.length;
    if (room < 200) break;
    const body =
      f.text.length > room ? `${f.text.slice(0, room)}\n...` : f.text;
    excerptParts.push(header + body + footer);
    excerptUsed += header.length + body.length + footer.length;
  }

  const pathList = paths.length
    ? paths.slice(0, PREINDEX_PATH_LIST_CAP).join("\n")
    : "(no file paths discovered yet)";

  const metaBlock = repoInfo
    ? `Repository: ${repoInfo.fullName}
Description: ${repoInfo.description ?? "n/a"}
Default branch: ${repoInfo.defaultBranch}
Primary language: ${repoInfo.language ?? "n/a"}
Topics: ${repoInfo.topics?.join(", ") || "n/a"}
Stars / forks: ${repoInfo.stars} / ${repoInfo.forks}`
    : "Repository metadata could not be loaded (check URL, privacy, or GitHub token).";

  const guidanceBlock =
    options?.mode === "guidance"
      ? `\n## GUIDANCE MODE\nGive file-oriented guidance using paths from the list and excerpts. Do not invent files that are not listed.`
      : "";

  const fileExcerptSection =
    excerptParts.length > 0
      ? `## File contents (raw from GitHub; pre-index)\n${excerptParts.join("")}`
      : "";

  const systemContent = `You are RepoDoc's code assistant. This repository is STILL BEING INDEXED, so for now you answer from a live GitHub fetch: the metadata, file excerpts, README supplement, and path list below.

You DO have access to this repository - the excerpts below were fetched from it moments ago. Never tell the user to paste code to you. If the user asks whether you can see or access the code: yes, via this live fetch, with fuller retrieval available once indexing completes. Do not claim to have read files that are not in the excerpts or README supplement; if detail is missing, say what is missing and that the completed index will cover it.
${guidanceBlock}

## Context

${metaBlock}

${fileExcerptSection}
${readmeSupplement}
## File paths (from GitHub tree, truncated)
${pathList}`;

  const messages: {
    role: "user" | "assistant" | "system";
    content: string;
  }[] = [{ role: "system", content: systemContent }];

  if (conversationHistory?.length) {
    messages.push(...conversationHistory);
  }
  messages.push({ role: "user", content: question });

  const chatResult = await openrouterChatCompletion({
    model: "google/gemini-2.5-flash",
    messages,
    temperature: 0.35,
  });

  const usage = chatResult.usage;
  let sources = fetched.map((f, i) => ({
    fileName: f.path,
    sourceCode: f.text.slice(0, 600),
    summary: f.truncated
      ? "Pre-index excerpt (trimmed per file)"
      : "Pre-index file from GitHub",
    similarity: Math.max(0.22, 0.58 - i * 0.02),
  }));
  if (sources.length === 0 && readme && !hasReadmeInFetched) {
    sources = [
      {
        fileName: "README.md",
        sourceCode: readme.slice(0, 500),
        summary: "README excerpt (pre-index)",
        similarity: 0.45,
      },
    ];
  } else if (sources.length === 0 && paths.length) {
    sources = paths.slice(0, 10).map((p) => ({
      fileName: p,
      sourceCode: "",
      summary: "Tree path only (pre-index; could not fetch contents)",
      similarity: 0.25,
    }));
  }

  return {
    answer: chatResult.content,
    sources,
    usage: chatResult.usage,
    model: chatResult.model,
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    modelUsed: chatResult.model,
    memoryHitCount: 0,
    avgMemorySimilarity: null,
  };
}
