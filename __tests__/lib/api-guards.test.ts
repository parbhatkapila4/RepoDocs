jest.mock("@clerk/nextjs/server", () => ({ auth: jest.fn() }));
jest.mock("@/lib/get-db-user-id", () => ({ getDbUserId: jest.fn() }));
jest.mock("@/lib/rate-limiter", () => {
  const { NextResponse } = jest.requireActual("next/server");
  return {
    rateLimit: jest.fn(),
    getRateLimitIdentifier: jest.fn(() => "id-1"),
    rateLimitResponse: jest.fn(() =>
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
    ),
    RATE_LIMITS: { API: { requests: 20, windowMs: 60_000 } },
  };
});
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    project: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
    queryMetrics: { aggregate: jest.fn() },
  },
}));

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";
import { rateLimit } from "@/lib/rate-limiter";
import {
  isGuardFailure,
  requireAuthAndRateLimit,
  requireOwnedProjectWithinBudget,
  requirePaidPlan,
} from "@/lib/api-guards";
import { isProjectOverBudget } from "@/lib/budget";

const authMock = auth as unknown as jest.Mock;
const getDbUserIdMock = getDbUserId as jest.Mock;
const rateLimitMock = rateLimit as jest.Mock;
const projectFindFirst = prisma.project.findFirst as jest.Mock;
const userFindUnique = prisma.user.findUnique as jest.Mock;
const metricsAggregate = prisma.queryMetrics.aggregate as jest.Mock;

const req = new NextRequest("http://localhost/api/test");

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: "clerk-1" });
  getDbUserIdMock.mockResolvedValue("db-1");
  rateLimitMock.mockResolvedValue({ success: true });
});

describe("requireAuthAndRateLimit", () => {
  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    const result = await requireAuthAndRateLimit(req);
    expect(isGuardFailure(result)).toBe(true);
    if (isGuardFailure(result)) expect(result.response.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    rateLimitMock.mockResolvedValue({ success: false, resetTime: Date.now() });
    const result = await requireAuthAndRateLimit(req);
    expect(isGuardFailure(result)).toBe(true);
    if (isGuardFailure(result)) expect(result.response.status).toBe(429);
  });

  it("passes ids through when every gate clears", async () => {
    const result = await requireAuthAndRateLimit(req);
    expect(isGuardFailure(result)).toBe(false);
    if (!isGuardFailure(result)) {
      expect(result).toEqual({ userId: "clerk-1", dbUserId: "db-1" });
    }
  });
});

describe("requireOwnedProjectWithinBudget", () => {
  it("returns 404 for a project the user does not own", async () => {
    projectFindFirst.mockResolvedValue(null);
    const result = await requireOwnedProjectWithinBudget("p-1", "db-1");
    expect(isGuardFailure(result)).toBe(true);
    if (isGuardFailure(result)) expect(result.response.status).toBe(404);
  });

  it("returns 402 when the rolling spend has hit the configured cap", async () => {
    projectFindFirst.mockResolvedValue({
      id: "p-1",
      monthlyCostLimitUsd: 5,
    });
    metricsAggregate.mockResolvedValue({ _sum: { estimatedCostUsd: 5.01 } });
    const result = await requireOwnedProjectWithinBudget("p-1", "db-1");
    expect(isGuardFailure(result)).toBe(true);
    if (isGuardFailure(result)) {
      expect(result.response.status).toBe(402);
      const body = await result.response.json();
      expect(body.error).toBe("Budget exceeded");
    }
  });

  it("returns the project when spend is under the cap", async () => {
    projectFindFirst.mockResolvedValue({ id: "p-1", monthlyCostLimitUsd: 5 });
    metricsAggregate.mockResolvedValue({ _sum: { estimatedCostUsd: 1.2 } });
    const result = await requireOwnedProjectWithinBudget("p-1", "db-1");
    expect(isGuardFailure(result)).toBe(false);
  });
});

describe("isProjectOverBudget", () => {
  it("never queries when no cap is configured", async () => {
    await expect(isProjectOverBudget("p-1", null)).resolves.toBe(false);
    expect(metricsAggregate).not.toHaveBeenCalled();
  });

  it("fails open if the metrics query throws", async () => {
    metricsAggregate.mockRejectedValue(new Error("db down"));
    await expect(isProjectOverBudget("p-1", 5)).resolves.toBe(false);
  });
});

describe("requirePaidPlan", () => {
  it("returns 402 upgrade_required for starter plans", async () => {
    userFindUnique.mockResolvedValue({ plan: "starter" });
    const result = await requirePaidPlan("db-1", "indexing");
    expect(isGuardFailure(result)).toBe(true);
    if (isGuardFailure(result)) {
      expect(result.response.status).toBe(402);
      const body = await result.response.json();
      expect(body.reason).toBe("upgrade_required");
      expect(body.feature).toBe("indexing");
    }
  });

  it("normalizes plan aliases and lets paid plans through", async () => {
    userFindUnique.mockResolvedValue({ plan: "pro" });
    const result = await requirePaidPlan("db-1", "chat");
    expect(isGuardFailure(result)).toBe(false);
    if (!isGuardFailure(result)) expect(result.plan).toBe("professional");
  });
});
