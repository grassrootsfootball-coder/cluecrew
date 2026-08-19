/**
 * THE THREE SENSES OF "LIVE" — one place, so a reader meets all three together.
 *
 * **"LIVE" HAS MEANT THREE THINGS AND THEY HAVE BEEN USED INTERCHANGEABLY** (David's ruling,
 * 2026-08-17 — R184). The reviewer has been triaging severity on the strongest reading while being
 * handed the weakest facts: told an item was "live", she reasonably understood *a child is meeting
 * this*, when all that had been established was *a reviewer signed it off*.
 *
 * `status: LIVE` KEEPS ITS NAME as a column — it is the first sense and it is the right word for it.
 * **Nothing else may say "live" without saying which.**
 *
 *   1. PUBLISHED — `status: LIVE`. A reviewer signed it off. A fact about REVIEW.
 *   2. SERVABLE  — PUBLISHED and `pool: PRACTICE`: it satisfies `itemPool`'s where-clause, so a door
 *                  drawing from that pool would return it. A fact about the POOL.
 *   3. REACHABLE(<population>) — SERVABLE and some door actually names its question type, FOR A
 *                  NAMED POPULATION. A fact about the PRODUCT.
 *
 * **REACHABLE NAMES WHO** (Cowork's correction, adopted 2026-08-17 — R190). Reachability is a
 * property of an item AND a population, so a bare "REACHABLE" is the old word at one remove: it
 * sounds settled and hides the same ambiguity one level down. The instance was mine, in the
 * document making this very argument — it called `ENG-028-PR-06` "LIVE and reachable today" and
 * then gave the counter-example two lines later: it sits behind `case-en-04`, which is paid, so a
 * free child cannot open it. **REACHABLE(free)** and **REACHABLE(paid)** are the two populations
 * that exist today. A bare REACHABLE is never written on either side.
 *
 * **DELIVERABLE IS NOT A FOURTH SENSE OF "LIVE" AND IS NOT ON THIS LADDER.** `check:serving-path`
 * asks whether an item RENDERS correctly when handed to the runner — routes to an engine, renders a
 * stem, resolves its passage and its citations. That is a property of the item's CONTENT and is
 * orthogonal: a DRAFT item can be deliverable, and a REACHABLE item can be undeliverable. The two
 * vocabularies answer different questions and are reported separately (R171).
 *
 * **THE LADDER IS STRICT: REACHABLE(free) implies REACHABLE(paid) implies SERVABLE implies
 * PUBLISHED.** Each step can only lose items. When counts are EQUAL that is a fact about today,
 * never a reason to stop distinguishing them — on the morning of 2026-08-17 the first three read
 * 332 / 332 / 298, and by that evening all three read 332 because four Case rows landed. **A
 * conflation is invisible exactly when the senses happen to agree** — which is why splitting
 * REACHABLE mattered: it agreed with SERVABLE at 332 and hid that only 318 reach a free child.
 */

export type ServingSense = 'PUBLISHED' | 'SERVABLE' | 'REACHABLE(free)' | 'REACHABLE(paid)';

export const SERVING_SENSES: ReadonlyArray<{ sense: ServingSense; means: string; factAbout: string }> = [
  { sense: 'PUBLISHED', means: 'status: LIVE — a reviewer signed it off', factAbout: 'review' },
  { sense: 'SERVABLE', means: 'PUBLISHED and pool: PRACTICE — itemPool would return it', factAbout: 'the pool' },
  { sense: 'REACHABLE(paid)', means: 'SERVABLE and any Case names its type', factAbout: 'the product' },
  { sense: 'REACHABLE(free)', means: 'SERVABLE and a FREE-TIER Case names its type', factAbout: 'the product, for a free child' },
];

/**
 * The triad, for printing at the head of any check or report that would otherwise say "live".
 * Every consumer prints the SAME three lines, so the vocabulary cannot drift between reports.
 */
export function servingSensesBanner(): string {
  return [
    `  "LIVE" MEANS ${SERVING_SENSES.length} THINGS AND THIS REPORT NAMES WHICH (R184, R190):`,
    ...SERVING_SENSES.map(
      (s) => `    ${s.sense.padEnd(16)} ${s.means}  [a fact about ${s.factAbout}]`,
    ),
    '    REACHABLE(free) implies REACHABLE(paid) implies SERVABLE implies PUBLISHED.',
    '    Equal counts are a fact about today. A bare "REACHABLE" is never written: it is the old',
    '    word at one remove, because reachability is a property of an item AND a population.',
    '    DELIVERABLE is NOT on this ladder — it asks whether an item RENDERS, and is orthogonal.',
  ].join('\n');
}
