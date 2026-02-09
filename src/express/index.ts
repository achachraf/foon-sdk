/**
 * FOON SDK Express Middleware
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createFonRouter } from 'foon-sdk/express';
 * import { GeminiProvider } from 'foon-sdk';
 *
 * const app = express();
 * app.use(express.json());
 *
 * const fonRouter = createFonRouter({
 *   provider: new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY }),
 *   prefix: '/foon',
 *   confidenceThreshold: 0.85
 * });
 *
 * fonRouter.post('/users', {
 *   schema: userSchema,
 *   handler: createUserHandler
 * });
 *
 * app.use(fonRouter);
 * app.listen(3000);
 * ```
 */

export { createFonRouter, FonRouter } from './FonRouter';
export { RouteRegistry } from './route-registry';
export { createTransformMiddleware } from './transform-middleware';
export { createErrorHandler, defaultErrorHandler } from './error-handler';

export type {
  FonRouterConfig,
  RouteConfig,
  HttpMethod,
  ErrorHandler,
  RouteEntry,
  IFonRouter,
} from './types';
