import {
  MappingPlan,
  Assignment,
  AssignmentTrace,
  RejectedAssignment,
  Conflict,
  NormalizedSchema,
} from '../types';
import { getValueAtPath, setValueAtPath, isValidPath } from './jsonpath';
import { convertType, isSafeConversion } from './type-converter';
import { createExecutionError } from '../errors';

/**
 * Execution result
 */
export interface ExecutionResult {
  output: any;
  assignmentsApplied: AssignmentTrace[];
  assignmentsRejected: RejectedAssignment[];
  conflicts: Conflict[];
}

/**
 * Execute mapping plan deterministically
 */
export function executeMappingPlan(
  input: unknown,
  mappingPlan: MappingPlan,
  schema: NormalizedSchema,
  confidenceThreshold: number
): ExecutionResult {
  const output: any = {};
  const assignmentsApplied: AssignmentTrace[] = [];
  const assignmentsRejected: RejectedAssignment[] = [];
  const conflicts: Conflict[] = [];

  // Track which target paths have been written
  const targetPathAssignments = new Map<string, string[]>();

  // Process assignments
  for (const assignment of mappingPlan.assignments) {
    // Validate confidence
    if (assignment.confidence < confidenceThreshold) {
      assignmentsRejected.push({
        assignment,
        reason: 'CONFIDENCE_TOO_LOW',
        details: `Confidence ${assignment.confidence} is below threshold ${confidenceThreshold}`,
      });
      continue;
    }

    // Validate paths
    if (!isValidPath(assignment.from)) {
      assignmentsRejected.push({
        assignment,
        reason: 'INVALID_PATH',
        details: `Invalid source path: ${assignment.from}`,
      });
      continue;
    }

    if (!isValidPath(assignment.to)) {
      assignmentsRejected.push({
        assignment,
        reason: 'INVALID_PATH',
        details: `Invalid target path: ${assignment.to}`,
      });
      continue;
    }

    // Get source value
    let fromValue: any;
    try {
      fromValue = getValueAtPath(input, assignment.from);
    } catch (error) {
      assignmentsRejected.push({
        assignment,
        reason: 'INVALID_PATH',
        details: `Failed to read from path: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }

    if (fromValue === undefined) {
      assignmentsRejected.push({
        assignment,
        reason: 'INVALID_PATH',
        details: `No value found at source path: ${assignment.from}`,
      });
      continue;
    }

    // Get target field schema
    const targetField = schema.fields.find((f) => f.path === assignment.to);
    if (!targetField) {
      assignmentsRejected.push({
        assignment,
        reason: 'INVALID_PATH',
        details: `Target path not found in schema: ${assignment.to}`,
      });
      continue;
    }

    // Type conversion if needed
    let toValue = fromValue;
    let transformed = false;

    if (!isSafeConversion(fromValue, targetField.type)) {
      assignmentsRejected.push({
        assignment,
        reason: 'TYPE_MISMATCH',
        details: `Cannot safely convert ${typeof fromValue} to ${targetField.type}`,
      });
      continue;
    }

    const convertedValue = convertType(fromValue, targetField.type);
    if (convertedValue !== fromValue) {
      toValue = convertedValue;
      transformed = true;
    }

    // Check for conflicts
    if (targetPathAssignments.has(assignment.to)) {
      const sources = targetPathAssignments.get(assignment.to)!;
      sources.push(assignment.from);

      conflicts.push({
        targetPath: assignment.to,
        sources,
        resolution: 'LAST_WINS', // Simple strategy: last assignment wins
      });
    } else {
      targetPathAssignments.set(assignment.to, [assignment.from]);
    }

    // Set target value
    try {
      setValueAtPath(output, assignment.to, toValue);

      assignmentsApplied.push({
        assignment,
        fromValue,
        toValue,
        transformed,
      });
    } catch (error) {
      assignmentsRejected.push({
        assignment,
        reason: 'INVALID_PATH',
        details: `Failed to set value: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  // If there are conflicts with FAILED resolution, throw error
  const failedConflicts = conflicts.filter((c) => c.resolution === 'FAILED');
  if (failedConflicts.length > 0) {
    throw createExecutionError('Mapping conflicts detected', {
      conflicts: failedConflicts,
    });
  }

  return {
    output,
    assignmentsApplied,
    assignmentsRejected,
    conflicts,
  };
}
