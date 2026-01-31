import { SchemaAdapter } from '../../../src/schema/SchemaAdapter';

describe('SchemaAdapter', () => {
  const simpleSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'User name',
      },
      age: {
        type: 'integer',
      },
    },
    required: ['name'],
  };

  it('should normalize schema and extract fields', () => {
    const adapter = new SchemaAdapter(simpleSchema);
    const normalized = adapter.getNormalizedSchema();

    expect(normalized.version).toBeDefined();
    expect(normalized.fields).toBeDefined();
    expect(normalized.raw).toEqual(simpleSchema);

    const fields = adapter.listFields();
    expect(fields.length).toBe(2);

    const nameField = fields.find((f) => f.path === '$.name');
    expect(nameField).toBeDefined();
    expect(nameField?.type).toBe('string');
    expect(nameField?.required).toBe(true);
    expect(nameField?.description).toBe('User name');

    const ageField = fields.find((f) => f.path === '$.age');
    expect(ageField).toBeDefined();
    expect(ageField?.type).toBe('integer');
    expect(ageField?.required).toBe(false);
  });

  it('should validate valid payload', () => {
    const adapter = new SchemaAdapter(simpleSchema);
    const result = adapter.validate({
      name: 'John',
      age: 30,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation for invalid payload', () => {
    const adapter = new SchemaAdapter(simpleSchema);
    const result = adapter.validate({
      age: 30,
      // Missing required 'name' field
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should check if field is required', () => {
    const adapter = new SchemaAdapter(simpleSchema);

    expect(adapter.isRequired('$.name')).toBe(true);
    expect(adapter.isRequired('$.age')).toBe(false);
  });

  it('should get field by path', () => {
    const adapter = new SchemaAdapter(simpleSchema);

    const field = adapter.getField('$.name');
    expect(field).toBeDefined();
    expect(field?.type).toBe('string');

    const notFound = adapter.getField('$.nonexistent');
    expect(notFound).toBeUndefined();
  });
});
