import * as fs from "fs";
import * as path from "path";

const repoRoot = path.resolve(__dirname, "..");

interface Rule {
  id: string;
  why: string;
  pattern: RegExp;
}

const RULES: Rule[] = [
  {
    id: "percentile-latency",
    why: "No percentile is computed anywhere in the codebase; only a mean latency exists.",
    pattern: /\bp(?:50|75|90|95|99)\b/i,
  },
  {
    id: "latency-milliseconds",
    why: "No timing or benchmark code produces a millisecond figure for publication.",
    pattern:
      /\b\d+(?:\.\d+)?\s*(?:ms|milliseconds?)\b|"?avg\w*LatencyMs"?\s*:\s*[\d.]+/i,
  },
  {
    id: "latency-seconds",
    why: "No measurement backs an 'answers in N seconds' claim.",
    pattern:
      /\bin\s+(?:about\s+|around\s+|roughly\s+|~\s*)?\d+(?:\.\d+)?\s*(?:s|secs?|seconds?)\b/i,
  },
  {
    id: "indexing-speed",
    why: "Indexing is a background job; the product's own copy says 5-15 minutes.",
    pattern:
      /(?:\b(?:index\w*|queryable)\b[^.]{0,45}?(?:~\s*)?\b\d+\s*(?:s|secs?|seconds?)\b)|(?:(?:~\s*)?\b\d+\s*(?:s|secs?|seconds?)\b[^.]{0,45}?\b(?:index\w*|queryable)\b)|\b(?:ten|fifteen|twenty|thirty|sixty)\s+seconds\b/i,
  },
  {
    id: "throughput",
    why: "Nothing computes files-per-unit-time; the 847 files/minute figure was invented.",
    pattern:
      /\b(?:files|repos|repositories|documents|embeddings)\s*(?:\/|per\s+)\s*(?:min|minute|sec|second|hour|hr)\b/i,
  },
  {
    id: "cache-hit-rate",
    why: "Cache hit rate is live and per-project; a fixed published figure was invented.",
    pattern:
      /\bcache[\s-]?hit[\s-]?rate\b[^.]{0,30}\d|\d[^.]{0,30}\bcache[\s-]?hit[\s-]?rate\b|"cacheHitRate"\s*:\s*[\d.]+/i,
  },
  {
    id: "accuracy-percentage",
    why: "There is no eval set or scored test producing an accuracy, precision or recall figure.",
    pattern:
      /\b\d{1,3}(?:\.\d+)?\s*%[^.]{0,45}\b(?:accura\w+|precision|recall|correctness|match rate|hit rate|uptime)\b|\b(?:accura\w+|precision|recall|correctness|match rate|hit rate|uptime)\b[^.]{0,45}\b\d{1,3}(?:\.\d+)?\s*%/i,
  },
  {
    id: "line-level-citations",
    why: "Retrieval returns whole files; no line numbers are computed, stored or rendered.",
    pattern: /\bline[\s-]level\b|\b(?:exact|precise)\s+lines?\b/i,
  },
  {
    id: "model-failover",
    why: "All generation goes through one OpenRouter gateway; models are picked per task, never raced.",
    pattern:
      /\bfall(?:ing)?[\s-]?back\s+(?:\w+\s+){0,2}(?:model|provider|llm)s?\b|\b(?:model|provider|llm)\s+fall(?:ing)?[\s-]?back\b|\bfails?\s+over\s+to\b/i,
  },
  {
    id: "unlimited-usage",
    why: "A 20 req/min rate limit and an optional per-project spend cap both apply. 'Unlimited projects' is true and stays allowed.",
    pattern:
      /\b(?:unlimited|infinite)\s+(?:questions|queries|requests|usage|answers)\b|∞/i,
  },
  {
    id: "symbol-extraction",
    why: "Nothing in the pipeline extracts or counts symbols.",
    pattern: /\b\d[\d,]*\s+symbols\b/i,
  },
  {
    id: "measured-metrics-framing",
    why: "Framing hardcoded constants as observed production data.",
    pattern: /\bproduction metrics\b|\bmeasured (?:over|across) the last\b/i,
  },
];

const NEGATION_CUES = [
  "no ",
  "not ",
  "n't",
  "never",
  "without",
  "rather than",
  "instead of",
  "nothing ",
  "none ",
  "cannot",
  "no longer",
  "unresolved",
];
const CLAUSE_SEPARATOR = /;|\u2014|\s-\s|\.\s+/;

function clauseAround(line: string, matchIndex: number): string {
  let cursor = 0;
  for (const clause of line.split(CLAUSE_SEPARATOR)) {
    const start = line.indexOf(clause, cursor);
    const end = start + clause.length;
    if (matchIndex >= start && matchIndex < end) return clause;
    cursor = end;
  }
  return line;
}

function isNegated(line: string, matchIndex: number): boolean {
  const clause = clauseAround(line, matchIndex).toLowerCase();
  return NEGATION_CUES.some((cue) => clause.includes(cue));
}

const SKIP_LINE = [
  /className=/,
  /style=\{/,
  /transition/i,
  /animation/i,
  /duration/i,
  /transitionDelay/i,
  /cubic-bezier/i,
  /\bease\b/i,
  /setTimeout|setInterval/,
  /\bdur=|\bkeyTimes=|repeatCount=/,
  /viewBox=|strokeWidth=|stopColor=/,
  /^\s*\/\/ eslint/,
];

function shouldSkipLine(line: string): boolean {
  return SKIP_LINE.some((p) => p.test(line));
}

interface Violation {
  rule: string;
  why: string;
  file: string;
  line: number;
  text: string;
}

function scanLine(
  line: string,
  file: string,
  lineNo: number,
  out: Violation[],
): void {
  if (shouldSkipLine(line)) return;
  for (const rule of RULES) {
    const re = new RegExp(
      rule.pattern.source,
      rule.pattern.flags.replace("g", "") + "g",
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m[0].length === 0) break;
      if (isNegated(line, m.index)) continue;
      out.push({
        rule: rule.id,
        why: rule.why,
        file,
        line: lineNo,
        text: line.trim().slice(0, 160),
      });
    }
  }
}

function scanText(
  text: string,
  file: string,
  commentsOnly = false,
): Violation[] {
  const out: Violation[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (commentsOnly && !line.trimStart().startsWith("#")) return;
    scanLine(line, file, i + 1, out);
  });
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|md)$/.test(entry.name)) out.push(full);
  }
  return out;
}
function scannedFiles(): { file: string; commentsOnly: boolean }[] {
  const files: { file: string; commentsOnly: boolean }[] = [];

  for (const f of walk(path.join(repoRoot, "src", "components", "landing"))) {
    files.push({ file: f, commentsOnly: false });
  }

  const explicit = [
    "src/components/auth/AuthBrandPanel.tsx",
    "src/app/about/page.tsx",
    "src/app/pricing/page.tsx",
    "src/app/documentation/page.tsx",
    "src/app/changelog/page.tsx",
    "src/app/contact/page.tsx",
    "src/app/terms/page.tsx",
    "src/app/privacy/page.tsx",
    "src/app/api/page.tsx",
    "README.md",
    "CONTRIBUTING.md",
  ];
  for (const rel of explicit) {
    const full = path.join(repoRoot, rel);
    if (fs.existsSync(full)) files.push({ file: full, commentsOnly: false });
  }

  const envExample = path.join(repoRoot, ".env.example");
  if (fs.existsSync(envExample)) {
    files.push({ file: envExample, commentsOnly: true });
  }

  return files;
}
const KNOWN_VIOLATIONS: string[] = [
  '{ label: "p50 query latency", value: "142 ms" },',
  '{ label: "p99 query latency", value: "487 ms" },',
  '{ label: "files / minute", value: "847" },',
  '{ label: "cache hit rate", value: "73%" },',
  "production metrics, last 30 days",
  '"Indexed in ~30s",',
  '{ label: "Indexing", value: "~30s", note: "URL to queryable" },',
  "Paste a URL, add a token if needed, and it indexes in around thirty seconds.",
  "See the whole system in 30 seconds.",
  'meta: { model: "gemini-2.5-flash", tokens: "1.7k", latency: "920ms" },',
  '"avgLatencyMs": 142,',
  '"cacheHitRate": 0.73',
  "A coding agent's worth of context for any GitHub repo. Indexed locally, mapped end to end, every answer cited to the exact line.",
  '{ title: "Line-level citations", desc: "Proof attached to every answer" },',
  "Each answer carries citations into the underlying code. Click one to land on the exact line that backs it.",
  "Every claim links to the precise lines it came from.",
  "Ask in plain English. Retrieval pulls the right files and a grounded answer arrives in 2 seconds.",
  "&gt; 4,812 files · 92,140 symbols",
  '{ label: "Questions", value: "∞", note: "Ask all you want" },',
  '{ icon: Shield, label: "Model fallback strategy" },',
  "# Fallback LLM provider used when Gemini is rate-limited or down.",
  '"We aim for 99.9% monthly uptime; not contractually guaranteed at the free tier",',
];

const MUST_NOT_FLAG: string[] = [
  '{ label: "Embedding", value: "768d", note: "gemini-embedding-001" },',
  '{ label: "Sourced", value: "Top 5", note: "Files behind each answer" },',
  '{ name: "Code files", pct: 100, val: "top 5", good: true },',
  '{ name: "Repo memory", pct: 60, val: "top 3" },',
  '<KV label="rate limit" value="20 req / min" />',
  "Up to 3 projects",
  "Unlimited projects",
  "Every answer lists the files it was grounded in, ranked by similarity.",
  '{ title: "File-level sources", desc: "The files behind every answer" },',
  "Each response lists the files it was built from, ranked by similarity.",
  '{ name: "Aliased", pct: 0, val: "not resolved" },',
  "Edges are parsed straight out of import and require statements. Path-aliased imports (@/lib/...) aren't resolved yet.",
  "aliased imports such as @/lib/... are not resolved",
  "Vector search runs against an HNSW index on the embedding column with cosine distance (`vector_cosine_ops`) - an approximate-nearest-neighbour lookup, not an exact scan.",
  "PostgreSQL + pgvector (HNSW, cosine) via Prisma 6.16",
  "No benchmark compares it against a sequential scan on real row counts, so no speedup figure is claimed here - only the mechanism.",
  "A browsable view of every indexed file with its import edges drawn. Click a file to see exactly what it imports and what imports it.",
  "Every indexed file in one map, with the import edges between them drawn. Click a file to see its dependencies in both directions.",
  "It typically takes 5-15 minutes depending on repository size.",
  "Citations are file-level, not line-level.",
  "There is no cross-provider failover.",
  "Indexing is a background job and does not finish in 30 seconds.",
  "We publish no p50 or p99 latency figures because nothing measures them.",
  "No cache hit rate is published; the figure shown is live and per-project.",
  "Answers are never cited to the exact line - retrieval works on whole files.",
  "Nothing in the pipeline counts symbols, so no symbol total is reported.",
];

describe("claim-drift guard self-test", () => {
  it("flags every claim class that was actually fabricated in this repo", () => {
    const missed = KNOWN_VIOLATIONS.filter(
      (s) => scanText(s, "known-violation").length === 0,
    );
    expect(missed).toEqual([]);
  });

  it("leaves true claims and negated statements alone", () => {
    const falsePositives = MUST_NOT_FLAG.flatMap((s) =>
      scanText(s, "must-not-flag").map((v) => `[${v.rule}] ${s}`),
    );
    expect(falsePositives).toEqual([]);
  });

  it("covers every fabrication class with at least one known violation", () => {
    const covered = new Set(
      KNOWN_VIOLATIONS.flatMap((s) => scanText(s, "x").map((v) => v.rule)),
    );
    const uncovered = RULES.map((r) => r.id).filter((id) => !covered.has(id));
    expect(uncovered).toEqual([]);
  });
});

describe("public surfaces carry no unbacked claims", () => {
  it("scans marketing, README, docs and .env.example comments", () => {
    const violations: Violation[] = [];
    for (const { file, commentsOnly } of scannedFiles()) {
      violations.push(
        ...scanText(
          fs.readFileSync(file, "utf8"),
          path.relative(repoRoot, file).replace(/\\/g, "/"),
          commentsOnly,
        ),
      );
    }

    const report = violations
      .map(
        (v) => `${v.file}:${v.line} [${v.rule}] ${v.text}\n    why: ${v.why}`,
      )
      .join("\n");

    expect(report).toBe("");
  });
});
