import { LRUCache as LRU } from 'lru-cache';
import { Cache as ICache, CachedMappingPlan } from '../types';

/**
 * LRU Cache implementation
 */
export class LRUCache implements ICache {
  private cache: LRU<string, CachedMappingPlan>;

  constructor(options: { max?: number; ttl?: number } = {}) {
    this.cache = new LRU<string, CachedMappingPlan>({
      max: options.max || 100, // Default: 100 entries
      ttl: options.ttl || 1000 * 60 * 60, // Default: 1 hour
    });
  }

  /**
   * Get cached mapping plan
   */
  async get(key: string): Promise<CachedMappingPlan | null> {
    const value = this.cache.get(key);
    return value || null;
  }

  /**
   * Store mapping plan in cache
   */
  async set(key: string, value: CachedMappingPlan, ttl?: number): Promise<void> {
    this.cache.set(key, value, { ttl });
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  /**
   * Delete entry
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}
