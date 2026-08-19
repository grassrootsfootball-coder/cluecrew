/**
 * WRITES REVIEWED CONTENT UNGUARDED — a one-shot ruling-applier (R63). Values come from a human
 * ruling, not a derivation function.
 *
 * **THE BLOCKER WAS TRANSCRIPTION, NOT REVIEW** (David, 2026-08-19). All 34 SpaG items are signed —
 * her fourth return, section 1: *"ENG-003 set A stands at 34 of 34 signed."* `reviewedBy` read 0 of
 * 34 because **her signature exists as a DOCUMENT and not as a VALUE**, which is the third time this
 * week a signature has lived in prose while the field the CMS reads stayed empty.
 *
 * **HER NAME IS NOT WRITTEN BY A HAND THAT IS NOT HERS** (David's ruling, and R94/R203 in one).
 * `reviewedBy` gets a POINTER TO THE READING — the return document and its hash — never the string
 * "Annie". A bare name in that field would assert that she operated the CMS, which she did not and
 * does not; the pointer asserts exactly what happened, which is that a signature exists elsewhere
 * and this row cites it. `reviewRecordedBy` carries who typed it.
 *
 * **THE HASH IS RECOMPUTED HERE, NEVER COPIED.** A transcription that quotes a hash from prose is
 * the same class of fault as the signature living in prose: it records that someone believed the
 * document said something. This reads the file, hashes it, and refuses if the document is missing.
 *
 * THIS DOES NOT PUBLISH. `publishBlockers` refuses `own-item`, so someone other than the author
 * walks the 34 through the review path; this only makes the signature visible to that path.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';

const RETURN_FILE = 'content/evidence/annie-eng003-fourth-return.md';
const RETURN_SECTION = '1. Signatures complete';
/** The sentence the transcription rests on. Asserted against the file, never assumed. */
const RETURN_CLAIM = 'ENG-003 set A stands at 34 of 34 signed';
const TYPES = ['en-spag-cloze', 'en-spag-punct-spot', 'en-spag-spelling-spot'];
const RECORDER = 'human:david@cluecrew.test';

async function main() {
  const path = resolve(import.meta.dirname, '..', RETURN_FILE);
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    throw new Error(`REFUSED: ${RETURN_FILE} is not on disk. A signature transcription with no document to point at is the fault it exists to fix.`);
  }
  if (!text.includes(RETURN_CLAIM)) {
    throw new Error(`REFUSED: ${RETURN_FILE} does not contain the claim "${RETURN_CLAIM}". The document moved; report, do not adapt.`);
  }
  const hash = createHash('sha256').update(text).digest('hex');

  const items = await prisma.item.findMany({
    where: { questionTypeId: { in: TYPES } },
    select: { id: true, questionTypeId: true, status: true, reviewedBy: true, reviewRecordedBy: true },
    orderBy: { id: 'asc' },
  });
  if (items.length !== 34) throw new Error(`REFUSED: expected 34 SpaG items, found ${items.length}.`);
  // All 34 are signed by the same §1 sentence, so all 34 take the same pointer. The Case row
  // opens on the nine punct-spot items; the other 25 are transcribed here and wait on their door.

  // The pointer. Deliberately NOT a person-shaped string — it must be unmistakable for a name.
  const pointer = `return:${RETURN_FILE}#${hash.slice(0, 16)}`;

  const already = items.filter((i) => i.reviewedBy === pointer);
  if (already.length === items.length) {
    console.log(`All ${items.length} already carry this pointer. Nothing to write.`);
    await prisma.$disconnect();
    return;
  }
  const conflicting = items.filter((i) => i.reviewedBy !== null && i.reviewedBy !== pointer);
  if (conflicting.length > 0) {
    throw new Error(`REFUSED: ${conflicting.length} item(s) already carry a different reviewedBy (${conflicting.slice(0, 3).map((c) => `${c.id}=${c.reviewedBy}`).join(', ')}). Overwriting an existing signature is not transcription.`);
  }

  for (const item of items) {
    await prisma.item.update({
      where: { id: item.id },
      data: { reviewedBy: pointer, reviewRecordedBy: RECORDER },
    });
  }

  const back = await prisma.item.findMany({
    where: { questionTypeId: { in: TYPES } },
    select: { id: true, reviewedBy: true, reviewRecordedBy: true },
  });
  const written = back.filter((i) => i.reviewedBy === pointer && i.reviewRecordedBy === RECORDER);
  console.log(`transcribed: ${items.length} · read back carrying the pointer: ${written.length} of ${back.length}`);
  if (written.length !== back.length) throw new Error('read-back disagrees with the write');

  console.log(`\n  document : ${RETURN_FILE}`);
  console.log(`  section  : ${RETURN_SECTION}`);
  console.log(`  claim    : "${RETURN_CLAIM}"`);
  console.log(`  sha256   : ${hash}`);
  console.log(`  reviewedBy       = ${pointer}   (a POINTER to the reading, not a name)`);
  console.log(`  reviewRecordedBy = ${RECORDER}  (the hand that typed it)`);
  console.log('\n  NOT PUBLISHED. publishBlockers refuses own-item, so someone other than the author');
  console.log('  walks these 34 through the review path. This only makes the signature visible to it.');
  await prisma.$disconnect();
}

main();
