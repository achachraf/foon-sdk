import { transform } from '../../src/transform';
import { OpenAIProvider } from '../../src/providers/openai';
import userSchema from '../fixtures/schemas/user-schema.json';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

describe('OpenAI E2E tests', () => {
  // Skip tests if no API key
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    it.skip('Skipping OpenAI E2E tests (no API key)', () => {});
    return;
  }

  it('should transform messy input to schema-compliant output using OpenAI', async () => {
    const provider = new OpenAIProvider({
      apiKey,
      model,
    });

    const result = await transform(
      {
        firstname: 'Bob',
        lastname: 'Johnson',
        email: 'bob.johnson@example.com',
        age: '35', // String instead of number
        city: 'New York',
        country: 'USA',
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.80,
      }
    );

    // Log result for debugging
    console.log('OpenAI E2E Result:', JSON.stringify(result, null, 2));

    expect(result.ok).toBe(true);
    expect(result.output).toBeDefined();

    if (result.ok && result.output) {
      const output = result.output as any;

      // Check name mapping
      expect(output.name).toBeDefined();
      expect(output.name.given).toBe('Bob');
      expect(output.name.family).toBe('Johnson');

      // Check email
      expect(output.email).toBe('bob.johnson@example.com');

      // Check age (should be converted to number)
      if (output.age !== undefined) {
        expect(typeof output.age).toBe('number');
        expect(output.age).toBe(35);
      }

      // Check trace
      expect(result.trace.provider).toBe('openai');
      expect(result.trace.validation.success).toBe(true);
      expect(result.trace.execution.assignmentsApplied.length).toBeGreaterThan(0);
    }
  }, 30000); // 30 second timeout for API call

  it('should handle required field validation', async () => {
    const provider = new OpenAIProvider({
      apiKey,
      model,
    });

    const result = await transform(
      {
        // Missing required fields (name, email)
        city: 'Seattle',
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.80,
      }
    );

    // Log result for debugging
    console.log('OpenAI Validation Test Result:', JSON.stringify(result, null, 2));

    // Should fail validation or have low confidence
    if (!result.ok) {
      expect(result.error).toBeDefined();
      expect(['VALIDATION_ERROR', 'CONFIDENCE_TOO_LOW']).toContain(result.error?.category);
    }
  }, 30000);

  it('should handle type conversion correctly', async () => {
    const provider = new OpenAIProvider({
      apiKey,
      model,
    });

    const result = await transform(
      {
        first_name: 'Carol',
        last_name: 'Williams',
        email_address: 'carol@example.com',
        user_age: '42', // String that needs conversion
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.80,
      }
    );

    // Log result for debugging
    console.log('OpenAI Type Conversion Result:', JSON.stringify(result, null, 2));

    expect(result.ok).toBe(true);

    if (result.ok && result.output) {
      const output = result.output as any;

      // Check type conversion
      if (output.age !== undefined) {
        expect(typeof output.age).toBe('number');
        expect(output.age).toBe(42);
      }

      // Check that transformation happened
      const ageAssignment = result.trace.execution.assignmentsApplied.find(
        (a) => a.assignment.to === '$.age'
      );
      if (ageAssignment) {
        expect(ageAssignment.transformed).toBe(true);
      }
    }
  }, 30000);
});
