/**
 * MATHS-75 WHOLE, AS BYTES (her 193rd §4 request).
 *
 * She holds a quotation with an ellipsis, and **an ellipsis is not bytes**. The whole row crosses —
 * every column, not the six a projection would have chosen (R88's return-leg lesson) — so the
 * duplication question is decided against the text rather than against a summary of it.
 *
 * **THE FALSE SENTENCE CROSSES UNALTERED WITH ITS REFUTATION BESIDE IT.** The gap was declared on
 * *maths-75 is using only the numerator*. That sentence is false on the library's own bytes, and
 * correcting it silently would leave her reasoning intact on a premise that had been swapped
 * underneath it. Both travel; neither is edited.
 *
 * This store states the bytes and stops. Whether the mint retires into maths-75 is hers.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const M75 = 'maths-75-incomplete-fraction-of-an-amount';
const MINT = 'fraction-part-used-alone';

async function run() {
  /**
   * NORMALISED TO THE DELIVERED FORM BEFORE ANYTHING IS DIGESTED (R88). A Prisma row carries `Date`
   * objects; the file carries ISO strings. A digest taken over the live objects does not reproduce
   * over the bytes that ship, so the stamp names a projection the artefact does not deliver — which
   * is exactly how two materially different files once shipped under one name. R767's recompute
   * guard refused it here, which is the guard working rather than a near miss.
   */
  const asDelivered = <T>(row: T): T => JSON.parse(JSON.stringify(row)) as T;
  const whole = asDelivered(await prisma.misconception.findUniqueOrThrow({ where: { id: M75 } }));
  const mint = asDelivered(await prisma.misconception.findUniqueOrThrow({ where: { id: MINT } }));
  const carriers = await prisma.itemOption.findMany({
    where: { misconceptionId: { in: [M75, MINT] } },
    select: { misconceptionId: true, content: true, isCorrect: true, item: { select: { id: true, stem: true, status: true } } },
  });
  requirePopulation('cross:maths75-whole', {
    'column(s) on the maths-75 row': Object.keys(whole).length,
    'carrier(s) across both entries': carriers.length,
  });

  const carriersOf = (id: string) => carriers.filter((c) => c.misconceptionId === id).map((c) => ({
    itemId: c.item.id, status: c.item.status,
    stem: (c.item.stem as { text?: string }).text ?? null,
    option: (c.content as { label?: string }).label, value: String((c.content as { value: unknown }).value),
  }));

  const full = {
    kind: 'maths-75-whole-for-the-duplication-reading',
    forAnnie: 'her 193rd §4 — send maths-75 whole, behaviour and childHint, as bytes',
    NOTHING_IS_PROPOSED: 'whether fraction-part-used-alone retires into maths-75 under the maths-88 precedent is your reading. This store states the bytes.',

    THE_SENTENCE_THE_GAP_WAS_DECLARED_ON: 'maths-75 is using only the numerator',
    itsStatus: 'FALSE on the library\'s own bytes — crossed unaltered, per your citation discipline, so the premise and its refutation arrive together',
    THE_REFUTATION_IS_THE_DESCRIPTION_ITSELF: whole.description,
    andWHATTHATSHOWS: 'the description names the numerator case AND the denominator case, and the denominator example it gives is "15 divided by 3/4 = 5 where the answer is 20". That is MC01-FDP-08 option C — the carrier the mint landed on first, by value.',

    MATHS_75_WHOLE: whole,
    mathsSeventyFiveSha256: sha(JSON.stringify(whole, Object.keys(whole).sort())),
    mathsSeventyFiveSha256Spec: 'sha256 over JSON.stringify of the whole row with keys sorted — every column, not a projection',
    columnsCarried: Object.keys(whole).sort(),
    andWHYEVERYCOLUMN: 'the first return-leg export dropped 16 of 22 columns including approvalNote, the field holding a discriminator between two entries a drafter must choose between (R88). A duplication question is exactly that choice.',

    THE_MINT_WHOLE: mint,
    theMintSha256: sha(JSON.stringify(mint, Object.keys(mint).sort())),
    theMintSha256Spec: 'sha256 over JSON.stringify of the whole row with keys sorted — every column, not a projection',

    CARRIERS: { [M75]: carriersOf(M75), [MINT]: carriersOf(MINT) },
    carrierCounts: { [M75]: carriersOf(M75).length, [MINT]: carriersOf(MINT).length },

    WHAT_THE_READING_TURNS_ON: [
      'maths-75 childHint: ' + JSON.stringify(whole.childHint) + ' — general to fractions',
      'the mint childHint (as amended by your 193rd): ' + JSON.stringify(mint.childHint) + ' — names the dividing',
      'if the entry text covers the act, the maths-88 precedent retires the mint and retags C and D to maths-75; a hint that mis-serves the divide-by-a-fraction context is then an amendment question ON maths-75, not a reason to keep a duplicate. Those are your words and this store has not applied them.',
    ],
  };
  const lines = [`${M75}\t${carriersOf(M75).length} carriers`, `${MINT}\t${carriersOf(MINT).length} carriers`];
  const d = digestOverText('one line per entry, "<id>\\t<carrier count>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['MATHS_75_WHOLE', 'THE_MINT_WHOLE', 'CARRIERS', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('maths-75-whole-for-the-duplication-reading', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'maths-75-whole-for-the-duplication-reading');
  console.log(`\n  maths-75: ${Object.keys(whole).length} columns, ${carriersOf(M75).length} carriers`);
  console.log(`  the mint: ${carriersOf(MINT).length} carriers`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
