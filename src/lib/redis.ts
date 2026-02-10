import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing Upstash Redis credentials");
}

// Singleton REST client for Vercel serverless compatibility
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Acquire a distributed lock using Redis SET NX PX
 * 
 * NOTE: This is used for auxiliary locking only.
 * Job coordination is handled by Postgres lease-based locking (lockedAt/lockedBy).
 * Multiple workers can run concurrently - each processes different jobs.
 * 
 * @returns true if lock acquired, false otherwise
 */
export async function acquireLock(
  key: string,
  ttlMs: number,
  workerId: string
): Promise<boolean> {
  try {
    // SET key value NX PX ttl
    // NX = only set if not exists
    // PX = expire after ttlMs milliseconds
    const result = await redis.set(key, workerId, {
      nx: true,
      px: ttlMs,
    });
    
    return result === "OK";
  } catch (error) {
    console.error(`Failed to acquire lock ${key}:`, error);
    return false;
  }
}

/**
 * Release a distributed lock
 * Only releases if the lock is held by the specified workerId
 */
export async function releaseLock(
  key: string,
  workerId: string
): Promise<boolean> {
  try {
    // Lua script ensures atomic check-and-delete
    // Only delete if the value matches workerId
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await redis.eval(script, [key], [workerId]) as number;
    return result === 1;
  } catch (error) {
    console.error(`Failed to release lock ${key}:`, error);
    return false;
  }
}

/**
 * Check if a lock exists
 */
export async function hasLock(key: string): Promise<boolean> {
  try {
    const value = await redis.get(key);
    return value !== null;
  } catch (error) {
    console.error(`Failed to check lock ${key}:`, error);
    return false;
  }
}
