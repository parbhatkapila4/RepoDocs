/**
 * Rate limiting and cost tracking
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface CostTracker {
  apiCalls: number;
  estimatedCost: number;
  lastReset: Date;
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }>;
  private costs: Map<string, CostTracker>;

  // API costs (approximate, in USD per 1K tokens/requests)
  private readonly API_COSTS = {
    'gemini-embedding': 0.00001, // $0.00001 per embedding
    'gemini-flash': 0.00001, // $0.00001 per 1K tokens
    'openrouter-query': 0.00005, // $0.00005 per 1K tokens (varies by model)
  };

  constructor() {
    this.requests = new Map();
    this.costs = new Map();

    // Cleanup old entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Check if request is allowed under rate limit
   */
  async checkLimit(
    key: string,
    config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let entry = this.requests.get(key);

    // Create new entry if doesn't exist or window expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      this.requests.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.resetTime - now,
      };
    }

    // Increment counter
    entry.count++;

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  /**
   * Track API call cost
   */
  async trackCost(
    userId: string,
    apiType: keyof typeof this.API_COSTS,
    tokens: number = 1000
  ): Promise<void> {
    const cost = (tokens / 1000) * this.API_COSTS[apiType];

    let tracker = this.costs.get(userId);

    if (!tracker) {
      tracker = {
        apiCalls: 0,
        estimatedCost: 0,
        lastReset: new Date(),
      };
      this.costs.set(userId, tracker);
    }

    tracker.apiCalls++;
    tracker.estimatedCost += cost;
  }

  /**
   * Get cost summary for user
   */
  async getCostSummary(userId: string): Promise<CostTracker | null> {
    return this.costs.get(userId) || null;
  }

  /**
   * Reset cost tracking for user
   */
  async resetCosts(userId: string): Promise<void> {
    this.costs.delete(userId);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetTime < now) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get rate limit status
   */
  async getStatus(key: string): Promise<{
    requests: number;
    resetTime: number;
  } | null> {
    return this.requests.get(key) || null;
  }
}

// Export singleton
export const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  userId: string,
  config?: RateLimitConfig
): Promise<void> {
  const result = await rateLimiter.checkLimit(userId, config);

  if (!result.allowed) {
    const resetInSeconds = Math.ceil(result.resetIn / 1000);
    throw new Error(
      `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`
    );
  }
}

