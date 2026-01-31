/**
 * Mapping plan returned by LLM provider
 * This is the core data structure that drives transformation
 */
export interface MappingPlan {
  /** Field assignments from input to target schema */
  assignments: Assignment[];

  /** Fields to drop (not in schema) */
  drops: Drop[];

  /** Warnings about potential issues */
  warnings: Warning[];
}

/**
 * Single field mapping assignment
 */
export interface Assignment {
  /** Source JSONPath in input */
  from: string;

  /** Target JSONPath in output */
  to: string;

  /** Confidence score (0..1) */
  confidence: number;

  /** Optional type transformation hint */
  transform?: string;
}

/**
 * Field to be dropped
 */
export interface Drop {
  /** JSONPath of dropped field */
  path: string;

  /** Reason for dropping */
  reason: string;

  /** Confidence in drop decision */
  confidence: number;
}

/**
 * Warning about input data
 */
export interface Warning {
  /** Warning message */
  message: string;

  /** Confidence in warning */
  confidence: number;

  /** Optional context */
  context?: string;
}
