import { Provider } from '../base/Provider';
import { MappingPlan, NormalizedSchema, ProposalOptions, ProviderConfig } from '../../types';
import { buildMappingPrompt } from '../base/prompt-builder';
import { GeminiClient } from './gemini-client';
import { createProviderError, createMappingPlanParseError } from '../../errors';

/**
 * Google Gemini provider implementation
 */
export class GeminiProvider extends Provider {
  readonly name = 'gemini';
  readonly promptVersion = 'v1.0.0';

  private client: GeminiClient;

  constructor(config: ProviderConfig) {
    super();

    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.client = new GeminiClient(config);
  }

  /**
   * Propose a mapping plan using Gemini
   */
  async proposeMappingPlan(
    input: unknown,
    schema: NormalizedSchema,
    options: ProposalOptions
  ): Promise<MappingPlan> {
    try {
      // Build prompts
      const { systemPrompt, userPrompt } = buildMappingPrompt(
        schema,
        input,
        options.confidenceThreshold,
        options.security.includeValues || false
      );

      // Call Gemini API
      const response = await this.client.generateContent(systemPrompt, userPrompt);

      // Parse and validate mapping plan
      try {
        return this.parseMappingPlan(response);
      } catch (error) {
        throw createMappingPlanParseError(
          `Failed to parse Gemini response as mapping plan: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { rawResponse: response }
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('mapping plan') || error.message.includes('Gemini API'))
      ) {
        throw error;
      }

      throw createProviderError(
        `Gemini provider failed: ${error instanceof Error ? error.message : String(error)}`,
        { originalError: error }
      );
    }
  }
}
