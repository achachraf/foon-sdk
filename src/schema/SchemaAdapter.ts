import {
  SchemaAdapter as ISchemaAdapter,
  NormalizedSchema,
  SchemaField,
  ValidationResult,
} from '../types';
import { normalizeSchema } from './normalizer';
import { SchemaValidator } from './validator';
import { createSchemaLoadError } from '../errors';

/**
 * Schema Adapter implementation
 */
export class SchemaAdapter implements ISchemaAdapter {
  private normalizedSchema: NormalizedSchema;
  private validator: SchemaValidator;

  constructor(schema: object) {
    try {
      this.normalizedSchema = normalizeSchema(schema);
      this.validator = new SchemaValidator(schema);
    } catch (error) {
      throw createSchemaLoadError(
        `Failed to load schema: ${error instanceof Error ? error.message : String(error)}`,
        { originalError: error }
      );
    }
  }

  /**
   * Get the normalized schema
   */
  getNormalizedSchema(): NormalizedSchema {
    return this.normalizedSchema;
  }

  /**
   * List all fields
   */
  listFields(): SchemaField[] {
    return this.normalizedSchema.fields;
  }

  /**
   * Get a specific field by path
   */
  getField(path: string): SchemaField | undefined {
    return this.normalizedSchema.fields.find((f) => f.path === path);
  }

  /**
   * Check if a path is required
   */
  isRequired(path: string): boolean {
    const field = this.getField(path);
    return field?.required || false;
  }

  /**
   * Validate a payload against the schema
   */
  validate(payload: unknown): ValidationResult {
    return this.validator.validate(payload);
  }

  /**
   * Create a SchemaAdapter from a schema object
   */
  static from(schema: object): SchemaAdapter {
    return new SchemaAdapter(schema);
  }
}
