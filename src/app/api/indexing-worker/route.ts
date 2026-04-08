import { NextResponse } from "next/server";
import { runIndexingWorkerOnce } from "@/lib/indexing-worker-run";

export async function GET() {
  const { status, body } = await runIndexingWorkerOnce();
  return NextResponse.json(body, { status });
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
