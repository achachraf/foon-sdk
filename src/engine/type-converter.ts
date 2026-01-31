/**
 * Type conversion utilities for safe transformations
 */

/**
 * Convert value to target type if possible
 */
export function convertType(value: any, targetType: string | string[]): any {
  const types = Array.isArray(targetType) ? targetType : [targetType];

  // If value already matches one of the target types, return as-is
  const valueType = getType(value);
  if (types.includes(valueType)) {
    return value;
  }

  // Try conversions
  for (const type of types) {
    try {
      switch (type) {
        case 'string':
          return String(value);

        case 'number':
          if (typeof value === 'string') {
            const num = Number(value);
            if (!isNaN(num)) {
              return num;
            }
          }
          break;

        case 'boolean':
          if (typeof value === 'string') {
            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
          }
          if (typeof value === 'number') {
            return value !== 0;
          }
          break;

        case 'integer':
          if (typeof value === 'string' || typeof value === 'number') {
            const num = Number(value);
            if (!isNaN(num) && Number.isInteger(num)) {
              return num;
            }
          }
          break;
      }
    } catch {
      // Continue trying other types
    }
  }

  // No conversion found, return original value
  return value;
}

/**
 * Get JSON Schema type of value
 */
function getType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';

  const type = typeof value;

  if (type === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }

  return type;
}

/**
 * Check if conversion is safe (no data loss)
 */
export function isSafeConversion(value: any, targetType: string | string[]): boolean {
  const types = Array.isArray(targetType) ? targetType : [targetType];
  const valueType = getType(value);

  // Already correct type
  if (types.includes(valueType)) {
    return true;
  }

  // Safe conversions
  if (types.includes('string')) {
    return true; // Any value can be safely converted to string
  }

  if (types.includes('number') && typeof value === 'string') {
    const num = Number(value);
    return !isNaN(num);
  }

  if (types.includes('boolean') && typeof value === 'string') {
    return value.toLowerCase() === 'true' || value.toLowerCase() === 'false';
  }

  if (types.includes('integer')) {
    if (typeof value === 'string') {
      const num = Number(value);
      return !isNaN(num) && Number.isInteger(num);
    }
    if (typeof value === 'number') {
      return Number.isInteger(value);
    }
  }

  return false;
}
