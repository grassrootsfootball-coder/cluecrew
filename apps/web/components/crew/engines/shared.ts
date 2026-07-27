/**
 * Shared engine contract (BUILD-PHASE-4 §2). Engines RENDER; they never
 * decide. Selection is tap-tap everywhere (the accessible alternative that
 * is also our lean baseline; drag becomes Phase 5 polish).
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
