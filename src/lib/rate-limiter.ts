/**
 * Rate Limiting Utility
 * Protects API routes from abuse and ensures fair usage
 */

import { NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests allowed in the window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default rate limit configs for different tiers
export const RATE_LIMITS = {
  FREE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  PRO: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  ENTERPRISE: {
    windowMs: 60 * 1000,
    maxRequests: 1000,
  },
  API: {
    windowMs: 60 * 1000,
    maxRequests: 20,
  },
};

/**
 * Rate limiter middleware
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.FREE
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry or reset time passed, create new entry
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';
  
  return `ip:${ip}`;
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(resetTime: number): NextResponse {
  const resetDate = new Date(resetTime);
  
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      resetAt: resetDate.toISOString(),
    },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        'X-RateLimit-Reset': resetDate.toISOString(),
      },
    }
  );
}

/**
 * Cleanup old entries periodically
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Usage middleware for API routes
 */
export async function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMITS.API
) {
  return async (request: Request) => {
    // Get identifier
    const identifier = getRateLimitIdentifier(request);

    // Check rate limit
    const { success, remaining, resetTime } = await rateLimit(identifier, config);

    if (!success) {
      return rateLimitResponse(resetTime);
    }

    // Add rate limit headers to response
    const response = await handler(request);
    
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

    return response;
  };
}
