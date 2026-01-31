import { RouteRegistry } from '../../../src/express/route-registry';
import { RouteEntry } from '../../../src/express/types';

describe('RouteRegistry', () => {
  let registry: RouteRegistry;

  beforeEach(() => {
    registry = new RouteRegistry();
  });

  it('should register and retrieve routes', () => {
    const entry: RouteEntry = {
      method: 'POST',
      path: '/users',
      schema: { type: 'object' },
      handler: jest.fn(),
      config: {
        schema: { type: 'object' },
        handler: jest.fn(),
      },
    };

    registry.register(entry);

    const retrieved = registry.get('POST', '/users');
    expect(retrieved).toEqual(entry);
  });

  it('should check if route exists', () => {
    const entry: RouteEntry = {
      method: 'POST',
      path: '/users',
      schema: { type: 'object' },
      handler: jest.fn(),
      config: {
        schema: { type: 'object' },
        handler: jest.fn(),
      },
    };

    expect(registry.has('POST', '/users')).toBe(false);

    registry.register(entry);

    expect(registry.has('POST', '/users')).toBe(true);
  });

  it('should get all registered routes', () => {
    const entry1: RouteEntry = {
      method: 'POST',
      path: '/users',
      schema: { type: 'object' },
      handler: jest.fn(),
      config: {
        schema: { type: 'object' },
        handler: jest.fn(),
      },
    };

    const entry2: RouteEntry = {
      method: 'PUT',
      path: '/users/:id',
      schema: { type: 'object' },
      handler: jest.fn(),
      config: {
        schema: { type: 'object' },
        handler: jest.fn(),
      },
    };

    registry.register(entry1);
    registry.register(entry2);

    const all = registry.getAll();
    expect(all).toHaveLength(2);
    expect(all).toContain(entry1);
    expect(all).toContain(entry2);
  });

  it('should clear all routes', () => {
    const entry: RouteEntry = {
      method: 'POST',
      path: '/users',
      schema: { type: 'object' },
      handler: jest.fn(),
      config: {
        schema: { type: 'object' },
        handler: jest.fn(),
      },
    };

    registry.register(entry);
    expect(registry.getAll()).toHaveLength(1);

    registry.clear();
    expect(registry.getAll()).toHaveLength(0);
  });
});
