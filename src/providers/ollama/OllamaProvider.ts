import { Provider } from '../base/Provider';
import { MappingPlan, NormalizedSchema, ProposalOptions, ProviderConfig } from '../../types';
import { buildMappingPrompt } from '../base/prompt-builder';
import { OllamaClient } from './ollama-client';
import { createProviderError, createMappingPlanParseError } from '../../errors';

/**
 * Ollama provider implementation
 * Supports both local Ollama installations and hosted versions
 */
export class OllamaProvider extends Provider {
  readonly name = 'ollama';
  readonly promptVersion = 'v1.0.0';

  private client: OllamaClient;

  constructor(config: ProviderConfig) {
    super();

    // API key is optional for local Ollama
    this.client = new OllamaClient(config);
  }

  /**
   * Propose a mapping plan using Ollama
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

      // Call Ollama API
      const response = await this.client.generateContent(systemPrompt, userPrompt);

      // Parse and validate mapping plan
      try {
        return this.parseMappingPlan(response);
      } catch (error) {
        throw createMappingPlanParseError(
          `Failed to parse Ollama response as mapping plan: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { rawResponse: response }
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('mapping plan') || error.message.includes('Ollama API'))
      ) {
        throw error;
      }

      throw createProviderError(
        `Ollama provider failed: ${error instanceof Error ? error.message : String(error)}`,
        { originalError: error }
      );
    }
  }
}
