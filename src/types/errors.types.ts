/**
 * Error categories for FOON SDK errors
 */
export enum ErrorCategory {
  SCHEMA_LOAD_ERROR = 'SCHEMA_LOAD_ERROR',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  MAPPING_PLAN_PARSE_ERROR = 'MAPPING_PLAN_PARSE_ERROR',
  CONFIDENCE_TOO_LOW = 'CONFIDENCE_TOO_LOW',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SECURITY_LIMIT_EXCEEDED = 'SECURITY_LIMIT_EXCEEDED',
}

/**
 * Base error class for all FOON SDK errors
 */
export class FONError extends Error {
  constructor(
    public category: ErrorCategory,
    message: string,
    public details?: object,
    public traceId?: string
  ) {
    super(message);
    this.name = 'FONError';
    Object.setPrototypeOf(this, FONError.prototype);
  }
}
