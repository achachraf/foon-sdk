import { SchemaField } from '../types';
import crypto from 'crypto';

/**
 * Extract fields from JSON Schema
 */
export function extractFields(schema: any, basePath: string = '$'): SchemaField[] {
  const fields: SchemaField[] = [];

  // Handle object type
  if (schema.type === 'object' && schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const path = `${basePath}.${key}`;
      const isRequired = schema.required?.includes(key) || false;

      fields.push(createField(path, propSchema as any, isRequired));

      // Recursively extract nested fields
      if ((propSchema as any).type === 'object' && (propSchema as any).properties) {
        fields.push(...extractFields(propSchema as any, path));
      }

      // Handle arrays with object items
      if (
        (propSchema as any).type === 'array' &&
        (propSchema as any).items?.type === 'object'
      ) {
        const itemSchema = (propSchema as any).items;
        const arrayPath = `${path}[*]`;
        if (itemSchema.properties) {
          fields.push(...extractFields(itemSchema, arrayPath));
        }
      }
    }
  }

  return fields;
}

/**
 * Create a SchemaField from JSON Schema property
 */
function createField(path: string, propSchema: any, required: boolean): SchemaField {
  return {
    path,
    type: propSchema.type || 'any',
    required,
    description: propSchema.description,
    format: propSchema.format,
    enum: propSchema.enum,
    default: propSchema.default,
  };
}

/**
 * Generate schema version (hash of schema)
 */
export function generateSchemaVersion(schema: object): string {
  const schemaStr = JSON.stringify(schema, Object.keys(schema).sort());
  return crypto.createHash('sha256').update(schemaStr).digest('hex').substring(0, 16);
}
