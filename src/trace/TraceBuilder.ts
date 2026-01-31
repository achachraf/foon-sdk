import {
  TraceReport,
  MappingPlan,
  ExecutionTrace,
  ValidationTrace,
  CacheTrace,
  ConfidenceSummary,
  Timings,
} from '../types';
import { generateTraceId } from './trace-utils';

/**
 * Builder for constructing trace reports
 */
export class TraceBuilder {
  private traceId: string;
  private mode: 'SEMANTIC' = 'SEMANTIC';
  private provider: string = '';
  private promptVersion: string = '';
  private timings: Partial<Timings> = {};
  private mappingPlan?: { raw: string; parsed: MappingPlan };
  private execution?: ExecutionTrace;
  private validation?: ValidationTrace;
  private cache?: CacheTrace;
  private confidenceSummary?: ConfidenceSummary;

  constructor() {
    this.traceId = generateTraceId();
  }

  /**
   * Get the trace ID
   */
  getTraceId(): string {
    return this.traceId;
  }

  /**
   * Set provider information
   */
  setProvider(name: string, promptVersion: string): this {
    this.provider = name;
    this.promptVersion = promptVersion;
    return this;
  }

  /**
   * Set timings
   */
  setTimings(timings: Timings): this {
    this.timings = timings;
    return this;
  }

  /**
   * Add partial timing
   */
  addTiming(key: keyof Timings, value: number): this {
    this.timings[key] = value;
    return this;
  }

  /**
   * Set mapping plan
   */
  setMappingPlan(raw: string, parsed: MappingPlan): this {
    this.mappingPlan = { raw, parsed };
    return this;
  }

  /**
   * Set execution trace
   */
  setExecution(execution: ExecutionTrace): this {
    this.execution = execution;
    return this;
  }

  /**
   * Set validation trace
   */
  setValidation(validation: ValidationTrace): this {
    this.validation = validation;
    return this;
  }

  /**
   * Set cache trace
   */
  setCache(cache: CacheTrace): this {
    this.cache = cache;
    return this;
  }

  /**
   * Set confidence summary
   */
  setConfidenceSummary(summary: ConfidenceSummary): this {
    this.confidenceSummary = summary;
    return this;
  }

  /**
   * Build the complete trace report
   */
  build(): TraceReport {
    // Ensure all required fields are present
    if (!this.provider) {
      throw new Error('Provider not set in trace');
    }

    if (!this.mappingPlan) {
      throw new Error('Mapping plan not set in trace');
    }

    if (!this.execution) {
      throw new Error('Execution trace not set in trace');
    }

    if (!this.validation) {
      throw new Error('Validation trace not set in trace');
    }

    if (!this.cache) {
      throw new Error('Cache trace not set in trace');
    }

    if (!this.confidenceSummary) {
      throw new Error('Confidence summary not set in trace');
    }

    return {
      traceId: this.traceId,
      mode: this.mode,
      provider: this.provider,
      promptVersion: this.promptVersion,
      timings: this.timings as Timings,
      mappingPlan: this.mappingPlan,
      execution: this.execution,
      validation: this.validation,
      cache: this.cache,
      confidenceSummary: this.confidenceSummary,
    };
  }
}
