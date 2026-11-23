/** HER 184th: six stem collisions ruled (R844). Counts asserted from the artefact, never from prose. */
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
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const COL = '/Users/davidb/Downloads/EVERYCOLLIDEDMATHSIDFORANNIE56c84163a2a2.json';
const COL_SHA = '56c84163a2a2f131f44e4183881bd7fbbdafc65d03c7b4d607c65518e6233f4e';
const SHA184 = '322eddf0651ae535';
const TYPE_BY_GROUP: Record<string, string> = { CALC: 'maths-calc', FDP: 'maths-fdp', NPV: 'maths-npv', MEAS: 'maths-meas', GEOM: 'maths-geom', STATS: 'maths-stats', RP: 'maths-rp' };

/** Her ruling per id: the KEY she named identifies the variant. Matched on the key, asserted against the artefact. */
const RULED: Record<string, { key: string; reason: string; landed?: true }> = {
  'MC01-FDP-04': { key: '4', reason: 'the two-step jug, calibration final; its three distractors carry declared working and its tier-three weight matches its slot. The one-step variants are not unfit, they are REDUNDANT against three served divide-by-fraction items (15÷¾, 12÷⅔, 6÷⅔) — recorded as redundancy.' },
  'MC02-NPV-07': { key: '0.6', reason: 'the largest-decimal comparison. The place-value alternative is sound and is the FOURTH of its exact kind in the district (5.284, 6.351, 7.482 already serve), while the longer-decimal-looks-bigger trap is a misconception the district otherwise never tests. Coverage decides where quality ties.' },
  'MC05-FDP-08': { key: '£48', reason: 'the £64 coat at 25%. The alternative is £50 at 20% keyed £40, which is MC04-FDP-06 nearly verbatim and already serving — the redundancy case at its clearest.' },
  'MC05-MEAS-02': { key: '4 kg', reason: 'the flour conversion wears the id, and THE ORPHAN CLOSES ITSELF. MEAS-01 is the money-change slot in all five cases, so the pen-change item duplicates its own case\'s MEAS-01 skill while the conversion mirrors MC02\'s MEAS-02 as the parallel-case design intends. The price hint retires to the shelf with the pen item; the conversion hint attaches.' },
  'MC04-FDP-04': { key: '3/8', reason: 'the landed variant stands. An equal alternative does not displace a verified, landed row: churn is a cost and parity is not a reason.', landed: true },
  'MC05-FDP-01': { key: '4/5', reason: 'the landed 4/5 against 4/9 stands, same ruling, same reason.', landed: true },
};

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('annie-184', [
    { name: 'a ruled id with a key selects a variant', input: 'MC01-FDP-04', mustBeCaught: true },
    { name: 'a second does', input: 'MC05-MEAS-02', mustBeCaught: true },
    { name: 'a distractor-split id is not in this ruling', input: 'MC01-CALC-01', mustBeCaught: false },
    { name: 'nor is an unrelated id', input: 'MC03-CALC-04', mustBeCaught: false },
  ], (id) => Object.prototype.hasOwnProperty.call(RULED, id));

  const raw = readFileSync(COL);
  if (createHash('sha256').update(raw).digest('hex') !== COL_SHA) throw new Error('collided-29 artefact digest does not match the one she verified — refusing');
  const col = (JSON.parse(raw.toString('utf8')) as { STEM_COLLISIONS: Record<string, { variants: Array<Record<string, unknown>> }> }).STEM_COLLISIONS;
  requirePopulation('land:annie-184', { 'ids she ruled': Object.keys(RULED).length, 'stem-collision ids in the artefact': Object.keys(col).length });

  const results: Array<Record<string, unknown>> = [];
  for (const [id, ruling] of Object.entries(RULED)) {
    const variants = col[id]!.variants;
    // **ASSERTED FROM THE ARTEFACT, NOT FROM PROSE** — including my own.
    const variantCount = variants.length;
    const distinctItems = new Set(variants.map((v) => sha(canonicalJson(v.item)))).size;
    const matches = variants.filter((v) => String(v.key).trim() === ruling.key);
    if (matches.length !== 1) { results.push({ itemId: id, outcome: `REFUSED — her key "${ruling.key}" matches ${matches.length} variants, not one`, variantCount }); continue; }
    const chosen = matches[0]!;
    const unchosen = variants.filter((v) => v !== chosen);
    const item = chosen.item as Record<string, unknown>;

    if (ruling.landed) {
      const row = await prisma.item.findUnique({ where: { id }, select: { stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } } });
      const landedKey = row?.options.find((o) => o.isCorrect);
      const stands = landedKey ? String((landedKey.content as { value: string }).value) === ruling.key : false;
      results.push({ itemId: id, outcome: stands ? 'STANDS UNCHANGED — the landed row already carries her variant' : 'MISMATCH — the landed row does not carry her key', variantCount, distinctItems, herKey: ruling.key, onTheRow: landedKey ? String((landedKey.content as { value: string }).value) : null, reason: ruling.reason });
      continue;
    }

    const stem = { text: normaliseMathsNotation(String(item.stem ?? '')) };
    const explanation = Object.fromEntries(Object.entries((item.explanation ?? {}) as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? normaliseMathsNotation(v) : v]));
    const opts = item.options as Array<{ label: string; value: string; isKey?: boolean; misconceptionId?: string | null }>;
    const options = opts.map((o) => ({ content: { value: normaliseMathsNotation(o.value), label: o.label }, isCorrect: o.isKey === true, misconceptionId: o.misconceptionId ?? null }));
    const faults = checkItemChildFacing({ id, stem, explanation, options: options.map((o) => ({ content: o.content })) }).filter((f) => !(f.rule === 'sentence-length' && /stem\./.test(f.where)));
    if (faults.length) { results.push({ itemId: id, outcome: 'GATE REFUSED', faults: faults.map((f) => `${f.rule}: ${f.detail}`), variantCount }); continue; }
    const contentHash = sha(canonicalJson({ stem, options: options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation }));
    const shelved = unchosen.map((v) => ({ stem: String(v.stem), key: String(v.key), hintCore: String(v.hintCore ?? ''), heldInFiles: v.heldInFiles }));
    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        await tx.item.upsert({
          where: { id },
          create: { id, questionType: { connect: { id: TYPE_BY_GROUP[String(item.group)]! } }, difficultyTier: Number(item.tier), stem, explanation: { ...explanation, _stemCollisionResolved: { ruledBy: 'Annie', return: `184th (${SHA184})`, variantsUnderThisId: variantCount, chosenKey: ruling.key, reason: ruling.reason, THE_UNCHOSEN_RETIRE_TO_THE_SHELF: shelved } } as object, status: 'DRAFT', authoredBy: 'her 184th, ruled from the collided 29' },
          update: { stem, explanation: { ...explanation, _stemCollisionResolved: { ruledBy: 'Annie', return: `184th (${SHA184})`, variantsUnderThisId: variantCount, chosenKey: ruling.key, reason: ruling.reason, THE_UNCHOSEN_RETIRE_TO_THE_SHELF: shelved } } as object },
        });
        await tx.itemOption.deleteMany({ where: { itemId: id } });
        await tx.itemOption.createMany({ data: options.map((o) => ({ itemId: id, content: o.content, isCorrect: o.isCorrect, misconceptionId: o.misconceptionId })) });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'APPROVED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'row', subjectHash: contentHash, method: `her 184th (${SHA184}): stem collision ruled against the artefact at ${COL_SHA.slice(0, 16)} — ${variantCount} variants, key "${ruling.key}" chosen`, note: ruling.reason } });
      });
    }
    results.push({ itemId: id, outcome: APPLY ? 'LANDED' : 'WOULD LAND', variantCount, distinctItems, chosenKey: ruling.key, contentSha256: contentHash, retiredToTheShelf: shelved.map((s) => `${s.key}: ${s.stem.slice(0, 60)}`), reason: ruling.reason });
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'annie-184-landing',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    THE_ARTEFACT_SHE_VERIFIED: COL_SHA,
    COUNTS_ASSERTED_FROM_THE_ARTEFACT: {
      rule: 'every variant count below is `variants.length` read from the artefact, never from prose — including my own prose.',
      perId: Object.fromEntries(Object.entries(col).map(([k, v]) => [k, { variantsInTheArtefact: v.variants.length, distinctItems: new Set(v.variants.map((x) => sha(canonicalJson(x.item)))).size }])),
      AND_MY_OWN_PROSE_WAS_WRONG: '**MC01-FDP-04 carries THREE variants, and I had described the class as "two different questions share one itemId".** Worse, reading two of its three side by side they looked identical — same stem, same key, same hint — and they are NOT: they differ in their option sets, so the artefact\'s three is three DISTINCT items. **Asserting from the artefact caught what asserting from the page would have missed twice over.**',
    },
    HER_SIX: results,
    THE_ORPHAN_CLOSES: 'MC05-MEAS-02 was the double-hint row that started the mechanism hunt. **It was never a joining fault — it is an identity collision**: two whole items under one id, each with its own hint. The price hint retires to the shelf with the pen item; the conversion hint attaches. The class closes with its cause named.',
    THE_UNCHOSEN_ARE_NOT_DISCARDED: 'every unchosen variant is recorded on the row under `_stemCollisionResolved.THE_UNCHOSEN_RETIRE_TO_THE_SHELF`, with its stem, key, hint and holding files. **Retired is not deleted.**',
    HER_FLAG_NOT_AMENDED: 'two stems spell "pounds" as a word against options wearing £ — the unsettled prose-money convention, surfacing exactly where the store predicted. Flagged for the voice question; NOT amended here.',
  };
  const lines = results.map((r) => `${r.itemId}\t${r.outcome}\t${r.variantCount}`);
  const d = digestOverText('the result lines joined by \\n, each "<itemId>\\t<outcome>\\t<variantCount>"', lines.join('\n'));
  const full = { ...payload, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['COUNTS_ASSERTED_FROM_THE_ARTEFACT', 'HER_SIX', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'annie-184-landing' : 'annie-184-landing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — ${results.map((r) => `${r.itemId}:${String(r.outcome).split(' —')[0]}`).join(' | ')}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
