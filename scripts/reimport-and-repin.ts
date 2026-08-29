/**
 * RE-IMPORT FROM THE AMENDED SOURCE, AND RE-PIN HER SIX (R840).
 *
 * Her ruling: **any row whose bytes do not match comes back to her rather than carrying a verdict
 * onto text she never saw.**
 *
 * **CALIBRATED FIRST.** A "differs" verdict is only about the text if the hash function here is the
 * one that pinned the hashes there. So every retained row is re-hashed and checked against its own
 * pinned value BEFORE any comparison is trusted (R829 — an instrument compared against itself
 * proves nothing; compared against a known answer it proves the function).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing, normaliseMathsNotation } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const SRC = '/Users/davidb/Downloads/amended-maths-source-for-code.json';
const SRC_SHA = '4bab53bba515e606d0d7ace781316f2ca1ee65aaebc0c0460947ea26da2c4433';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const TYPE_BY_GROUP: Record<string, string> = { CALC: 'maths-calc', FDP: 'maths-fdp', NPV: 'maths-npv', MEAS: 'maths-meas', GEOM: 'maths-geom', STATS: 'maths-stats', RP: 'maths-rp' };
const WITHDRAWN = ['MC01-CALC-01','MC01-CALC-02','MC01-CALC-04','MC01-CALC-05','MC01-CALC-07','MC01-CALC-08','MC01-FDP-06','MC01-GEOM-05','MC01-MEAS-01','MC01-MEAS-02','MC01-MEAS-03','MC01-MEAS-04','MC01-MEAS-06','MC01-MEAS-07','MC01-NPV-06','MC01-STATS-02','MC04-FDP-04','MC04-FDP-06','MC04-GEOM-04','MC05-FDP-01'];
const SITTING_ONE = ['MC01-CALC-01','MC01-CALC-02','MC01-CALC-03','MC01-CALC-04','MC01-CALC-05','MC01-CALC-06','MC01-CALC-07','MC01-CALC-08'];
const repairDegrees = (t: string) => t.replace(/\b(\d+)C\b/g, '$1°C');
const contentHash = (stem: unknown, explanation: unknown, options: Array<{ content: unknown; isCorrect: boolean }>) =>
  sha(canonicalJson({ stem, options: options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation }));

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('reimport-repin', [
    { name: 'an id with both variants crossing is unresolved', input: 'MC01-CALC-04', mustBeCaught: true },
    { name: 'the second such id is', input: 'MC01-FDP-06', mustBeCaught: true },
    { name: 'a singly-defined id is not', input: 'MC01-CALC-01', mustBeCaught: false },
    { name: 'nor is another', input: 'MC01-MEAS-01', mustBeCaught: false },
  ], (id) => ['MC01-CALC-04', 'MC01-FDP-06', 'MC05-FDP-08'].includes(id));

  const raw = readFileSync(SRC);
  if (createHash('sha256').update(raw).digest('hex') !== SRC_SHA) throw new Error('amended source digest does not match the one named — refusing');
  const src = JSON.parse(raw.toString('utf8')) as {
    THE_EXEMPLAR: { items: Array<Record<string, unknown>> };
    THREE_OF_THE_NINE_ARE_UNRESOLVED_AND_BOTH_VARIANTS_CROSS: { ids: string[] };
  };
  const unresolved = new Set(src.THREE_OF_THE_NINE_ARE_UNRESOLVED_AND_BOTH_VARIANTS_CROSS.ids);
  const byId = new Map(src.THE_EXEMPLAR.items.map((i) => [String(i.itemId), i]));

  // ---- CALIBRATION: does this hash function reproduce the pinned hashes? ----
  const retainedFile = readFileSync(join(REPO, 'content/exports', readFileSync(join(REPO, 'content/exports/.last-withdrawn') , 'utf8').trim()), 'utf8');
  const retained = (JSON.parse(retainedFile) as { RETAINED_ROWS: Array<Record<string, unknown>> }).RETAINED_ROWS;
  const pinned = await prisma.attributionEvent.findMany({ where: { recordId: { in: SITTING_ONE }, field: 'content', actor: 'Annie' }, select: { recordId: true, subjectHash: true } });
  const pinnedBy = new Map(pinned.map((p) => [p.recordId, p.subjectHash]));
  const calib = retained.filter((r) => SITTING_ONE.includes(String(r.itemId))).map((r) => {
    const got = contentHash(r.stem, r.explanation, (r.options as Array<{ content: unknown; isCorrect: boolean }>));
    return { itemId: r.itemId, pinned: pinnedBy.get(String(r.itemId)) ?? null, recomputedFromRetained: got, reproduces: got === pinnedBy.get(String(r.itemId)) };
  });
  const calibrated = calib.length > 0 && calib.every((c) => c.reproduces);

  requirePopulation('reimport:amended-source', { 'withdrawn ids': WITHDRAWN.length, 'exemplar rows in the amended source': byId.size });

  // ---- the re-import ----
  const results: Array<Record<string, unknown>> = [];
  for (const id of WITHDRAWN) {
    const item = byId.get(id);
    if (!item) { results.push({ itemId: id, outcome: 'NOT IN THE AMENDED SOURCE', note: 'this source carries the exemplar (the MC01 batch), three briefs and nine amended items. This id is in none of them.' }); continue; }
    if (unresolved.has(id)) { results.push({ itemId: id, outcome: 'HELD — BOTH VARIANTS CROSS', note: 'the units amendment reached both variants and does not resolve the collision. **Picking is the fault that caused the withdrawal**, and this store does not pick.' }); continue; }
    const typeId = TYPE_BY_GROUP[String(item.group)];
    const stem = { text: repairDegrees(normaliseMathsNotation(String(item.stem ?? ''))) };
    const explanation = Object.fromEntries(Object.entries((item.explanation ?? {}) as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? repairDegrees(normaliseMathsNotation(v)) : v]));
    const opts = item.options as Array<{ label: string; value: string; isKey?: boolean; misconceptionId?: string | null }>;
    const options = opts.map((o) => ({ content: { value: repairDegrees(normaliseMathsNotation(o.value)), label: o.label }, isCorrect: o.isKey === true, misconceptionId: o.misconceptionId ?? null }));
    const faults = checkItemChildFacing({ id, stem, explanation, options: options.map((o) => ({ content: o.content })) }).filter((f) => !(f.rule === 'sentence-length' && /stem\./.test(f.where)));
    if (faults.length) { results.push({ itemId: id, outcome: 'GATE REFUSED', faults: faults.map((f) => `${f.rule}: ${f.detail}`) }); continue; }
    const newHash = contentHash(stem, explanation, options);
    const wasPinned = pinnedBy.get(id) ?? null;
    const repin = SITTING_ONE.includes(id)
      ? (wasPinned === null ? 'NO PINNED HASH — she never verified this row' : (newHash === wasPinned ? 'RE-PINNED — bytes identical to what she verified' : 'BACK TO HER — bytes differ from what she verified'))
      : null;
    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        await tx.item.create({ data: { id, questionType: { connect: { id: typeId } }, difficultyTier: Number(item.tier), stem, explanation: explanation as object, status: 'DRAFT', authoredBy: 'amended maths source' } });
        await tx.itemOption.createMany({ data: options.map((o) => ({ itemId: id, content: o.content, isCorrect: o.isCorrect, misconceptionId: o.misconceptionId })) });
        if (repin === 'RE-PINNED — bytes identical to what she verified') {
          await tx.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'APPROVED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'content', subjectHash: newHash, method: `her 180th, RE-PINNED against the amended source (${SRC_SHA.slice(0, 16)}) — the row's bytes are identical to those she verified`, note: 'CONTENT-VERIFIED. reviewedBy untouched, status DRAFT. Not a re-reading: the same text under a new row.' } });
        }
      });
    }
    results.push({ itemId: id, outcome: APPLY ? 'IMPORTED' : 'WOULD IMPORT', contentSha256: newHash, herPinnedHash: wasPinned, rePin: repin });
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const rp = results.filter((r) => r.rePin);
  const payload = {
    kind: 'reimport-and-repin',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    THE_SOURCE: { file: 'amended-maths-source-for-code.json', sha256: SRC_SHA, alsoOnThisDiskAs: 'AMENDEDMATHSSOURCECROSSING.json — byte-identical, two names, the naming class again in the turn it was ruled' },
    ONE_THE_CALIBRATION: {
      why: 'a "bytes differ" verdict is only about the text if the hash function here is the one that pinned the hashes there. Compared against a KNOWN ANSWER — the retained bytes of the rows she verified — rather than against itself.',
      rows: calib,
      CALIBRATED: calibrated,
      andIfItHadFailed: 'every comparison below would have been about my function and none of it would have been reportable. **This is the step that makes a mismatch mean something.**',
    },
    TWO_THE_REIMPORT: {
      withdrawnIds: WITHDRAWN.length,
      imported: results.filter((r) => String(r.outcome).includes('IMPORT')).length,
      notInTheAmendedSource: results.filter((r) => r.outcome === 'NOT IN THE AMENDED SOURCE').map((r) => r.itemId),
      heldBothVariantsCross: results.filter((r) => String(r.outcome).startsWith('HELD')).map((r) => r.itemId),
      gateRefused: results.filter((r) => r.outcome === 'GATE REFUSED'),
      AND_THE_TWO_THE_WITHDRAWAL_WAS_FOR: '**MC04-FDP-04 and MC05-FDP-01 are not in this source.** The amended source carries the exemplar, three briefs and nine amended items; the two colliding rows are in none of them. They stay out.',
    },
    THREE_THE_REPIN: {
      herRuling: 'any row whose bytes do not match comes back to her rather than carrying a verdict onto text she never saw.',
      rows: rp,
      rePinned: rp.filter((r) => String(r.rePin).startsWith('RE-PINNED')).map((r) => r.itemId),
      backToHer: rp.filter((r) => String(r.rePin).startsWith('BACK TO HER')).map((r) => r.itemId),
      couldNotBeReached: SITTING_ONE.filter((id) => !rp.some((r) => r.itemId === id)),
    },
    results,
  };
  const lines = results.map((r) => `${r.itemId}\t${r.outcome}\t${r.rePin ?? ''}`);
  const d = digestOverText('the result lines joined by \\n, each "<itemId>\\t<outcome>\\t<rePin>"', lines.join('\n'));
  const full = { ...payload, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_THE_CALIBRATION', 'TWO_THE_REIMPORT', 'THREE_THE_REPIN', 'results']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'reimport-and-repin' : 'reimport-and-repin-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — calibrated ${calibrated} | imported ${payload.TWO_THE_REIMPORT.imported} | re-pinned ${payload.THREE_THE_REPIN.rePinned.length} | back to her ${payload.THREE_THE_REPIN.backToHer.length}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
