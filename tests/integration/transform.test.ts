import { transform } from '../../src/transform';
import { MockProvider } from '../helpers/MockProvider';
import userSchema from '../fixtures/schemas/user-schema.json';

describe('transform() integration tests', () => {
  it('should successfully transform input with correct mappings', async () => {
    const provider = new MockProvider();
    provider.setMockPlan({
      assignments: [
        { from: '$.firstname', to: '$.name.given', confidence: 0.95 },
        { from: '$.lastname', to: '$.name.family', confidence: 0.95 },
        { from: '$.email', to: '$.email', confidence: 1.0 },
      ],
      drops: [],
      warnings: [],
    });

    const result = await transform(
      {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.85,
      }
    );

    expect(result.ok).toBe(true);
    expect(result.output).toEqual({
      name: {
        given: 'John',
        family: 'Doe',
      },
      email: 'john.doe@example.com',
    });

    expect(result.trace.traceId).toBeDefined();
    expect(result.trace.provider).toBe('mock');
    expect(result.trace.execution.assignmentsApplied).toHaveLength(3);
    expect(result.trace.validation.success).toBe(true);
  });

  it('should fail when confidence is below threshold', async () => {
    const provider = new MockProvider();
    provider.setMockPlan({
      assignments: [
        { from: '$.firstname', to: '$.name.given', confidence: 0.70 }, // Below threshold
        { from: '$.lastname', to: '$.name.family', confidence: 0.95 },
      ],
      drops: [],
      warnings: [],
    });

    const result = await transform(
      {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.85,
      }
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.category).toBe('CONFIDENCE_TOO_LOW');
    expect(result.trace.execution.assignmentsRejected).toHaveLength(1);
  });

  it('should fail validation when required fields are missing', async () => {
    const provider = new MockProvider();
    provider.setMockPlan({
      assignments: [
        { from: '$.firstname', to: '$.name.given', confidence: 0.95 },
        // Missing name.family and email (required fields)
      ],
      drops: [],
      warnings: [],
    });

    const result = await transform(
      {
        firstname: 'John',
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.85,
      }
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.category).toBe('VALIDATION_ERROR');
    expect(result.trace.validation.success).toBe(false);
    expect(result.trace.validation.errors.length).toBeGreaterThan(0);
  });

  it('should use cache for repeated requests', async () => {
    const { LRUCache } = await import('../../src/cache');
    const cache = new LRUCache();
    const provider = new MockProvider();

    const input = {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
    };

    const options = {
      schema: userSchema,
      provider,
      confidenceThreshold: 0.85,
      cache, // Use same cache instance
    };

    // First request
    const result1 = await transform(input, options);
    expect(result1.ok).toBe(true);
    expect(result1.trace.cache.hit).toBe(false);

    // Second request (should hit cache)
    const result2 = await transform(input, options);
    expect(result2.ok).toBe(true);
    expect(result2.trace.cache.hit).toBe(true);
  });
});
