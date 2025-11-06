/**
 * Caching layer for embeddings and queries
 * Falls back gracefully if Redis is not available
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private inMemoryCache: Map<string, CacheItem<any>>;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds
  private redisAvailable: boolean = false;

  constructor() {
    this.inMemoryCache = new Map();
    this.initializeRedis();
    
    // Cleanup expired items every 5 minutes
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  private async initializeRedis() {
    // Check if Redis environment variables are set
    if (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL) {
      try {
        // Try to initialize Redis client
        // For now, we'll use in-memory cache as fallback
        // In production, you'd use @upstash/redis or ioredis
        this.redisAvailable = false;
        console.log('Using in-memory cache (Redis not configured)');
      } catch (error) {
        console.log('Redis not available, using in-memory cache');
        this.redisAvailable = false;
      }
    }
  }

  /**
   * Generate cache key from components
   */
  private generateKey(...parts: string[]): string {
    return parts.join(':');
  }

  /**
   * Get item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Check in-memory cache
      const cached = this.inMemoryCache.get(key);
      
      if (cached) {
        const now = Date.now();
        const age = (now - cached.timestamp) / 1000; // Convert to seconds
        
        if (age < cached.ttl) {
          return cached.data as T;
        } else {
          // Expired, remove it
          this.inMemoryCache.delete(key);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set item in cache
   */
  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      this.inMemoryCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete item from cache
   */
  async delete(key: string): Promise<void> {
    try {
      this.inMemoryCache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      this.inMemoryCache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Cleanup expired items
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.inMemoryCache.entries()) {
      const age = (now - item.timestamp) / 1000;
      if (age >= item.ttl) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  /**
   * Cache embedding result
   */
  async cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    const key = this.generateKey('embedding', this.hashString(text));
    await this.set(key, embedding, 86400); // 24 hours
  }

  /**
   * Get cached embedding
   */
  async getCachedEmbedding(text: string): Promise<number[] | null> {
    const key = this.generateKey('embedding', this.hashString(text));
    return await this.get<number[]>(key);
  }

  /**
   * Cache query result
   */
  async cacheQuery(projectId: string, question: string, result: any): Promise<void> {
    const key = this.generateKey('query', projectId, this.hashString(question));
    await this.set(key, result, 1800); // 30 minutes
  }

  /**
   * Get cached query result
   */
  async getCachedQuery(projectId: string, question: string): Promise<any | null> {
    const key = this.generateKey('query', projectId, this.hashString(question));
    return await this.get(key);
  }

  /**
   * Invalidate all caches for a project
   */
  async invalidateProject(projectId: string): Promise<void> {
    // For in-memory cache, we need to iterate and delete matching keys
    for (const key of this.inMemoryCache.keys()) {
      if (key.includes(projectId)) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  /**
   * Simple string hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.inMemoryCache.size,
      redisAvailable: this.redisAvailable,
      type: this.redisAvailable ? 'redis' : 'in-memory',
    };
  }
}

// Export singleton instance
export const cache = new CacheManager();

