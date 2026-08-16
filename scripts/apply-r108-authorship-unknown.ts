/**
 * WRITES REVIEWED CONTENT UNGUARDED. A HUMAN RULING SUPPLIED EVERY VALUE HERE (R63).
 *
 * One-shot. Applies David's ruling of 2026-08-16: `en-within-span-wrong-element` and
 * `en-negation-dropped` are marked AUTHORSHIP UNKNOWN, not as Annie's words.
 *
 * WHY THE STORE AND NOT THE SHEET. The paper batch renders `textProvenance` — so correcting only
 * the rendering would leave the store still claiming `hintAuthorKind: PERSON, hintAuthoredBy:
 * Annie`, and the next export would say it again. The false claim is IN THE DATA. This is the same
 * lesson as the hard-coded 172: prose that was never derived from anything, believed because it
 * was written down.
 *
 * WHAT WE KNOW AND WHAT WE DO NOT, which is the whole content of the ruling:
 *   · The text has been in the store since the batch-1 import and has not moved since.
 *   · It matches the "## 3. Proposed child hint" section of `LIB-PROPOSAL-*.md` — documents written
 *     TO her by the drafting side, not BY her. Byte-identical for within-span; for negation-dropped
 *     identical once markdown emphasis is read as apostrophes (`*not*` stored as `'not'`).
 *   · No document authored by her, anywhere on this disk, contains either string. 1,738 text
 *     artefacts scanned across Downloads, content/ and docs/. Two artefacts of hers exist here —
 *     `annie-eng028-return.md` and `annie-maths-families.md` — and neither carries these.
 *   · The claim that the text is hers rests on ONE ambiguous sentence in another agent's metadata
 *     field: "Two are Anne's own text quoted verbatim from her proposals". "Her proposals" can mean
 *     proposals BY her or TO her, and every artefact here says the latter.
 *
 * UNKNOWN IS NOT ABSENT AND IT IS NOT A DENIAL (R98). This does not assert she did not write them.
 * It records that nothing available can tell, which is the true state, and which she can settle in
 * one sentence that nobody else can supply.
 */
import { Prisma, prisma } from '../packages/db/src/index';
import { exportApprovalBatch } from './export-approval-batch';

const RULED_ON = '2026-08-16';
const IDS = ['en-within-span-wrong-element', 'en-negation-dropped'] as const;

const AUTHORSHIP_NOTE =
  'AUTHORSHIP UNKNOWN. What we know: this text has been in the store since the batch-1 import and '
  + 'has not moved since, and it matches the "Proposed child hint" section of the LIB-PROPOSAL '
  + 'document for this entry — a document written TO the reviewer by the drafting side. What we do '
  + 'not know: whether the words are hers. We hold no document authored by her containing this '
  + 'text; 1,738 artefacts were scanned. The claim that it was hers rests on one ambiguous sentence '
  + 'in another agent\'s metadata field ("Anne\'s own text quoted verbatim from her proposals"), '
  + 'where "her proposals" may mean proposals BY her or TO her. Recorded UNKNOWN rather than as '
  + 'hers, on David\'s ruling of 2026-08-16. This is not a denial that she wrote it — it is a '
  + 'record that nothing here can tell, which only she can settle.';

async function main(): Promise<void> {
  const rows = await prisma.misconception.findMany({ where: { id: { in: [...IDS] } } });
  if (rows.length !== IDS.length) {
    throw new Error(`expected ${IDS.length} entries, found ${rows.length} — nothing written`);
  }

  for (const row of rows) {
    const prior = (row.textProvenance ?? {}) as Record<string, unknown>;
    if (prior.hintAuthorKind !== 'PERSON') {
      throw new Error(`${row.id}: expected hintAuthorKind PERSON, found ${String(prior.hintAuthorKind)} — `
        + 'the row is not in the state the ruling was made about, so nothing is written. R87.');
    }
    await prisma.misconception.update({
      where: { id: row.id },
      data: {
        textProvenance: {
          ...prior,
          hintAuthorKind: 'UNKNOWN',
          hintAuthoredBy: null,
          hintAuthorshipNote: AUTHORSHIP_NOTE,
          // The superseded claim is KEPT, not deleted. It is the thing she is being asked about,
          // and a correction that erases what it corrected leaves her ruling unreadable later.
          hintAuthorKindWasClaimedAs: prior.hintAuthorKind,
          hintAuthoredByWasClaimedAs: prior.hintAuthoredBy,
          hintAuthorshipRuledOn: RULED_ON,
        } as Prisma.InputJsonValue,
      },
    });
    console.log(`  ${row.id}: hintAuthorKind PERSON/${String(prior.hintAuthoredBy)} -> UNKNOWN`);
  }

  // RE-READ WHAT WAS WRITTEN. A door that reports success re-reads what it claims to have written.
  const after = await prisma.misconception.findMany({ where: { id: { in: [...IDS] } } });
  const wrong = after.filter((r) => (r.textProvenance as Record<string, unknown>)?.hintAuthorKind !== 'UNKNOWN');
  if (wrong.length) throw new Error(`did not land on: ${wrong.map((r) => r.id).join(', ')}`);
  console.log(`\nVerified by re-reading ${after.length} row(s): both now UNKNOWN.`);

  // A SCRIPT THAT APPLIES A RULING RE-EXPORTS THE AFFECTED ARTEFACT AS ITS FINAL STEP. The paper
  // batch is exactly the artefact this ruling was made about, and it is currently HELD because it
  // asserted the claim being corrected.
  await exportApprovalBatch();
  await prisma.$disconnect();
}

void main();
