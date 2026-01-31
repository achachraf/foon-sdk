import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationResult, ValidationError } from '../types';

/**
 * JSON Schema validator using AJV
 */
export class SchemaValidator {
  private ajv: Ajv;

  constructor(schema: object) {
    this.ajv = new Ajv({
      strict: false, // Allow unknown formats
      allErrors: true,
      verbose: true,
    });

    // Add format support (email, date-time, etc.)
    addFormats(this.ajv);

    this.ajv.addSchema(schema, 'target-schema');
  }

  /**
   * Validate a payload against the schema
   */
  validate(payload: unknown): ValidationResult {
    const valid = this.ajv.validate('target-schema', payload);

    if (valid) {
      return { valid: true, errors: [] };
    }

    const errors = this.ajv.errors || [];
    return {
      valid: false,
      errors: errors.map((err) => this.convertAjvError(err)),
    };
  }

  /**
   * Convert AJV error to ValidationError
   */
  private convertAjvError(error: ErrorObject): ValidationError {
    return {
      path: error.instancePath || '$',
      message: error.message || 'Validation failed',
      keyword: error.keyword,
      params: error.params,
    };
  }
}
