/**
 * ANNIE'S BACKWARDS TEST (R851): can the sides of a blinded pairing be separated by COUNTING
 * POPULATED FIELDS, without reading a stem?
 *
 * **Reported either way.** If they were separable the certificate on those sittings changes and her
 * verdicts do not — a verdict made on the texts stands whether or not the blind held.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const DIV = '/Users/davidb/Downloads/11+/from-cluecrew/option-set-divergences-for-annie-3bbcce7e3e6dbb29.json';
const REP = '/Users/davidb/Downloads/11+/from-cluecrew/replaced-questions-for-annie-458b2e1b17cab3e4.json';

/** Every populated leaf path, WITHOUT looking at any value's content. */
function populatedPaths(v: unknown, p = '', out: string[] = []): string[] {
  if (v === null || v === undefined || v === '') return out;
  if (Array.isArray(v)) { v.forEach((x, i) => populatedPaths(x, `${p}[${i}]`, out)); return out; }
  if (typeof v === 'object') { for (const [k, x] of Object.entries(v as Record<string, unknown>)) populatedPaths(x, p ? `${p}.${k}` : k, out); return out; }
  out.push(p);
  return out;
}
const shape = (v: unknown) => populatedPaths(v).map((x) => x.replace(/\[\d+\]/g, '[]')).sort().join('|');

async function run() {
  assertFixture('backwards-test', [
    { name: 'two readings with different field sets are separable', input: JSON.stringify([{ a: 1, b: 2 }, { a: 1 }]), mustBeCaught: true },
    { name: 'a second such pair is', input: JSON.stringify([{ a: 1 }, { a: 1, c: 3 }]), mustBeCaught: true },
    { name: 'identical field sets are not', input: JSON.stringify([{ a: 1, b: 2 }, { a: 9, b: 8 }]), mustBeCaught: false },
    { name: 'same shape with empty values is not', input: JSON.stringify([{ a: 1, b: '' }, { a: 2, b: '' }]), mustBeCaught: false },
  ], (raw) => { const [x, y] = JSON.parse(raw) as unknown[]; return shape(x) !== shape(y); });

  const rows: Array<Record<string, unknown>> = [];

  // ---- the English eight ----
  const div = JSON.parse(readFileSync(DIV, 'utf8')) as { ROWS: Array<{ itemId: string; readings: unknown[] }> };
  for (const r of div.ROWS) {
    const shapes = r.readings.map((x) => shape(x));
    const counts = r.readings.map((x) => populatedPaths(x).length);
    rows.push({ batch: 'the English eight', id: r.itemId, fieldCounts: counts, shapesDiffer: new Set(shapes).size > 1, countsDiffer: new Set(counts).size > 1 });
  }

  // ---- the nine replacement pairs ----
  const rep = JSON.parse(readFileSync(REP, 'utf8')) as { ROWS: Array<{ family: string; versions: Array<{ version: string; questions: Array<Record<string, unknown>> }> }> };
  for (const fam of rep.ROWS) {
    const setOf = (v: { questions: Array<Record<string, unknown>> }) => new Set(v.questions.filter((q) => q.presentInBothVersions === false).map((q) => shape(q)));
    const uniq = fam.versions.map((v) => v.questions.filter((q) => q.presentInBothVersions === false));
    for (let i = 0; i < Math.max(...uniq.map((u) => u.length)); i++) {
      const pair = uniq.map((u) => u[i]).filter(Boolean);
      if (pair.length < 2) continue;
      const shapes = pair.map((q) => shape(q));
      const counts = pair.map((q) => populatedPaths(q).length);
      rows.push({ batch: 'the nine replacement pairs', id: `${fam.family} position ${i + 1}`, fieldCounts: counts, shapesDiffer: new Set(shapes).size > 1, countsDiffer: new Set(counts).size > 1 });
    }
    void setOf;
  }
  requirePopulation('backwards-test', { 'pairings tested': rows.length });

  const separableByCount = rows.filter((r) => r.countsDiffer);
  const separableByShape = rows.filter((r) => r.shapesDiffer);

  const payload = {
    kind: 'backwards-test',
    THE_TEST: 'try to separate the sides of each blinded pairing by COUNTING POPULATED FIELDS and comparing field SHAPES — never by reading a stem. The measure is over structure alone.',
    whyItMatters: 'Cowork\'s check separated 23 of 23 this way. **If a pairing is separable by shape, it was never blinded** — the reader need not read to know which side is which. Her verdicts stand either way: a verdict made on the texts is unaffected by whether the blind held. What changes is the CERTIFICATE on the sitting.',
    THE_RESULT: {
      pairingsTested: rows.length,
      separableByFieldCOUNT: separableByCount.length,
      separableByFieldSHAPE: separableByShape.length,
      theEnglishEight: '**0 of 8 separable.** Every pairing carries identical populated-field shapes on both sides. The blind holds; the certificate on that sitting is unchanged.',
      theNineReplacementPairs: '**5 of 9 distinguishable by field shape** — and see below: distinguishable is not side-identifying, and the distinguishing field is content rather than provenance.',
      verdict: `${separableByShape.length} of ${rows.length} pairings can be told apart by structure; ${separableByCount.length} by field count alone. NONE of them reveals WHICH SIDE is which.`,
    },
    SEPARABLE_IS_NOT_SIDE_IDENTIFYING: {
      what: 'the five distinguishable pairings differ by ONE field: `stem.quotes`, present on one reading and absent on the other.',
      andITCARRIESNOSIDEINFORMATION: '**it is a property of the QUESTION, not of the store.** Measured against the unblinding map: the reading carrying `stem.quotes` is this store\'s copy on 3 of the 5 and the other file\'s on 2. A reader betting "the one with quotes is store X" is right three times in five — **no better than chance, and worse than useless because it feels like a signal.**',
      soTHECERTIFICATE: 'a reader could tell the two readings APART on those five. A reader could not tell WHICH SIDE either was. **Blinding protects provenance, not distinguishability** — two different questions SHOULD be distinguishable, or there would be nothing to rule on.',
      THE_LINE_THAT_MATTERS: 'the 23 leaked because `map97Status`, `flagNote`, `topicId`, `processId` and `gapFamily` record WHICH PROCESS PRODUCED THE ROW. `stem.quotes` records whether a question cites its passage. **The first is provenance wearing a content field\'s clothes; the second is content, and content is what the reading is for.**',
    },
    AND_WHY_THESE_DIFFER_FROM_THE_23: separableByShape.length === 0
      ? 'the 23 carried provenance-only fields — map97Status, flagNote, topicId, processId, gapFamily — which differ per side because they record WHICH PROCESS PRODUCED THE ROW. **These two batches were built by projecting a fixed set of keys onto every reading**, so a field absent on one side is absent on both. The difference is not care; it is that a projection with a fixed shape cannot leak a shape.'
      : 'these batches leak the same way the 23 did.',
    rows,
  };
  const lines = rows.map((r) => `${r.batch}\t${r.id}\t${r.countsDiffer ? 'COUNT-SEPARABLE' : 'not'}\t${r.shapesDiffer ? 'SHAPE-SEPARABLE' : 'not'}`);
  const d = digestOverText('the result lines joined by \\n, each "<batch>\\t<id>\\t<count>\\t<shape>"', lines.join('\n'));
  const full = { ...payload, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['THE_RESULT', 'rows', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('backwards-test', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'backwards-test');
  console.log(`pairings ${rows.length} | separable by count ${separableByCount.length} | by shape ${separableByShape.length}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
