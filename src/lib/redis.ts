import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing Upstash Redis credentials");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function acquireLock(
  key: string,
  ttlMs: number,
  workerId: string
): Promise<boolean> {
  try {
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

export async function releaseLock(
  key: string,
  workerId: string
): Promise<boolean> {
  try {
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

export async function hasLock(key: string): Promise<boolean> {
  try {
    const value = await redis.get(key);
    return value !== null;
  } catch (error) {
    console.error(`Failed to check lock ${key}:`, error);
    return false;
  }
}
