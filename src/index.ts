// Main transform function
export { transform } from './transform';

// Types
export type {
  // Transform types
  Mode,
  TransformOptions,
  TransformResult,
  TransformHooks,
  // Schema types
  SchemaAdapter,
  NormalizedSchema,
  SchemaField,
  ValidationResult,
  ValidationError,
  // Mapping types
  MappingPlan,
  Assignment,
  Drop,
  Warning,
  // Provider types
  Provider,
  ProviderConfig,
  ProviderMetrics,
  ProposalOptions,
  // Cache types
  Cache,
  CachedMappingPlan,
  CacheMetadata,
  // Trace types
  TraceReport,
  Timings,
  ExecutionTrace,
  AssignmentTrace,
  RejectedAssignment,
  Conflict,
  ValidationTrace,
  CacheTrace,
  ConfidenceSummary,
  // Security types
  SecurityOptions,
  InputValidationResult,
} from './types';

// Error types and classes
export { FONError, ErrorCategory } from './errors';

// Providers
export { GeminiProvider } from './providers/gemini';
export { OpenAIProvider } from './providers/openai';
export { OllamaProvider } from './providers/ollama';
export { Provider as BaseProvider } from './providers/base/Provider';

// Schema adapter (for advanced usage)
export { SchemaAdapter as SchemaAdapterClass } from './schema';

// Cache implementations
export { LRUCache } from './cache';

// Engine (for advanced usage)
export { MappingEngine } from './engine/MappingEngine';
