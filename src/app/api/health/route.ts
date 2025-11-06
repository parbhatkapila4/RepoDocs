import { NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring';
import prisma from '@/lib/prisma';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  try {
    const healthStatus = monitoring.getHealthStatus();
    const perfStats = monitoring.getPerformanceStats();
    const errorStats = monitoring.getErrorStats();
    const cacheStats = cache.getStats();

    // Check database connection
    let dbStatus = 'healthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'unhealthy';
      healthStatus.status = 'unhealthy';
    }

    const response = {
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        ...healthStatus.checks,
        database: { status: dbStatus },
        cache: { status: 'healthy', ...cacheStats },
      },
      metrics: {
        performance: perfStats,
        errors: {
          total: errorStats.total,
          bySeverity: errorStats.bySeverity,
        },
      },
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

