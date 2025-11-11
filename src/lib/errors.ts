import { logger } from "./logger";

/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', public details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT');
  }
}

export class ExternalAPIError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `${service} API error`,
      502,
      'EXTERNAL_API_ERROR'
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * Retry wrapper for async functions with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryIf?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryIf = () => true,
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt or if retryIf returns false
      if (attempt === maxRetries || !retryIf(error)) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
      
      logger.debug(`Retry attempt`, { attempt: attempt + 1, maxRetries, nextDelay: delay });
    }
  }

  throw lastError;
}

/**
 * Async timeout wrapper
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AppError(errorMessage, 408, 'TIMEOUT'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Error logger helper
 */
export function logError(error: any, context?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    code: error?.code,
    statusCode: error?.statusCode,
    ...context,
  };

  logger.error('Error captured', errorInfo);

  // In production, you would send this to a monitoring service like Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: errorInfo });
  // }
}

/**
 * Safe async handler wrapper for API routes
 */
export function asyncHandler(
  handler: (req: any, res?: any) => Promise<any>
) {
  return async (req: any, res?: any) => {
    try {
      return await handler(req, res);
    } catch (error) {
      logError(error, {
        url: req.url,
        method: req.method,
      });
      throw error;
    }
  };
}

