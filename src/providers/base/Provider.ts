import { Provider as IProvider, ProposalOptions, MappingPlan, NormalizedSchema } from '../../types';

/**
 * Abstract base provider class
 */
export abstract class Provider implements IProvider {
  abstract readonly name: string;
  abstract readonly promptVersion: string;

  /**
   * Propose a mapping plan from input to schema
   */
  abstract proposeMappingPlan(
    input: unknown,
    schema: NormalizedSchema,
    options: ProposalOptions
  ): Promise<MappingPlan>;

  /**
   * Validate and parse LLM response as mapping plan
   */
  protected parseMappingPlan(response: string): MappingPlan {
    try {
      const parsed = JSON.parse(response);

      // Validate structure
      if (!parsed.assignments || !Array.isArray(parsed.assignments)) {
        throw new Error('Missing or invalid "assignments" array');
      }

      if (!parsed.drops || !Array.isArray(parsed.drops)) {
        throw new Error('Missing or invalid "drops" array');
      }

      if (!parsed.warnings || !Array.isArray(parsed.warnings)) {
        throw new Error('Missing or invalid "warnings" array');
      }

      // Validate assignments
      for (const assignment of parsed.assignments) {
        if (!assignment.from || !assignment.to || assignment.confidence === undefined) {
          throw new Error(
            'Invalid assignment: must have "from", "to", and "confidence" properties'
          );
        }

        if (
          typeof assignment.confidence !== 'number' ||
          assignment.confidence < 0 ||
          assignment.confidence > 1
        ) {
          throw new Error('Invalid confidence: must be a number between 0 and 1');
        }
      }

      return parsed as MappingPlan;
    } catch (error) {
      throw new Error(
        `Failed to parse mapping plan: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
