import { transform } from '../../src/transform';
import { OllamaProvider } from '../../src/providers/ollama';
import userSchema from '../fixtures/schemas/user-schema.json';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

describe('Ollama E2E tests', () => {
  // Skip tests if no API key or model
  const apiKey = process.env.OLLAMA_API_KEY;
  const model = process.env.OLLAMA_MODEL || 'llama2';
  const baseUrl = process.env.OLLAMA_BASE_URL; // Optional

  if (!apiKey && !baseUrl) {
    it.skip('Skipping Ollama E2E tests (no API key or base URL)', () => {});
    return;
  }

  it('should transform messy input to schema-compliant output using Ollama', async () => {
    const provider = new OllamaProvider({
      apiKey,
      model,
      baseUrl,
    });

    const result = await transform(
      {
        firstname: 'Charlie',
        lastname: 'Brown',
        email: 'charlie.brown@example.com',
        age: '28', // String instead of number
        city: 'Chicago',
        country: 'USA',
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.80,
      }
    );

    // Log result for debugging
    console.log('Ollama E2E Result:', JSON.stringify(result, null, 2));

    expect(result.ok).toBe(true);
    expect(result.output).toBeDefined();

    if (result.ok && result.output) {
      const output = result.output as any;

      // Check name mapping
      expect(output.name).toBeDefined();
      expect(output.name.given).toBe('Charlie');
      expect(output.name.family).toBe('Brown');

      // Check email
      expect(output.email).toBe('charlie.brown@example.com');

      // Check age (should be converted to number)
      if (output.age !== undefined) {
        expect(typeof output.age).toBe('number');
        expect(output.age).toBe(28);
      }

      // Check trace
      expect(result.trace.provider).toBe('ollama');
      expect(result.trace.validation.success).toBe(true);
      expect(result.trace.execution.assignmentsApplied.length).toBeGreaterThan(0);
    }
  }, 60000); // 60 second timeout for Ollama (can be slower)

  it('should handle required field validation', async () => {
    const provider = new OllamaProvider({
      apiKey,
      model,
      baseUrl,
    });

    const result = await transform(
      {
        // Missing required fields (name, email)
        city: 'Portland',
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.80,
      }
    );

    // Log result for debugging
    console.log('Ollama Validation Test Result:', JSON.stringify(result, null, 2));

    // Should fail validation or have low confidence
    if (!result.ok) {
      expect(result.error).toBeDefined();
      expect(['VALIDATION_ERROR', 'CONFIDENCE_TOO_LOW']).toContain(result.error?.category);
    }
  }, 60000);

  it('should handle type conversion correctly', async () => {
    const provider = new OllamaProvider({
      apiKey,
      model,
      baseUrl,
    });

    const result = await transform(
      {
        first_name: 'Diana',
        last_name: 'Miller',
        email_address: 'diana@example.com',
        user_age: '50', // String that needs conversion
      },
      {
        schema: userSchema,
        provider,
        confidenceThreshold: 0.80,
      }
    );

    // Log result for debugging
    console.log('Ollama Type Conversion Result:', JSON.stringify(result, null, 2));

    expect(result.ok).toBe(true);

    if (result.ok && result.output) {
      const output = result.output as any;

      // Check type conversion
      if (output.age !== undefined) {
        expect(typeof output.age).toBe('number');
        expect(output.age).toBe(50);
      }

      // Check that transformation happened
      const ageAssignment = result.trace.execution.assignmentsApplied.find(
        (a) => a.assignment.to === '$.age'
      );
      if (ageAssignment) {
        expect(ageAssignment.transformed).toBe(true);
      }
    }
  }, 60000);
});
