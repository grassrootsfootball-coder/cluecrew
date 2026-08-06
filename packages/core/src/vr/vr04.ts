/**
 * vr-04 CLOSEST-MEANING — constructor machinery from annie's sitting (2026-08-06).
 *
 * Three rules, all enforced here so the constructor (and the import door) share one
 * implementation rather than drifting:
 *   · TWO-PART SCREEN (annie's correction, 2026-08-06) — a two-sense headword is NOT
 *     disqualified from a bare card. The ambiguity only becomes a WRONG answer when a
 *     distractor is correct in the OTHER sense. So (a) the headword may stay, (b) any
 *     distractor living in another sense is a hard block. dark is fine as a distractor
 *     in general but forbidden under GLOOMY (the "gloomy room" sense). Per-headword.
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

/** Per-headword hard blocks: distractor words correct in the headword's OTHER sense
 *  (annie's two-part screen, 2026-08-06). These are exactly what a near-synonym
 *  generator reaches for first, so they block alongside VR04_NEVER_ADD. FAIR is absent
 *  because it is retired from bare cards (three live senses, no key survives — GLAD
 *  replaces it at T1). */
export const VR04_FORBIDDEN_BY_HEADWORD: Record<string, string[]> = {
  chilly: ['unfriendly', 'frosty', 'distant'],
  hollow: ['meaningless', 'false', 'worthless', 'deep', 'echoing'],
  generous: ['large', 'plentiful', 'ample'],
  gloomy: ['dark', 'dim', 'shadowy'],
  rare: ['underdone', 'pink'],
  bold: ['thick', 'dark', 'heavy'],
  humble: ['poor', 'simple', 'plain', 'shabby'],
  vague: ['forgetful', 'dreamy', 'absent-minded'],
  feeble: ['unconvincing', 'pathetic', 'lame'],
  genuine: ['honest', 'sincere', 'open'],
};

export type Vr04Diagnosis = 'WS' | 'SH' | 'OF' | 'SC' | 'OM';
export interface Vr04Distractor { word: string; diagnosis: Vr04Diagnosis }
export interface Vr04Row { n: number; tier: number; headword: string; key: string; carrier?: string | null; distractors: Vr04Distractor[] }

/** The words forbidden as distractors under a given headword (its other senses). */
export function forbiddenFor(headword: string): Set<string> {
  return new Set(VR04_FORBIDDEN_BY_HEADWORD[headword.toLowerCase()] ?? []);
}

/** Every rule against one row. Empty = clean. A defect blocks the row at import. */
export function checkVr04Row(row: Vr04Row): string[] {
  const errs: string[] = [];
  const bare = !row.carrier;
  const forbidden = forbiddenFor(row.headword);
  for (const d of row.distractors) {
    const w = d.word.toLowerCase();
    // The two-part screen: a distractor correct in the headword's OTHER sense.
    if (forbidden.has(w)) errs.push(`two-sense: "${d.word}" is correct in another sense of "${row.headword}" — a second correct answer; forbidden as a distractor`);
    if (VR04_NEVER_ADD.has(w)) errs.push(`never-add: "${d.word}" is a defensible second answer, not a distractor`);
    if (d.diagnosis === 'OM' && bare) errs.push(`the-other-meaning on the bare card "${row.headword}" — a second correct answer at T1-T3; OM needs a carrier sentence`);
  }
  return errs;
}

/**
 * NEAR-SYNONYM COMPOSITION FLAG (annie, 2026-08-07) — a flag, never a block.
 *
 * Two headwords in the same sense-family across different tiers (SWIFT T1 / RAPID T2)
 * may be a real duplication (asking the same question twice) or a legitimate difficulty
 * ladder (asking a harder question of the same word) — and NO threshold on the headwords
 * alone tells them apart. annie's correction: the question she answers when this fires is
 * never "are these two words too close", it is "does the harder item ask a HARDER
 * question" — and she cannot see that without the option sets. So the flag surfaces both
 * rows' full option sets (key + distractors); she rules in ten seconds. SWIFT/RAPID she
 * kept (tightening RAPID's distractors to close the gap); BRAVE/BOLD is a genuine ladder.
 *
 * Family membership is a curated list, not a similarity threshold — a discriminative word
 * list cannot answer the paired-tier question by construction (it keeps the rare half and
 * drops the common half, so absence of a near-synonym is what you would see either way).
 */
export const VR04_SYNONYM_GROUPS: Record<string, string[]> = {
  fast: ['swift', 'rapid', 'quick', 'speedy'],
  courage: ['brave', 'bold', 'daring'],
  happy: ['glad', 'jubilant', 'jovial'],
  sad: ['gloomy', 'melancholy'],
};

export interface Vr04SynonymFlagSide { headword: string; tier: number; key: string; options: string[] }
export interface Vr04SynonymFlag { group: string; a: Vr04SynonymFlagSide; b: Vr04SynonymFlagSide }

/** Surface every cross-TIER near-synonym headword pair with BOTH option sets, for a human
 *  call. Same-tier clustering is a separate corpus finding and is left out here. */
export function flagNearSynonymHeadwords(rows: Vr04Row[]): Vr04SynonymFlag[] {
  const groupOf = new Map<string, string>();
  for (const [g, members] of Object.entries(VR04_SYNONYM_GROUPS)) for (const m of members) groupOf.set(m, g);
  const side = (r: Vr04Row): Vr04SynonymFlagSide => ({ headword: r.headword, tier: r.tier, key: r.key, options: [r.key, ...r.distractors.map((d) => d.word)] });
  const flags: Vr04SynonymFlag[] = [];
  for (let i = 0; i < rows.length; i += 1) for (let j = i + 1; j < rows.length; j += 1) {
    const a = rows[i]!, b = rows[j]!;
    const g = groupOf.get(a.headword.toLowerCase());
    if (!g || groupOf.get(b.headword.toLowerCase()) !== g || a.tier === b.tier) continue;
    flags.push({ group: g, a: side(a), b: side(b) });
  }
  return flags;
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
