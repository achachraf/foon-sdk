import { LRUCache } from '../../../src/cache/LRUCache';
import { CachedMappingPlan } from '../../../src/types';

describe('LRUCache', () => {
  it('should store and retrieve values', async () => {
    const cache = new LRUCache();

    const cachedPlan: CachedMappingPlan = {
      mappingPlan: {
        assignments: [],
        drops: [],
        warnings: [],
      },
      metadata: {
        createdAt: Date.now(),
        provider: 'test',
        promptVersion: 'v1',
        schemaVersion: 'v1',
        inputSignature: 'sig1',
      },
    };

    await cache.set('key1', cachedPlan);

    const retrieved = await cache.get('key1');
    expect(retrieved).toEqual(cachedPlan);
  });

  it('should return null for non-existent keys', async () => {
    const cache = new LRUCache();

    const result = await cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should check if key exists', async () => {
    const cache = new LRUCache();

    const cachedPlan: CachedMappingPlan = {
      mappingPlan: { assignments: [], drops: [], warnings: [] },
      metadata: {
        createdAt: Date.now(),
        provider: 'test',
        promptVersion: 'v1',
        schemaVersion: 'v1',
        inputSignature: 'sig1',
      },
    };

    await cache.set('key1', cachedPlan);

    expect(await cache.has('key1')).toBe(true);
    expect(await cache.has('key2')).toBe(false);
  });

  it('should delete keys', async () => {
    const cache = new LRUCache();

    const cachedPlan: CachedMappingPlan = {
      mappingPlan: { assignments: [], drops: [], warnings: [] },
      metadata: {
        createdAt: Date.now(),
        provider: 'test',
        promptVersion: 'v1',
        schemaVersion: 'v1',
        inputSignature: 'sig1',
      },
    };

    await cache.set('key1', cachedPlan);
    expect(await cache.has('key1')).toBe(true);

    await cache.delete('key1');
    expect(await cache.has('key1')).toBe(false);
  });

  it('should clear all entries', async () => {
    const cache = new LRUCache();

    const cachedPlan: CachedMappingPlan = {
      mappingPlan: { assignments: [], drops: [], warnings: [] },
      metadata: {
        createdAt: Date.now(),
        provider: 'test',
        promptVersion: 'v1',
        schemaVersion: 'v1',
        inputSignature: 'sig1',
      },
    };

    await cache.set('key1', cachedPlan);
    await cache.set('key2', cachedPlan);

    expect(cache.size()).toBe(2);

    await cache.clear();
    expect(cache.size()).toBe(0);
  });
});
