import { InputValidationResult, SecurityOptions } from '../types';

/**
 * Validate input against security limits
 */
export function validateInput(
  input: unknown,
  security: Required<SecurityOptions>
): InputValidationResult {
  const errors: string[] = [];

  // Check input size
  const inputStr = JSON.stringify(input);
  const size = Buffer.byteLength(inputStr, 'utf8');

  if (size > security.maxInputSize) {
    errors.push(
      `Input size (${size} bytes) exceeds maximum allowed (${security.maxInputSize} bytes)`
    );
  }

  // Check depth
  const depth = getDepth(input);
  if (depth > security.maxDepth) {
    errors.push(`Input depth (${depth}) exceeds maximum allowed (${security.maxDepth})`);
  }

  // Check key count
  const keyCount = countKeys(input);
  if (keyCount > security.maxKeys) {
    errors.push(`Input key count (${keyCount}) exceeds maximum allowed (${security.maxKeys})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      size,
      depth,
      keys: keyCount,
    },
  };
}

/**
 * Get maximum depth of nested object
 */
function getDepth(obj: unknown, currentDepth: number = 0): number {
  if (currentDepth > 100) return currentDepth; // Prevent infinite recursion

  if (obj === null || obj === undefined) return currentDepth;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return currentDepth + 1;
    return Math.max(...obj.map((item) => getDepth(item, currentDepth + 1)));
  }

  if (typeof obj === 'object') {
    const values = Object.values(obj);
    if (values.length === 0) return currentDepth + 1;
    return Math.max(...values.map((value) => getDepth(value, currentDepth + 1)));
  }

  return currentDepth;
}

/**
 * Count total number of keys
 */
function countKeys(obj: unknown, count: number = 0): number {
  if (count > 10000) return count; // Prevent infinite recursion

  if (obj === null || obj === undefined) return count;

  if (Array.isArray(obj)) {
    return obj.reduce((acc, item) => countKeys(item, acc), count);
  }

  if (typeof obj === 'object') {
    let total = count + Object.keys(obj).length;
    for (const value of Object.values(obj)) {
      total = countKeys(value, total);
    }
    return total;
  }

  return count;
}
