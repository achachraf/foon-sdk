import { ErrorCategory, FONError } from '../types/errors.types';

/**
 * Create a schema load error
 */
export function createSchemaLoadError(message: string, details?: object, traceId?: string): FONError {
  return new FONError(ErrorCategory.SCHEMA_LOAD_ERROR, message, details, traceId);
}

/**
 * Create a provider error
 */
export function createProviderError(message: string, details?: object, traceId?: string): FONError {
  return new FONError(ErrorCategory.PROVIDER_ERROR, message, details, traceId);
}

/**
 * Create a mapping plan parse error
 */
export function createMappingPlanParseError(
  message: string,
  details?: object,
  traceId?: string
): FONError {
  return new FONError(ErrorCategory.MAPPING_PLAN_PARSE_ERROR, message, details, traceId);
}

/**
 * Create a confidence too low error
 */
export function createConfidenceTooLowError(
  message: string,
  details?: object,
  traceId?: string
): FONError {
  return new FONError(ErrorCategory.CONFIDENCE_TOO_LOW, message, details, traceId);
}

/**
 * Create an execution error
 */
export function createExecutionError(message: string, details?: object, traceId?: string): FONError {
  return new FONError(ErrorCategory.EXECUTION_ERROR, message, details, traceId);
}

/**
 * Create a validation error
 */
export function createValidationError(message: string, details?: object, traceId?: string): FONError {
  return new FONError(ErrorCategory.VALIDATION_ERROR, message, details, traceId);
}

/**
 * Create a security limit exceeded error
 */
export function createSecurityLimitError(
  message: string,
  details?: object,
  traceId?: string
): FONError {
  return new FONError(ErrorCategory.SECURITY_LIMIT_EXCEEDED, message, details, traceId);
}
