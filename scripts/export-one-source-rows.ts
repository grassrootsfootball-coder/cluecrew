/**
 * THE TWO ONE-SOURCE ROWS — both texts side by side, for Annie to settle.
 *
 * **AND THE FRAMING WAS WRONG, WHICH IS THE FINDING.** These were recorded as *"pinned witness
 * holds a LONGER text; this database differs, so which is the pre-cap original is hers to settle"*
 * — 21-versus-16 and 23-versus-16. Reading the two texts against each other shows something else:
 * **they are the same length and they say different things.** Neither is a capped version of the
 * other. They are independent drafts of the same misconception, and the word-cap sweep never
 * touched this pair.
 *
 * That changes what she is being asked. Not *"which of these is the original before it was
 * shortened"* — a question with a factual answer that a length comparison could support — but
 * **"which of these two hints should a child read"**, which is an authoring judgement and hers
 * alone. Sending the first question with the second question's evidence would have got an answer
 * to neither.
 *
 * R25: the values travel, both of them, verbatim. A summary of a disagreement between two texts is
 * the one thing that cannot stand in for the texts.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const EVIDENCE = resolve(import.meta.dirname, '../content/evidence');
const FAMILY = 'one-source-rows-both-texts';

const IDS = ['en-coordination-wrong-conjunct', 'en-whole-text-absence-asserted'];
const WITNESSES = ['PLATFORM-IMPORT-BATCH-2.json', 'PLATFORM-IMPORT-english-misconceptions.json'];

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Pull an entry's hint out of a witness file by id, whatever nesting it sits in. */
function hintFromWitness(file: string, id: string): string | null {
  const found: string[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node === null || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    if (obj.id === id && typeof obj.childHint === 'string') found.push(obj.childHint);
    Object.values(obj).forEach(walk);
  };
  walk(JSON.parse(readFileSync(join(EVIDENCE, file), 'utf8')));
  if (found.length === 0) return null;
  const distinct = [...new Set(found)];
  if (distinct.length > 1) throw new Error(`${file} holds ${distinct.length} different hints for ${id} — refusing to pick one`);
  return distinct[0]!;
}

async function main() {
  const rows = await prisma.misconception.findMany({ where: { id: { in: IDS } }, orderBy: { id: 'asc' } });
  requirePopulation('one-source rows', { 'ids asked about': IDS.length, 'rows found here': rows.length });

  const pairs = rows.map((row) => {
    const witness = WITNESSES.map((f) => ({ file: f, childHint: hintFromWitness(f, row.id) })).filter((w) => w.childHint !== null);
    const witnessTexts = [...new Set(witness.map((w) => w.childHint!))];
    if (witnessTexts.length !== 1) throw new Error(`${row.id}: witnesses disagree with each other (${witnessTexts.length} texts) — a different problem from the one this file reports`);
    const witnessText = witnessTexts[0]!;
    return {
      id: row.id,
      question: 'Which of these two hints should a child read?',
      notTheQuestion:
        'NOT "which is the pre-cap original". The two texts are the same length and teach different things, so neither is a shortened form of the other and the cap sweep is not involved.',
      inThisDatabase: { childHint: row.childHint, words: words(row.childHint), approvedByRecordedAs: row.approvedBy },
      inThePinnedWitness: { childHint: witnessText, words: words(witnessText), files: witness.map((w) => w.file) },
      sameLength: words(row.childHint) === words(witnessText),
      relation: 'INDEPENDENT DRAFTS — different content, not different lengths of one text',
    };
  });

  const payload = {
    what: 'The two one-source rows, both texts verbatim, for Annie to settle.',
    correctionToTheEarlierRecord:
      'Recorded as 21-vs-16 and 23-vs-16, implying a capped text and a longer original. Both pairs are equal length and differ in content. The framing was wrong; the ruling asked for is an authoring choice, not a recovery.',
    pinStatus: 'The witness files remain PERMANENT-EVIDENCE, liftedBy NOTHING (merge ruling §4).',
    pairs,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'both candidate hints for each of the two one-source rows, verbatim, with the corrected relation between them', ['pairs']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  for (const p of pairs) {
    console.log(`\n${p.id}  — same length: ${p.sameLength}`);
    console.log(`  DB      (${p.inThisDatabase.words}w): ${p.inThisDatabase.childHint}`);
    console.log(`  WITNESS (${p.inThePinnedWitness.words}w): ${p.inThePinnedWitness.childHint}`);
  }
  console.log(`\n  ${path}`);
  await prisma.$disconnect();
}

main();
