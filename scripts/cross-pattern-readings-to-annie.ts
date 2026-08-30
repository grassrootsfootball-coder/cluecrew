/**
 * THE PATTERN READINGS AND THE vr19 REGENERATION, CROSSED TO ANNIE AS BYTES.
 *
 * She holds them as DESCRIPTION and her rulings bind on the bytes when they cross, so this carries
 * the readings themselves — entry, three sample carriers, the generator's account — in one artefact
 * with a digest per reading and one over the file (R923: one artefact, both readers, byte-identity).
 *
 * **THE COUNT IS HERS AND THE EVIDENCE IS MINE, AND THEY COVER DIFFERENT SETS.** The refusing set is
 * thirteen. This store can evidence SIX by execution — five still refusing and one now repaired —
 * and one more (`vr18-partial-rule`) crossed undecided because the instrument cannot judge it. The
 * remainder are patterns whose act is semantic, where this store returns UNDECIDABLE rather than a
 * verdict. **Named rather than matched.**
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const EXPORTS = pjoin(REPO, 'content/exports');

/** What the generator actually did, per pattern — read from its own source, quoted not summarised. */
const ACCOUNTS: Record<string, { fn: string; how: string; theLine: string }> = {
  'vr13-not-a-word': { fn: 'makeAWord', how: 'CURATED BANK, POSITIONAL', theLine: '{ content: { value: entry[4] }, isCorrect: false, m: 0 }' },
  'vr05-single-word-only': { fn: 'hiddenWords', how: 'CURATED BANK, POSITIONAL', theLine: '{ content: { value: entry[3] }, isCorrect: false, m: 0 }' },
  'vr05-almost-letters': { fn: 'hiddenWords', how: 'CURATED BANK, POSITIONAL', theLine: '{ content: { value: entry[2] }, isCorrect: false, m: 1 }' },
  'vr-move-letter-first-word-invalid': { fn: 'moveLetter', how: 'CURATED BANK, POSITIONAL', theLine: '{ content: { value: entry[3] }, isCorrect: false, m: 0 }' },
  'vr-move-letter-second-word-invalid': { fn: 'moveLetter', how: 'CURATED BANK, POSITIONAL', theLine: '{ content: { value: entry[4] }, isCorrect: false, m: 1 }' },
  'vr19-shared-letter-miss': { fn: 'wordNumberCodes', how: 'ARITHMETIC ON THE KEY — now REPAIRED', theLine: 'was: answer.slice(0,-1) + ((Number(answer.at(-1)) + 1) % 10)' },
};
const BANK_NOTE = '**the value was authored into a bank COLUMN and the tag was assigned by that column\'s POSITION** — `m: 0` and `m: 1` index the entry list for the question type. Nothing ever compared the column to the entry it would wear, which is the same divorce R930 names, arrived at through curation rather than arithmetic.';

async function run() {
  assertFixture('reading-digest', [
    { name: 'a reading digests over its own content', input: JSON.stringify([{ id: 'a', carriers: [1] }, { id: 'a', carriers: [1] }]), mustBeCaught: true },
    { name: 'a changed carrier moves the digest', input: JSON.stringify([{ id: 'a', carriers: [1] }, { id: 'a', carriers: [2] }]), mustBeCaught: false },
  ], (raw) => { const [a, b] = JSON.parse(raw); return sha(canonicalJson(a)) === sha(canonicalJson(b)); });

  const census = JSON.parse(readFileSync(pjoin(EXPORTS, readdirSync(EXPORTS).filter((f) => f.startsWith('carrier-performs-entry-census-')).sort().pop()!), 'utf8')) as
    { BY_PATTERN: Record<string, { carriers: number; performs: number; refuses: number; undecidable: number; refusingRows: Array<{ itemId: string; optionValue: string; why: string }> }> };

  const lib = new Map((await prisma.misconception.findMany({ where: { district: 'VR' },
    select: { id: true, description: true, childHint: true, approvedBy: true, status: true } })).map((m) => [m.id, m]));

  const patterns = Object.keys(ACCOUNTS);
  const readings = [];
  for (const id of patterns) {
    const b = census.BY_PATTERN[id];
    const entry = lib.get(id)!;
    const opts = await prisma.itemOption.findMany({ where: { misconceptionId: id, item: { status: 'DRAFT' } },
      select: { content: true, item: { select: { id: true, stem: true, options: { select: { content: true, isCorrect: true } } } } }, take: 3 });
    const samples = opts.map((o) => ({
      itemId: o.item.id, stem: o.item.stem,
      theKey: o.item.options.filter((x) => x.isCorrect).map((x) => (x.content as { value: unknown }).value),
      THE_CARRIERS_VALUE: (o.content as { value: unknown }).value,
      whatTheExecutionSaid: b.refusingRows.find((r) => r.itemId === o.item.id)?.why ?? 'this carrier performs its entry',
    }));
    const body = {
      entry: { id: entry.id, behaviour: entry.description, childHint: entry.childHint, signed: !!entry.approvedBy, status: entry.status },
      verdict: id === 'vr19-shared-letter-miss' ? 'REPAIRED — 25 of 25 now perform' : `REFUSES on ${b.refuses} of ${b.carriers} carriers`,
      carriers: b.carriers, performs: b.performs, refuses: b.refuses,
      THREE_SAMPLE_CARRIERS: samples,
      THE_GENERATORS_ACCOUNT: { function: ACCOUNTS[id].fn, how: ACCOUNTS[id].how, theLine: ACCOUNTS[id].theLine,
        ...(ACCOUNTS[id].how.startsWith('CURATED') ? { andWHATTHATMEANS: BANK_NOTE } : {}) },
      THE_DEFAULT_PER_YOUR_199th: 'carriers regenerate to perform their entry\'s act; the exception is a family whose options share one real nameable act, which retags or mints under the one-act rule.',
    };
    readings.push({ ...body, readingSha256: sha(canonicalJson(body)),
      readingSha256Spec: 'sha256 over canonical JSON of this reading, keys sorted, compact separators (R729)' });
  }
  requirePopulation('cross:pattern-readings', { 'pattern reading(s)': readings.length });

  const vr19 = readdirSync(EXPORTS).filter((f) => f.startsWith('vr19-regeneration-') && !f.includes('dry-run')).sort().pop()!;
  const vr19Bytes = readFileSync(pjoin(EXPORTS, vr19), 'utf8');

  const full = {
    kind: 'pattern-readings-and-vr19-regeneration',
    TO: 'Annie — as BYTES. Your rulings bind on these, not on the description you were holding.',
    THE_COUNT_IS_YOURS_AND_THE_EVIDENCE_IS_MINE: {
      theRefusingSet: 13,
      evidencedHereByExecution: readings.length,
      andWHATTHATCOVERS: 'five patterns still refusing and one now repaired. `vr18-partial-rule` crossed separately and undecided, because the instrument cannot judge it (your 201st). The remainder of the thirteen are patterns whose act is semantic, where this store returns UNDECIDABLE rather than a verdict — a test that scored them by inference would report a number for all 23 and mean something for ten.',
      soTHESETSDIFFER: 'this is named rather than matched. Six readings is not a correction of thirteen; it is what this store can evidence.',
    },
    READINGS: readings,
    ...(() => { const s = digestOverText('the reading digests joined by \\n in the order emitted', readings.map((r) => r.readingSha256).join('\n')); return { setSha256: s.value, setSha256Spec: s.spec }; })(),
    THE_VR19_REGENERATION: {
      whatItWas: 'the sixth reading, now closed. The words conformed to the attested entry per your 201st.',
      artefact: vr19, artefactSha256: sha(vr19Bytes),
      artefactSha256Spec: 'sha256 over the delivered regeneration artefact\'s bytes',
      theProof: '`vr19-shared-letter-miss` moved from 0 of 25 performing to 25 of 25; the refusing carrier count across the eleven cases fell from 107 to 82.',
      andWHATWASDROPPED: 'STATS, which codes to the palindrome 93439 — its letter-order distractor would have equalled the key. PAPAS replaces it.',
    },
  };
  const lines = readings.map((r) => `${r.entry.id}\t${r.verdict}\t${r.readingSha256}`);
  const d = digestOverText('one line per reading, "<entryId>\\t<verdict>\\t<readingSha256>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['READINGS', 'THE_VR19_REGENERATION', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('pattern-readings-and-vr19-regeneration', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(EXPORTS, name), json);
  deliver(pjoin(EXPORTS, name), 'pattern-readings-and-vr19-regeneration');
  for (const r of readings) console.log(`   ${r.entry.id.padEnd(36)} ${r.verdict}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
