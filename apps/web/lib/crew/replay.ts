/**
 * Worked-example replay (BUILD-DISTRICT-MATHS, spec addition ratified by
 * David): on a missed item, Walk mode re-runs THAT question's solution
 * step-by-step. Steps are generated from the item's solution expression
 * through AUTHORED TEMPLATES only — the trace is deterministic arithmetic
 * from core, the phrasing is authored content, and nothing is generated
 * live (S3). No template or no solution → no replay, never a fallback.
 */
import { renderReplay } from '@cluecrew/core';
import replayContent from '../../../../content/replay-templates.json';

interface ReplayTemplate {
  intro: string;
  step: string;
  outro: string;
}

const TEMPLATES = (replayContent as { templates: Record<string, ReplayTemplate> }).templates;

/**
 * Builds the replay lines for a missed item, or null when the item carries
 * no solution or names no known template. templateId comes from the item's
 * explanation payload (`replayTemplate`), defaulting to the arithmetic chain.
 */
export function buildReplay(
  solution: string | null,
  templateId: string,
  item: { stemText: string; keyDisplay: string },
): string[] | null {
  if (!solution) return null;
  const template = TEMPLATES[templateId];
  if (!template) return null;
  // One renderer for the app and the review tooling (packages/core, R1064): house notation, the key
  // as displayed, and a refusal — no replay — wherever a step cannot be shown exactly.
  const rendered = renderReplay(solution, template, item);
  return rendered.ok ? rendered.lines : null;
}
