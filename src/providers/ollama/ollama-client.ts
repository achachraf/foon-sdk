import { ProviderConfig } from '../../types';
import { createProviderError } from '../../errors';

/**
 * Ollama API client
 * Supports both local Ollama (http://localhost:11434) and hosted versions
 */
export class OllamaClient {
  private apiKey?: string;
  private model: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey; // Optional for local Ollama
    this.model = config.model || 'llama2';
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Generate content using Ollama API
   */
  async generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `${this.baseUrl}/api/chat`;

    const payload = {
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
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for deterministic output
        num_predict: 8192,
      },
      format: 'json', // Request JSON output
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add API key if provided (for hosted Ollama)
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw createProviderError(`Ollama API error (${response.status}): ${errorBody}`, {
          status: response.status,
          body: errorBody,
        });
      }

      const data = (await response.json()) as any;

      // Extract text from response
      if (!data.message || !data.message.content) {
        throw createProviderError('Invalid Ollama API response structure', { response: data });
      }

      return data.message.content as string;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw createProviderError(`Ollama API request timed out after ${this.timeout}ms`);
      }

      if (error instanceof Error && error.message.includes('Ollama API')) {
        throw error;
      }

      throw createProviderError(
        `Ollama API request failed: ${error instanceof Error ? error.message : String(error)}`,
        { originalError: error }
      );
    }
  }
}
