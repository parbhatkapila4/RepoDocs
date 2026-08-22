export interface JsonFetchResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  nonJson: boolean;
}

export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts?: { retryOnceOnNonJson?: boolean; retryDelayMs?: number },
): Promise<JsonFetchResult<T>> {
  const attempt = async (): Promise<JsonFetchResult<T>> => {
    const res = await fetch(input, init);
    const text = await res.text();
    try {
      return {
        ok: res.ok,
        status: res.status,
        data: JSON.parse(text) as T,
        nonJson: false,
      };
    } catch {
      return { ok: res.ok, status: res.status, data: null, nonJson: true };
    }
  };

  const first = await attempt();
  if (!first.nonJson || !opts?.retryOnceOnNonJson) return first;
  await new Promise((r) => setTimeout(r, opts.retryDelayMs ?? 1200));
  return attempt();
}
