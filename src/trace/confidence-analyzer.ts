import { AssignmentTrace, ConfidenceSummary } from '../types';

/**
 * Analyze confidence scores from assignments
 */
export function analyzeConfidence(
  assignments: AssignmentTrace[],
  threshold: number
): ConfidenceSummary {
  if (assignments.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      countBelowThreshold: 0,
      threshold,
    };
  }

  const confidences = assignments.map((a) => a.assignment.confidence);

  const min = Math.min(...confidences);
  const max = Math.max(...confidences);
  const avg = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  const countBelowThreshold = confidences.filter((c) => c < threshold).length;

  return {
    min,
    max,
    avg: Math.round(avg * 100) / 100, // Round to 2 decimal places
    countBelowThreshold,
    threshold,
  };
}
