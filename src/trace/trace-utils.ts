import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique trace ID
 */
export function generateTraceId(): string {
  return uuidv4();
}

/**
 * Simple timer for measuring execution time
 */
export class Timer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = Date.now();
  }
}
