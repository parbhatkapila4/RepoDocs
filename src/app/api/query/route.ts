import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import { queryCodebase, queryCodebasePreindex } from "@/lib/rag";
import {
  extractMemoriesFromConversation,
  storeMemories,
} from "@/lib/memory";
import { estimateCostUsd } from "@/lib/cost";
import { recordQueryMetrics } from "@/lib/query-metrics";
import * as queryCache from "@/lib/query-cache";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startMs = Date.now();
  let projectIdForMetrics: string | undefined;
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
    const { projectId, question, conversationHistory, mode: bodyMode } = body;

    const mode =
      bodyMode === "guidance" || bodyMode === "default" ? bodyMode : "default";

    if (!projectId || !question) {
      return NextResponse.json(
        { error: "Project ID and question are required" },
        { status: 400 }
      );
    }
    projectIdForMetrics = projectId;

    if (typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question must be a non-empty string" },
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

    const embeddingsCount = await prisma.sourceCodeEmbeddings.count({
      where: {
        projectId: projectId,
      },
    });

    if (embeddingsCount === 0) {
      void import("@/lib/indexing-worker-kick").then((m) =>
        m.kickIndexingWorker().catch(() => { })
      );

      const preResult = await queryCodebasePreindex(
        project.repoUrl,
        project.githubToken,
        question,
        conversationHistory,
        { mode }
      );

      const latencyMs = Date.now() - startMs;
      const promptTokens = preResult.promptTokens ?? 0;
      const completionTokens = preResult.completionTokens ?? 0;
      const totalTokens = preResult.totalTokens ?? 0;
      const modelUsed = preResult.modelUsed ?? "unknown";
      void recordQueryMetrics(prisma, {
        projectId,
        routeType: "query",
        modelUsed,
        promptTokens,
        completionTokens,
        totalTokens,
        retrievalCount: preResult.sources.length,
        memoryHitCount: 0,
        latencyMs,
        estimatedCostUsd: estimateCostUsd(
          promptTokens,
          completionTokens,
          modelUsed
        ),
        success: true,
        cacheHit: false,
      }).catch((err) => console.error("[QueryMetrics]", err));

      return NextResponse.json({
        success: true,
        answer: preResult.answer,
        sources: preResult.sources,
        metadata: {
          sourcesCount: preResult.sources.length,
          projectName: project.name,
          preindex: true,
        },
      });
    }

    const cached = queryCache.get(projectId, question);
    if (cached) {
      const latencyMs = Date.now() - startMs;

      console.log("[QueryMetrics] Recording success (cache hit)", { projectId, routeType: "query", latencyMs });
      void recordQueryMetrics(prisma, {
        projectId,
        routeType: "query",
        modelUsed: "unknown",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        retrievalCount: cached.sources.length,
        memoryHitCount: 0,
        latencyMs,
        estimatedCostUsd: 0,
        success: true,
        cacheHit: true,
      }).catch((err) => console.error("[QueryMetrics]", err));
      return NextResponse.json({
        success: true,
        answer: cached.answer,
        sources: cached.sources,
        metadata: {
          sourcesCount: cached.sources.length,
          projectName: project.name,
        },
      });
    }

    const result = await queryCodebase(
      projectId,
      question,
      conversationHistory,
      { mode }
    );

    queryCache.set(projectId, question, result.answer, result.sources);

    const latencyMs = Date.now() - startMs;
    const promptTokens = result.promptTokens ?? 0;
    const completionTokens = result.completionTokens ?? 0;
    const totalTokens = result.totalTokens ?? 0;
    const modelUsed = result.modelUsed ?? "unknown";
    const retrievalCount = result.sources.length;
    const memoryHitCount = result.memoryHitCount ?? 0;
    const estimatedCostUsd = estimateCostUsd(
      promptTokens,
      completionTokens,
      modelUsed
    );


    console.log("[QueryMetrics] Recording success", { projectId, routeType: "query", latencyMs });
    void recordQueryMetrics(prisma, {
      projectId,
      routeType: "query",
      modelUsed,
      promptTokens,
      completionTokens,
      totalTokens,
      retrievalCount,
      memoryHitCount,
      latencyMs,
      estimatedCostUsd,
      success: true,
      cacheHit: false,
      avgMemorySimilarity: result.avgMemorySimilarity ?? undefined,
    }).catch((err) => console.error("[QueryMetrics]", err));

    try {
      await prisma.$executeRaw`
        INSERT INTO "CodebaseQueries" ("projectId", "question", "answer", "sourcesCount", "createdAt")
        VALUES (${projectId}, ${question}, ${result.answer}, ${result.sources.length}, NOW())
      `;
    } catch (dbError) { }

    extractMemoriesFromConversation(question, result.answer)
      .then((items) => {
        if (items.length > 0) {
          return storeMemories(projectId, items);
        }
      })
      .catch((err) => console.error("[RepoMemory] Failed to persist:", err));

    return NextResponse.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      metadata: {
        sourcesCount: result.sources.length,
        projectName: project.name,
      },
    });
  } catch (error) {
    console.error("Error in query endpoint:", error);

    if (projectIdForMetrics) {
      const latencyMs = Date.now() - startMs;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.log("[QueryMetrics] Recording failure", { projectId: projectIdForMetrics, routeType: "query", latencyMs, success: false });
      void recordQueryMetrics(prisma, {
        projectId: projectIdForMetrics,
        routeType: "query",
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
    }

    return NextResponse.json(
      {
        error: "Failed to process query",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

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

    try {
      const queries = await prisma.$queryRaw<
        {
          id: string;
          question: string;
          answer: string;
          sourcesCount: number;
          createdAt: Date;
        }[]
      >`
        SELECT id, question, answer, "sourcesCount", "createdAt"
        FROM "CodebaseQueries"
        WHERE "projectId" = ${projectId}
        ORDER BY "createdAt" DESC
        LIMIT 50
      `;

      return NextResponse.json({
        success: true,
        queries,
      });
    } catch (error) {
      return NextResponse.json({
        success: true,
        queries: [],
      });
    }
  } catch (error) {
    console.error("Error fetching query history:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch query history",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
