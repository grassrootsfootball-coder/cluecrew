/**
 * WRITES REVIEWED CONTENT UNGUARDED — a one-shot ruling-applier (R63). Values come from a human
 * ruling, not a derivation function; what it owes is provenance, which is what it writes.
 *
 * **THE TWO DEDUPES** (David, 2026-08-19, naming them so they stop being guessed):
 * `en-subject-verb-agreement-by-proximity` and `en-comparative-superlative-form`. Annie's approved
 * QUEUE text survives; the capped LIBRARY text is superseded.
 *
 * **AND THE STATE FOUND IS NOT THE STATE ASSUMED, WHICH IS WHY THIS WRITES A RECORD AND NOT A
 * TEXT.** Both rows ALREADY carry the surviving queue text — checked before writing, against the
 * store. There is no duplicate ROW to retire: the duplication is two TEXTS for one id, the capped
 * one surviving only in historical library exports. So the dedupe's outstanding work was never the
 * text; it was that **nothing anywhere recorded that a text had been superseded, or by what.**
 *
 * The superseded text travels VERBATIM (R25) rather than as "the capped version" — a description
 * of a string that was retired for its wording is the one thing that cannot stand in for it.
 */
import { prisma } from '../packages/db/src/index';

const ANNIE = 'reviewer:rev-0001';

/** The capped library text each row's queue text superseded, quoted from the pinned exports. */
const SUPERSEDED: Record<string, string> = {
  'en-subject-verb-agreement-by-proximity': 'Cross out the of-part, then match the verb to what is left.',
  'en-comparative-superlative-form': "Two things take -er. Three or more take -est. Never both -est and 'most'.",
};

async function main() {
  const rows = await prisma.misconception.findMany({ where: { id: { in: Object.keys(SUPERSEDED) } }, orderBy: { id: 'asc' } });
  if (rows.length !== 2) throw new Error(`REFUSED: expected 2 rows, found ${rows.length}. A ruling whose target moved is reported, never adapted.`);

  for (const row of rows) {
    const superseded = SUPERSEDED[row.id]!;
    if (row.childHint.trim() === superseded.trim()) {
      throw new Error(`REFUSED: ${row.id} still carries the SUPERSEDED text. This script records a completed dedupe; it does not perform one.`);
    }
    const prior = (row.textProvenance ?? {}) as Record<string, unknown>;
    await prisma.misconception.update({
      where: { id: row.id },
      data: {
        approvedBy: ANNIE,
        approvalMethod: 'approved queue text, dedupe ruling 2026-08-19',
        textProvenance: {
          ...prior,
          state: 'RECORDED',
          servingText: row.childHint,
          servingTextRole: "ANNIE'S APPROVED QUEUE TEXT — the survivor of the dedupe",
          approvedByPerson: ANNIE,
          supersededText: {
            text: superseded,
            role: 'THE CAPPED LIBRARY TEXT',
            supersededOn: '2026-08-19',
            supersededByRuling: "David's dedupe ruling, naming both entries",
            stillReadableIn: 'historical misconception-library-current exports; retained, not deleted',
          },
          dedupeShape:
            'TWO TEXTS, ONE ROW — not two rows. No entry was retired, so no row needed a field naming its superseder; the general rule (a retired row keeps its text and names the entry that superseded it) has no instance here.',
          recordedAt: '2026-08-19',
        },
        approvalNote: `${row.approvalNote ?? ''} | DEDUPE RECORDED 2026-08-19: queue text survives, capped library text superseded and quoted in textProvenance.`.trim(),
      },
    });
    console.log(`  ${row.id}`);
    console.log(`      survives:   ${row.childHint}`);
    console.log(`      superseded: ${superseded}`);
  }
  console.log('\n2 dedupes recorded. No childHint changed — both rows already carried the surviving text.');
  await prisma.$disconnect();
}

main();
