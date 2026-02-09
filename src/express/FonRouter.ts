import { Router, RequestHandler } from 'express';
import { FonRouterConfig, RouteConfig, HttpMethod, IFonRouter } from './types';
import { RouteRegistry } from './route-registry';
import { createTransformMiddleware } from './transform-middleware';
import { createErrorHandler } from './error-handler';

/**
 * FOON Router - Express router wrapper that creates FOON-enabled routes
 */
export class FonRouter {
  private router: Router;
  private registry: RouteRegistry;
  private config: Required<Omit<FonRouterConfig, 'onError' | 'cache'>> &
    Pick<FonRouterConfig, 'onError' | 'cache'>;
  private errorHandler: ReturnType<typeof createErrorHandler>;

  constructor(config: FonRouterConfig) {
    this.router = Router();
    this.registry = new RouteRegistry();
    this.errorHandler = createErrorHandler(config.onError);

    // Set defaults
    this.config = {
      provider: config.provider,
      prefix: config.prefix || '/foon',
      methods: config.methods || ['POST', 'PUT', 'PATCH'],
      confidenceThreshold: config.confidenceThreshold || 0.85,
      cache: config.cache,
      security: config.security || {},
      traceHeader: config.traceHeader || 'X-FON-Trace-Id',
      onError: config.onError,
      createOriginalRoutes: config.createOriginalRoutes !== false, // Default true
      verbose: config.verbose || false,
    };
  }

  /**
   * Register a POST route
   */
  post(path: string, config: RouteConfig): this {
    this.registerRoute('POST', path, config);
    return this;
  }

  /**
   * Register a PUT route
   */
  put(path: string, config: RouteConfig): this {
    this.registerRoute('PUT', path, config);
    return this;
  }

  /**
   * Register a PATCH route
   */
  patch(path: string, config: RouteConfig): this {
    this.registerRoute('PATCH', path, config);
    return this;
  }

  /**
   * Register a DELETE route
   */
  delete(path: string, config: RouteConfig): this {
    this.registerRoute('DELETE', path, config);
    return this;
  }

  /**
   * Internal method to register a route
   */
  private registerRoute(method: HttpMethod, path: string, config: RouteConfig): void {
    // Check if method is supported
    if (!this.config.methods.includes(method)) {
      console.warn(
        `Method ${method} is not in configured methods list. Skipping FOON route creation.`
      );

      // Still create original route if requested
      if (this.shouldCreateOriginal(config)) {
        this.createOriginalRoute(method, path, config.handler);
      }
      return;
    }

    // Register in registry
    this.registry.register({
      method,
      path,
      schema: config.schema,
      handler: config.handler,
      config,
    });

    // Create original route (if enabled)
    if (this.shouldCreateOriginal(config)) {
      this.createOriginalRoute(method, path, config.handler);
    }

    // Create FOON route (prefixed)
    this.createFonRoute(method, path, config);
  }

  /**
   * Check if original route should be created
   */
  private shouldCreateOriginal(config: RouteConfig): boolean {
    // Route-specific override takes precedence
    if (config.createOriginal !== undefined) {
      return config.createOriginal;
    }
    // Fall back to global config
    return this.config.createOriginalRoutes;
  }

  /**
   * Create original route (without FOON transformation)
   */
  private createOriginalRoute(
    method: HttpMethod,
    path: string,
    handler: RequestHandler | RequestHandler[]
  ): void {
    const methodLower = method.toLowerCase() as 'post' | 'put' | 'patch' | 'delete';

    if (Array.isArray(handler)) {
      this.router[methodLower](path, ...handler);
    } else {
      this.router[methodLower](path, handler);
    }
  }

  /**
   * Create FOON route (with transformation)
   */
  private createFonRoute(method: HttpMethod, path: string, config: RouteConfig): void {
    const methodLower = method.toLowerCase() as 'post' | 'put' | 'patch' | 'delete';
    const fonPath = this.config.prefix + path;

    // Create transform middleware
    const transformMiddleware = createTransformMiddleware({
      schema: config.schema,
      provider: this.config.provider,
      confidenceThreshold: config.confidenceThreshold || this.config.confidenceThreshold,
      cache: this.config.cache,
      security: this.config.security,
      traceHeader: this.config.traceHeader,
      errorHandler: this.errorHandler,
      verbose: this.config.verbose,
    });

    // Register FOON route with transform middleware
    const handlers = Array.isArray(config.handler) ? config.handler : [config.handler];
    this.router[methodLower](fonPath, transformMiddleware, ...handlers);

    if (this.config.verbose) {
      console.log(`[FOON] Created route: ${method} ${fonPath} -> ${path}`);
    }
  }

  /**
   * Get the underlying Express router
   * This allows the FonRouter to be used with app.use()
   */
  getRouter(): Router {
    return this.router;
  }
}

/**
 * Create a new FOON Router
 * Returns a FonRouter instance with custom methods
 * Use .getRouter() to get Express Router for app.use()
 */
export function createFonRouter(config: FonRouterConfig): FonRouter {
  return new FonRouter(config);
}
