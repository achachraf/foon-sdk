import {
  Provider,
  Cache,
  SecurityOptions,
  TransformResult,
  SchemaAdapter as ISchemaAdapter,
  MappingPlan,
} from '../types';
import { SchemaAdapter } from '../schema';
import { validateInput, mergeSecurityOptions, sanitizeInput, redactSensitiveFields } from '../security';
import { generateCacheKey, generateInputSignature, LRUCache } from '../cache';
import { executeMappingPlan } from './executor';
import { TraceBuilder, Timer, analyzeConfidence } from '../trace';
import {
  createSecurityLimitError,
  createConfidenceTooLowError,
  createValidationError,
} from '../errors';

/**
 * Options for MappingEngine
 */
export interface MappingEngineOptions {
  provider: Provider;
  schema: object | ISchemaAdapter;
  confidenceThreshold?: number;
  cache?: Cache;
  security?: SecurityOptions;
  verbose?: boolean;
}

/**
 * Main mapping engine that orchestrates transformation
 */
export class MappingEngine {
  private provider: Provider;
  private schemaAdapter: ISchemaAdapter;
  private confidenceThreshold: number;
  private cache: Cache;
  private security: Required<SecurityOptions>;
  private verbose: boolean;

  constructor(options: MappingEngineOptions) {
    this.provider = options.provider;
    this.confidenceThreshold = options.confidenceThreshold || 0.85;
    this.cache = options.cache || new LRUCache();
    this.security = mergeSecurityOptions(options.security);
    this.verbose = options.verbose || false;

    // Create or use schema adapter
    if ('getNormalizedSchema' in options.schema) {
      this.schemaAdapter = options.schema as ISchemaAdapter;
    } else {
      this.schemaAdapter = new SchemaAdapter(options.schema);
    }
  }

  /**
   * Transform input to schema-compliant output
   */
  async transform(input: unknown): Promise<TransformResult> {
    const trace = new TraceBuilder();
    const totalTimer = new Timer();

    try {
      trace.setProvider(this.provider.name, this.provider.promptVersion);

      // Step 1: Security validation
      const validationResult = validateInput(input, this.security);
      if (!validationResult.valid) {
        throw createSecurityLimitError(
          `Input validation failed: ${validationResult.errors.join(', ')}`,
          { errors: validationResult.errors, stats: validationResult.stats },
          trace.getTraceId()
        );
      }

      // Step 2: Sanitize and redact if needed
      let processedInput = input;
      if (this.security.sanitizePrompt) {
        processedInput = sanitizeInput(input);
      }
      if (this.security.redactKeys.length > 0) {
        processedInput = redactSensitiveFields(processedInput, this.security.redactKeys);
      }

      // Step 3: Generate cache key
      const schema = this.schemaAdapter.getNormalizedSchema();
      const inputSignature = generateInputSignature(input);
      const cacheKey = generateCacheKey(
        schema.version,
        inputSignature,
        this.confidenceThreshold,
        this.provider.name,
        this.provider.promptVersion
      );

      // Step 4: Check cache
      let mappingPlan: MappingPlan;
      let rawMappingPlan: string;
      let proposalTime = 0;

      const cachedPlan = await this.cache.get(cacheKey);

      if (cachedPlan) {
        mappingPlan = cachedPlan.mappingPlan;
        rawMappingPlan = JSON.stringify(mappingPlan);
        trace.setCache({ hit: true, key: cacheKey });
      } else {
        // Step 5: Get mapping plan from provider
        const proposalTimer = new Timer();

        mappingPlan = await this.provider.proposeMappingPlan(processedInput, schema, {
          confidenceThreshold: this.confidenceThreshold,
          security: this.security,
        });

        rawMappingPlan = JSON.stringify(mappingPlan);
        proposalTime = proposalTimer.elapsed();

        // Cache the mapping plan
        await this.cache.set(cacheKey, {
          mappingPlan,
          metadata: {
            createdAt: Date.now(),
            provider: this.provider.name,
            promptVersion: this.provider.promptVersion,
            schemaVersion: schema.version,
            inputSignature,
          },
        });

        trace.setCache({ hit: false, key: cacheKey });
      }

      trace.setMappingPlan(rawMappingPlan, mappingPlan);

      // Step 6: Execute mapping plan
      const executionTimer = new Timer();

      const executionResult = executeMappingPlan(
        input,
        mappingPlan,
        schema,
        this.confidenceThreshold
      );

      const executionTime = executionTimer.elapsed();

      // Check for rejected assignments due to low confidence
      const lowConfidenceRejections = executionResult.assignmentsRejected.filter(
        (r) => r.reason === 'CONFIDENCE_TOO_LOW'
      );

      if (lowConfidenceRejections.length > 0) {
        const confidenceSummary = analyzeConfidence(
          executionResult.assignmentsApplied,
          this.confidenceThreshold
        );

        trace.setExecution({
          assignmentsApplied: executionResult.assignmentsApplied,
          assignmentsRejected: executionResult.assignmentsRejected,
          droppedFields: mappingPlan.drops,
          warnings: mappingPlan.warnings,
          conflicts: executionResult.conflicts,
        });

        trace.setConfidenceSummary(confidenceSummary);

        trace.setValidation({ success: false, errors: [] });

        trace.addTiming('proposal', proposalTime);
        trace.addTiming('execution', executionTime);
        trace.addTiming('validation', 0);
        trace.addTiming('total', totalTimer.elapsed());

        throw createConfidenceTooLowError(
          `${lowConfidenceRejections.length} assignment(s) below confidence threshold ${this.confidenceThreshold}`,
          { rejections: lowConfidenceRejections },
          trace.getTraceId()
        );
      }

      // Step 7: Validate output
      const validationTimer = new Timer();
      const validationResult2 = this.schemaAdapter.validate(executionResult.output);
      const validationTime = validationTimer.elapsed();

      if (!validationResult2.valid) {
        const confidenceSummary = analyzeConfidence(
          executionResult.assignmentsApplied,
          this.confidenceThreshold
        );

        trace.setExecution({
          assignmentsApplied: executionResult.assignmentsApplied,
          assignmentsRejected: executionResult.assignmentsRejected,
          droppedFields: mappingPlan.drops,
          warnings: mappingPlan.warnings,
          conflicts: executionResult.conflicts,
        });

        trace.setConfidenceSummary(confidenceSummary);

        trace.setValidation({
          success: false,
          errors: validationResult2.errors,
        });

        trace.addTiming('proposal', proposalTime);
        trace.addTiming('execution', executionTime);
        trace.addTiming('validation', validationTime);
        trace.addTiming('total', totalTimer.elapsed());

        throw createValidationError(
          `Output validation failed: ${validationResult2.errors.length} error(s)`,
          { errors: validationResult2.errors },
          trace.getTraceId()
        );
      }

      // Step 8: Build successful trace
      const confidenceSummary = analyzeConfidence(
        executionResult.assignmentsApplied,
        this.confidenceThreshold
      );

      trace.setExecution({
        assignmentsApplied: executionResult.assignmentsApplied,
        assignmentsRejected: executionResult.assignmentsRejected,
        droppedFields: mappingPlan.drops,
        warnings: mappingPlan.warnings,
        conflicts: executionResult.conflicts,
      });

      trace.setConfidenceSummary(confidenceSummary);

      trace.setValidation({
        success: true,
        errors: [],
      });

      trace.addTiming('proposal', proposalTime);
      trace.addTiming('execution', executionTime);
      trace.addTiming('validation', validationTime);
      trace.addTiming('total', totalTimer.elapsed());

      return {
        ok: true,
        output: executionResult.output,
        trace: trace.build(),
      };
    } catch (error) {
      // Build error trace if possible
      try {
        const errorTrace = trace.build();
        return {
          ok: false,
          error: error as any,
          trace: errorTrace,
        };
      } catch {
        // If trace building fails, return error without complete trace
        return {
          ok: false,
          error: error as any,
          trace: {
            traceId: trace.getTraceId(),
            mode: 'SEMANTIC',
            provider: this.provider.name,
            promptVersion: this.provider.promptVersion,
            timings: { total: totalTimer.elapsed(), proposal: 0, execution: 0, validation: 0 },
            mappingPlan: { raw: '', parsed: { assignments: [], drops: [], warnings: [] } },
            execution: {
              assignmentsApplied: [],
              assignmentsRejected: [],
              droppedFields: [],
              warnings: [],
              conflicts: [],
            },
            validation: { success: false, errors: [] },
            cache: { hit: false, key: '' },
            confidenceSummary: { min: 0, max: 0, avg: 0, countBelowThreshold: 0, threshold: this.confidenceThreshold },
          },
        };
      }
    }
  }
}
