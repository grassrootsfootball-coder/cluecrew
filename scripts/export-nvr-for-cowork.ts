/**
 * THE 22 NVR LIBRARY ENTRIES, VERBATIM, SO COWORK'S WRITE CAN COMPLETE.
 *
 * **AND A CORRECTION TO WHAT WAS ASKED FOR.** The instruction was to send "the eleven amended NVR
 * values". **This store does not hold them and cannot send them.** Annie's eighth return recorded
 * eleven of the twenty-two as approved WITH AMENDMENTS; the amended TEXT never crossed, and no
 * artefact here carries it. Sending eleven strings under that name would mean sending this store's
 * CURRENT text as though it were her amendment — the precise fault of R222, one week old.
 *
 * **WHAT THIS SENDS INSTEAD IS THE THING THE HOUSE RULE SAYS COWORK NEEDS.** The DB authors library
 * text and Cowork proposes TRANSFORMS against quoted DB text, keeping no local copy to drift from.
 * So the useful delivery is every NVR entry's current `childHint` verbatim, plus which are settled
 * and which are not. If Cowork's blocked write is a transform against this store's text, this
 * unblocks it today. If it genuinely needs Annie's eleven amended strings, **neither store has
 * them and she is the only source** — and that is a finding, not a delay.
 *
 * Read path per the house rule: the same projection `export-misconception-library.ts` delivers,
 * narrowed to NVR, regenerated rather than reused from a download.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'nvr-library-for-cowork';
const ANNIE = 'reviewer:rev-0001';

/** Settled on her eighth return by approval-on-reading, as written (R225). */
const APPROVED_AS_WRITTEN = [
  'nvr-wrong-mirror-axis', 'nvr-code-row-swap', 'nvr-count-by-glance', 'nvr-mirror-for-rotation',
  'nvr-multi-part-tracking', 'nvr-series-phase-slip', 'nvr-transform-not-applied',
];

async function main() {
  const rows = await prisma.misconception.findMany({ where: { district: 'NVR' }, orderBy: { id: 'asc' } });
  // Read, never recalled (R178): the Reviewer row the approver value actually points at.
  const reviewer = await prisma.reviewer.findUnique({ where: { id: 'rev-0001' } });
  requirePopulation('NVR library for Cowork', { 'NVR entries': rows.length });

  const entries = rows.map((row) => {
    const faults = checkChildFacingText({ role: 'hint', label: `misconception:${row.id}`, text: row.childHint });
    return {
      id: row.id,
      // R25 — the value, not an account of it.
      childHint: row.childHint,
      description: row.description,
      status: row.status,
      approvedByRecordedAs: row.approvedBy,
      settledState: APPROVED_AS_WRITTEN.includes(row.id)
        ? 'SETTLED — approved as written by Annie on her eighth return, 2026-08-19'
        : 'NOT SETTLED HERE — this is the text this store holds, not an approved value',
      gateVerdict: faults.filter(isBlocking).length === 0 ? 'PASSES' : 'BLOCKED',
      gateFaults: faults.map((f) => `${f.rule}: ${f.detail}`),
    };
  });

  const settled = entries.filter((e) => e.settledState.startsWith('SETTLED'));

  const payload = {
    what: 'Every NVR library entry in this store, childHint verbatim, so a transform can be proposed against quoted text.',
    correctionToTheRequest:
      'Asked for "the eleven amended NVR values". THIS STORE DOES NOT HOLD THEM. Her eighth return recorded eleven approved WITH AMENDMENTS and the amended text never crossed; no artefact here carries it. Sending this store\'s current text under the name "her amendment" would assert an authorship nobody here can vouch for.',
    houseRule:
      'The DB authors library text; Cowork proposes changes as a TRANSFORM against quoted DB text and keeps no local copy to drift from. This file is that quoted text, regenerated rather than reused.',
    ifTheElevenAreGenuinelyNeeded:
      'Neither store holds them. Annie is the only source. That is a finding to put to her, not a delay to absorb.',
    /**
     * **`carryingAnnie` WAS A LABEL, NOT A MEASUREMENT** (Cowork's flag, 2026-08-19 — R256). The
     * approver field on those rows reads `reviewer:rev-0001`; the NAME "Annie" appears nowhere in
     * this file as an approver value, and the count was taken from a settled-state SENTENCE I had
     * written rather than from the field. A denominator named for a person, derived from prose
     * about that person, is the shape R94 exists to refuse — reported one level up, in a
     * denominator instead of a row.
     *
     * Renamed to what it counts, with the resolution stated rather than assumed.
     */
    denominators: {
      nvrEntries: rows.length,
      settledByHerEighthReturn: settled.length,
      carryingAnApprover: entries.filter((e) => e.approvedByRecordedAs !== null).length,
      carryingApproverValue_reviewerRev0001: entries.filter((e) => e.approvedByRecordedAs === ANNIE).length,
      failingTheGate: entries.filter((e) => e.gateVerdict === 'BLOCKED').length,
    },
    whoIsReviewerRev0001: {
      question: 'Is `reviewer:rev-0001` the Annie who signs the returns?',
      measurableFromTheseFiles: false,
      measurableInThisStore: true,
      thisStoreSays: {
        reviewerRowId: 'rev-0001',
        displayName: reviewer?.displayName ?? 'NO ROW FOUND',
        resolvesActor: reviewer?.resolvesActor ?? null,
        heldFrom: reviewer?.heldFrom?.toISOString() ?? null,
        heldUntil: reviewer?.heldUntil?.toISOString() ?? null,
        staffEmail: reviewer?.staffEmail ?? null,
      },
      caution:
        'This store maps rev-0001 to the display name "Annie", and ANNE-ANNIE-MERGE-RULING.md rules Annie the canonical reviewer name. That is a mapping in THIS store, not a fact either file carries. It also binds to a SHARED role account (staff-reviewer@cluecrew.test), so anyone holding that login signs as her.',
      state: 'RESOLVED IN THIS STORE, UNRESOLVED BETWEEN THE STORES — neither side should infer it from the other\'s file.',
    },
    entries,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    "every NVR library entry's verbatim childHint with its settled state and gate verdict", ['entries']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`NVR entries: ${rows.length} · settled by her eighth return: ${settled.length} · failing the gate: ${payload.denominators.failingTheGate}`);
  console.log(`carrying an approver: ${payload.denominators.carryingAnApprover} · carrying the value ${ANNIE}: ${payload.denominators.carryingApproverValue_reviewerRev0001}`);
  console.log(`rev-0001 resolves in THIS store to displayName "${reviewer?.displayName}" — a mapping here, not a fact either file carries.`);
  console.log(`\n  ${path}`);
  await prisma.$disconnect();
}

main();
