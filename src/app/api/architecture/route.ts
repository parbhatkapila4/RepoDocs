import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import {
  buildDependencyGraph,
  buildQuickDependencyGraphFromGitTree,
} from "@/lib/architecture";
import {
  rateLimit,
  getRateLimitIdentifier,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limiter";
import { recordQueryMetrics } from "@/lib/query-metrics";
import { estimateCostUsd } from "@/lib/cost";
import { kickIndexingWorker } from "@/lib/indexing-worker-kick";
import { decryptSecret } from "@/lib/secret-crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const startMs = Date.now();
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

    const projectId = request.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

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

    let result = await buildDependencyGraph(projectId);
    const embeddingsCount = await prisma.sourceCodeEmbeddings.count({
      where: { projectId },
    });
    let indexingJob = await prisma.indexingJob.findUnique({
      where: { projectId },
      select: { status: true, progress: true, error: true, updatedAt: true },
    });

    if (embeddingsCount === 0) {
      if (!indexingJob || indexingJob.status === "failed") {
        await prisma.indexingJob.upsert({
          where: { projectId },
          create: {
            projectId,
            status: "queued",
            progress: 0,
          },
          update: {
            status: "queued",
            progress: 0,
            error: null,
            lockedAt: null,
            lockedBy: null,
          },
        });
      }

      void kickIndexingWorker();

      try {
        const quickGraph = (await Promise.race([
          buildQuickDependencyGraphFromGitTree(
            project.repoUrl,
            decryptSecret(project.githubToken) ||
              process.env.GITHUB_TOKEN ||
              undefined
          ),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
        ])) as
          | Awaited<ReturnType<typeof buildQuickDependencyGraphFromGitTree>>
          | null;

        if (quickGraph && quickGraph.nodes.length > 0) {
          result = quickGraph;
        }
      } catch {
      }

      indexingJob = await prisma.indexingJob.findUnique({
        where: { projectId },
        select: { status: true, progress: true, error: true, updatedAt: true },
      });
    }

    const latencyMs = Date.now() - startMs;
    void recordQueryMetrics(prisma, {
      projectId,
      routeType: "architecture",
      modelUsed: "static-analysis",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      retrievalCount: result.nodes.length,
      memoryHitCount: 0,
      latencyMs,
      estimatedCostUsd: estimateCostUsd(0, 0, "static-analysis"),
      success: true,
      cacheHit: false,
    }).catch((err) => console.error("[QueryMetrics]", err));

    return NextResponse.json({
      success: true,
      nodes: result.nodes,
      edges: result.edges,
      diagnostics: {
        embeddingsCount,
        indexingStatus: indexingJob?.status ?? null,
        indexingProgress: indexingJob?.progress ?? 0,
        indexingError: indexingJob?.error ?? null,
        indexingUpdatedAt: indexingJob?.updatedAt ?? null,
      },
    });
  } catch (error) {
    console.error("Error in architecture endpoint:", error);

    return NextResponse.json(
      {
        error: "Failed to build architecture graph",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
