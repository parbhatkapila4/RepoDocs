import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { Project } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import {
  rateLimit,
  getRateLimitIdentifier,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limiter";
import { isProjectOverBudget, BUDGET_EXCEEDED_MESSAGE } from "@/lib/budget";
import {
  normalizePlanName,
  planAllows,
  upgradeMessage,
  type PaidFeature,
  type PlanName,
} from "@/lib/plan";

export type GuardFailure = { response: NextResponse };

export function isGuardFailure<T>(
  result: GuardFailure | T,
): result is GuardFailure {
  return (result as GuardFailure).response instanceof NextResponse;
}

export async function requireAuthAndRateLimit(
  request: NextRequest,
): Promise<GuardFailure | { userId: string; dbUserId: string }> {
  const { userId } = await auth();

  if (!userId) {
    return {
      response: NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Your session has expired. Refresh the page and sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  const rl = await rateLimit(
    getRateLimitIdentifier(request, userId),
    RATE_LIMITS.API,
  );
  if (!rl.success) return { response: rateLimitResponse(rl.resetTime) };

  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) {
    return {
      response: NextResponse.json(
        {
          error: "User not found",
          message:
            "Your account could not be found. Sign out and back in, then try again.",
        },
        { status: 404 },
      ),
    };
  }

  return { userId, dbUserId };
}

export async function requireOwnedProjectWithinBudget(
  projectId: string,
  dbUserId: string,
): Promise<GuardFailure | { project: Project }> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: dbUserId,
      deletedAt: null,
    },
  });

  if (!project) {
    return {
      response: NextResponse.json(
        {
          error: "Project not found or unauthorized",
          message:
            "This project doesn't exist or isn't accessible from the account you're signed in with.",
        },
        { status: 404 },
      ),
    };
  }

  if (await isProjectOverBudget(projectId, project.monthlyCostLimitUsd)) {
    return {
      response: NextResponse.json(
        { error: "Budget exceeded", message: BUDGET_EXCEEDED_MESSAGE },
        { status: 402 },
      ),
    };
  }

  return { project };
}

export async function requirePaidPlan(
  dbUserId: string,
  feature: PaidFeature,
): Promise<GuardFailure | { plan: PlanName }> {
  const user = await prisma.user.findUnique({
    where: { id: dbUserId },
    select: { plan: true },
  });
  const plan = normalizePlanName(user?.plan);

  if (!planAllows(plan, feature)) {
    return {
      response: NextResponse.json(
        {
          error: upgradeMessage(feature),
          message: upgradeMessage(feature),
          reason: "upgrade_required",
          feature,
          plan,
        },
        { status: 402 },
      ),
    };
  }

  return { plan };
}
