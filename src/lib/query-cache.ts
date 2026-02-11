import crypto from "crypto";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface CachedSource {
  fileName: string;
  sourceCode: string;
  summary: string;
  similarity: number;
}

interface CacheEntry {
  answer: string;
  sources: CachedSource[];
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();

function hashQuestion(question: string): string {
  return crypto
    .createHash("sha256")
    .update(question.trim())
    .digest("hex")
    .slice(0, 16);
}

function key(projectId: string, question: string): string {
  return `${projectId}:${hashQuestion(question)}`;
}

function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.cachedAt >= TTL_MS;
}


export function get(
  projectId: string,
  question: string
): { answer: string; sources: CachedSource[] } | null {
  const k = key(projectId, question);
  const entry = cache.get(k);
  if (!entry) return null;
  if (isExpired(entry)) {
    cache.delete(k);
    return null;
  }
  return { answer: entry.answer, sources: entry.sources };
}


export function set(
  projectId: string,
  question: string,
  answer: string,
  sources: CachedSource[]
): void {
  const k = key(projectId, question);
  cache.set(k, {
    answer,
    sources,
    cachedAt: Date.now(),
  });

  if (cache.size > 100) {
    const keysToCheck = Array.from(cache.keys()).slice(0, 5);
    for (const kk of keysToCheck) {
      const e = cache.get(kk);
      if (e && isExpired(e)) cache.delete(kk);
    }
  }
}
