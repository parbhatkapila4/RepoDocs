import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

let redis: Redis | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.error("[rate-limiter] Failed to init Upstash client:", error);
    redis = null;
  }
}

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

function inMemoryRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetTime: number } {
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
    return { success: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  rateLimitStore.set(identifier, entry);
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.FREE
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  if (redis) {
    try {
      const now = Date.now();
      const windowSec = Math.ceil(config.windowMs / 1000);
      const bucket = Math.floor(now / config.windowMs);
      const key = `rl:${identifier}:${bucket}`;
      const resetTime = (bucket + 1) * config.windowMs;

      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSec);
      }

      if (count > config.maxRequests) {
        return { success: false, remaining: 0, resetTime };
      }
      return {
        success: true,
        remaining: Math.max(0, config.maxRequests - count),
        resetTime,
      };
    } catch (error) {
      console.error("[rate-limiter] Redis error, falling back:", error);
    }
  }

  return inMemoryRateLimit(identifier, config);
}

export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  const realIp = request.headers.get("x-real-ip");
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    (realIp && realIp.trim()) ||
    (forwarded ? forwarded.split(",")[0].trim() : "") ||
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
