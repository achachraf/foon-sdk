import { NormalizedSchema } from '../types';
import { extractFields, generateSchemaVersion } from './field-extractor';

/**
 * Normalize JSON Schema to internal representation
 */
export function normalizeSchema(schema: object): NormalizedSchema {
  const fields = extractFields(schema);
  const version = generateSchemaVersion(schema);

  return {
    version,
    fields,
    raw: schema,
  };
}
