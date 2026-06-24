import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseDiff } from "@/lib/diff";
import {
  analyzeParsedDiff,
  recordAnalysisSuccess,
  recordAnalysisFailure,
} from "@/lib/analyze";
import {
  requireAuthAndRateLimit,
  requireOwnedProjectWithinBudget,
  isGuardFailure,
} from "@/lib/api-guards";

export const runtime = "nodejs";
export const maxDuration = 60;

const DiffSchema = z.object({
  projectId: z.string().min(1),
  diff: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  let startMs = 0;
  let projectIdForMetrics = "";

  try {
    const access = await requireAuthAndRateLimit(request);
    if (isGuardFailure(access)) return access.response;
    const { dbUserId } = access;

    const parsed = DiffSchema.safeParse(
      await request.json().catch(() => null)
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Project ID and non-empty diff content are required" },
        { status: 400 }
      );
    }
    const { projectId, diff } = parsed.data;

    projectIdForMetrics = projectId;

    const owned = await requireOwnedProjectWithinBudget(projectId, dbUserId);
    if (isGuardFailure(owned)) return owned.response;

    startMs = Date.now();
    const result = await analyzeParsedDiff(parseDiff(diff.trim()), projectId);
    const latencyMs = Date.now() - startMs;

    recordAnalysisSuccess("diff", projectId, result, latencyMs);

    const { _metrics, ...analysis } = result;

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    const latencyMs = startMs ? Date.now() - startMs : 0;
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred";
    console.error("Error in analyze-diff endpoint:", error);

    recordAnalysisFailure("diff", projectIdForMetrics, latencyMs, errorMessage);

    return NextResponse.json(
      {
        error: "Failed to analyze diff",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
