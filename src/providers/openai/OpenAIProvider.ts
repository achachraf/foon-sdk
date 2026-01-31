import { Provider } from '../base/Provider';
import { MappingPlan, NormalizedSchema, ProposalOptions, ProviderConfig } from '../../types';
import { buildMappingPrompt } from '../base/prompt-builder';
import { OpenAIClient } from './openai-client';
import { createProviderError, createMappingPlanParseError } from '../../errors';

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends Provider {
  readonly name = 'openai';
  readonly promptVersion = 'v1.0.0';

  private client: OpenAIClient;

  constructor(config: ProviderConfig) {
    super();

    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAIClient(config);
  }

  /**
   * Propose a mapping plan using OpenAI
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

      // Call OpenAI API
      const response = await this.client.generateContent(systemPrompt, userPrompt);

      // Parse and validate mapping plan
      try {
        return this.parseMappingPlan(response);
      } catch (error) {
        throw createMappingPlanParseError(
          `Failed to parse OpenAI response as mapping plan: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { rawResponse: response }
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('mapping plan') || error.message.includes('OpenAI API'))
      ) {
        throw error;
      }

      throw createProviderError(
        `OpenAI provider failed: ${error instanceof Error ? error.message : String(error)}`,
        { originalError: error }
      );
    }
  }
}
