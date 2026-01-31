/**
 * Redact sensitive fields from input
 */
export function redactSensitiveFields(input: unknown, redactKeys: string[]): unknown {
  if (input === null || input === undefined) return input;

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveFields(item, redactKeys));
  }

  if (typeof input === 'object') {
    const redacted: any = {};

    for (const [key, value] of Object.entries(input)) {
      if (shouldRedact(key, redactKeys)) {
        redacted[key] = '***REDACTED***';
      } else if (value && typeof value === 'object') {
        redacted[key] = redactSensitiveFields(value, redactKeys);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  return input;
}

/**
 * Check if key should be redacted
 */
function shouldRedact(key: string, redactKeys: string[]): boolean {
  const lowerKey = key.toLowerCase();
  return redactKeys.some((redactKey) => lowerKey.includes(redactKey.toLowerCase()));
}
