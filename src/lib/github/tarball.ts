import { Readable } from "stream";
import type { ReadableStream as WebReadableStream } from "stream/web";
import { createGunzip } from "zlib";
import * as tar from "tar-stream";
import { log } from "@/lib/logger";
import { parseGithubOwnerRepo, resolveGithubDefaultBranch } from "./refs";

export interface RepoDocument {
  pageContent: string;
  metadata: { source: string };
}

export interface TarballLoadStats {
  files: number;
  skippedIgnored: number;
  skippedTooLarge: number;
  skippedBinary: number;
  totalBytes: number;
}

const IGNORED_BASENAMES = new Set([
  ".DS_Store",
  ".gitignore",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "bun.lock",
]);

const IGNORED_DIR_SEGMENTS = new Set([
  ".git",
  ".github",
  "node_modules",
  ".next",
]);

const MAX_FILE_BYTES = 512 * 1024;

const MAX_TOTAL_BYTES = 200 * 1024 * 1024;

const MAX_TARBALL_BYTES = 150 * 1024 * 1024;
const DOC_CACHE = new Map<
  string,
  { docs: RepoDocument[]; stats: TarballLoadStats }
>();
const DOC_CACHE_MAX_ENTRIES = 3;
const DOC_CACHE_MAX_TOTAL_BYTES = 96 * 1024 * 1024;

function isImmutableRef(ref: string): boolean {
  return /^[0-9a-f]{40}$/i.test(ref);
}

function docCachePut(
  key: string,
  entry: { docs: RepoDocument[]; stats: TarballLoadStats },
): void {
  DOC_CACHE.delete(key);
  DOC_CACHE.set(key, entry);
  const totalBytes = () =>
    [...DOC_CACHE.values()].reduce((n, e) => n + e.stats.totalBytes, 0);
  while (
    DOC_CACHE.size > DOC_CACHE_MAX_ENTRIES ||
    (DOC_CACHE.size > 1 && totalBytes() > DOC_CACHE_MAX_TOTAL_BYTES)
  ) {
    const oldest = DOC_CACHE.keys().next().value;
    if (oldest === undefined) break;
    DOC_CACHE.delete(oldest);
  }
}

export function isIndexableRepoPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized) return false;
  const segments = normalized.split("/");
  const base = segments[segments.length - 1] || "";
  if (IGNORED_BASENAMES.has(base)) return false;
  if (segments.some((s) => IGNORED_DIR_SEGMENTS.has(s))) return false;
  return true;
}

function stripArchivePrefix(entryName: string): string {
  const normalized = entryName.replace(/\\/g, "/");
  const slash = normalized.indexOf("/");
  if (slash < 0) return "";
  return normalized.slice(slash + 1);
}

async function openTarballStream(
  owner: string,
  repo: string,
  ref: string,
  githubToken?: string,
): Promise<Readable> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "repodoc-indexer",
  };
  if (githubToken) headers.Authorization = `token ${githubToken}`;

  const url = `https://api.github.com/repos/${owner}/${repo}/tarball/${encodeURIComponent(ref)}`;
  const res = await fetch(url, {
    headers,
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok || !res.body) {
    const hint =
      res.status === 404
        ? "Repository or ref not found (private repos need a token with repo scope)."
        : res.status === 401 || res.status === 403
          ? "GitHub denied access - the token may be missing, expired, or lacking scope."
          : `GitHub returned ${res.status}.`;
    throw new Error(
      `Tarball download failed for ${owner}/${repo}@${ref}: ${hint}`,
    );
  }

  const source = Readable.fromWeb(res.body as WebReadableStream);
  let received = 0;
  source.on("data", (chunk: Buffer) => {
    received += chunk.length;
    if (received > MAX_TARBALL_BYTES) {
      source.destroy(
        new Error(
          `Repository tarball exceeds the ${Math.round(MAX_TARBALL_BYTES / 1024 / 1024)}MB indexing limit.`,
        ),
      );
    }
  });
  return source;
}

export async function fetchRepoTarball(
  owner: string,
  repo: string,
  ref: string,
  githubToken?: string,
): Promise<Buffer> {
  const source = await openTarballStream(owner, repo, ref, githubToken);
  const chunks: Buffer[] = [];
  for await (const chunk of source) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

export async function extractRepoDocumentsFromTarStream(
  source: Readable,
): Promise<{ docs: RepoDocument[]; stats: TarballLoadStats }> {
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    const gunzip = createGunzip();
    const docs: RepoDocument[] = [];
    const stats: TarballLoadStats = {
      files: 0,
      skippedIgnored: 0,
      skippedTooLarge: 0,
      skippedBinary: 0,
      totalBytes: 0,
    };

    extract.on("entry", (header, stream, next) => {
      const drain = () => {
        stream.resume();
        stream.on("end", next);
      };

      if (header.type !== "file") return drain();
      const rel = stripArchivePrefix(header.name);
      if (!rel) return drain();
      if (!isIndexableRepoPath(rel)) {
        stats.skippedIgnored++;
        return drain();
      }
      if (
        (header.size ?? 0) > MAX_FILE_BYTES ||
        stats.totalBytes >= MAX_TOTAL_BYTES
      ) {
        stats.skippedTooLarge++;
        return drain();
      }

      const chunks: Buffer[] = [];
      stream.on("data", (c: Buffer) => chunks.push(c));
      stream.on("error", reject);
      stream.on("end", () => {
        const buf = Buffer.concat(chunks);
        const text = buf.toString("utf8");
        if (text.includes(String.fromCharCode(0))) {
          stats.skippedBinary++;
        } else {
          stats.totalBytes += buf.length;
          stats.files++;
          docs.push({ pageContent: text, metadata: { source: rel } });
        }
        next();
      });
    });

    extract.on("finish", () => resolve({ docs, stats }));
    extract.on("error", reject);
    gunzip.on("error", reject);
    source.on("error", reject);

    source.pipe(gunzip).pipe(extract);
  });
}

export async function extractRepoDocumentsFromTarball(
  tarball: Buffer,
): Promise<{ docs: RepoDocument[]; stats: TarballLoadStats }> {
  return extractRepoDocumentsFromTarStream(Readable.from(tarball));
}

export async function loadGithubRepository(
  githubUrl: string,
  githubToken?: string,
  ref?: string,
): Promise<RepoDocument[]> {
  const parsed = parseGithubOwnerRepo(githubUrl);
  if (!parsed) {
    throw new Error(`Cannot parse owner/repo from GitHub URL: ${githubUrl}`);
  }
  const token = githubToken || process.env.GITHUB_TOKEN;
  const resolvedRef =
    typeof ref === "string" && ref.trim().length > 0
      ? ref.trim()
      : await resolveGithubDefaultBranch(githubUrl, token);

  const cacheKey = `${parsed.owner}/${parsed.repo}@${resolvedRef}`;
  if (isImmutableRef(resolvedRef)) {
    const cached = DOC_CACHE.get(cacheKey);
    if (cached) {
      docCachePut(cacheKey, cached);
      log.debug(
        `[tarball] ${cacheKey}: cache hit (${cached.stats.files} files, ${Math.round(cached.stats.totalBytes / 1024)}KB text)`,
      );
      return cached.docs;
    }
  }

  const source = await openTarballStream(
    parsed.owner,
    parsed.repo,
    resolvedRef,
    token,
  );
  const { docs, stats } = await extractRepoDocumentsFromTarStream(source);
  log.debug(
    `[tarball] ${cacheKey}: ${stats.files} files (${Math.round(stats.totalBytes / 1024)}KB text), skipped ${stats.skippedIgnored} ignored / ${stats.skippedTooLarge} oversize / ${stats.skippedBinary} binary`,
  );

  if (isImmutableRef(resolvedRef)) {
    docCachePut(cacheKey, { docs, stats });
  }
  return docs;
}
