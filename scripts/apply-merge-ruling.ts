/**
 * APPLY ANNE-ANNIE-MERGE-RULING.md — moves 1-3 of the six-move worklist, this store's half.
 *
 * RULING APPLIER (R63: a human ruling supplies the values; provenance recorded, no derived-write
 * guard belongs here). Authority: ANNE-ANNIE-MERGE-RULING.md, cited by name and sha256 on every
 * write. **The six are enumerated BY PROPERTY against the pinned approval-batch artefact** (ruling
 * §3): the entries whose approvalAuthorshipNote begins "APPROVAL AUTHORSHIP UNKNOWN". An id list
 * remembered from R198 would be a recalled name (R178).
 *
 * REFUSES rather than adapts (ruling §6): any entry whose current text no longer matches the
 * move's description is reported and skipped, and the whole run reports it loudly.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';

const RULING_PATH = '/Users/davidb/Downloads/ANNE-ANNIE-MERGE-RULING.md';
const RULING_FILE = 'ANNE-ANNIE-MERGE-RULING.md';
const BATCH = '/Users/davidb/ClueCrew/content/exports/approval-batch-english-96b04e0b2d993975.json';
const WRITE = process.argv.includes('--write');

async function main(): Promise<void> {
  const rulingSha = createHash('sha256').update(readFileSync(RULING_PATH)).digest('hex');
  console.log(`authority: ${RULING_FILE} sha256=${rulingSha}`);

  // §3: enumerate by property against the pinned artefact.
  const batch = JSON.parse(readFileSync(BATCH, 'utf8')) as { entries: Array<{ id: string; textProvenance?: { approvalAuthorshipNote?: string } }> };
  const six = batch.entries
    .filter((e) => typeof e.textProvenance?.approvalAuthorshipNote === 'string'
      && e.textProvenance.approvalAuthorshipNote.startsWith('APPROVAL AUTHORSHIP UNKNOWN'))
    .map((e) => e.id)
    .sort();
  console.log(`enumerated by property from the pinned batch file: ${six.length} entries`);
  for (const id of six) console.log(`  · ${id}`);
  if (six.length !== 6) {
    console.error(`REFUSED: the property enumerates ${six.length}, and the ruling describes six. Not adapting.`);
    process.exit(1);
  }

  const rows = await prisma.misconception.findMany({ where: { id: { in: six } } });
  const refusals: string[] = [];
  let applied = 0;

  for (const row of rows) {
    const tp = { ...((row.textProvenance ?? {}) as Record<string, unknown>) };
    const note = typeof tp.approvalNote === 'string' ? tp.approvalNote : '';
    // TARGET CHECK (§6): the move's description says the note carries the never-crossed sentence.
    if (!note.includes('that claim never crossed and is not asserted here')) {
      refusals.push(`${row.id}: approvalNote no longer carries the never-crossed sentence — target moved; move 3 refused here`);
      continue;
    }
    if (tp.identityResolution !== undefined) {
      refusals.push(`${row.id}: identityResolution already present — move 2 would double-apply; refused`);
      continue;
    }
    // MOVE 2 — the resolution beside the doubt, on the row (R200's stated plan, executed verbatim).
    tp.identityResolution = {
      anneIsAnnie: true, settledBy: 'David', artefact: RULING_FILE, sha256: rulingSha, on: '2026-08-19',
    };
    // MOVE 3 — one appended sentence; the original stays visible above it.
    tp.approvalNote = note
      + ' [APPENDED 2026-08-19 under ANNE-ANNIE-MERGE-RULING.md: the claim has now crossed — Anne and '
      + 'Annie are ruled one person, canonicalReviewerName Annie; no approval weakened, strengthened '
      + 'or reopened.]';

    if (WRITE) {
      await prisma.misconception.update({ where: { id: row.id }, data: { textProvenance: tp as object } });
      // MOVE 1 — the AMENDED event, artefact by name and hash. Actor is the ruler; the writer names
      // itself and the authority it applied (R94: the act is his, the keystrokes are mine).
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: row.id, action: 'AMENDED',
          actor: 'human:david@cluecrew.test',
          recordedBy: `agent:claude-fable applying ${RULING_FILE}`,
          field: 'textProvenance',
          note: `Identity resolution recorded under ${RULING_FILE} (sha256 ${rulingSha.slice(0, 16)}…): '
            + 'Anne and Annie are one person, ruled. The 2026-08-16 annotation stands as a true record '
            + 'of what had crossed then; this appends the resolution beside it, never over it.`,
          method: `merge ruling application, enumerated by property against approval-batch-english-96b04e0b2d993975.json`,
          at: new Date(),
        },
      });
      applied += 1;
    }
  }

  console.log(`\n${WRITE ? 'APPLIED' : 'DRY RUN'}: moves 1-3 on ${WRITE ? applied : rows.length - refusals.length} of ${rows.length} · refused ${refusals.length}`);
  for (const r of refusals) console.log(`  x ${r}`);
  await prisma.$disconnect();
  process.exit(refusals.length > 0 ? 1 : 0);
}

void main();
