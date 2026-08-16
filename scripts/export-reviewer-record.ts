/**
 * THE REVIEWER RECORD — `pnpm export:reviewer-record`
 *
 * Four of the five return-leg classes R88 found NOT CARRIED, in the order David ruled:
 *
 *   1. `reviewer-identity`      2 rows — who holds the role, since when, on what evidence.
 *   2. `ruling-notes`         202 rows — the reasoning attached to every NAMED ruling.
 *   3. `item-review-notes`    301 rows — why an item came back, and how the decision was recorded.
 *   4. `word-review-notes`     14 rows — vocabulary card rulings.
 *
 * IDENTITY GOES FIRST OF THESE FOUR AND THE REASON IS STRUCTURAL: without it a ruling attributed to
 * `current-reviewer` cannot be resolved to a person on the authoring side. Every one of the 202
 * notes below is signed by an id that means nothing without the two rows in the first artefact —
 * so delivering the reasoning without the identity would deliver 202 anonymous opinions.
 *
 * VERBATIM, PER R25: when a value carries a signature, send the value and not an account of it.
 * Every note, method and evidence string is the stored field unchanged. Nothing here summarises.
 *
 * FOUR SEPARATE ARTEFACTS, not one bundle. Each has its own stamp and its own freshness, so
 * `check:return-leg` can report one class STALE without the other three hiding behind it.
 *
 * EACH STAMP COVERS THE PAYLOAD IT SHIPS (R88). The library export was stamped from a five-field
 * projection while delivering seventeen, and two materially different files went out under one
 * name. Here the delivered array IS the stamp source, for all four.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma as defaultPrisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');

interface Artefact { family: string; note: string; entries: unknown[] }

async function build(prisma: typeof defaultPrisma): Promise<Artefact[]> {
  // 1. IDENTITY. The id is stable and opaque; displayName is what a human reads. Both travel,
  // because the authoring side sees only the id and cannot resolve it.
  const reviewers = await prisma.reviewer.findMany({ orderBy: { heldFrom: 'asc' } });
  const identity = reviewers.map((r) => ({
    reviewerId: r.id,
    displayName: r.displayName,
    resolvesActor: r.resolvesActor,
    heldFrom: r.heldFrom.toISOString(),
    heldUntil: r.heldUntil?.toISOString() ?? null,
    stillHolds: r.heldUntil === null,
    evidence: r.evidence,
  }));

  // 2. THE REASONING. Only events with a NAMED reviewer: an event with no reviewerId is one of the
  // 609 that predate R65, and shipping those as reviewer judgement would attribute prose to nobody.
  const events = await prisma.attributionEvent.findMany({
    where: { note: { not: null }, reviewerId: { not: null } },
    orderBy: { at: 'asc' },
  });
  const rulings = events.map((e) => ({
    reviewerId: e.reviewerId,
    recordType: e.recordType,
    recordId: e.recordId,
    action: e.action,
    field: e.field,
    at: e.at.toISOString(),
    method: e.method,
    note: e.note,
    subjectHash: e.subjectHash,
    recordedBy: e.recordedBy,
  }));

  // 3. ITEM REVIEW NOTES. reviewedBy is whose judgement; reviewRecordedBy is who typed it. The
  // pair travels together or the distinction is lost at the far end.
  const items = await prisma.item.findMany({
    where: { OR: [{ reviewNotes: { not: null } }, { reviewRecordNote: { not: null } }] },
    select: {
      id: true, status: true, reviewNotes: true, reviewRecordNote: true,
      reviewMethod: true, reviewedBy: true, reviewRecordedBy: true,
    },
    orderBy: { id: 'asc' },
  });

  // 4. WORD REVIEW NOTES.
  const words = await prisma.word.findMany({
    where: { reviewNotes: { not: null } },
    select: { id: true, headword: true, status: true, reviewNotes: true },
    orderBy: { id: 'asc' },
  });

  return [
    {
      family: 'reviewer-identity',
      note:
        'Who holds the reviewer role, since when, and on what evidence. Without this every ruling '
        + 'signed "current-reviewer" is unresolvable on the authoring side.',
      entries: identity,
    },
    {
      family: 'ruling-notes',
      note:
        'The reasoning attached to every ruling with a NAMED reviewer, verbatim. Events with no '
        + 'reviewerId are excluded: they predate R65 and shipping them here would attribute prose '
        + 'to nobody.',
      entries: rulings,
    },
    {
      family: 'item-review-notes',
      note:
        'Why an item was returned, and how the decision was recorded. reviewedBy is whose '
        + 'judgement it was; reviewRecordedBy is who typed it. The two are never merged.',
      entries: items,
    },
    {
      family: 'word-review-notes',
      note: 'Vocabulary card rulings, verbatim.',
      entries: words,
    },
  ];
}

async function main(): Promise<void> {
  const prisma = defaultPrisma;
  const artefacts = await build(prisma);

  // Every class is expected to hold rows today. An empty one means the query or the column moved,
  // and "0 reviewer rulings" is a sentence nobody should be able to read as good news.
  requirePopulation('export:reviewer-record', Object.fromEntries(
    artefacts.map((a) => [a.family, a.entries.length]),
  ));

  mkdirSync(OUT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  for (const a of artefacts) {
    const stamp = artefactStamp(a.entries, generatedAt, 'content', a.note);
    const body = { kind: a.family, note: a.note, generatedAt, stamp, count: a.entries.length, entries: a.entries };
    const path = join(OUT_DIR, stampedName(a.family, stamp.sourceHash, 'json'));
    writeFileSync(path, JSON.stringify(body, null, 2));
    deliver(path, a.family);
    console.log(`  ${a.family.padEnd(20)} ${String(a.entries.length).padStart(4)} entries`);
  }
  await prisma.$disconnect();
}

void main();
