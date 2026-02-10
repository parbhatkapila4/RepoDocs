interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private inMemoryCache: Map<string, CacheItem<any>>;
  private readonly DEFAULT_TTL = 3600;
  private redisAvailable: boolean = false;

  constructor() {
    this.inMemoryCache = new Map();
    this.initializeRedis();

    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  private async initializeRedis() {
    if (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL) {
      try {
        this.redisAvailable = false;
      } catch (error) {
        this.redisAvailable = false;
      }
    }
  }

  private generateKey(...parts: string[]): string {
    return parts.join(":");
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = this.inMemoryCache.get(key);

      if (cached) {
        const now = Date.now();
        const age = (now - cached.timestamp) / 1000;

        if (age < cached.ttl) {
          return cached.data as T;
        } else {
          this.inMemoryCache.delete(key);
        }
      }

      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set<T>(
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      this.inMemoryCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.inMemoryCache.delete(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  async clear(): Promise<void> {
    try {
      this.inMemoryCache.clear();
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.inMemoryCache.entries()) {
      const age = (now - item.timestamp) / 1000;
      if (age >= item.ttl) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  async cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    const key = this.generateKey("embedding", this.hashString(text));
    await this.set(key, embedding, 86400); 
  }

  async getCachedEmbedding(text: string): Promise<number[] | null> {
    const key = this.generateKey("embedding", this.hashString(text));
    return await this.get<number[]>(key);
  }

  async cacheQuery(
    projectId: string,
    question: string,
    result: any
  ): Promise<void> {
    const key = this.generateKey("query", projectId, this.hashString(question));
    await this.set(key, result, 1800); 
  }

  async getCachedQuery(
    projectId: string,
    question: string
  ): Promise<any | null> {
    const key = this.generateKey("query", projectId, this.hashString(question));
    return await this.get(key);
  }

  async invalidateProject(projectId: string): Promise<void> {
    for (const key of this.inMemoryCache.keys()) {
      if (key.includes(projectId)) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  getStats() {
    return {
      size: this.inMemoryCache.size,
      redisAvailable: this.redisAvailable,
      type: this.redisAvailable ? "redis" : "in-memory",
    };
  }
}

export const cache = new CacheManager();
