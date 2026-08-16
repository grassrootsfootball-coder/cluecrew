/**
 * THE READ PATH for library text (annie's ruling, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/export-misconception-library.ts`
 *
 * Three copy mismatches in two turns came from one cause: Cowork had no way to READ current library
 * text, so it worked from whatever it last downloaded — or from a fragment quoted in a report. The
 * DB holds library text; this is how Cowork sees it without keeping a copy to drift from.
 *
 * Every entry carries its CURRENT `childHint` verbatim and a gate verdict, so a proposal can be
 * written as a transform against quoted text and checked before it is sent. Hash-named and delivered
 * like every other export, so a re-read is a re-run rather than a remembered file.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma as defaultPrisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'misconception-library-current';

/**
 * The library's source, shared with `check-export-freshness`.
 *
 * MIXED, in annie's sense: the childHint text is CONTENT (it ages visibly — a reader comparing it
 * against the live hint sees the difference), but `status` and the gate verdict are STATUS, and
 * they age invisibly. The status half is why this needs a builder: a ratification changes what the
 * file says about an entry without changing the entry's text at all.
 */
export async function buildMisconceptionLibrarySource(prisma: typeof defaultPrisma): Promise<unknown> {
  return libraryEntries(prisma);
}

/**
 * THE STAMP MUST COVER WHAT IS DELIVERED, and for one run it did not.
 *
 * This builder projected FIVE fields while the delivered entries carried seventeen, so adding
 * `approvalNote` and the rest of the reviewer's own words changed the payload and left the
 * filename hash IDENTICAL — `6d3c109008854e71` on two materially different files. The name is the
 * thing every comparison in this repo cites; a name that does not move when the content moves is
 * a comparison that reports agreement between two different artefacts.
 *
 * Both now derive from one function, INCLUDING the gate verdict — and that is a reversal. It was
 * excluded at first, on the argument that an artefact's identity should not depend on the checker
 * (R62's coupling, one level up). The consequence was that the stamp covered something other than
 * the payload, so `check:stamp-covers-payload` could never verify this artefact, and the fault of
 * two files under one name could recur here undetected. The theoretical coupling costs nothing
 * real: `gate` is computed from `childHint`, which is already in the stamp, so including it adds
 * redundancy rather than new authority. Being VERIFIABLE beats being purely derived.
 */

/**
 * THE ONE PROJECTION. Both the delivered entries and the stamp source come from here, so a field
 * added to the delivery cannot leave the artefact's identity unchanged.
 */
async function libraryEntries(prisma: typeof defaultPrisma) {
  const rows = await prisma.misconception.findMany({ orderBy: [{ district: 'asc' }, { id: 'asc' }] });
  return rows.map((m) => {
    const hint = String(m.childHint ?? '');
    const failures = hint
      ? checkChildFacingText({ role: 'hint', label: m.id, text: hint, testedTokens: m.testedTokens ?? [] }).filter(isBlocking)
      : [];
    return {
      id: m.id,
      district: m.district,
      status: m.status,
      description: m.description,
      childHint: hint,               // VERBATIM — quote this when proposing a transform
      gate: failures.length ? failures.map((f) => f.detail) : 'clean',
      // THE REVIEWER'S OWN WORDS, which this export dropped until 2026-08-16. It carried 6 of the
      // 22 fields the row holds and named none of the reviewer-authored ones — R57 on the RETURN
      // leg, where nobody had been looking at all.
      //
      // `approvalNote` is the sharp case. Annie's entry for en-comparison-vehicle-misread carries
      // the DISCRIMINATOR — "attribute-transfer moves a quality BETWEEN CHARACTERS; this moves it
      // from a comparison's VEHICLE to its SUBJECT. Different remedies, different hints." Cowork
      // spent a run discovering by cold read that attribute-transfer was being used where it does
      // not fit. She wrote the answer on 8 August and the export was not carrying the field.
      approvalNote: m.approvalNote,
      approvalMethod: m.approvalMethod,
      approvedBy: m.approvedBy,
      proposedBy: m.proposedBy,
      rejectionNote: m.rejectionNote,
      rejectedBy: m.rejectedBy,
      category: m.category,
      axis: m.axis,
      sourcePattern: m.sourcePattern,
      teachback: m.teachback,
      testedTokens: m.testedTokens,
      // PROVENANCE OF THE TEXT. Absent means UNKNOWN, never absent — an entry whose source this
      // store cannot see is one nobody should treat as unsourced. That distinction is the whole
      // repair: Cowork corrected a true record of Annie's approval to false because it found
      // nothing on its own disk and read the silence as evidence.
      textProvenance: m.textProvenance ?? { state: 'UNKNOWN', note: 'no provenance recorded on this row' },
    };
  });
}

async function main(): Promise<void> {
  const prisma = defaultPrisma;
  const entries = await libraryEntries(prisma);

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(
    await buildMisconceptionLibrarySource(prisma),
    generatedAt,
    'mixed',
    'every misconception, with its verbatim childHint (content) and its status and gate verdict (status)',
    ['entries'],
  );
  const out = {
    kind: 'misconception-library-current',
    ...stamp,
    staleness:
      'MIXED SNAPSHOT. The hint text ages visibly; the status and gate verdict do not. A ratification ' +
      'changes what this file says about an entry without changing the entry text. Check with ' +
      '`pnpm check:export-freshness` before working from it.',
    note: 'The DB holds library text. Propose changes as a TRANSFORM against the childHint quoted here, never as a rewritten copy — a rewrite is how "or sound right" was lost. Do not keep this file as a working copy; re-run the export instead.',
    exportedAt: generatedAt,
    counts: {
      total: entries.length,
      byStatus: entries.reduce<Record<string, number>>((m, e) => ({ ...m, [e.status]: (m[e.status] ?? 0) + 1 }), {}),
      failingGate: entries.filter((e) => e.gate !== 'clean').length,
    },
    entries,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify(out, null, 2));
  deliver(path, FAMILY);
  console.log(`${entries.length} entries · ${out.counts.failingGate} failing the gate · ${JSON.stringify(out.counts.byStatus)}`);
  await prisma.$disconnect();
}

// Only when run directly: importing this for its source builder must not run the export
// (and must not `$disconnect()` the client the importer is still using).
if (process.argv[1]?.endsWith('export-misconception-library.ts')) void main();
