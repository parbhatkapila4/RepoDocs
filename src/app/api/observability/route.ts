import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const DEFAULT_WINDOW_DAYS = 7;
const RECENT_ERRORS_LIMIT = 20;
const ERROR_MESSAGE_MAX_LENGTH = 500;
const ROLLING_BUDGET_DAYS = 30;
const HEALTH_LATENCY_THRESHOLD_MS = 15000;

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

  return dbUser?.id ?? null;
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const windowParam = searchParams.get("window");

  if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  const windowDays = Math.min(
    365,
    Math.max(1, parseInt(windowParam ?? String(DEFAULT_WINDOW_DAYS), 10) || DEFAULT_WINDOW_DAYS)
  );
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const project = await prisma.project.findFirst({
    where: {
      id: projectId.trim(),
      userId: dbUserId,
      deletedAt: null,
    },
    select: {
      id: true,
      monthlyCostLimitUsd: true,
      alertThresholdPercent: true,
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found or unauthorized" },
      { status: 404 }
    );
  }


  const baseWhere = {
    projectId: project.id,
    createdAt: { gte: since },
  };

  const since30d = new Date(
    Date.now() - ROLLING_BUDGET_DAYS * 24 * 60 * 60 * 1000
  );

  const [
    aggregate,
    queriesWithMemoryHits,
    recentErrorsRows,
    cost30dAggregate,
    costByRouteRows,
    coldStartAggregate,
    warmAggregate,
    cacheHitAggregate,
    cacheMissAggregate,
    errorCountResult,
  ] = await Promise.all([
    prisma.queryMetrics.aggregate({
      where: baseWhere,
      _count: true,
      _avg: {
        latencyMs: true,
        avgMemorySimilarity: true,
      } as { latencyMs: true },
      _sum: { estimatedCostUsd: true },
    }),
    prisma.queryMetrics.count({
      where: { ...baseWhere, memoryHitCount: { gt: 0 } },
    }),
    prisma.queryMetrics.findMany({
      where: { ...baseWhere, success: false },
      orderBy: { createdAt: "desc" },
      take: RECENT_ERRORS_LIMIT,
      select: { createdAt: true, routeType: true, errorMessage: true },
    }),
    prisma.queryMetrics.aggregate({
      where: {
        projectId: project.id,
        createdAt: { gte: since30d },
      },
      _sum: { estimatedCostUsd: true },
    }),
    prisma.queryMetrics.groupBy({
      where: baseWhere,
      by: ["routeType"],
      _sum: { estimatedCostUsd: true },
    }),
    prisma.queryMetrics.aggregate({
      where: { ...baseWhere, wasColdStart: true },
      _count: true,
      _avg: { latencyMs: true },
    }),
    prisma.queryMetrics.aggregate({
      where: { ...baseWhere, wasColdStart: false },
      _avg: { latencyMs: true },
    }),
    prisma.queryMetrics.aggregate({
      where: { ...baseWhere, cacheHit: true },
      _count: true,
      _avg: { latencyMs: true },
    }),
    prisma.queryMetrics.aggregate({
      where: { ...baseWhere, cacheHit: false },
      _avg: { latencyMs: true },
    }),
    prisma.queryMetrics.count({
      where: { ...baseWhere, success: false },
    }),
  ]);

  const totalQueries = aggregate._count;
  const avgLatencyMs = totalQueries === 0
    ? 0
    : Math.round((aggregate._avg.latencyMs ?? 0) * 100) / 100;
  const memoryHitRate =
    totalQueries === 0 ? 0 : queriesWithMemoryHits / totalQueries;
  const avgMemorySimilarity =
    (aggregate._avg as { avgMemorySimilarity?: number | null } | undefined)
      ?.avgMemorySimilarity ?? null;
  const estimatedCostUsd7d = aggregate._sum.estimatedCostUsd ?? 0;
  const totalCost7d = aggregate._sum.estimatedCostUsd ?? 0;

  const breakdown: Record<string, number> = {
    query: 0,
    diff: 0,
    architecture: 0,
  };
  for (const row of costByRouteRows) {
    breakdown[row.routeType] = row._sum.estimatedCostUsd ?? 0;
  }

  const coldStartCount = coldStartAggregate._count;
  const coldStartLatencyAvg =
    coldStartCount === 0
      ? 0
      : Math.round((coldStartAggregate._avg.latencyMs ?? 0) * 100) / 100;
  const warmLatencyAvg = Math.round((warmAggregate._avg.latencyMs ?? 0) * 100) / 100;

  const cacheHitCount = cacheHitAggregate._count;
  const cacheHitRate =
    totalQueries === 0 ? 0 : cacheHitCount / Math.max(1, totalQueries);
  const avgLatencyCacheHit =
    cacheHitCount === 0
      ? 0
      : Math.round((cacheHitAggregate._avg.latencyMs ?? 0) * 100) / 100;
  const avgLatencyCacheMiss = Math.round(
    (cacheMissAggregate._avg.latencyMs ?? 0) * 100
  ) / 100;

  const errorCount = errorCountResult;
  const errorRate = errorCount / Math.max(1, totalQueries);

  const recentErrors = recentErrorsRows.map((row) => ({
    createdAt: row.createdAt,
    routeType: row.routeType,
    errorMessage: row.errorMessage
      ? row.errorMessage.slice(0, ERROR_MESSAGE_MAX_LENGTH) +
      (row.errorMessage.length > ERROR_MESSAGE_MAX_LENGTH ? "…" : "")
      : null,
  }));

  const cost30d = cost30dAggregate._sum.estimatedCostUsd ?? 0;
  const monthlyCostLimitUsd = project.monthlyCostLimitUsd ?? null;
  const alertThresholdPercent = project.alertThresholdPercent ?? 80;

  let budgetStatus: "ok" | "warning" | "limit_exceeded" | "not_set";
  if (monthlyCostLimitUsd == null) {
    budgetStatus = "not_set";
  } else if (cost30d >= monthlyCostLimitUsd) {
    budgetStatus = "limit_exceeded";
  } else if (
    cost30d >= monthlyCostLimitUsd * (alertThresholdPercent / 100)
  ) {
    budgetStatus = "warning";
  } else {
    budgetStatus = "ok";
  }

  let healthStatus: "healthy" | "warning" | "critical";
  if (errorRate > 0.15 || budgetStatus === "limit_exceeded") {
    healthStatus = "critical";
  } else if (
    errorRate >= 0.05 ||
    budgetStatus === "warning" ||
    avgLatencyMs > HEALTH_LATENCY_THRESHOLD_MS
  ) {
    healthStatus = "warning";
  } else {
    healthStatus = "healthy";
  }

  return NextResponse.json({
    totalQueries,
    avgLatencyMs,
    memoryHitRate,
    avgMemorySimilarity,
    estimatedCostUsd7d,
    totalCost7d,
    breakdown,
    coldStartCount,
    coldStartLatencyAvg,
    warmLatencyAvg,
    cacheHitRate,
    avgLatencyCacheHit,
    avgLatencyCacheMiss,
    recentErrors,
    cost30d,
    monthlyCostLimitUsd,
    alertThresholdPercent,
    budgetStatus,
    healthStatus,
  });
}
