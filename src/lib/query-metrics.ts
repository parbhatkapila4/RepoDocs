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
      },
    })
    .then(() => { });
}
