/**
 * Security options for input validation and sanitization
 */
export interface SecurityOptions {
  /** Maximum input size in bytes (default: 1MB) */
  maxInputSize?: number;

  /** Maximum nesting depth (default: 10) */
  maxDepth?: number;

  /** Maximum number of keys (default: 1000) */
  maxKeys?: number;

  /** Maximum string length for prompt inclusion (default: 10000) */
  maxStringLength?: number;

  /** Keys to redact (default: ['password', 'token', 'authorization', 'secret', 'apiKey', 'apiSecret']) */
  redactKeys?: string[];

  /** Enable prompt sanitization to mitigate prompt injection (default: true) */
  sanitizePrompt?: boolean;

  /** Include sample values in LLM prompt (default: false for security) */
  includeValues?: boolean;
}

/**
 * Input validation result
 */
export interface InputValidationResult {
  valid: boolean;
  errors: string[];
  stats?: {
    size: number;
    depth: number;
    keys: number;
  };
}
