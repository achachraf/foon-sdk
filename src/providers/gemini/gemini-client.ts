import { ProviderConfig } from '../../types';
import { createProviderError } from '../../errors';

/**
 * Gemini API client
 */
export class GeminiClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-1.5-flash';
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Generate content using Gemini API
   */
  async generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1, // Low temperature for deterministic output
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json', // Request JSON output
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw createProviderError(`Gemini API error (${response.status}): ${errorBody}`, {
          status: response.status,
          body: errorBody,
        });
      }

      const data = (await response.json()) as any;

      // Extract text from response
      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0]
      ) {
        throw createProviderError('Invalid Gemini API response structure', { response: data });
      }

      return data.candidates[0].content.parts[0].text as string;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw createProviderError(`Gemini API request timed out after ${this.timeout}ms`);
      }

      if (error instanceof Error && error.message.includes('Gemini API')) {
        throw error;
      }

      throw createProviderError(
        `Gemini API request failed: ${error instanceof Error ? error.message : String(error)}`,
        { originalError: error }
      );
    }
  }
}
