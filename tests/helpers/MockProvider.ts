import { MappingPlan, NormalizedSchema, ProposalOptions } from '../../src/types';
import { Provider } from '../../src/providers/base/Provider';

/**
 * Mock provider for testing
 */
export class MockProvider extends Provider {
  readonly name = 'mock';
  readonly promptVersion = 'test-v1.0.0';

  private mockPlan?: MappingPlan;

  /**
   * Set the mock mapping plan to return
   */
  setMockPlan(plan: MappingPlan): void {
    this.mockPlan = plan;
  }

  /**
   * Propose a mapping plan (returns mock plan)
   */
  async proposeMappingPlan(
    input: unknown,
    schema: NormalizedSchema,
    options: ProposalOptions
  ): Promise<MappingPlan> {
    if (!this.mockPlan) {
      // Default mock plan
      return {
        assignments: [
          { from: '$.firstname', to: '$.name.given', confidence: 0.95 },
          { from: '$.lastname', to: '$.name.family', confidence: 0.95 },
          { from: '$.email', to: '$.email', confidence: 1.0 },
        ],
        drops: [],
        warnings: [],
      };
    }

    return this.mockPlan;
  }
}
