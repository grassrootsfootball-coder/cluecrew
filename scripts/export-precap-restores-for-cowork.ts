/**
 * THE FIVE RECOVERED PRE-CAP ROWS — a delivery to Cowork, not a write here.
 *
 * **THE RESTORE POINTS THE OTHER WAY** (R230). Checked against the store rather than assumed: this
 * database ALREADY holds the longer pre-cap text on all five recovered rows. Cowork's copies are
 * the capped ones. So the remedy the trim ruling asked for is a delivery, and the only thing this
 * side owes is the values.
 *
 * Two of the six are NOT here: `en-coordination-wrong-conjunct` and `en-whole-text-absence-asserted`
 * go to Annie instead, because their two texts are the same length and say different things — they
 * are independent drafts, not a cap pair, and the question is which a child should read (R230).
 * `en-narrator-voice-as-fact` is not here either: it was never recovered, and it travels as a
 * DRAFT for her approval, never as a restore.
 *
 * R25: the values travel verbatim, with word counts beside them so the receiving side can verify
 * the direction of the change rather than trust this file's description of it.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'precap-restores-for-cowork';

/** The three with two independent sources, and the two whose second source is this database. */
const RECOVERED = [
  'en-negation-dropped', 'en-vocab-neighbouring-sense', 'en-vocab-form-lookalike',
  'en-coordination-wrong-conjunct', 'en-whole-text-absence-asserted',
];

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

async function main() {
  const rows = await prisma.misconception.findMany({ where: { id: { in: RECOVERED } }, orderBy: { id: 'asc' } });
  requirePopulation('pre-cap restores', { 'ids expected': RECOVERED.length, 'rows found': rows.length });
  if (rows.length !== RECOVERED.length) throw new Error('a recovered id is missing from this store — refusing to deliver a short list under a full name');

  const payload = {
    what: "This store's pre-cap text for the recovered rows. Cowork holds the capped copies; these are the restores.",
    direction: 'DELIVERY, not a request. Nothing on this side needs changing — the longer text is already here.',
    ruling: "Annie's fifth return: on text carrying an approval marker the cap REPORTS over-length and stands aside; it never trims.",
    caution:
      'Two of these five (en-coordination-wrong-conjunct, en-whole-text-absence-asserted) also differ from the pinned witness in CONTENT at equal length. Those two are with Annie as an authoring choice and should NOT be treated as settled by this file.',
    rows: rows.map((r) => ({
      id: r.id,
      childHint: r.childHint,
      words: words(r.childHint),
      approvedByRecordedAs: r.approvedBy,
      alsoWithAnnie: ['en-coordination-wrong-conjunct', 'en-whole-text-absence-asserted'].includes(r.id),
    })),
    notInThisFile: {
      'en-narrator-voice-as-fact':
        'NOT RECOVERED and not restorable — absent from every pinned witness, and this store holds 11w against a capped 13w, so it is not the pre-cap either. Travels separately as a DRAFT for Annie, per her ruling that it does not stand under her name on the strength of a capped string.',
    },
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    "this store's pre-cap hint text for the five recovered rows, verbatim", ['rows']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);
  for (const r of payload.rows) console.log(`  ${r.id.padEnd(34)} ${String(r.words).padStart(2)}w${r.alsoWithAnnie ? '  (also with Annie)' : ''}`);
  console.log(`\n  ${path}`);
  await prisma.$disconnect();
}

main();
