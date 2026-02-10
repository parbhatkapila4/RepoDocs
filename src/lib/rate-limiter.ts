import { NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const RATE_LIMITS = {
  FREE: {
    windowMs: 60 * 1000,
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

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.FREE
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

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

  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `ip:${ip}`;
}

export function rateLimitResponse(resetTime: number): NextResponse {
  const resetDate = new Date(resetTime);

  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
      resetAt: resetDate.toISOString(),
    },
    {
      status: 429,
      headers: {
        "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
        "X-RateLimit-Reset": resetDate.toISOString(),
      },
    }
  );
}

export function cleanupRateLimitStore() {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

export async function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMITS.API
) {
  return async (request: Request) => {
    const identifier = getRateLimitIdentifier(request);

    const { success, remaining, resetTime } = await rateLimit(
      identifier,
      config
    );

    if (!success) {
      return rateLimitResponse(resetTime);
    }

    const response = await handler(request);

    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(resetTime).toISOString()
    );

    return response;
  };
}
