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

  initialize() {
    if (this.isInitialized) return;

    if (typeof window !== "undefined") {
      this.initializeClientMonitoring();
    } else {
      this.initializeServerMonitoring();
    }

    this.isInitialized = true;
  }

  private initializeClientMonitoring() {}

  private initializeServerMonitoring() {}

  captureError(error: Error, context?: ErrorContext) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error captured:", error, context);
    }

    if (process.env.NODE_ENV === "production") {
    }
  }

  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (
      process.env.NODE_ENV === "production" &&
      typeof window !== "undefined"
    ) {
    }
  }

  trackPageView(path: string, properties?: Record<string, any>) {
    this.trackEvent("page_view", {
      path,
      ...properties,
    });
  }

  trackPerformance(metric: PerformanceMetric) {
    if (process.env.NODE_ENV === "production") {
    }
  }

  setUserContext(userId: string, email?: string, username?: string) {
    if (process.env.NODE_ENV === "production") {
    }
  }

  clearUserContext() {
    if (process.env.NODE_ENV === "production") {
    }
  }

  addBreadcrumb(
    message: string,
    category?: string,
    data?: Record<string, any>
  ) {
    if (process.env.NODE_ENV === "production") {
    }
  }

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
        this.trackPerformance({
          name,
          duration,
          metadata: { ...metadata, error: true },
        });
        throw error;
      });
  }
}

export const monitoring = MonitoringService.getInstance();

export const captureError = (error: Error, context?: ErrorContext) => {
  monitoring.captureError(error, context);
};

export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  monitoring.trackEvent(eventName, properties);
};

export const trackPageView = (
  path: string,
  properties?: Record<string, any>
) => {
  monitoring.trackPageView(path, properties);
};

export const setUserContext = (
  userId: string,
  email?: string,
  username?: string
) => {
  monitoring.setUserContext(userId, email, username);
};

export const clearUserContext = () => {
  monitoring.clearUserContext();
};

export const addBreadcrumb = (
  message: string,
  category?: string,
  data?: Record<string, any>
) => {
  monitoring.addBreadcrumb(message, category, data);
};

export const measureAsync = <T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  return monitoring.measureAsync(name, fn, metadata);
};

monitoring.initialize();
