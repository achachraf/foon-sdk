import { MappingPlan } from './mapping.types';
import { NormalizedSchema } from './schema.types';
import { SecurityOptions } from './security.types';

/**
 * Provider interface for LLM integration
 */
export interface Provider {
  /** Provider name (e.g., "gemini", "openai") */
  readonly name: string;

  /** Prompt version for cache key */
  readonly promptVersion: string;

  /**
   * Generate a mapping plan from input to schema
   */
  proposeMappingPlan(
    input: unknown,
    schema: NormalizedSchema,
    options: ProposalOptions
  ): Promise<MappingPlan>;
}

/**
 * Options for mapping plan proposal
 */
export interface ProposalOptions {
  /** Confidence threshold to inform the LLM */
  confidenceThreshold: number;

  /** Security settings */
  security: SecurityOptions;

  /** Optional schema description for context */
  schemaDescription?: string;
}

/**
 * Base provider configuration
 */
export interface ProviderConfig {
  /** API key for the provider (optional for local providers like Ollama) */
  apiKey?: string;

  /** Model name/ID (provider-specific) */
  model?: string;

  /** Base URL for API (optional, uses provider default) */
  baseUrl?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Max retries for network errors (default: 3, not for LLM failures) */
  maxRetries?: number;
}

/**
 * Provider metrics for observability
 */
export interface ProviderMetrics {
  /** Provider name */
  provider: string;

  /** Model used */
  model: string;

  /** Request duration in ms */
  duration: number;

  /** Token usage if available */
  tokens?: {
    input: number;
    output: number;
    total: number;
  };

  /** Whether request hit cache */
  cached: boolean;
}
