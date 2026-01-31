/**
 * Normalized schema representation
 */
export interface NormalizedSchema {
  /** Schema version or hash for cache key generation */
  version: string;

  /** List of all fields in the schema */
  fields: SchemaField[];

  /** Original JSON Schema object */
  raw: object;
}

/**
 * Individual field in normalized schema
 */
export interface SchemaField {
  /** JSONPath to the field (e.g., "$.name.given") */
  path: string;

  /** JSON Schema type(s) */
  type: string | string[];

  /** Whether field is required */
  required: boolean;

  /** Field description (helps LLM mapping) */
  description?: string;

  /** Format constraint (e.g., "email", "date-time") */
  format?: string;

  /** Enum values if applicable */
  enum?: unknown[];

  /** Default value if applicable */
  default?: unknown;

  /** Additional schema properties */
  [key: string]: unknown;
}

/**
 * Schema adapter interface
 */
export interface SchemaAdapter {
  /** Get the normalized schema */
  getNormalizedSchema(): NormalizedSchema;

  /** List all fields */
  listFields(): SchemaField[];

  /** Get a specific field by path */
  getField(path: string): SchemaField | undefined;

  /** Check if a path is required */
  isRequired(path: string): boolean;

  /** Validate a payload against the schema */
  validate(payload: unknown): ValidationResult;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Individual validation error
 */
export interface ValidationError {
  /** JSONPath where error occurred */
  path: string;

  /** Error message */
  message: string;

  /** AJV keyword that failed */
  keyword?: string;

  /** Additional error parameters */
  params?: object;
}
