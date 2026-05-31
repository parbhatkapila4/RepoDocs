import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/lib/get-db-user-id";

export const runtime = "nodejs";

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
    const projects = await prisma.project.findMany({
      where: { userId: dbUserId, deletedAt: null },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return NextResponse.json({
        totalMetricsRows: 0,
        byProject: [],
        recentRows: [],
      });
    }

    const scope = { projectId: { in: projectIds } };

    const [totalMetricsRows, byProject, recentRows] = await Promise.all([
      prisma.queryMetrics.count({ where: scope }),
      prisma.queryMetrics.groupBy({
        by: ["projectId"],
        where: scope,
        _count: true,
      }),
      prisma.queryMetrics.findMany({
        where: scope,
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
