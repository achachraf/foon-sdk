import { Request, Response, NextFunction } from 'express';
import { FONError, ErrorCategory } from '../errors';
import { ErrorHandler } from './types';

/**
 * Default error handler for FON transformation errors
 */
export const defaultErrorHandler: ErrorHandler = (
  error: FONError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determine HTTP status code based on error category
  const statusCode = getStatusCode(error.category);

  // Build error response
  const errorResponse = {
    error: error.category,
    message: error.message,
    traceId: error.traceId,
    details: error.details,
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Map error category to HTTP status code
 */
function getStatusCode(category: ErrorCategory): number {
  switch (category) {
    case ErrorCategory.SCHEMA_LOAD_ERROR:
      return 500; // Internal server error (configuration issue)

    case ErrorCategory.PROVIDER_ERROR:
      return 502; // Bad gateway (LLM API error)

    case ErrorCategory.MAPPING_PLAN_PARSE_ERROR:
      return 502; // Bad gateway (LLM returned invalid response)

    case ErrorCategory.CONFIDENCE_TOO_LOW:
      return 400; // Bad request (input couldn't be mapped with confidence)

    case ErrorCategory.EXECUTION_ERROR:
      return 500; // Internal server error

    case ErrorCategory.VALIDATION_ERROR:
      return 400; // Bad request (output doesn't match schema)

    case ErrorCategory.SECURITY_LIMIT_EXCEEDED:
      return 413; // Payload too large

    default:
      return 500; // Internal server error
  }
}

/**
 * Create a custom error handler
 */
export function createErrorHandler(customHandler?: ErrorHandler): ErrorHandler {
  if (customHandler) {
    return customHandler;
  }
  return defaultErrorHandler;
}
