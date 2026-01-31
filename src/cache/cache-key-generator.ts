import crypto from 'crypto';

/**
 * Generate stable cache key from inputs
 */
export function generateCacheKey(
  schemaVersion: string,
  inputSignature: string,
  confidenceThreshold: number,
  providerName: string,
  promptVersion: string
): string {
  const parts = [schemaVersion, inputSignature, confidenceThreshold, providerName, promptVersion];

  const combined = parts.join('::');
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Generate input signature (hash of keys + structure, not values)
 */
export function generateInputSignature(input: unknown): string {
  const structure = extractStructure(input);
  const structureStr = JSON.stringify(structure, Object.keys(structure).sort());
  return crypto.createHash('sha256').update(structureStr).digest('hex').substring(0, 16);
}

/**
 * Extract structure from input (keys + types, no values)
 */
function extractStructure(obj: unknown, depth: number = 0): any {
  if (depth > 10) return 'deep'; // Prevent infinite recursion

  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';

  if (Array.isArray(obj)) {
    if (obj.length === 0) return 'array:empty';
    // Sample first item to represent array structure
    return { 'array': extractStructure(obj[0], depth + 1) };
  }

  if (typeof obj === 'object') {
    const structure: any = {};
    for (const key of Object.keys(obj).sort()) {
      structure[key] = extractStructure((obj as any)[key], depth + 1);
    }
    return structure;
  }

  return typeof obj;
}
