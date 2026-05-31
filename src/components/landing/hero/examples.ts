export type AnswerPart =
  | { kind: "text"; value: string }
  | { kind: "cite"; value: string };

export interface ExampleSource {
  filePath: string;
  startLine: number;
  body: string;
  highlight: { from: number; to: number };
}

export interface Example {
  id: string;
  question: string;
  answer: AnswerPart[];
  meta: { model: string; tokens: string; latency: string };
}

export interface Batch {
  id: string;
  label: string; 
  examples: Example[];
}

export const BATCHES: Batch[] = [
  {
    id: "architecture",
    label: "system architecture",
    examples: [
      {
        id: "auth-trace",
        question: "How does authentication work across the API surface?",
        answer: [
          { kind: "text", value: "Clerk gates every route via the middleware at " },
          { kind: "cite", value: "middleware.ts:9" },
          {
            kind: "text",
            value: ". Server actions bypass auth.protect() because they verify the session inside the action body  -  see ",
          },
          { kind: "cite", value: "middleware.ts:32" },
          {
            kind: "text",
            value: ". The public allowlist is intentionally narrow: sign-in/up routes, the indexing-worker cron endpoint, and webhook receivers.",
          },
        ],
        meta: { model: "gemini-2.5-flash", tokens: "1.7k", latency: "920ms" },
      },
      {
        id: "request-trace",
        question: "Trace the path from a user query to a cited answer.",
        answer: [
          { kind: "text", value: "The request lands at " },
          { kind: "cite", value: "api/query/route.ts" },
          { kind: "text", value: ", rate-limits at " },
          { kind: "cite", value: "rate-limiter.ts:18" },
          { kind: "text", value: ", embeds the question via " },
          { kind: "cite", value: "getGenerateEmbeddings" },
          { kind: "text", value: ", runs a pgvector cosine search against " },
          { kind: "cite", value: "SourceCodeEmbeddings" },
          { kind: "text", value: ", retrieves top-5 chunks, and calls " },
          { kind: "cite", value: "openrouterChatCompletion" },
          { kind: "text", value: ". Each step writes to QueryMetrics before returning." },
        ],
        meta: { model: "gemini-2.5-flash", tokens: "2.1k", latency: "1.1s" },
      },
      {
        id: "worker-design",
        question: "Why does the worker use Postgres-leased locking instead of Redis?",
        answer: [
          { kind: "text", value: "Postgres is already the source of truth for " },
          { kind: "cite", value: "IndexingJob" },
          {
            kind: "text",
            value: " state. Adding Redis would create two consistency layers  -  if Redis says 'leased' but Postgres says 'queued', recovery is ambiguous. The lease columns ",
          },
          { kind: "cite", value: "lockedAt / lockedBy" },
          {
            kind: "text",
            value: " on the same row mean a single transaction handles claim and state change atomically.",
          },
        ],
        meta: { model: "gemini-2.5-flash", tokens: "1.4k", latency: "850ms" },
      },
    ],
  },
  {
    id: "operations",
    label: "operational concerns",
    examples: [
      {
        id: "budget",
        question: "Where does budget enforcement happen during indexing?",
        answer: [
          { kind: "cite", value: "Project.monthlyCostLimitUsd" },
          { kind: "text", value: " is read at the start of each batch in the worker at " },
          { kind: "cite", value: "indexing-worker-run.ts:113" },
          { kind: "text", value: ". When projected cost crosses 90% of the limit, the worker returns " },
          { kind: "cite", value: "needsResume=true" },
          { kind: "text", value: " with a resumeAfter cursor and the job re-queues. The next pickup re-checks the budget. No spend ever happens past the limit." },
        ],
        meta: { model: "gemini-2.5-flash", tokens: "1.8k", latency: "1.0s" },
      },
      {
        id: "observability",
        question: "How are memory hits recorded for observability?",
        answer: [
          { kind: "text", value: "Every " },
          { kind: "cite", value: "/api/query" },
          { kind: "text", value: " call writes a QueryMetrics row via " },
          { kind: "cite", value: "recordQueryMetrics" },
          { kind: "text", value: " at " },
          { kind: "cite", value: "query-metrics.ts:28" },
          {
            kind: "text",
            value: ". memoryHitCount and avgMemorySimilarity are recorded per-request. The /observability page aggregates these on a 30-day rolling window.",
          },
        ],
        meta: { model: "gemini-2.5-flash", tokens: "1.5k", latency: "880ms" },
      },
      {
        id: "concurrency",
        question: "Can multiple workers run concurrently on different jobs?",
        answer: [
          { kind: "text", value: "Yes  -  there's no global lock. The eligible-job query at " },
          { kind: "cite", value: "indexing-worker-run.ts:15" },
          { kind: "text", value: " uses " },
          { kind: "cite", value: "lockedAt IS NULL OR lockedAt < leaseExpiry" },
          {
            kind: "text",
            value: ". Two workers racing for the same job lose the race for the second one because the lease update silently fails on the stale row. Production runs 3-5 workers in parallel.",
          },
        ],
        meta: { model: "gemini-2.5-flash", tokens: "1.6k", latency: "950ms" },
      },
    ],
  },
  {
    id: "edge",
    label: "edge cases",
    examples: [
      {
        id: "race",
        question: "Why does queueIndexingJob upsert instead of create?",
        answer: [
          { kind: "text", value: "Each project has a " },
          { kind: "cite", value: "@unique" },
          { kind: "text", value: " constraint on " },
          { kind: "cite", value: "IndexingJob.projectId" },
          {
            kind: "text",
            value: ". Calling create twice  -  say a regenerate-readme action firing while a stale create is still in flight  -  throws P2002 and loses the user's intent. Upsert reuses the row and resets status=queued, lockedAt=null atomically.",
          },
        ],
        meta: { model: "gemini-2.5-flash", tokens: "1.3k", latency: "780ms" },
      },
      {
        id: "injection",
        question: "How does the system handle prompt injection from indexed files?",
        answer: [
          { kind: "text", value: "Source code is wrapped in a delimited block in the system prompt at " },
          { kind: "cite", value: "rag.ts:171" },
          {
            kind: "text",
            value: " with an explicit instruction that retrieved content is untrusted. The model output is bounded by the zod schema in ",
          },
          { kind: "cite", value: "api/query/route.ts" },
          { kind: "text", value: " before being returned. Active code-injection scanning is on the v1.1 roadmap." },
        ],
        meta: { model: "gemini-2.5-flash", tokens: "1.9k", latency: "1.0s" },
      },
      {
        id: "ratelimit",
        question: "What's the failure mode if Gemini rate-limits us mid-query?",
        answer: [
          { kind: "cite", value: "openrouter.ts:42" },
          { kind: "text", value: " retries on the fallback model. If the fallback also fails, the route writes a QueryMetrics row with " },
          { kind: "cite", value: "success=false" },
          {
            kind: "text",
            value: ", returns a structured 503, and the client retries with exponential backoff. We never silently return a partial answer.",
          },
        ],
        meta: { model: "gemini-2.5-flash", tokens: "1.5k", latency: "1.2s" },
      },
    ],
  },
];

export const EXAMPLES: Example[] = BATCHES.flatMap((b) => b.examples);
