import { JSONPath } from 'jsonpath-plus';

/**
 * Get value at JSONPath
 */
export function getValueAtPath(obj: any, path: string): any {
  try {
    const result = JSONPath({ path, json: obj, wrap: false });
    return result;
  } catch (error) {
    throw new Error(
      `Failed to get value at path "${path}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Set value at JSONPath
 */
export function setValueAtPath(obj: any, path: string, value: any): void {
  try {
    // Parse the path to navigate to parent and set the value
    const pathParts = path.split('.').filter((p) => p !== '$' && !p.includes('['));

    if (pathParts.length === 0) {
      throw new Error('Invalid path: cannot set root value');
    }

    let current = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    const lastPart = pathParts[pathParts.length - 1];
    current[lastPart] = value;
  } catch (error) {
    throw new Error(
      `Failed to set value at path "${path}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if path exists in object
 */
export function pathExists(obj: any, path: string): boolean {
  try {
    const result = JSONPath({ path, json: obj, wrap: false });
    return result !== undefined;
  } catch {
    return false;
  }
}

/**
 * Validate JSONPath syntax
 */
export function isValidPath(path: string): boolean {
  if (!path.startsWith('$')) {
    return false;
  }

  try {
    // Try to parse with a dummy object
    JSONPath({ path, json: {}, wrap: false });
    return true;
  } catch {
    return false;
  }
}
