import prisma from "./prisma";
import { loadGithubRepository } from "./github";
import { Octokit } from "octokit";

export interface ArchitectureNode {
  id: string;
  path: string;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
}

export interface DependencyGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}


function normalizePath(p: string): string {
  let s = p.replace(/\\/g, "/").trim();
  while (s.startsWith("./")) s = s.slice(2);
  return s;
}


function resolveRelative(fromFilePath: string, importPath: string): string | null {
  if (!importPath.startsWith(".")) return null;
  const parts = fromFilePath.split("/").filter(Boolean);
  const dirParts = parts.slice(0, -1);
  const segs = importPath.split("/").filter(Boolean);
  for (const seg of segs) {
    if (seg === "..") {
      if (dirParts.length === 0) return null;
      dirParts.pop();
    } else if (seg !== ".") {
      dirParts.push(seg);
    }
  }
  const resolved = normalizePath(dirParts.join("/"));
  return resolved || null;
}


function extractImportPaths(sourceCode: string): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();


  const esImportRegex =
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = esImportRegex.exec(sourceCode)) !== null) {
    const p = m[1].trim();
    if (p && !seen.has(p)) {
      seen.add(p);
      paths.push(p);
    }
  }


  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = requireRegex.exec(sourceCode)) !== null) {
    const p = m[1].trim();
    if (p && !seen.has(p)) {
      seen.add(p);
      paths.push(p);
    }
  }

  return paths;
}





export async function buildDependencyGraph(
  projectId: string
): Promise<DependencyGraph> {
  const rows = await prisma.sourceCodeEmbiddings.findMany({
    where: { projectId },
    select: { fileName: true, sourceCode: true },
  });

  if (rows.length === 0) {
    return { nodes: [], edges: [] };
  }

  const pathSet = new Set<string>();
  for (const r of rows) {
    const path = normalizePath(r.fileName);
    if (path) pathSet.add(path);
  }

  const nodes: ArchitectureNode[] = Array.from(pathSet).map((path) => ({
    id: path,
    path,
  }));

  const edgeKey = (from: string, to: string) => `${from}\0${to}`;
  const edgesSet = new Set<string>();
  const edges: ArchitectureEdge[] = [];

  for (const row of rows) {
    const fromPath = normalizePath(row.fileName);
    if (!fromPath) continue;

    const importPaths = extractImportPaths(row.sourceCode);
    for (const rawImport of importPaths) {
      const toPath = resolveRelative(fromPath, rawImport);
      if (toPath == null || toPath === "") continue;
      const key = edgeKey(fromPath, toPath);
      if (edgesSet.has(key)) continue;
      edgesSet.add(key);
      edges.push({ from: fromPath, to: toPath });
    }
  }

  return { nodes, edges };
}

function isLikelyCodeFile(path: string): boolean {
  const p = path.toLowerCase();
  return (
    p.endsWith(".ts") ||
    p.endsWith(".tsx") ||
    p.endsWith(".js") ||
    p.endsWith(".jsx") ||
    p.endsWith(".mjs") ||
    p.endsWith(".cjs") ||
    p.endsWith(".py") ||
    p.endsWith(".go") ||
    p.endsWith(".java") ||
    p.endsWith(".rs") ||
    p.endsWith(".php") ||
    p.endsWith(".rb")
  );
}

export async function buildDependencyGraphFromRepo(
  githubUrl: string,
  githubToken?: string
): Promise<DependencyGraph> {
  const docs = await loadGithubRepository(githubUrl, githubToken);
  if (!docs || docs.length === 0) {
    return { nodes: [], edges: [] };
  }

  const MAX_FILES = 350;
  const filteredDocs = docs
    .filter((d) => isLikelyCodeFile(String(d.metadata?.source || "")))
    .slice(0, MAX_FILES);

  const pathSet = new Set<string>();
  for (const d of filteredDocs) {
    const path = normalizePath(String(d.metadata?.source || ""));
    if (path) pathSet.add(path);
  }

  const nodes: ArchitectureNode[] = Array.from(pathSet).map((path) => ({
    id: path,
    path,
  }));

  const edgeKey = (from: string, to: string) => `${from}\0${to}`;
  const edgesSet = new Set<string>();
  const edges: ArchitectureEdge[] = [];

  for (const d of filteredDocs) {
    const fromPath = normalizePath(String(d.metadata?.source || ""));
    if (!fromPath) continue;

    const importPaths = extractImportPaths(String(d.pageContent || ""));
    for (const rawImport of importPaths) {
      const toPath = resolveRelative(fromPath, rawImport);
      if (!toPath) continue;
      const key = edgeKey(fromPath, toPath);
      if (edgesSet.has(key)) continue;
      edgesSet.add(key);
      edges.push({ from: fromPath, to: toPath });
    }
  }

  return { nodes, edges };
}

function parseGitHubRepo(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([^\/]+)\/([^\/?#]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/i, "") };
}

export async function buildQuickDependencyGraphFromGitTree(
  githubUrl: string,
  githubToken?: string
): Promise<DependencyGraph> {
  const parsed = parseGitHubRepo(githubUrl);
  if (!parsed) return { nodes: [], edges: [] };

  const octokit = new Octokit({
    auth: githubToken || undefined,
  });

  const repoMeta = await octokit.rest.repos.get({
    owner: parsed.owner,
    repo: parsed.repo,
  });

  const defaultBranch = repoMeta.data.default_branch || "main";
  const tree = await octokit.rest.git.getTree({
    owner: parsed.owner,
    repo: parsed.repo,
    tree_sha: defaultBranch,
    recursive: "true",
  });

  const MAX_FILES = 260;
  const files = (tree.data.tree || [])
    .filter((item) => item.type === "blob" && item.path && isLikelyCodeFile(item.path))
    .slice(0, MAX_FILES)
    .map((item) => normalizePath(item.path || ""))
    .filter(Boolean);

  const nodes: ArchitectureNode[] = files.map((path) => ({ id: path, path }));
  return { nodes, edges: [] };
}
