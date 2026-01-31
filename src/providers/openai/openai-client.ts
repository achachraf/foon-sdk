import { ProviderConfig } from '../../types';
import { createProviderError } from '../../errors';

/**
 * OpenAI API client
 */
export class OpenAIClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-mini';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Generate content using OpenAI Chat Completions API
   */
  async generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;

    const payload: any = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' }, // Request JSON output
      max_completion_tokens: 8192, // Use max_completion_tokens for newer models
    };

    // Only add temperature for models that support it (some restricted models don't)
    // Most production models support temperature, but some preview/nano models don't
    if (!this.model.includes('nano')) {
      payload.temperature = 0.1;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw createProviderError(`OpenAI API error (${response.status}): ${errorBody}`, {
          status: response.status,
          body: errorBody,
        });
      }

      const data = (await response.json()) as any;

      // Extract text from response
      if (
        !data.choices ||
        !data.choices[0] ||
        !data.choices[0].message ||
        !data.choices[0].message.content
      ) {
        throw createProviderError('Invalid OpenAI API response structure', { response: data });
      }

      return data.choices[0].message.content as string;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw createProviderError(`OpenAI API request timed out after ${this.timeout}ms`);
      }

      if (error instanceof Error && error.message.includes('OpenAI API')) {
        throw error;
      }

      throw createProviderError(
        `OpenAI API request failed: ${error instanceof Error ? error.message : String(error)}`,
        { originalError: error }
      );
    }
  }
}
