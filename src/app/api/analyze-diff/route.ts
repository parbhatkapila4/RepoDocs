import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { analyzeDiff } from "@/lib/diff";
import { estimateCostUsd } from "@/lib/cost";
import { recordQueryMetrics } from "@/lib/query-metrics";

export const runtime = "nodejs";
export const maxDuration = 60;

async function getDbUserId(clerkUserId: string): Promise<string | null> {
  let dbUser = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { id: true },
  });

  if (!dbUser) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);

      if (clerkUser.emailAddresses[0]?.emailAddress) {
        dbUser = await prisma.user.findUnique({
          where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
          select: { id: true },
        });
      }
    } catch {
      return null;
    }
  }

  return dbUser?.id || null;
}

export async function POST(request: NextRequest) {
  let startMs = 0;
  let projectIdForMetrics = "";

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { projectId, diff } = body;

    if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (!diff || typeof diff !== "string" || diff.trim().length === 0) {
      return NextResponse.json(
        { error: "Diff content is required and must be a non-empty string" },
        { status: 400 }
      );
    }

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
