import prisma from "./prisma";

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
