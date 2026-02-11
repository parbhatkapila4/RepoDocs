import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

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

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const [totalMetricsRows, byProject, recentRows] = await Promise.all([
      prisma.queryMetrics.count(),
      prisma.queryMetrics.groupBy({
        by: ["projectId"],
        _count: true,
      }),
      prisma.queryMetrics.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          projectId: true,
          routeType: true,
          createdAt: true,
          latencyMs: true,
          estimatedCostUsd: true,
          success: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalMetricsRows,
      byProject: byProject.map((row) => ({
        projectId: row.projectId,
        count: row._count,
      })),
      recentRows,
    });
  } catch (error) {
    console.error("[debug/observability]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch diagnostic data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
