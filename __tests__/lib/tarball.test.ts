jest.mock("@/lib/github-octokit", () => ({ createGitHubOctokit: jest.fn() }));

import { gzipSync } from "zlib";
import * as tar from "tar-stream";

import {
  extractRepoDocumentsFromTarball,
  isIndexableRepoPath,
} from "@/lib/github/tarball";

async function buildTarGz(
  entries: { name: string; content?: Buffer | string; type?: "directory" }[],
): Promise<Buffer> {
  const pack = tar.pack();
  const chunks: Buffer[] = [];
  pack.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    pack.on("end", () => resolve(Buffer.concat(chunks)));
    pack.on("error", reject);
  });
  for (const e of entries) {
    if (e.type === "directory") {
      pack.entry({ name: e.name, type: "directory" });
    } else {
      pack.entry({ name: e.name }, e.content ?? "");
    }
  }
  pack.finalize();
  return gzipSync(await done);
}

describe("isIndexableRepoPath", () => {
  it("accepts ordinary source paths", () => {
    expect(isIndexableRepoPath("src/lib/auth.ts")).toBe(true);
    expect(isIndexableRepoPath("README.md")).toBe(true);
    expect(isIndexableRepoPath("prisma/schema.prisma")).toBe(true);
  });

  it("rejects lockfiles and VCS metadata anywhere in the tree", () => {
    expect(isIndexableRepoPath("package-lock.json")).toBe(false);
    expect(isIndexableRepoPath("apps/web/yarn.lock")).toBe(false);
    expect(isIndexableRepoPath(".git/HEAD")).toBe(false);
    expect(isIndexableRepoPath(".github/workflows/ci.yml")).toBe(false);
    expect(isIndexableRepoPath("packages/a/node_modules/x/index.js")).toBe(
      false,
    );
    expect(isIndexableRepoPath(".DS_Store")).toBe(false);
    expect(isIndexableRepoPath("docs/.DS_Store")).toBe(false);
  });
});

describe("extractRepoDocumentsFromTarball", () => {
  it("strips the archive prefix and returns loader-shaped documents", async () => {
    const tarball = await buildTarGz([
      { name: "acme-repo-9f31c2e", type: "directory" },
      { name: "acme-repo-9f31c2e/src/index.ts", content: "export {};" },
      { name: "acme-repo-9f31c2e/README.md", content: "# Hi" },
    ]);

    const { docs, stats } = await extractRepoDocumentsFromTarball(tarball);
    const sources = docs.map((d) => d.metadata.source).sort();
    expect(sources).toEqual(["README.md", "src/index.ts"]);
    expect(
      docs.find((d) => d.metadata.source === "README.md")?.pageContent,
    ).toBe("# Hi");
    expect(stats.files).toBe(2);
  });

  it("skips ignored paths, oversize files, and binaries", async () => {
    const big = Buffer.alloc(600 * 1024, 97);
    const binary = Buffer.from([0x50, 0x4b, 0x00, 0x03, 0x00, 0x41]);
    const tarball = await buildTarGz([
      { name: "r-x/src/app.ts", content: "ok" },
      { name: "r-x/package-lock.json", content: "{}" },
      { name: "r-x/.github/workflows/ci.yml", content: "on: push" },
      { name: "r-x/big.sql", content: big },
      { name: "r-x/build/tool.bin", content: binary },
    ]);

    const { docs, stats } = await extractRepoDocumentsFromTarball(tarball);
    expect(docs.map((d) => d.metadata.source)).toEqual(["src/app.ts"]);
    expect(stats.skippedIgnored).toBe(2);
    expect(stats.skippedTooLarge).toBe(1);
    expect(stats.skippedBinary).toBe(1);
  });

  it("ignores entries at the archive root (no repo-relative path)", async () => {
    const tarball = await buildTarGz([
      { name: "pax_global_header", content: "52 comment=abc" },
      { name: "r-y/src/ok.ts", content: "x" },
    ]);
    const { docs } = await extractRepoDocumentsFromTarball(tarball);
    expect(docs.map((d) => d.metadata.source)).toEqual(["src/ok.ts"]);
  });
});
