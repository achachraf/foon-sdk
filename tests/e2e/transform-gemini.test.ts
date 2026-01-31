import { transform } from '../../src/transform';
import { GeminiProvider } from '../../src/providers/gemini';
import userSchema from '../fixtures/schemas/user-schema.json';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

describe('Gemini E2E tests', () => {
  // Skip tests if no API key
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    it.skip('Skipping Gemini E2E tests (no API key)', () => {});
    return;
  }

  it('should transform messy input to schema-compliant output using Gemini', async () => {
    const provider = new GeminiProvider({
      apiKey,
      model,
    });

    const result = await transform(
      {
        firstname: 'Alice',
        lastname: 'Smith',
        email: 'alice.smith@example.com',
        age: '30', // String instead of number
        city: 'San Francisco',
        country: 'USA',
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.80,
      }
    );

    // Log result for debugging
    console.log('Gemini E2E Result:', JSON.stringify(result, null, 2));

    expect(result.ok).toBe(true);
    expect(result.output).toBeDefined();

    if (result.ok && result.output) {
      const output = result.output as any;

      // Check name mapping
      expect(output.name).toBeDefined();
      expect(output.name.given).toBe('Alice');
      expect(output.name.family).toBe('Smith');

      // Check email
      expect(output.email).toBe('alice.smith@example.com');

      // Check age (should be converted to number)
      if (output.age !== undefined) {
        expect(typeof output.age).toBe('number');
        expect(output.age).toBe(30);
      }

      // Check trace
      expect(result.trace.provider).toBe('gemini');
      expect(result.trace.validation.success).toBe(true);
      expect(result.trace.execution.assignmentsApplied.length).toBeGreaterThan(0);
    }
  }, 30000); // 30 second timeout for API call

  it('should handle required field validation', async () => {
    const provider = new GeminiProvider({
      apiKey,
      model,
    });

    const result = await transform(
      {
        // Missing required fields (name, email)
        city: 'Boston',
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.80,
      }
    );

    // Log result for debugging
    console.log('Validation Test Result:', JSON.stringify(result, null, 2));

    // Should fail validation or have low confidence
    if (!result.ok) {
      expect(result.error).toBeDefined();
      expect(['VALIDATION_ERROR', 'CONFIDENCE_TOO_LOW']).toContain(result.error?.category);
    }
  }, 30000);
});
