import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import { analyzeDiff } from "@/lib/diff";
import { estimateCostUsd } from "@/lib/cost";
import { recordQueryMetrics } from "@/lib/query-metrics";
import {
  rateLimit,
  getRateLimitIdentifier,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limiter";
import { z } from "zod";
import { isProjectOverBudget, BUDGET_EXCEEDED_MESSAGE } from "@/lib/budget";

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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(
      getRateLimitIdentifier(request, userId),
      RATE_LIMITS.API
    );
    if (!rl.success) return rateLimitResponse(rl.resetTime);

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    if (await isProjectOverBudget(projectId, project.monthlyCostLimitUsd)) {
      return NextResponse.json(
        { error: "Budget exceeded", message: BUDGET_EXCEEDED_MESSAGE },
        { status: 402 }
      );
    }

    startMs = Date.now();
    const result = await analyzeDiff(projectId, diff.trim());
    const latencyMs = Date.now() - startMs;
    const { _metrics, ...analysis } = result;

    const promptTokens = _metrics?.promptTokens ?? 0;
    const completionTokens = _metrics?.completionTokens ?? 0;
    const totalTokens = _metrics?.totalTokens ?? 0;
    const modelUsed = _metrics?.modelUsed ?? "unknown";
    const retrievalCount = _metrics?.retrievalCount ?? 0;
    const memoryHitCount = _metrics?.memoryHitCount ?? 0;
    const estimatedCostUsd = estimateCostUsd(
      promptTokens,
      completionTokens,
      modelUsed
    );


    console.log("[QueryMetrics] Recording success", { projectId, routeType: "diff", latencyMs });
    void recordQueryMetrics(prisma, {
      projectId,
      routeType: "diff",
      modelUsed,
      promptTokens,
      completionTokens,
      totalTokens,
      retrievalCount,
      memoryHitCount,
      latencyMs,
      estimatedCostUsd,
      success: true,
      avgMemorySimilarity: result._metrics?.avgMemorySimilarity ?? undefined,
    }).catch((err) => console.error("[QueryMetrics]", err));

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


    console.log("[QueryMetrics] Recording failure", { projectId: projectIdForMetrics, routeType: "diff", latencyMs, success: false });
    void recordQueryMetrics(prisma, {
      projectId: projectIdForMetrics,
      routeType: "diff",
      modelUsed: "unknown",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      retrievalCount: 0,
      memoryHitCount: 0,
      latencyMs,
      estimatedCostUsd: 0,
      success: false,
      errorMessage,
    }).catch((err) => console.error("[QueryMetrics]", err));

    return NextResponse.json(
      {
        error: "Failed to analyze diff",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
