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

/**
 * The question a child reads. `text` FIRST (R79: whatever Cowork authors is the name), `prompt`
 * second for the VR/NVR families where `prompt` is still the authored field.
 *
 * This returned `stem.prompt ?? ''` while all 371 English items carried `stem.text`, so every one of
 * them would have rendered with NO QUESTION and nothing would have said so. Unanimous on both sides:
 * 344 of 344 in Cowork's store, 371 of 371 here, zero carrying `prompt`. Not a near miss.
 *
 * IT NO LONGER RETURNS AN EMPTY STRING SILENTLY. A stem with neither field is a fault in the item,
 * and returning '' let it reach a child as a blank question. The caller gets a thrown error instead:
 * a crash is recoverable and a blank question in an exam is not.
 */
export function stemText(stem: Record<string, unknown>): string {
  if (typeof stem.text === 'string' && stem.text.trim()) return stem.text;
  if (typeof stem.prompt === 'string' && stem.prompt.trim()) return stem.prompt;
  throw new Error(
    `stem has neither a non-empty 'text' nor 'prompt' — it carries: ${Object.keys(stem).join(', ') || '(nothing)'}. `
    + 'Refusing to render a blank question.',
  );
}

/** How a given option should render once the answer is in. */
export function outcomeFor(
  optionId: string,
  outcome: EngineProps['outcome'],
): 'correct' | 'not-yet' | null {
  if (!outcome || outcome.optionId !== optionId) return null;
  return outcome.correct ? 'correct' : 'not-yet';
}
