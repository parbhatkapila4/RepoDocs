export type ModuleKind =
  | "ui"
  | "api"
  | "auth"
  | "rag"
  | "embeddings"
  | "db"
  | "github"
  | "cron"
  | "cache"
  | "memory";

export interface ModuleNode {
  id: ModuleKind;
  label: string;
  kind: "edge" | "service" | "store";
  position: { x: number; y: number };
  description: string;
}

export const MODULE_NODES: ModuleNode[] = [
  {
    id: "ui",
    label: "ui/",
    kind: "edge",
    position: { x: 60, y: 60 },
    description: "Next.js App Router pages, chat surface",
  },
  {
    id: "api",
    label: "api/",
    kind: "edge",
    position: { x: 280, y: 60 },
    description: "Route handlers, server actions",
  },
  {
    id: "auth",
    label: "auth",
    kind: "service",
    position: { x: 500, y: 60 },
    description: "Clerk middleware + session",
  },
  {
    id: "rag",
    label: "rag",
    kind: "service",
    position: { x: 60, y: 200 },
    description: "Retrieval + answer generation",
  },
  {
    id: "embeddings",
    label: "embeddings",
    kind: "service",
    position: { x: 280, y: 200 },
    description: "Gemini text-embedding-004",
  },
  {
    id: "memory",
    label: "memory",
    kind: "service",
    position: { x: 500, y: 200 },
    description: "Repo memory chunks + recall",
  },
  {
    id: "db",
    label: "postgres + pgvector",
    kind: "store",
    position: { x: 60, y: 340 },
    description: "Source of truth + vector index",
  },
  {
    id: "github",
    label: "github",
    kind: "service",
    position: { x: 280, y: 340 },
    description: "Octokit + LangChain repo loader",
  },
  {
    id: "cron",
    label: "indexing-worker",
    kind: "service",
    position: { x: 500, y: 340 },
    description: "Vercel cron + Postgres-leased queue",
  },
  {
    id: "cache",
    label: "cache",
    kind: "store",
    position: { x: 700, y: 200 },
    description: "Query cache + Upstash Redis",
  },
];

export interface ModuleEdge {
  id: string;
  source: ModuleKind;
  target: ModuleKind;
}

export const MODULE_EDGES: ModuleEdge[] = [
  { id: "e-ui-api", source: "ui", target: "api" },
  { id: "e-api-auth", source: "api", target: "auth" },
  { id: "e-api-rag", source: "api", target: "rag" },
  { id: "e-rag-embeddings", source: "rag", target: "embeddings" },
  { id: "e-rag-memory", source: "rag", target: "memory" },
  { id: "e-rag-db", source: "rag", target: "db" },
  { id: "e-embeddings-db", source: "embeddings", target: "db" },
  { id: "e-memory-db", source: "memory", target: "db" },
  { id: "e-cron-github", source: "cron", target: "github" },
  { id: "e-cron-embeddings", source: "cron", target: "embeddings" },
  { id: "e-github-db", source: "github", target: "db" },
  { id: "e-api-cache", source: "api", target: "cache" },
  { id: "e-rag-cache", source: "rag", target: "cache" },
];

export interface SuggestedQuestion {
  id: string;
  prompt: string;
  short: string;
  active: ModuleKind[];
  answer: AnswerPart[];
}

export type AnswerPart =
  | { type: "text"; value: string }
  | { type: "cite"; value: string; node?: ModuleKind };

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: "auth",
    short: "How does auth work?",
    prompt: "How does authentication work in this codebase?",
    active: ["ui", "api", "auth"],
    answer: [
      { type: "text", value: "Clerk handles auth at the middleware layer. " },
      { type: "cite", value: "src/middleware.ts:9", node: "auth" },
      {
        type: "text",
        value:
          " enforces protection on every route except a small public allowlist (sign-in/up, share-token routes, webhooks). Server actions (POST with the next-action header) bypass auth.protect() because they validate the session themselves at ",
      },
      { type: "cite", value: "src/middleware.ts:32", node: "auth" },
      {
        type: "text",
        value:
          ". Authenticated visitors landing on /sign-in are redirected to /dashboard.",
      },
    ],
  },
  {
    id: "indexing",
    short: "How are repos indexed?",
    prompt: "How does indexing run in the background?",
    active: ["github", "cron", "embeddings", "db"],
    answer: [
      {
        type: "text",
        value:
          "Project creation enqueues an IndexingJob row instead of indexing inline. ",
      },
      { type: "cite", value: "src/lib/indexing-worker-run.ts:97", node: "cron" },
      {
        type: "text",
        value:
          " is invoked by Vercel cron and an after()-kick. It leases one job (Postgres lockedAt/lockedBy, 5-minute lease), pulls files via ",
      },
      { type: "cite", value: "src/lib/github.ts:39", node: "github" },
      { type: "text", value: ", embeds them with Gemini at " },
      {
        type: "cite",
        value: "src/lib/gemini.ts (text-embedding-004)",
        node: "embeddings",
      },
      {
        type: "text",
        value:
          ", and writes them into pgvector. needsResume + a resumeAfter cursor lets long jobs split across worker invocations.",
      },
    ],
  },
  {
    id: "rag",
    short: "How does the RAG pipeline answer?",
    prompt: "How does the RAG pipeline produce an answer?",
    active: ["rag", "embeddings", "memory", "db"],
    answer: [
      { type: "text", value: "The /api/query route calls " },
      { type: "cite", value: "src/lib/rag.ts:queryCodebase", node: "rag" },
      {
        type: "text",
        value:
          ". It embeds the question, runs a raw pgvector cosine search against SourceCodeEmbeddings, then layers in supplementary RepoMemory chunks via ",
      },
      { type: "cite", value: "src/lib/memory.ts", node: "memory" },
      {
        type: "text",
        value:
          ". Retrieved code + memory + history are sent to gemini-2.5-flash through OpenRouter. The function returns sources, token usage, and memory-hit metrics  -  every call writes a QueryMetrics row for observability.",
      },
    ],
  },
  {
    id: "cache",
    short: "When does caching kick in?",
    prompt: "When does caching kick in for queries?",
    active: ["api", "rag", "cache"],
    answer: [
      {
        type: "text",
        value:
          "Repeated questions on the same project are served from an in-memory query cache (",
      },
      { type: "cite", value: "src/lib/query-cache.ts", node: "cache" },
      {
        type: "text",
        value:
          "). Cache hits write a QueryMetrics row with cacheHit=true so observability still sees the request. Upstash Redis is wired in ",
      },
      { type: "cite", value: "src/lib/redis.ts", node: "cache" },
      { type: "text", value: " for distributed locks (not job state)." },
    ],
  },
];

export function findQuestionMatch(input: string): SuggestedQuestion {
  const q = input.toLowerCase();
  for (const sq of SUGGESTED_QUESTIONS) {
    const tokens = sq.short.toLowerCase().split(/\W+/).filter(Boolean);
    if (tokens.some((t) => t.length > 3 && q.includes(t))) return sq;
  }
  return SUGGESTED_QUESTIONS[0];
}
