import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cacheStats = cache.getStats();

    let dbStatus = "healthy";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = "unhealthy";
    }

    const overallStatus = dbStatus === "healthy" ? "healthy" : "unhealthy";

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: { status: dbStatus },
        cache: { status: "healthy", ...cacheStats },
      },
    };

    const statusCode = overallStatus === "healthy" ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
