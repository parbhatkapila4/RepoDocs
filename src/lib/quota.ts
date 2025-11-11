import { PlanType } from "@prisma/client"
import prisma from "./prisma"

export type UsageKind = "readme" | "docs" | "chat"

const PLAN_LIMITS: Record<PlanType, { readme: number; docs: number; chat: number }> = {
  [PlanType.FREE]: { readme: 3, docs: 3, chat: 5 },
  [PlanType.BASIC]: { readme: 10, docs: 10, chat: 40 },
  [PlanType.PREMIUM]: { readme: 40, docs: 40, chat: 100 },
  [PlanType.ENTERPRISE]: { readme: Number.POSITIVE_INFINITY, docs: Number.POSITIVE_INFINITY, chat: Number.POSITIVE_INFINITY },
}

const USAGE_LABEL: Record<UsageKind, string> = {
  readme: "README generations",
  docs: "documentation generations",
  chat: "chat conversations",
}

const PLAN_LABEL: Record<PlanType, string> = {
  [PlanType.FREE]: "Free",
  [PlanType.BASIC]: "Basic",
  [PlanType.PREMIUM]: "Premium",
  [PlanType.ENTERPRISE]: "Enterprise",
}

export function getPlanLimits(plan: PlanType | null | undefined) {
  if (!plan) {
    return PLAN_LIMITS[PlanType.FREE]
  }
  return PLAN_LIMITS[plan]
}

function getCurrentPeriodStart() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
}

async function getUserPlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return user.plan ?? PlanType.FREE
}

export async function ensureQuotaAvailable(userId: string, kind: UsageKind) {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)
  const limit = limits[kind]

  if (!Number.isFinite(limit)) {
    return {
      plan,
      used: 0,
      limit,
    }
  }

  const periodStart = getCurrentPeriodStart()
  const existing = await prisma.usageQuota.findUnique({
    where: {
      userId_periodStart: {
        userId,
        periodStart,
      },
    },
  })

  const used = existing
    ? kind === "readme"
      ? existing.readmeCount
      : kind === "docs"
        ? existing.docsCount
        : existing.chatCount
    : 0

  if (used >= limit) {
    const label = USAGE_LABEL[kind]
    const planName = PLAN_LABEL[plan]
    throw new Error(
      `You have reached the monthly limit for ${label} on the ${planName} plan. Please upgrade your plan to continue.`,
    )
  }

  return {
    plan,
    used,
    limit,
  }
}

export async function incrementUsage(userId: string, kind: UsageKind) {
  const periodStart = getCurrentPeriodStart()

  const updateData =
    kind === "readme"
      ? { readmeCount: { increment: 1 } }
      : kind === "docs"
        ? { docsCount: { increment: 1 } }
        : { chatCount: { increment: 1 } }

  await prisma.usageQuota.upsert({
    where: {
      userId_periodStart: {
        userId,
        periodStart,
      },
    },
    update: {
      ...updateData,
    },
    create: {
      userId,
      periodStart,
      readmeCount: kind === "readme" ? 1 : 0,
      docsCount: kind === "docs" ? 1 : 0,
      chatCount: kind === "chat" ? 1 : 0,
    },
  })
}

export async function getUsageSnapshot(userId: string) {
  const plan = await getUserPlan(userId)
  const planLimits = getPlanLimits(plan)
  const periodStart = getCurrentPeriodStart()
  const existing = await prisma.usageQuota.findUnique({
    where: {
      userId_periodStart: {
        userId,
        periodStart,
      },
    },
  })

  const limits = {
    readme: Number.isFinite(planLimits.readme) ? planLimits.readme : null,
    docs: Number.isFinite(planLimits.docs) ? planLimits.docs : null,
    chat: Number.isFinite(planLimits.chat) ? planLimits.chat : null,
  }

  return {
    plan,
    limits,
    usage: {
      readme: existing?.readmeCount ?? 0,
      docs: existing?.docsCount ?? 0,
      chat: existing?.chatCount ?? 0,
    },
    periodStart,
  }
}

