import { createGitHubOctokit } from "@/lib/github-octokit";
import { log } from "@/lib/logger";

function normalizePathPreindex(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

const PREINDEX_LOCK_FILES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "bun.lock",
]);

const PREINDEX_ALLOWED_EXT = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".cs",
  ".php",
  ".rb",
  ".vue",
  ".svelte",
  ".html",
  ".htm",
  ".md",
  ".mdx",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".css",
  ".scss",
  ".prisma",
]);

export function isPreindexTreePath(path: string): boolean {
  const p = path.replace(/\\/g, "/");
  const lower = p.toLowerCase();
  if (
    lower.includes("node_modules/") ||
    lower.includes(".next/") ||
    lower.includes("dist/") ||
    lower.includes("build/") ||
    lower.includes(".git/") ||
    lower.includes("/vendor/") ||
    lower.endsWith(".min.js") ||
    lower.endsWith(".map")
  ) {
    return false;
  }
  const segments = lower.split("/");
  const base = segments[segments.length - 1] || "";
  if (PREINDEX_LOCK_FILES.has(base)) return false;
  if (base === "dockerfile") return true;
  const dot = base.lastIndexOf(".");
  const ext = dot >= 0 ? base.slice(dot) : "";
  return PREINDEX_ALLOWED_EXT.has(ext);
}

export function isGithubLoaderIgnoredPath(path: string): boolean {
  const n = path.replace(/\\/g, "/");
  if (n === ".github" || n.startsWith(".github/")) return true;
  if (n.includes("/.github/")) return true;
  return false;
}

export async function listGithubRepoPathsForPreindex(
  repoUrl: string,
  githubToken?: string,
  maxPaths = 500,
  pathFilter: (path: string) => boolean = isPreindexTreePath,
): Promise<{
  paths: string[];
  defaultBranch: string;
  owner: string;
  repo: string;
  truncated: boolean;
} | null> {
  const urlMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!urlMatch) return null;
  const [, owner, rawRepo] = urlMatch;
  const repo = rawRepo.replace(/\.git$/, "");
  const token = githubToken || process.env.GITHUB_TOKEN;
  const octokit = createGitHubOctokit(token);
  try {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const branch = repoData.default_branch;
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const commitSha = refData.object.sha;
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: commitSha,
      recursive: "true",
    });
    const raw = (treeData.tree || [])
      .filter(
        (item) => item.type === "blob" && item.path && pathFilter(item.path),
      )
      .map((item) => normalizePathPreindex(item.path!))
      .filter(Boolean);
    const truncated = raw.length > maxPaths;
    const paths = raw.slice(0, maxPaths);
    return { paths, defaultBranch: branch, owner, repo, truncated };
  } catch (e) {
    log.error("listGithubRepoPathsForPreindex:", e);
    return null;
  }
}

export type PreindexFetchedFile = {
  path: string;
  text: string;
  truncated: boolean;
};

export async function fetchGithubPreindexFileContents(
  owner: string,
  repo: string,
  paths: string[],
  ref: string,
  githubToken?: string,
  maxCharsPerFile = 7500,
  maxFiles = 24,
): Promise<PreindexFetchedFile[]> {
  const token = githubToken || process.env.GITHUB_TOKEN;
  const octokit = createGitHubOctokit(token);
  const out: PreindexFetchedFile[] = [];
  const unique = Array.from(new Set(paths)).slice(0, maxFiles);
  for (const path of unique) {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });
      if (
        Array.isArray(data) ||
        !("content" in data) ||
        typeof data.content !== "string"
      ) {
        continue;
      }
      const raw = Buffer.from(data.content, "base64").toString("utf-8");
      const truncated = raw.length > maxCharsPerFile;
      const text = truncated ? raw.slice(0, maxCharsPerFile) : raw;
      out.push({ path, text, truncated });
    } catch {}
  }
  return out;
}
