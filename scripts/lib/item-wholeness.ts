/**
 * A WHOLE ITEM, DERIVED — NEVER FLAGGED (Annie's 142nd, David's build ruling, 2026-08-24 — R699).
 *
 * Her census found the door trigger's blind spot: 288 rows, zero misconception executions, 250
 * empty hint-and-walk layers, twenty-one of twenty-two tags pointing at entries never attested —
 * *"a tag pointing at an unattested entry is a wire into a dark room; the entry is what a child
 * meets on a miss."* A door that opens on signatures over hollow items serves a child who misses
 * and meets nothing.
 *
 * So: **`doorOpensOnThisSection` counts WHOLE items only.** A row is whole when
 *   (a) every tag on it points at an ATTESTED entry (exists here, ACTIVE, carrying the
 *       reviewer's stamp — the governed state the VR drain established),
 *   (b) every tagged option's EXECUTION exists, and
 *   (c) the hint-and-walk layer is PRESENT (a non-empty explanation object).
 * Phase-one content verification does NOT light a door.
 *
 * Derived at read time from the rows, the same shape as `servableCaseIds` — a door lights when
 * the last hollow row fills, and not before, with no flag for anyone to set or forget.
 */
export interface WholenessInput {
  explanation: unknown;
  options: Array<{ misconceptionId: string | null; misconceptionExecution: string | null }>;
}

export function hintLayerPresent(explanation: unknown): boolean {
  if (!explanation || typeof explanation !== 'object') return false;
  return Object.values(explanation as Record<string, unknown>).some(
    (v) => (typeof v === 'string' && v.trim() !== '') || (v && typeof v === 'object' && Object.keys(v).length > 0),
  );
}

export function itemWholeness(item: WholenessInput, attestedEntryIds: ReadonlySet<string>) {
  const tagged = item.options.filter((o) => o.misconceptionId !== null);
  const tagsAttested = tagged.length > 0 && tagged.every((o) => attestedEntryIds.has(o.misconceptionId!));
  const executionsExist = tagged.length > 0 && tagged.every((o) => typeof o.misconceptionExecution === 'string' && o.misconceptionExecution.trim() !== '');
  const hintLayer = hintLayerPresent(item.explanation);
  return { tagsAttested, executionsExist, hintLayer, whole: tagsAttested && executionsExist && hintLayer };
}
