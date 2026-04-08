import { headers } from "next/headers";
import { after } from "next/server";
import { runIndexingWorkerOnce } from "./indexing-worker-run";

export async function collectWorkerOriginsOrdered(): Promise<string[]> {
  const list: string[] = [];
  const seen = new Set<string>();

  const add = (u: string | undefined) => {
    if (!u) return;
    const clean = u.replace(/\/$/, "");
    if (seen.has(clean)) return;
    seen.add(clean);
    list.push(clean);
  };

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const protoHeader = h.get("x-forwarded-proto") ?? "https";
    if (host) {
      const proto = protoHeader.split(",")[0].trim();
      add(`${proto}://${host.split(",")[0].trim()}`);
    }
  } catch {
  }

  add(process.env.NEXT_PUBLIC_APP_URL);
  if (process.env.VERCEL_URL) {
    add(`https://${process.env.VERCEL_URL}`);
  }
  add("http://127.0.0.1:3000");
  add("http://localhost:3000");

  return list;
}

export async function resolveAppOriginForWorker(): Promise<string> {
  const origins = await collectWorkerOriginsOrdered();
  return origins[0] ?? "http://localhost:3000";
}

export async function kickIndexingWorker(): Promise<void> {
  try {
    after(() => {
      void runIndexingWorkerOnce().catch((err) =>
        console.error("[kickIndexingWorker] after() worker failed:", err)
      );
    });
    return;
  } catch {

  }

  const origins = await collectWorkerOriginsOrdered();
  const origin = origins[0];
  if (!origin) return;

  void fetch(`${origin}/api/indexing-worker`, { cache: "no-store" }).catch(
    (err) => console.warn("[kickIndexingWorker] HTTP kick failed:", err)
  );
}
