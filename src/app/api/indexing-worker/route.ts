import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { runIndexingWorkerOnce } from "@/lib/indexing-worker-run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(
      "[indexing-worker] CRON_SECRET is not configured; rejecting request."
    );
    return false;
  }

  const provided = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;

  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, body } = await runIndexingWorkerOnce();
  return NextResponse.json(body, { status });
}
