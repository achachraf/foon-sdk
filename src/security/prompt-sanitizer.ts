/**
 * Sanitize prompts to mitigate prompt injection attacks
 */

const SUSPICIOUS_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /new\s+instructions/i,
  /system\s*:/i,
  /assistant\s*:/i,
  /you\s+are\s+now/i,
  /forget\s+everything/i,
  /disregard\s+.*(previous|above|instructions)/i,
];

/**
 * Check if input contains suspicious prompt injection patterns
 */
export function detectPromptInjection(input: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Sanitize string fields in input to prevent prompt injection
 */
export function sanitizeInput(input: unknown): unknown {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item));
  }

  if (typeof input === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (value && typeof value === 'object') {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return input;
}

/**
 * Sanitize a string by escaping special characters that might be used for injection
 */
function sanitizeString(str: string): string {
  // Trim excessive whitespace
  let sanitized = str.trim();

  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  // Escape control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized;
}
