/**
 * Worked-example replay (BUILD-DISTRICT-MATHS, spec addition ratified by
 * David): on a missed item, Walk mode re-runs THAT question's solution
 * step-by-step. Steps are generated from the item's solution expression
 * through AUTHORED TEMPLATES only — the trace is deterministic arithmetic
 * from core, the phrasing is authored content, and nothing is generated
 * live (S3). No template or no solution → no replay, never a fallback.
 */
import { solutionTrace } from '@cluecrew/core';
import replayContent from '../../../../content/replay-templates.json';

interface ReplayTemplate {
  intro: string;
  step: string;
  outro: string;
}

const TEMPLATES = (replayContent as { templates: Record<string, ReplayTemplate> }).templates;

function fill(frame: string, operation: string, value: number): string {
  return frame.replaceAll('{operation}', operation).replaceAll('{value}', String(value));
}

/**
 * Builds the replay lines for a missed item, or null when the item carries
 * no solution or names no known template. templateId comes from the item's
 * explanation payload (`replayTemplate`), defaulting to the arithmetic chain.
 */
export function buildReplay(
  solution: string | null,
  templateId: string = 'arithmetic-chain',
): string[] | null {
  if (!solution) return null;
  const template = TEMPLATES[templateId];
  if (!template) return null;
  let trace;
  try {
    trace = solutionTrace(solution);
  } catch {
    return null;
  }
  if (trace.length === 0) return null;
  const last = trace[trace.length - 1]!;
  return [
    template.intro,
    ...trace.map((step) => fill(template.step, step.operation, step.value)),
    fill(template.outro, '', last.value),
  ];
}
