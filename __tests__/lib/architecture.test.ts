jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("../../src/lib/github", () => ({
  loadGithubRepository: jest.fn(),
}));

jest.mock("@/lib/github-octokit", () => ({
  createGitHubOctokit: jest.fn(),
}));

import * as fs from "fs";
import * as path from "path";
import { resolveImportTarget, normalizePath } from "../../src/lib/architecture";

describe("resolveImportTarget", () => {
  const known = new Set([
    "src/lib/prisma.ts",
    "src/lib/rag.ts",
    "src/components/Button.tsx",
    "src/hooks/index.ts",
    "src/workers/parse.js",
    "src/config/schema.json",
    "src/esm/mod.ts",
  ]);

  it("resolves an extensionless import to the .ts file that exists", () => {
    expect(resolveImportTarget("src/lib/rag.ts", "./prisma", known)).toBe(
      "src/lib/prisma.ts"
    );
  });

  it("resolves an extensionless import to a .tsx file", () => {
    expect(
      resolveImportTarget("src/components/Card.tsx", "./Button", known)
    ).toBe("src/components/Button.tsx");
  });

  it("resolves parent-directory traversal", () => {
    expect(
      resolveImportTarget("src/components/Card.tsx", "../lib/prisma", known)
    ).toBe("src/lib/prisma.ts");
  });

  it("resolves a directory import to its index file", () => {
    expect(resolveImportTarget("src/lib/rag.ts", "../hooks", known)).toBe(
      "src/hooks/index.ts"
    );
  });

  it("keeps an import that already names a real file", () => {
    expect(
      resolveImportTarget("src/lib/rag.ts", "../workers/parse.js", known)
    ).toBe("src/workers/parse.js");
  });

  it("resolves non-code extensions when the file is indexed", () => {
    expect(
      resolveImportTarget("src/lib/rag.ts", "../config/schema.json", known)
    ).toBe("src/config/schema.json");
  });

  it("maps a TypeScript ESM .js specifier onto the real .ts file", () => {
    expect(resolveImportTarget("src/lib/rag.ts", "../esm/mod.js", known)).toBe(
      "src/esm/mod.ts"
    );
  });

  it("returns null for a bare package specifier", () => {
    expect(resolveImportTarget("src/lib/rag.ts", "react", known)).toBeNull();
  });

  it("returns null for a path-aliased import", () => {
    expect(
      resolveImportTarget("src/lib/rag.ts", "@/lib/prisma", known)
    ).toBeNull();
  });

  it("returns null when no candidate matches a known file", () => {
    expect(
      resolveImportTarget("src/lib/rag.ts", "./does-not-exist", known)
    ).toBeNull();
  });

  it("does not escape above the repository root", () => {
    expect(resolveImportTarget("index.ts", "../../etc/passwd", known)).toBeNull();
  });
});

describe("relative imports across this repository", () => {
  const ESM_IMPORT =
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, out);
      else out.push(full);
    }
    return out;
  }

  const repoRoot = path.resolve(__dirname, "..", "..");
  const srcRoot = path.join(repoRoot, "src");
  const files = walk(srcRoot).map((f) =>
    normalizePath(path.relative(repoRoot, f))
  );
  const known = new Set(files);

  it("resolves a large majority of relative imports to real files", () => {
    let relativeImports = 0;
    let resolved = 0;

    for (const file of files) {
      if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue;
      const source = fs.readFileSync(path.join(repoRoot, file), "utf8");
      ESM_IMPORT.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = ESM_IMPORT.exec(source)) !== null) {
        const spec = m[1].trim();
        if (!spec.startsWith(".")) continue;
        relativeImports += 1;
        if (resolveImportTarget(file, spec, known)) resolved += 1;
      }
    }

    expect(relativeImports).toBeGreaterThan(50);
    expect(resolved / relativeImports).toBeGreaterThan(0.9);
  });
});
