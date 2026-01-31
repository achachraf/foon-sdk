import { Request, Response, NextFunction, RequestHandler, Router } from 'express';
import { Provider, SecurityOptions, Cache } from '../types';
import { FONError } from '../errors';

/**
 * HTTP methods supported for FON transformation
 */
export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Configuration for FON Router
 */
export interface FonRouterConfig {
  /** LLM provider instance (required) */
  provider: Provider;

  /** Route prefix for FON routes (default: '/foon') */
  prefix?: string;

  /** HTTP methods to transform (default: ['POST', 'PUT', 'PATCH']) */
  methods?: HttpMethod[];

  /** Confidence threshold (default: 0.85) */
  confidenceThreshold?: number;

  /** Cache instance (optional) */
  cache?: Cache;

  /** Security options */
  security?: SecurityOptions;

  /** Header name for trace ID (default: 'X-FON-Trace-Id') */
  traceHeader?: string;

  /** Custom error handler */
  onError?: ErrorHandler;

  /** Create original routes alongside FON routes (default: true) */
  createOriginalRoutes?: boolean;

  /** Verbose mode for debugging (default: false) */
  verbose?: boolean;
}

/**
 * Configuration for a single route
 */
export interface RouteConfig {
  /** JSON Schema for this route */
  schema: object;

  /** Express request handler */
  handler: RequestHandler | RequestHandler[];

  /** Override: create original route for this specific route */
  createOriginal?: boolean;

  /** Override: confidence threshold for this specific route */
  confidenceThreshold?: number;
}

/**
 * Error handler function
 */
export type ErrorHandler = (
  error: FONError,
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Route registration entry
 */
export interface RouteEntry {
  method: HttpMethod;
  path: string;
  schema: object;
  handler: RequestHandler | RequestHandler[];
  config: RouteConfig;
}

/**
 * FON Router interface
 */
export interface IFonRouter {
  /** Register POST route with schema */
  post(path: string, config: RouteConfig): this;

  /** Register PUT route with schema */
  put(path: string, config: RouteConfig): this;

  /** Register PATCH route with schema */
  patch(path: string, config: RouteConfig): this;

  /** Register DELETE route with schema */
  delete(path: string, config: RouteConfig): this;
}
