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

export type GuardFailure = { response: NextResponse };

export function isGuardFailure<T>(
  result: GuardFailure | T
): result is GuardFailure {
  return (result as GuardFailure).response instanceof NextResponse;
}

export async function requireAuthAndRateLimit(
  request: NextRequest
): Promise<GuardFailure | { userId: string; dbUserId: string }> {
  const { userId } = await auth();

  if (!userId) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const rl = await rateLimit(
    getRateLimitIdentifier(request, userId),
    RATE_LIMITS.API
  );
  if (!rl.success) return { response: rateLimitResponse(rl.resetTime) };

  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) {
    return {
      response: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  return { userId, dbUserId };
}

export async function requireOwnedProjectWithinBudget(
  projectId: string,
  dbUserId: string
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
        { error: "Project not found or unauthorized" },
        { status: 404 }
      ),
    };
  }

  if (await isProjectOverBudget(projectId, project.monthlyCostLimitUsd)) {
    return {
      response: NextResponse.json(
        { error: "Budget exceeded", message: BUDGET_EXCEEDED_MESSAGE },
        { status: 402 }
      ),
    };
  }

  return { project };
}
