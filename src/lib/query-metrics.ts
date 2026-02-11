import type { PrismaClient } from "@prisma/client";

export interface QueryMetricsPayload {
  projectId: string;
  routeType: "query" | "diff" | "architecture";
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  retrievalCount: number;
  memoryHitCount: number;
  latencyMs: number;
  estimatedCostUsd: number;
  success: boolean;
  errorMessage?: string | null;
  wasColdStart?: boolean;
  cacheHit?: boolean;
  avgMemorySimilarity?: number | null;
}


type PrismaWithQueryMetrics = PrismaClient & {
  queryMetrics: {
    create: (args: { data: Omit<QueryMetricsPayload, "errorMessage"> & { errorMessage?: string } }) => Promise<unknown>;
  };
};

export function recordQueryMetrics(
  prisma: PrismaClient,
  payload: QueryMetricsPayload
): Promise<void> {
  return (prisma as PrismaWithQueryMetrics).queryMetrics
    .create({
      data: {
        projectId: payload.projectId,
        routeType: payload.routeType,
        modelUsed: payload.modelUsed,
        promptTokens: payload.promptTokens,
        completionTokens: payload.completionTokens,
        totalTokens: payload.totalTokens,
        retrievalCount: payload.retrievalCount,
        memoryHitCount: payload.memoryHitCount,
        latencyMs: payload.latencyMs,
        estimatedCostUsd: payload.estimatedCostUsd,
        success: payload.success,
        errorMessage: payload.errorMessage ?? undefined,
        wasColdStart: payload.wasColdStart ?? false,
        cacheHit: payload.cacheHit ?? false,
        avgMemorySimilarity: payload.avgMemorySimilarity ?? undefined,
      },
    })
    .then(() => { });
}

export const COLD_START_THRESHOLD_MS = 10 * 60 * 1000;


export async function getWasColdStart(
  prisma: PrismaClient,
  projectId: string
): Promise<boolean> {
  const last = await prisma.queryMetrics.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { createdAt: true },
  });
  if (!last) return true;
  return Date.now() - last.createdAt.getTime() > COLD_START_THRESHOLD_MS;
}
