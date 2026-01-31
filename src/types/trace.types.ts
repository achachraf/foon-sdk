import { Assignment, Drop, Warning, MappingPlan } from './mapping.types';
import { ValidationError } from './schema.types';

/**
 * Complete trace report for a transformation
 */
export interface TraceReport {
  /** Unique trace ID */
  traceId: string;

  /** Transformation mode */
  mode: 'SEMANTIC';

  /** Provider used */
  provider: string;

  /** Prompt version */
  promptVersion: string;

  /** Timing information */
  timings: Timings;

  /** Mapping plan (raw and parsed) */
  mappingPlan: {
    raw: string;
    parsed: MappingPlan;
  };

  /** Execution details */
  execution: ExecutionTrace;

  /** Validation details */
  validation: ValidationTrace;

  /** Cache details */
  cache: CacheTrace;

  /** Confidence statistics */
  confidenceSummary: ConfidenceSummary;
}

/**
 * Timing breakdown
 */
export interface Timings {
  /** Total transformation time (ms) */
  total: number;

  /** Time to get mapping plan (ms) */
  proposal: number;

  /** Time to execute plan (ms) */
  execution: number;

  /** Time to validate output (ms) */
  validation: number;
}

/**
 * Execution trace details
 */
export interface ExecutionTrace {
  /** Successfully applied assignments */
  assignmentsApplied: AssignmentTrace[];

  /** Rejected assignments */
  assignmentsRejected: RejectedAssignment[];

  /** Fields that were dropped */
  droppedFields: Drop[];

  /** Warnings generated */
  warnings: Warning[];

  /** Conflicts detected */
  conflicts: Conflict[];
}

/**
 * Trace of a single applied assignment
 */
export interface AssignmentTrace {
  /** The assignment */
  assignment: Assignment;

  /** Value from source */
  fromValue: unknown;

  /** Value written to target */
  toValue: unknown;

  /** Whether type transformation was applied */
  transformed: boolean;
}

/**
 * Rejected assignment details
 */
export interface RejectedAssignment {
  /** The rejected assignment */
  assignment: Assignment;

  /** Reason for rejection */
  reason: 'CONFIDENCE_TOO_LOW' | 'INVALID_PATH' | 'TYPE_MISMATCH';

  /** Additional details */
  details?: string;
}

/**
 * Mapping conflict
 */
export interface Conflict {
  /** Target path with conflict */
  targetPath: string;

  /** Source paths causing conflict */
  sources: string[];

  /** How conflict was resolved */
  resolution: 'FIRST_WINS' | 'LAST_WINS' | 'FAILED';
}

/**
 * Validation trace
 */
export interface ValidationTrace {
  /** Whether validation succeeded */
  success: boolean;

  /** Validation errors if any */
  errors: ValidationError[];
}

/**
 * Cache trace
 */
export interface CacheTrace {
  /** Whether cache was hit */
  hit: boolean;

  /** Cache key used */
  key: string;

  /** TTL if cache was set */
  ttl?: number;
}

/**
 * Confidence statistics summary
 */
export interface ConfidenceSummary {
  /** Minimum confidence in applied assignments */
  min: number;

  /** Maximum confidence in applied assignments */
  max: number;

  /** Average confidence in applied assignments */
  avg: number;

  /** Number of assignments below threshold */
  countBelowThreshold: number;

  /** Configured threshold */
  threshold: number;
}
