/**
 * Monitoring and analytics utilities
 * Provides logging, error tracking, and performance monitoring
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ErrorLog {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class MonitoringService {
  private performanceMetrics: PerformanceMetric[] = [];
  private errorLogs: ErrorLog[] = [];
  private readonly MAX_METRICS = 1000;
  private readonly MAX_ERRORS = 500;

  /**
   * Start performance timer
   */
  startTimer(name: string): () => void {
    const start = performance.now();
    
    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - start;
      this.logPerformance(name, duration, metadata);
    };
  }

  /**
   * Log performance metric
   */
  private logPerformance(
    name: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.performanceMetrics.push(metric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics.shift();
    }

    // Log slow operations
    if (duration > 5000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, DataDog, New Relic, etc.
      // this.sendToMonitoringService(metric);
    }
  }

  /**
   * Log error with context
   */
  logError(
    error: Error | string,
    severity: ErrorLog['severity'] = 'medium',
    context?: Record<string, any>
  ): void {
    const errorLog: ErrorLog = {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date(),
      severity,
    };

    this.errorLogs.push(errorLog);

    // Keep only recent errors
    if (this.errorLogs.length > this.MAX_ERRORS) {
      this.errorLogs.shift();
    }

    // Console log based on severity
    const logMethod = severity === 'critical' || severity === 'high' 
      ? console.error 
      : console.warn;

    logMethod(`[${severity.toUpperCase()}]`, errorLog.message, context || '');

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry
      // Sentry.captureException(error, { extra: context, level: severity });
    }
  }

  /**
   * Track API usage
   */
  async trackAPIUsage(
    endpoint: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const usage = {
      endpoint,
      userId,
      timestamp: new Date(),
      ...metadata,
    };

    // Log for analytics
    console.log('[API Usage]', usage);

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to PostHog, Mixpanel, etc.
      // analytics.track('api_usage', usage);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(name?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = name
      ? this.performanceMetrics.filter(m => m.name === name)
      : this.performanceMetrics;

    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    
    return {
      count: metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorLog['severity'], number>;
    recent: ErrorLog[];
  } {
    const bySeverity = this.errorLogs.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorLog['severity'], number>);

    return {
      total: this.errorLogs.length,
      bySeverity,
      recent: this.errorLogs.slice(-10),
    };
  }

  /**
   * Clear all metrics and logs
   */
  clear(): void {
    this.performanceMetrics = [];
    this.errorLogs = [];
  }

  /**
   * Health check
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      errors: { status: string; recentErrors: number };
      performance: { status: string; avgLatency: number };
      memory: { status: string; usage: number };
    };
  } {
    const recentErrors = this.errorLogs.filter(
      e => Date.now() - e.timestamp.getTime() < 60000 // Last minute
    );

    const recentMetrics = this.performanceMetrics.filter(
      m => Date.now() - m.timestamp.getTime() < 60000 // Last minute
    );

    const avgLatency = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0;

    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    const errorStatus = recentErrors.length > 10 ? 'unhealthy' : recentErrors.length > 5 ? 'degraded' : 'healthy';
    const perfStatus = avgLatency > 5000 ? 'unhealthy' : avgLatency > 2000 ? 'degraded' : 'healthy';
    const memoryStatus = memoryUsage > 500 ? 'unhealthy' : memoryUsage > 300 ? 'degraded' : 'healthy';

    const overallStatus = 
      errorStatus === 'unhealthy' || perfStatus === 'unhealthy' || memoryStatus === 'unhealthy'
        ? 'unhealthy'
        : errorStatus === 'degraded' || perfStatus === 'degraded' || memoryStatus === 'degraded'
        ? 'degraded'
        : 'healthy';

    return {
      status: overallStatus,
      checks: {
        errors: { status: errorStatus, recentErrors: recentErrors.length },
        performance: { status: perfStatus, avgLatency },
        memory: { status: memoryStatus, usage: memoryUsage },
      },
    };
  }
}

// Export singleton
export const monitoring = new MonitoringService();

/**
 * Helper function to wrap async functions with monitoring
 */
export function withMonitoring<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const stopTimer = monitoring.startTimer(name);
    
    try {
      const result = await fn(...args);
      stopTimer({ success: true });
      return result;
    } catch (error) {
      stopTimer({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      monitoring.logError(error as Error, 'high', { function: name, args });
      throw error;
    }
  }) as T;
}

