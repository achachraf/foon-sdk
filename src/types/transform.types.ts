import { Provider, ProviderMetrics } from './provider.types';
import { SchemaAdapter } from './schema.types';
import { SecurityOptions } from './security.types';
import { Cache } from './cache.types';
import { TraceReport } from './trace.types';
import { FONError } from './errors.types';

/**
 * Transformation mode
 */
export type Mode = 'SEMANTIC';

/**
 * Transform options
 */
export interface TransformOptions {
  /** Transformation mode (default: SEMANTIC) */
  mode?: Mode;

  /** Target JSON Schema (object or SchemaAdapter instance) */
  schema: object | SchemaAdapter;

  /** LLM provider instance (required) */
  provider: Provider;

  /** Confidence threshold (default: 0.85) */
  confidenceThreshold?: number;

  /** Cache instance (optional, in-memory LRU by default) */
  cache?: Cache;

  /** Enable verbose trace output (default: false) */
  verbose?: boolean;

  /** Security options */
  security?: SecurityOptions;

  /** Optional hooks for observability */
  hooks?: TransformHooks;
}

/**
 * Transform result
 */
export interface TransformResult {
  /** Whether transformation succeeded */
  ok: boolean;

  /** Transformed output (schema-valid JSON) if successful */
  output?: unknown;

  /** Error if transformation failed */
  error?: FONError;

  /** Trace report (always present) */
  trace: TraceReport;
}

/**
 * Hooks for observability
 */
export interface TransformHooks {
  /** Called when trace is complete */
  onTrace?: (trace: TraceReport) => void;

  /** Called on error */
  onError?: (error: FONError, traceId: string) => void;

  /** Called after provider request */
  onProviderCall?: (metrics: ProviderMetrics) => void;
}
