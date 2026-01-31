// Error types
export { ErrorCategory, FONError } from './errors.types';

// Security types
export type { SecurityOptions, InputValidationResult } from './security.types';

// Schema types
export type {
  NormalizedSchema,
  SchemaField,
  SchemaAdapter,
  ValidationResult,
  ValidationError,
} from './schema.types';

// Mapping types
export type { MappingPlan, Assignment, Drop, Warning } from './mapping.types';

// Cache types
export type { Cache, CachedMappingPlan, CacheMetadata } from './cache.types';

// Provider types
export type {
  Provider,
  ProposalOptions,
  ProviderConfig,
  ProviderMetrics,
} from './provider.types';

// Trace types
export type {
  TraceReport,
  Timings,
  ExecutionTrace,
  AssignmentTrace,
  RejectedAssignment,
  Conflict,
  ValidationTrace,
  CacheTrace,
  ConfidenceSummary,
} from './trace.types';

// Transform types
export type { Mode, TransformOptions, TransformResult, TransformHooks } from './transform.types';
