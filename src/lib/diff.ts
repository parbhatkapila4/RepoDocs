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

export interface UnifiedDiffFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface BuiltUnifiedDiff {
  diff: string;
  fileCount: number; 
  truncated: boolean; 
}

const MAX_LLM_FILES = 300;

function buildOneGithubFile(f: UnifiedDiffFile): string {
  const header = `diff --git a/${f.filename} b/${f.filename}`;
  if (f.patch && f.patch.length > 0) {
    return `${header}\n${f.patch}`;
  }
  const stub = `${f.status} ${f.filename} (+${f.additions}/-${f.deletions}) [patch omitted]`;
  return `${header}\n@@ -0,0 +0,0 @@\n${stub}`;
}

export function buildUnifiedDiffFromGithubFiles(
  files: UnifiedDiffFile[],
  maxFiles: number = MAX_LLM_FILES
): BuiltUnifiedDiff {
  const fileCount = files.length;
  const ranked = [...files].sort(
    (a, b) => b.additions + b.deletions - (a.additions + a.deletions)
  );
  const included = ranked.slice(0, maxFiles);
  const diff = included.map(buildOneGithubFile).join("\n");
  return {
    diff,
    fileCount,
    truncated: fileCount > maxFiles,
  };
}
