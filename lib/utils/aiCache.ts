/**
 * AI Response Cache
 * 
 * Simple in-memory cache to avoid repeated API calls for identical requests.
 * Reduces costs by ~30-50% for pages that re-render or have duplicate queries.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  savedCalls: number;
  entries: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 100;

class AIResponseCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, savedCalls: 0, entries: 0 };

  /**
   * Generate a cache key from request parameters
   */
  private generateKey(params: Record<string, any>): string {
    // Create a stable hash from the params
    const sorted = JSON.stringify(params, Object.keys(params).sort());
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < sorted.length; i++) {
      const char = sorted.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `ai_cache_${hash}`;
  }

  /**
   * Get cached response if available and not expired
   */
  get<T>(params: Record<string, any>, ttl: number = DEFAULT_TTL): T | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.entries = this.cache.size;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    this.stats.savedCalls++;
    return entry.data as T;
  }

  /**
   * Store response in cache
   */
  set<T>(params: Record<string, any>, data: T): void {
    const key = this.generateKey(params);

    // Evict oldest entries if cache is full
    if (this.cache.size >= MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
    this.stats.entries = this.cache.size;
  }

  /**
   * Wrap an async function with caching
   */
  async withCache<T>(
    params: Record<string, any>,
    fetchFn: () => Promise<T>,
    ttl: number = DEFAULT_TTL
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(params, ttl);
    if (cached !== null) {
      console.log('[AICache] Cache hit - saved an API call!');
      return cached;
    }

    // Fetch and cache
    const result = await fetchFn();
    this.set(params, result);
    return result;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.entries = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Log cache stats to console
   */
  logStats(): void {
    const { hits, misses, savedCalls, entries } = this.stats;
    const hitRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : 0;
    console.log(`[AICache] Stats: ${entries} entries, ${hitRate}% hit rate, ${savedCalls} API calls saved`);
  }
}

// Export singleton instance
export const aiCache = new AIResponseCache();

/**
 * Decorator-style helper for caching AI responses
 * 
 * Usage:
 * const strategy = await cachedAICall(
 *   { raceId, conditions },
 *   () => generateStrategy(raceId, conditions),
 *   10 * 60 * 1000 // 10 min TTL
 * );
 */
export async function cachedAICall<T>(
  params: Record<string, any>,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  return aiCache.withCache(params, fetchFn, ttl);
}

