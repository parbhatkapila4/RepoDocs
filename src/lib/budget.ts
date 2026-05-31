import prisma from "./prisma";

const ROLLING_BUDGET_DAYS = 30;
export async function isProjectOverBudget(
  projectId: string,
  monthlyCostLimitUsd: number | null | undefined
): Promise<boolean> {
  if (monthlyCostLimitUsd == null) return false;

  const since = new Date(
    Date.now() - ROLLING_BUDGET_DAYS * 24 * 60 * 60 * 1000
  );

  try {
    const agg = await prisma.queryMetrics.aggregate({
      where: { projectId, createdAt: { gte: since } },
      _sum: { estimatedCostUsd: true },
    });
    const spent = agg._sum.estimatedCostUsd ?? 0;
    return spent >= monthlyCostLimitUsd;
  } catch {
    return false;
  }
}

export const BUDGET_EXCEEDED_MESSAGE =
  "This project has reached its configured monthly AI spend limit. Raise the limit in observability settings to continue.";
