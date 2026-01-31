import { RouteEntry, HttpMethod } from './types';

/**
 * Registry for storing route schemas
 */
export class RouteRegistry {
  private routes: Map<string, RouteEntry>;

  constructor() {
    this.routes = new Map();
  }

  /**
   * Generate registry key from method and path
   */
  private getKey(method: HttpMethod, path: string): string {
    return `${method} ${path}`;
  }

  /**
   * Register a route with its schema
   */
  register(entry: RouteEntry): void {
    const key = this.getKey(entry.method, entry.path);
    this.routes.set(key, entry);
  }

  /**
   * Get route entry by method and path
   */
  get(method: HttpMethod, path: string): RouteEntry | undefined {
    const key = this.getKey(method, path);
    return this.routes.get(key);
  }

  /**
   * Check if route is registered
   */
  has(method: HttpMethod, path: string): boolean {
    const key = this.getKey(method, path);
    return this.routes.has(key);
  }

  /**
   * Get all registered routes
   */
  getAll(): RouteEntry[] {
    return Array.from(this.routes.values());
  }

  /**
   * Clear all routes
   */
  clear(): void {
    this.routes.clear();
  }
}
