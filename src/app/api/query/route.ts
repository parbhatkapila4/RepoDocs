import { log } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import { queryCodebase, queryCodebasePreindex } from "@/lib/rag";
import { extractMemoriesFromConversation, storeMemories } from "@/lib/memory";
import { estimateCostUsd } from "@/lib/cost";
import { recordQueryMetrics } from "@/lib/query-metrics";
import * as queryCache from "@/lib/query-cache";
import {
  rateLimit,
  getRateLimitIdentifier,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limiter";
import { z } from "zod";
import { decryptSecret } from "@/lib/secret-crypto";
import { isProjectOverBudget, BUDGET_EXCEEDED_MESSAGE } from "@/lib/budget";
import { requirePaidPlan, isGuardFailure } from "@/lib/api-guards";

export const runtime = "nodejs";
export const maxDuration = 60;

const QuerySchema = z.object({
  projectId: z.string().min(1),
  question: z.string().trim().min(1),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
  mode: z.enum(["guidance", "default"]).optional(),
});

export async function POST(request: NextRequest) {
  const startMs = Date.now();
  let projectIdForMetrics: string | undefined;
  try {
    const { userId } = await auth();

    if (!userId) {
      log.warn("[query] rejected 401: no auth session");
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Your session has expired. Refresh the page and sign in again.",
        },
        { status: 401 },
      );
    }

    const rl = await rateLimit(
      getRateLimitIdentifier(request, userId),
      RATE_LIMITS.API,
    );
    if (!rl.success) {
      log.warn("[query] rejected 429: rate limited", { userId });
      return rateLimitResponse(rl.resetTime);
    }

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      log.warn("[query] rejected 404: no db user for clerk id", { userId });
      return NextResponse.json(
        {
          error: "User not found",
          message:
            "Your account could not be found. Sign out and back in, then try again.",
        },
        { status: 404 },
      );
    }

    const gate = await requirePaidPlan(dbUserId, "chat");
    if (isGuardFailure(gate)) {
      log.warn("[query] rejected: plan gate blocked chat", { dbUserId });
      return gate.response;
    }

    const parsed = QuerySchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      log.warn("[query] rejected 400: invalid request body", {
        issues: parsed.error.issues.map((i) => i.path.join(".")),
      });
      return NextResponse.json(
        {
          error: "Project ID and a non-empty question are required",
          message: "Project ID and a non-empty question are required.",
        },
        { status: 400 },
      );
    }
    const { projectId, question, conversationHistory } = parsed.data;
    const mode = parsed.data.mode ?? "default";
    projectIdForMetrics = projectId;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: dbUserId,
        deletedAt: null,
      },
    });

    if (!project) {
      log.warn("[query] rejected 404: project not found or not owned", {
        projectId,
        dbUserId,
      });
      return NextResponse.json(
        {
          error: "Project not found or unauthorized",
          message:
            "This project doesn't exist or isn't accessible from the account you're signed in with. Re-select the project and try again.",
        },
        { status: 404 },
      );
    }

    if (await isProjectOverBudget(projectId, project.monthlyCostLimitUsd)) {
      log.warn("[query] rejected 402: project over budget", { projectId });
      return NextResponse.json(
        { error: "Budget exceeded", message: BUDGET_EXCEEDED_MESSAGE },
        { status: 402 },
      );
    }

    const embeddingsCount = await prisma.sourceCodeEmbeddings.count({
      where: {
        projectId: projectId,
      },
    });

    if (embeddingsCount === 0) {
      void import("@/lib/indexing-worker-kick")
        .then((m) => m.kickIndexingWorker())
        .catch((kickError) =>
          log.warn("[query] Failed to kick indexing worker:", kickError),
        );

      const preResult = await queryCodebasePreindex(
        project.repoUrl,
        decryptSecret(project.githubToken),
        question,
        conversationHistory,
        { mode },
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
          modelUsed,
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

      log.debug("[QueryMetrics] Recording success (cache hit)", {
        projectId,
        routeType: "query",
        latencyMs,
      });
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
      {
        mode,
        identity: {
          name: project.name,
          repoUrl: project.repoUrl,
          githubToken: project.githubToken,
          indexedCommitSha: project.indexedCommitSha ?? null,
          fileCount: embeddingsCount,
        },
      },
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
      modelUsed,
    );

    log.debug("[QueryMetrics] Recording success", {
      projectId,
      routeType: "query",
      latencyMs,
    });
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
    } catch (dbError) {
      console.error("[query] Failed to persist chat history:", dbError);
    }

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

      log.debug("[QueryMetrics] Recording failure", {
        projectId: projectIdForMetrics,
        routeType: "query",
        latencyMs,
        success: false,
      });
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
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(
      getRateLimitIdentifier(request, userId),
      RATE_LIMITS.API,
    );
    if (!rl.success) return rateLimitResponse(rl.resetTime);

    const dbUserId = await getDbUserId(userId);
    if (!dbUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const gate = await requirePaidPlan(dbUserId, "chat");
    if (isGuardFailure(gate)) return gate.response;

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
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
        { status: 404 },
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
      { status: 500 },
    );
  }
}
