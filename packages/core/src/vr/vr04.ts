/**
 * vr-04 CLOSEST-MEANING — constructor machinery from annie's sitting (2026-08-06).
 *
 * Three rules, all enforced here so the constructor (and the import door) share one
 * implementation rather than drifting:
 *   · BARE-CARD SCREEN — a headword with two live senses cannot sit at T1-T3, because
 *     a single-word card cannot fix which sense, so it has two correct answers. Test:
 *     if you can write two carrier sentences that take different keys, it is polysemous.
 *   · NEVER-ADD — a hard block on the words a near-synonym generator reaches for first
 *     that are a defensible second answer (calm/composed for stoic; drain for receding).
 *   · THE-OTHER-MEANING — a gate, not a guideline: OM only where a carrier sentence
 *     fixes the sense (T4-T5). On a bare card it is a second correct answer; refuse it.
 * Plus a SCARCITY-AWARE selector so OM (FOUR rows of 40 — the honest ceiling: recede,
 * exhausted, exquisite, transparent are the only headwords with two live senses AND a
 * T4/T5 slot) is never rotated out — the vr-03 reversed-relation lesson, built in.
 *
 * annie's tagging distinction (recorded with the entries): WRONG-SHADE shares the core
 * sense and tilts it (stoic and gloomy are both emotional states); KEEPS-THE-SAME-COMPANY
 * shares no sense at all, only the social setting (brave and loyal are both compliments).
 */

/** Words that are a defensible second answer — never emitted as a vr-04 distractor. */
export const VR04_NEVER_ADD = new Set(['nervous', 'fearful', 'drain', 'subside', 'cover', 'mask', 'calm', 'composed', 'see-through']);

/** Headwords with two live senses — seeded from annie's rejections. The gate refuses
 *  these on a bare (T1-T3) card; extend as the bare-card screen flags more. */
export const VR04_POLYSEMOUS = new Set(['brisk', 'abrupt', 'content', 'fair']);

export type Vr04Diagnosis = 'WS' | 'SH' | 'OF' | 'SC' | 'OM';
export interface Vr04Distractor { word: string; diagnosis: Vr04Diagnosis }
export interface Vr04Row { n: number; tier: number; headword: string; key: string; carrier?: string | null; distractors: Vr04Distractor[] }

/** Screen a bare-card headword: null if it may sit at T1-T3, else the reason it may not. */
export function screenBareCard(headword: string): string | null {
  return VR04_POLYSEMOUS.has(headword.toLowerCase())
    ? `"${headword}" has two live senses — a bare card cannot fix the sense; it belongs at T4-T5 or nowhere`
    : null;
}

/** Every rule against one row. Empty = clean. A defect blocks the row at import. */
export function checkVr04Row(row: Vr04Row): string[] {
  const errs: string[] = [];
  const bare = !row.carrier;
  if (bare && row.tier <= 3) { const s = screenBareCard(row.headword); if (s) errs.push(s); }
  for (const d of row.distractors) {
    if (VR04_NEVER_ADD.has(d.word.toLowerCase())) errs.push(`never-add: "${d.word}" is a defensible second answer, not a distractor`);
    if (d.diagnosis === 'OM' && bare) errs.push(`the-other-meaning on the bare card "${row.headword}" — a second correct answer at T1-T3; OM needs a carrier sentence`);
  }
  return errs;
}

/**
 * Scarcity-aware distractor selection. Where a row carries the scarce OM tag, that
 * slot is FIXED and any rotation runs across the abundant tags — OM is never dropped
 * to top up an abundant one (which is how vr-03's reversed-relation fell to two).
 */
export function selectVr04Distractors(pool: Vr04Distractor[], keep: number): Vr04Distractor[] {
  if (pool.length <= keep) return pool;
  const scarce = pool.filter((d) => d.diagnosis === 'OM');
  const abundant = pool.filter((d) => d.diagnosis !== 'OM');
  return [...scarce, ...abundant].slice(0, keep);
}
