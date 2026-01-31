import { NormalizedSchema, SchemaField } from '../../types';

/**
 * Build field inventory prompt from schema
 */
export function buildSchemaFieldsPrompt(schema: NormalizedSchema): string {
  const lines: string[] = ['TARGET SCHEMA FIELDS:'];

  for (const field of schema.fields) {
    const required = field.required ? '[REQUIRED]' : '[optional]';
    const type = Array.isArray(field.type) ? field.type.join('|') : field.type;
    const desc = field.description ? ` - ${field.description}` : '';

    lines.push(`  ${field.path}: ${type} ${required}${desc}`);
  }

  return lines.join('\n');
}

/**
 * Build input keys inventory from input payload
 * Only includes structure, not values (for security)
 */
export function buildInputKeysPrompt(input: unknown, includeValues: boolean = false): string {
  const lines: string[] = ['INPUT PAYLOAD STRUCTURE:'];

  const keys = extractKeys(input, '$', includeValues);
  lines.push(...keys.map((k) => `  ${k}`));

  return lines.join('\n');
}

/**
 * Extract keys from input payload recursively
 */
function extractKeys(
  obj: unknown,
  basePath: string,
  includeValues: boolean,
  depth: number = 0
): string[] {
  if (depth > 10) return []; // Prevent infinite recursion

  const keys: string[] = [];

  if (obj === null || obj === undefined) {
    return [];
  }

  if (Array.isArray(obj)) {
    keys.push(`${basePath}: array[${obj.length}]`);
    if (obj.length > 0) {
      // Sample first item to show array structure
      keys.push(...extractKeys(obj[0], `${basePath}[*]`, includeValues, depth + 1));
    }
  } else if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const path = basePath === '$' ? `$.${key}` : `${basePath}.${key}`;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(`${path}: object`);
        keys.push(...extractKeys(value, path, includeValues, depth + 1));
      } else if (Array.isArray(value)) {
        keys.push(...extractKeys(value, path, includeValues, depth + 1));
      } else {
        const valueStr = includeValues ? ` = ${JSON.stringify(value)}` : '';
        keys.push(`${path}: ${typeof value}${valueStr}`);
      }
    }
  }

  return keys;
}

/**
 * Build system prompt for mapping plan generation
 */
export function buildSystemPrompt(confidenceThreshold: number): string {
  return `You are a JSON mapping expert. Your task is to generate a MAPPING PLAN (not the final JSON) that transforms input JSON to match a target schema.

CRITICAL: You must return ONLY valid JSON matching this exact structure:
{
  "assignments": [
    { "from": "$.inputPath", "to": "$.targetPath", "confidence": 0.95 }
  ],
  "drops": [
    { "path": "$.unusedField", "reason": "Not in schema", "confidence": 0.9 }
  ],
  "warnings": [
    { "message": "Potential issue description", "confidence": 0.85 }
  ]
}

RULES:
1. Output ONLY the JSON mapping plan. No markdown, no prose, no explanations.
2. Each assignment must have "from" (input JSONPath), "to" (target JSONPath), and "confidence" (0-1).
3. Confidence threshold is ${confidenceThreshold}. Be accurate with confidence scores.
4. Drop any input fields that don't map to the schema.
5. Warn about potential issues (typos, ambiguous mappings, type mismatches).
6. Use JSONPath notation (e.g., "$.name.first", "$.items[*].id").
7. Be conservative: if unsure about a mapping, lower the confidence score.`;
}

/**
 * Build complete prompt for LLM
 */
export function buildMappingPrompt(
  schema: NormalizedSchema,
  input: unknown,
  confidenceThreshold: number,
  includeValues: boolean = false
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = buildSystemPrompt(confidenceThreshold);

  const userPrompt = `${buildSchemaFieldsPrompt(schema)}

${buildInputKeysPrompt(input, includeValues)}

Generate the mapping plan to transform the input to match the target schema.`;

  return { systemPrompt, userPrompt };
}
