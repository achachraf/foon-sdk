import { Request, Response, NextFunction, RequestHandler } from 'express';
import { transform } from '../transform';
import { Provider, SecurityOptions, Cache } from '../types';
import { FONError } from '../errors';
import { ErrorHandler } from './types';

/**
 * Options for transform middleware
 */
export interface TransformMiddlewareOptions {
  schema: object;
  provider: Provider;
  confidenceThreshold?: number;
  cache?: Cache;
  security?: SecurityOptions;
  traceHeader?: string;
  errorHandler: ErrorHandler;
  verbose?: boolean;
}

/**
 * Create middleware that transforms request body using FON
 */
export function createTransformMiddleware(options: TransformMiddlewareOptions): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if no body
      if (!req.body || Object.keys(req.body).length === 0) {
        return next();
      }

      // Run FON transform
      const result = await transform(req.body, {
        schema: options.schema,
        provider: options.provider,
        confidenceThreshold: options.confidenceThreshold,
        cache: options.cache,
        security: options.security,
        verbose: options.verbose,
      });

      // Add trace ID to response header
      const traceHeader = options.traceHeader || 'X-FON-Trace-Id';
      res.setHeader(traceHeader, result.trace.traceId);

      // If verbose, also add timing headers
      if (options.verbose) {
        res.setHeader('X-FON-Timing-Total', result.trace.timings.total.toString());
        res.setHeader('X-FON-Timing-Proposal', result.trace.timings.proposal.toString());
        res.setHeader('X-FON-Cache-Hit', result.trace.cache.hit ? 'true' : 'false');
      }

      // Check if transformation succeeded
      if (result.ok && result.output) {
        // Replace request body with transformed output
        req.body = result.output;

        // Attach trace to request for debugging (optional)
        (req as any).fonTrace = result.trace;

        // Continue to next middleware/handler
        return next();
      } else if (result.error) {
        // Handle transformation error
        return options.errorHandler(result.error, req, res, next);
      } else {
        // This shouldn't happen, but handle it gracefully
        const error = new FONError(
          'EXECUTION_ERROR' as any,
          'Transformation failed without error details'
        );
        return options.errorHandler(error, req, res, next);
      }
    } catch (error) {
      // Handle unexpected errors
      const fonError =
        error instanceof FONError
          ? error
          : new FONError('EXECUTION_ERROR' as any, `Unexpected error: ${error instanceof Error ? error.message : String(error)}`);

      return options.errorHandler(fonError, req, res, next);
    }
  };
}
