const LONG_FILE_LINES = 56;
const HEAD_MIN = 14;
const HEAD_MAX = 38;
const HEAD_FRACTION = 0.2;
const SINGLE_MIN = 14;
const SINGLE_MAX = 72;
const SINGLE_FRACTION_SMALL = 0.3;
const SINGLE_FRACTION_LARGE = 0.3;
const TAIL_MAX_LINES = 24;
const GAP_MIN_LINES = 10;
const MAX_TOTAL_CHARS = 4800;

export type PreviewSegment = {
  startLine: number;
  endLine: number;
  code: string;
};

export function inferPrismLanguage(filePath: string): string {
  const lower = filePath.toLowerCase();
  const base = lower.split("/").pop() || lower;
  if (base.endsWith(".tsx")) return "tsx";
  if (base.endsWith(".ts")) return "typescript";
  if (base.endsWith(".jsx")) return "jsx";
  if (base.endsWith(".mjs") || base.endsWith(".cjs") || base.endsWith(".js"))
    return "javascript";
  if (base.endsWith(".json") || base.endsWith(".jsonc")) return "json";
  if (base.endsWith(".md") || base.endsWith(".mdx")) return "markdown";
  if (base.endsWith(".css")) return "css";
  if (base.endsWith(".scss") || base.endsWith(".sass")) return "scss";
  if (base.endsWith(".html")) return "markup";
  if (base.endsWith(".vue")) return "markup";
  if (base.endsWith(".svelte")) return "typescript";
  if (base.endsWith(".py")) return "python";
  if (base.endsWith(".go")) return "go";
  if (base.endsWith(".rs")) return "rust";
  if (base.endsWith(".java")) return "java";
  if (base.endsWith(".kt") || base.endsWith(".kts")) return "kotlin";
  if (base.endsWith(".rb")) return "ruby";
  if (base.endsWith(".php")) return "php";
  if (base.endsWith(".swift")) return "swift";
  if (base.endsWith(".yaml") || base.endsWith(".yml")) return "yaml";
  if (base.endsWith(".toml")) return "toml";
  if (base.endsWith(".sh") || base.endsWith(".bash")) return "bash";
  if (base.endsWith(".sql")) return "sql";
  if (base.endsWith(".prisma")) return "typescript";
  return "typescript";
}

function isLikelyMainCodeLine(line: string): boolean {
  const s = line.trimStart();
  if (/^export\s+default\s+function\b/.test(s)) return true;
  if (/^export\s+(async\s+)?function\b/.test(s)) return true;
  if (/^export\s+class\b/.test(s)) return true;
  if (/^export\s+interface\b/.test(s)) return true;
  if (/^export\s+type\s+\w/.test(s)) return true;
  if (/^export\s+enum\b/.test(s)) return true;
  if (/^export\s+const\s+\w+\s*=\s*(\(|async\s*\()/.test(s)) return true;
  if (/^class\s+\w/.test(s)) return true;
  if (/^(async\s+)?function\s+\w/.test(s)) return true;
  if (/^def\s+\w+\s*\(/.test(s)) return true;
  if (/^async\s+def\s+\w+\s*\(/.test(s)) return true;
  if (/^class\s+\w+(\s*\(|:)/.test(s)) return true;
  if (/^pub\s+fn\s+\w/.test(s)) return true;
  if (/^fn\s+\w+\s*\(/.test(s)) return true;
  if (/^impl\s+/.test(s)) return true;
  if (/^func\s+(\(|[\w*]+\s)/.test(s)) return true;
  if (/^(public|private|protected)\s+static\s+\w+\s+\w+\s*\(/.test(s))
    return true;
  if (
    /^(public|private|protected)\s+(static\s+)?(final\s+)?\w+\s+\w+\s*\(/.test(
      s
    )
  )
    return true;
  return false;
}

function shrinkSegmentToCharBudget(
  seg: PreviewSegment,
  maxChars: number
): PreviewSegment {
  if (seg.code.length <= maxChars) return seg;
  const lines = seg.code.split("\n");
  let end = lines.length;
  let chunk = lines.join("\n");
  while (chunk.length > maxChars && end > 1) {
    end -= 1;
    chunk = lines.slice(0, end).join("\n");
  }
  if (chunk.length > maxChars) {
    chunk = chunk.slice(0, maxChars);
  }
  return {
    startLine: seg.startLine,
    endLine: seg.startLine + end - 1,
    code: chunk,
  };
}

function shrinkSegmentsToBudget(segments: PreviewSegment[]): PreviewSegment[] {
  let total = segments.reduce((a, s) => a + s.code.length + 8, 0);
  if (total <= MAX_TOTAL_CHARS) return segments;
  if (segments.length === 1) {
    return [shrinkSegmentToCharBudget(segments[0], MAX_TOTAL_CHARS)];
  }
  const [head, tail] = segments;
  let tailShrunk = shrinkSegmentToCharBudget(
    tail,
    Math.floor(MAX_TOTAL_CHARS * 0.45)
  );
  const headBudget = MAX_TOTAL_CHARS - tailShrunk.code.length - 12;
  let headShrunk = shrinkSegmentToCharBudget(
    head,
    Math.max(400, headBudget)
  );
  total = headShrunk.code.length + tailShrunk.code.length;
  if (total > MAX_TOTAL_CHARS) {
    tailShrunk = shrinkSegmentToCharBudget(tailShrunk, MAX_TOTAL_CHARS - headShrunk.code.length - 12);
  }
  return [headShrunk, tailShrunk];
}

export function extractCodePreview(source: string): {
  segments: PreviewSegment[];
  totalLines: number;
  truncated: boolean;
  omittedBetween?: { fromLine: number; toLine: number };
} {
  if (!source) {
    return { segments: [], totalLines: 0, truncated: false };
  }

  const lines = source.split(/\r?\n/);
  const n = lines.length;

  const singleBlock = (endExclusive: number): PreviewSegment => ({
    startLine: 1,
    endLine: endExclusive,
    code: lines.slice(0, endExclusive).join("\n"),
  });

  if (n <= LONG_FILE_LINES) {
    let end = Math.min(
      Math.max(Math.ceil(n * SINGLE_FRACTION_SMALL), SINGLE_MIN),
      SINGLE_MAX,
      n
    );
    let seg = singleBlock(end);
    while (seg.code.length > MAX_TOTAL_CHARS && end > SINGLE_MIN) {
      end -= 1;
      seg = singleBlock(end);
    }
    seg = shrinkSegmentToCharBudget(seg, MAX_TOTAL_CHARS);
    return {
      segments: [seg],
      totalLines: n,
      truncated: seg.endLine < n,
      omittedBetween: undefined,
    };
  }

  const headLen = Math.min(
    Math.max(Math.ceil(n * HEAD_FRACTION), HEAD_MIN),
    HEAD_MAX,
    n - TAIL_MAX_LINES - 1
  );

  let anchor = -1;
  for (let i = headLen; i <= n - 4; i++) {
    if (i - headLen < GAP_MIN_LINES) continue;
    if (isLikelyMainCodeLine(lines[i])) {
      anchor = i;
      break;
    }
  }

  if (anchor < 0) {
    let end = Math.min(
      Math.max(Math.ceil(n * SINGLE_FRACTION_LARGE), SINGLE_MIN),
      SINGLE_MAX,
      n
    );
    let seg = singleBlock(end);
    while (seg.code.length > MAX_TOTAL_CHARS && end > SINGLE_MIN) {
      end -= 1;
      seg = singleBlock(end);
    }
    seg = shrinkSegmentToCharBudget(seg, MAX_TOTAL_CHARS);
    return {
      segments: [seg],
      totalLines: n,
      truncated: seg.endLine < n,
      omittedBetween: undefined,
    };
  }

  const tailEnd = Math.min(anchor + TAIL_MAX_LINES, n);
  const omittedBetween = {
    fromLine: headLen + 1,
    toLine: anchor,
  };
  const segments: PreviewSegment[] = [
    {
      startLine: 1,
      endLine: headLen,
      code: lines.slice(0, headLen).join("\n"),
    },
    {
      startLine: anchor + 1,
      endLine: tailEnd,
      code: lines.slice(anchor, tailEnd).join("\n"),
    },
  ];

  const shrunk = shrinkSegmentsToBudget(segments);
  const lastEnd = shrunk[shrunk.length - 1].endLine;
  return {
    segments: shrunk,
    totalLines: n,
    truncated: lastEnd < n,
    omittedBetween,
  };
}

export function previewToCopyText(
  segments: PreviewSegment[],
  omittedBetween?: { fromLine: number; toLine: number }
): string {
  if (segments.length === 0) return "";
  if (segments.length === 1) return segments[0].code;
  const [a, b] = segments;
  let gapLo = a.endLine + 1;
  let gapHi = b.startLine - 1;
  if (
    omittedBetween &&
    omittedBetween.toLine >= omittedBetween.fromLine
  ) {
    gapLo = omittedBetween.fromLine;
    gapHi = omittedBetween.toLine;
  }
  const omit =
    gapHi >= gapLo
      ? `\n\n// … lines ${gapLo}–${gapHi} omitted …\n\n`
      : "\n\n";
  return `${a.code}${omit}${b.code}`;
}
