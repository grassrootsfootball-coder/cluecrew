/**
 * WRITES REVIEWED CONTENT UNGUARDED. A HUMAN RULING SUPPLIED EVERY VALUE HERE (R63).
 *
 * One-shot. Applies David's ruling of 2026-08-16: `approvalAuthorKind` goes to UNKNOWN on the six
 * entries that carry her name as approver with no authored artefact behind it, on either side.
 *
 * **`approvedBy` STANDS AND IS NOT TOUCHED.** Approval is a DIFFERENT CLAIM from authorship, and
 * withdrawing it on an absence is the delivery-58 error — the one where Cowork corrected a TRUE
 * record of her approval to false because it could not find the artefact on its own disk. Not
 * finding a document is evidence about this disk. It is not evidence about what she did.
 *
 * So the two claims are marked separately and neither is withdrawn:
 *   hintAuthorKind      — did she WRITE the words?      Already UNKNOWN on two (R108).
 *   approvalAuthorKind  — did she APPROVE the entry?    UNKNOWN on all six, here.
 *
 * WHAT THE SHEET MUST THEN SAY, and the whole point of the ruling: *recorded as approved by you,
 * no artefact found, please confirm or correct.* Not "unapproved", which would be a false negative
 * on her own work, and not "approved by you", which is the claim nothing supports.
 *
 * TWO OF THE SIX ARE THE SUCCESSORS `ENG-001-WIW-04` AND `ENG-001-WIW-11` WERE RETAGGED ONTO
 * (`en-vocab-neighbouring-sense`, `en-vocab-form-lookalike`). The retag moved those items off a
 * RETIRED tag onto an entry whose approval rests on nothing anybody holds — R105's finding and this
 * one are the same fact met from two directions.
 */
import { Prisma, prisma } from '../packages/db/src/index';
import { exportApprovalBatch } from './export-approval-batch';

const RULED_ON = '2026-08-16';

/** The six. Derived by query and pinned here so a drifted population fails rather than half-applies. */
const IDS = [
  'en-within-span-wrong-element',
  'en-negation-dropped',
  'en-vocab-neighbouring-sense',
  'en-vocab-form-lookalike',
  'en-coordination-wrong-conjunct',
  'en-whole-text-absence-asserted',
] as const;

const APPROVAL_NOTE =
  'APPROVAL AUTHORSHIP UNKNOWN. This entry is recorded as approved by Annie and that record STANDS — '
  + 'it is not withdrawn. What is unknown is what it rests on: no document she authored, on either '
  + 'side, records the approval. Cowork searched every file under its own roots and found none; '
  + '1,738 artefacts were scanned here and found none. The claim traces to one sentence in a '
  + 'metadata field that Cowork itself wrote. Withdrawing the approval on that absence would be the '
  + 'delivery-58 error — an absence of evidence read as evidence of absence, against her own work. '
  + 'So it is marked, not reversed: recorded as approved by her, no artefact found, hers to confirm '
  + 'or correct. Ruled by David, 2026-08-16.';

async function main(): Promise<void> {
  const rows = await prisma.misconception.findMany({ where: { id: { in: [...IDS] } } });
  if (rows.length !== IDS.length) {
    throw new Error(`expected ${IDS.length} entries, found ${rows.length} — nothing written`);
  }

  // THE POPULATION IS RE-DERIVED, NOT TRUSTED. If a seventh entry now carries an approval claim
  // naming her, this ruling did not cover it and the run stops rather than silently under-applying.
  const claiming = await prisma.misconception.findMany({
    where: { district: 'ENGLISH' },
    select: { id: true, textProvenance: true },
  });
  const withClaim = claiming
    .filter((m) => JSON.stringify(m.textProvenance ?? {}).includes('Anne'))
    .map((m) => m.id)
    .sort();
  const uncovered = withClaim.filter((id) => !IDS.includes(id as typeof IDS[number]));
  if (uncovered.length) {
    throw new Error(`${uncovered.length} entry/entries carry an approval claim and are NOT in this `
      + `ruling: ${uncovered.join(', ')}. Nothing written — the ruling was made about six.`);
  }
  console.log(`Population re-derived: ${withClaim.length} entries carry an approval claim naming her; `
    + `the ruling covers ${IDS.length}. No gap.`);

  for (const row of rows) {
    const prior = (row.textProvenance ?? {}) as Record<string, unknown>;
    if (prior.approvalAuthorKind === 'UNKNOWN') {
      throw new Error(`${row.id}: already UNKNOWN — the row is not in the state the ruling was made `
        + 'about, so nothing is written. R87.');
    }
    await prisma.misconception.update({
      where: { id: row.id },
      data: {
        // approvedBy is NOT in this update. Deliberately. It stands.
        textProvenance: {
          ...prior,
          approvalAuthorKind: 'UNKNOWN',
          approvalAuthorshipNote: APPROVAL_NOTE,
          approvalAuthorshipRuledOn: RULED_ON,
        } as Prisma.InputJsonValue,
      },
    });
    console.log(`  ${row.id}: approvalAuthorKind -> UNKNOWN (approvedBy untouched: ${String(row.approvedBy)})`);
  }

  const after = await prisma.misconception.findMany({ where: { id: { in: [...IDS] } } });
  const wrong = after.filter((r) => (r.textProvenance as Record<string, unknown>)?.approvalAuthorKind !== 'UNKNOWN');
  if (wrong.length) throw new Error(`did not land on: ${wrong.map((r) => r.id).join(', ')}`);
  const changedApprover = after.filter((r, i) => r.approvedBy !== rows[i]!.approvedBy);
  if (changedApprover.length) throw new Error('approvedBy moved — it must not; nothing here writes it');
  console.log(`\nVerified by re-reading ${after.length} row(s): all UNKNOWN, no approvedBy moved.`);

  await exportApprovalBatch();
  await prisma.$disconnect();
}

void main();
