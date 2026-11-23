/**
 * HER 195th, CROSSED TO THE AUTHORING STORE — an amendment to THEIR slot, not to a row here.
 *
 * `target: authoring-slot:MC02-RP-02:stem`. This store does not author item content and does not
 * edit their slot; it carries the ruling with the exact bytes and asserts the one thing it CAN
 * assert — that the serving stem here is already byte-identical to the text she authored, so
 * both-or-neither is satisfiable the moment their slot moves.
 *
 * **NOT A NEW FORM JUDGEMENT.** Her words: the ground is the 180th's authority, not a new taste.
 * The slot reading *1 pound 50* is a third form of an amount already ruled; the disposition is her
 * amendment completing its journey to the source, so one stem carries one ruled text in both stores.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const RETURN_SHA = 'f49dfecb6c1147ca40083e6f0a0fc30f878a48a7d9353db6bf792da0b095af8e';
const AUTHORED = 'Shop A sells 5 apples for £1.50. Shop B sells 6 apples for £1.20. How much cheaper is one apple at Shop B than at Shop A?';

async function run() {
  const bytes = readFileSync('/Users/davidb/Downloads/annie-195-for-code.md', 'utf8');
  if (sha(bytes) !== RETURN_SHA) throw new Error(`the return does not hash to ${RETURN_SHA} — refusing`);

  const row = await prisma.item.findUniqueOrThrow({ where: { id: 'MC02-RP-02' },
    select: { id: true, status: true, stem: true, reviewedBy: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } } });
  const serving = String((row.stem as { text?: string }).text ?? '');
  requirePopulation('cross:annie-195', { 'amendment(s) to carry': 1, 'row(s) to assert against': 1 });

  const identical = serving === AUTHORED;
  if (!identical) {
    throw new Error(`the serving stem is NOT byte-identical to her authored text — refusing to report both-or-neither as satisfiable.\n  serving:  ${JSON.stringify(serving)}\n  authored: ${JSON.stringify(AUTHORED)}`);
  }

  const full = {
    kind: 'annie-195-amendment-crossed',
    TO: 'the English-district authoring store (Cowork)',
    authority: { return: 'annie-195-for-code.md', sha256: RETURN_SHA, verifiedOnArrival: true },

    THE_AMENDMENT: {
      target: 'authoring-slot:MC02-RP-02:stem',
      replaced: 'the slot text reading "1 pound 50", per this store\'s refusal notice',
      AUTHORED_VERBATIM: AUTHORED,
      authoredSha256: sha(AUTHORED),
      authoredSha256Spec: 'sha256 over the authored stem string, UTF-8, exactly as she wrote it',
      itIsYOURSTOAPPLY: 'this store does not author item content and has not touched your slot. The bytes are here; the write is yours.',
    },

    THE_GROUND_IS_NOT_A_NEW_JUDGEMENT: {
      hers: 'the ground of the amendment is the 180th\'s authority, not a new taste — one stem, one ruled text, both stores carrying it.',
      soWHAT: 'this store had refused to convert a written form on the ground that converting one is a ruling. It is, and the ruling already existed: her 180th amended this stem\'s SERVING bytes to £1.50 and signed against the pin. What was missing was the amendment reaching the SOURCE.',
      andHERSECONDPOINT: '"1 pound 50" is also no form a child should meet in print — spoken register transcribed rather than prose or symbol — but that is her observation and not the ground.',
    },

    WHAT_THIS_STORE_ASSERTS: {
      servingStemVerbatim: serving,
      byteIdenticalToHerAuthoredText: identical,
      status: row.status, signed: !!row.reviewedBy,
      soBOTHORNEITHERISSATISFIABLE: 'the serving side already carries the ruled text exactly. The moment your slot moves, both stores hold one stem with one ruled text and nothing further is required here.',
    },

    AND_THE_ONE_STILL_WAITING: {
      itemId: 'MC03-CALC-07',
      state: 'AWAITING RE-DERIVATION — a class this door did not have until today',
      what: 'your v3 replacement digest for this row is reproduced by your own send row, which still carries BARE option values ("24.00") while its stem is amended. This store\'s row is united in both, per the ruling that money a child reads carries its unit wherever it sits.',
      soITNEITHERREFUSESNORLIFTS: 'the row is not the withdrawn substance, so nothing is refused; your lifting key does not describe it, so nothing lifts. Without a name that state reads as "not named in any standing withdrawal" — indistinguishable from a row the notice never mentioned. A pending lift is a state, not a silence.',
      whatLiftsIt: 'your re-derivation of that row\'s option values. It lifts mechanically the moment the digest describes the row, and this store reports it on the next run.',
    },
  };
  const lines = [`amendment\tauthoring-slot:MC02-RP-02:stem\t${sha(AUTHORED).slice(0, 16)}`, `awaiting\tMC03-CALC-07`];
  const d = digestOverText('the result lines joined by \\n', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['THE_AMENDMENT', 'WHAT_THIS_STORE_ASSERTS', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('annie-195-amendment-crossed', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'annie-195-amendment-crossed');
  console.log(`\n  serving stem byte-identical to her authored text: ${identical}`);
  console.log(`  authored sha256: ${sha(AUTHORED).slice(0, 16)}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
