/**
 * Shared engine contract (BUILD-PHASE-4 §2). Engines RENDER; they never
 * decide. Selection is tap-tap everywhere (the accessible alternative that
 * is also our lean baseline; drag becomes Phase 5 polish).
 *
 * `outcome` carries the answered beat back to the tile so the pop/shake and
 * spark burst happen ON the option the child tapped (Addendum A §2.2).
 */
export interface ItemOptionView {
  id: string;
  content: unknown;
}

export interface EngineProps {
  stem: Record<string, unknown>;
  options: ItemOptionView[];
  rail: 'stage' | 'corner' | 'none';
  selected: string | null;
  onSelect: (optionId: string) => void;
  /** Set once answered: which option was chosen and whether it was right. */
  outcome?: { optionId: string; correct: boolean } | null;
}

export function optionLabel(content: unknown): string {
  if (content === null || content === undefined) return '?';
  if (typeof content === 'string' || typeof content === 'number') return String(content);
  const record = content as Record<string, unknown>;
  if (record.value !== undefined) return String(record.value);
  if (Array.isArray(record.pair)) return (record.pair as unknown[]).join('  ·  ');
  return JSON.stringify(record);
}

export function stemText(stem: Record<string, unknown>): string {
  return typeof stem.prompt === 'string' ? stem.prompt : '';
}

/** How a given option should render once the answer is in. */
export function outcomeFor(
  optionId: string,
  outcome: EngineProps['outcome'],
): 'correct' | 'not-yet' | null {
  if (!outcome || outcome.optionId !== optionId) return null;
  return outcome.correct ? 'correct' : 'not-yet';
}
