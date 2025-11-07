/**
 * Monitoring and Error Tracking Utilities
 * Centralized error handling, logging, and performance monitoring
 */

interface ErrorContext {
  userId?: string;
  projectId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Initialize monitoring services (Sentry, Analytics, etc.)
   */
  initialize() {
    if (this.isInitialized) return;

    if (typeof window !== 'undefined') {
      // Client-side monitoring
      this.initializeClientMonitoring();
    } else {
      // Server-side monitoring
      this.initializeServerMonitoring();
    }

    this.isInitialized = true;
  }

  private initializeClientMonitoring() {
    // Initialize Sentry for client
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry initialization would go here
      console.log('Client monitoring initialized');
    }

    // Initialize analytics
    if (process.env.NEXT_PUBLIC_ANALYTICS_KEY) {
      console.log('Analytics initialized');
    }
  }

  private initializeServerMonitoring() {
    // Initialize server-side monitoring
    console.log('Server monitoring initialized');
  }

  /**
   * Capture an error with context
   */
  captureError(error: Error, context?: ErrorContext) {
    console.error('Error captured:', error, context);

    // In production, send to Sentry
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { contexts: { custom: context } });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Details');
      console.error('Error:', error);
      console.log('Context:', context);
      console.groupEnd();
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>) {
    console.log('Event tracked:', eventName, properties);

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Analytics tracking would go here
      // posthog.capture(eventName, properties);
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, properties?: Record<string, any>) {
    this.trackEvent('page_view', {
      path,
      ...properties,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: PerformanceMetric) {
    console.log('Performance metric:', metric);

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Performance tracking would go here
    }
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, email?: string, username?: string) {
    console.log('User context set:', { userId, email, username });

    // Set in Sentry
    if (process.env.NODE_ENV === 'production') {
      // Sentry.setUser({ id: userId, email, username });
    }
  }

  /**
   * Clear user context
   */
  clearUserContext() {
    console.log('User context cleared');

    if (process.env.NODE_ENV === 'production') {
      // Sentry.setUser(null);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
    console.log('Breadcrumb:', { message, category, data });

    if (process.env.NODE_ENV === 'production') {
      // Sentry.addBreadcrumb({ message, category, data });
    }
  }

  /**
   * Measure function execution time
   */
  measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();

    return fn()
      .then((result) => {
        const duration = Date.now() - startTime;
        this.trackPerformance({ name, duration, metadata });
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.trackPerformance({ name, duration, metadata: { ...metadata, error: true } });
        throw error;
      });
  }
}

export const monitoring = MonitoringService.getInstance();

// Utility functions for common operations
export const captureError = (error: Error, context?: ErrorContext) => {
  monitoring.captureError(error, context);
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  monitoring.trackEvent(eventName, properties);
};

export const trackPageView = (path: string, properties?: Record<string, any>) => {
  monitoring.trackPageView(path, properties);
};

export const setUserContext = (userId: string, email?: string, username?: string) => {
  monitoring.setUserContext(userId, email, username);
};

export const clearUserContext = () => {
  monitoring.clearUserContext();
};

export const addBreadcrumb = (message: string, category?: string, data?: Record<string, any>) => {
  monitoring.addBreadcrumb(message, category, data);
};

export const measureAsync = <T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  return monitoring.measureAsync(name, fn, metadata);
};

// Initialize monitoring on import
monitoring.initialize();
