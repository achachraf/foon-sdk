import { TransformOptions, TransformResult } from './types';
import { MappingEngine } from './engine/MappingEngine';

/**
 * Transform input JSON to schema-compliant output using semantic mapping
 *
 * @param input - The input JSON to transform
 * @param options - Transformation options
 * @returns Promise<TransformResult> - Result with output or error + trace
 *
 * @example
 * ```typescript
 * import { transform, GeminiProvider } from 'fon-sdk';
 *
 * const result = await transform(
 *   { firstname: 'John', lastname: 'Doe' },
 *   {
 *     schema: userSchema,
 *     provider: new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY }),
 *     confidenceThreshold: 0.85
 *   }
 * );
 *
 * if (result.ok) {
 *   console.log('Transformed:', result.output);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export async function transform(
  input: unknown,
  options: TransformOptions
): Promise<TransformResult> {
  // Validate required options
  if (!options.provider) {
    throw new Error('Provider is required');
  }

  if (!options.schema) {
    throw new Error('Schema is required');
  }

  // Create mapping engine
  const engine = new MappingEngine({
    provider: options.provider,
    schema: options.schema,
    confidenceThreshold: options.confidenceThreshold,
    cache: options.cache,
    security: options.security,
    verbose: options.verbose,
  });

  // Execute transformation
  const result = await engine.transform(input);

  // Call hooks if provided
  if (options.hooks) {
    if (options.hooks.onTrace) {
      options.hooks.onTrace(result.trace);
    }

    if (!result.ok && result.error && options.hooks.onError) {
      options.hooks.onError(result.error, result.trace.traceId);
    }
  }

  return result;
}
