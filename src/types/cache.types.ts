import { MappingPlan } from './mapping.types';

/**
 * Cache interface for mapping plans
 */
export interface Cache {
  /** Get cached mapping plan */
  get(key: string): Promise<CachedMappingPlan | null>;

  /** Store mapping plan in cache */
  set(key: string, value: CachedMappingPlan, ttl?: number): Promise<void>;

  /** Check if key exists in cache */
  has(key: string): Promise<boolean>;

  /** Delete a cached entry */
  delete(key: string): Promise<boolean>;

  /** Clear all cached entries */
  clear(): Promise<void>;
}

/**
 * Cached mapping plan with metadata
 */
export interface CachedMappingPlan {
  /** The mapping plan */
  mappingPlan: MappingPlan;

  /** Metadata about the cached entry */
  metadata: CacheMetadata;
}

/**
 * Metadata stored with cached mapping plan
 */
export interface CacheMetadata {
  /** Timestamp when cached */
  createdAt: number;

  /** Provider name that generated the plan */
  provider: string;

  /** Prompt version used */
  promptVersion: string;

  /** Schema version/hash */
  schemaVersion: string;

  /** Input shape signature (hash of keys + structure) */
  inputSignature: string;
}
