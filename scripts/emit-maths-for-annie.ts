/**
 * THE MATHS POPULATION FOR ANNIE, WITH THE ORPHAN-MECHANISM SCREEN (R825/R826).
 *
 * Her ruling: **a hint signed against an entry is not a hint verified against its item, and one
 * mis-join means a mechanism, not an accident.** The screen reports MEMBERSHIP and proposes nothing.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { normaliseMathsNotation } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const STAGED = '/Users/davidb/Downloads/MATHSITEMSSTAGEDFORIMPORT.json';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

const OP_WORDS: Record<string, string> = { add: '+', plus: '+', sum: '+', total: '+', altogether: '+', subtract: '-', minus: '-', difference: '-', 'take away': '-', 'left over': '-', change: '-', multiply: '*', times: '*', product: '*', 'each of': '*', divide: '/', share: '/', quotient: '/', 'split between': '/' };
const opsIn = (t: string) => new Set(Object.entries(OP_WORDS).filter(([w]) => new RegExp(`\\b${w}\\b`, 'i').test(t)).map(([, s]) => s));
const numsIn = (t: string) => (t.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(/,/g, '')));

/** Execute the hint's single named operation over the stem's two numbers and compare with the key. */
function executable(stem: string, hint: string, key: string | null): { ran: boolean; agrees?: boolean; detail: string } {
  const ho = [...opsIn(hint)];
  const sn = numsIn(stem);
  const kn = key === null ? NaN : numsIn(key)[0] ?? NaN;
  if (ho.length !== 1 || sn.length !== 2 || Number.isNaN(kn)) return { ran: false, detail: 'not executable: needs exactly one named operation in the hint, exactly two numbers in the stem, and a numeric key' };
  const [a, b] = sn as [number, number];
  const got = ho[0] === '+' ? a + b : ho[0] === '-' ? a - b : ho[0] === '*' ? a * b : a / b;
  const agrees = Math.abs(got - kn) < 1e-9;
  return { ran: true, agrees, detail: `hint names "${ho[0]}"; ${a} ${ho[0]} ${b} = ${got}; key is ${kn} — ${agrees ? 'AGREES' : 'DISAGREES'}` };
}

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('maths-for-annie', [
    { name: 'a hint whose operation contradicts the key is caught', input: JSON.stringify(['Work out 8 and 2.', 'Subtract the second from the first.', '10']), mustBeCaught: true },
    { name: 'another contradiction is caught', input: JSON.stringify(['Work out 9 and 3.', 'Divide the first by the second.', '27']), mustBeCaught: true },
    { name: 'an agreeing pair is not', input: JSON.stringify(['Work out 8 and 2.', 'Add them.', '10']), mustBeCaught: false },
    { name: 'a non-executable row is not', input: JSON.stringify(['A shape has angles.', 'Think about the corners.', '4']), mustBeCaught: false },
  ], (raw) => { const [s, h, k] = JSON.parse(raw) as [string, string, string]; const r = executable(s, h, k); return r.ran && r.agrees === false; });

  const src = JSON.parse(readFileSync(STAGED, 'utf8')) as { items: Array<Record<string, unknown>>; population: Record<string, unknown>; HELD_BACK_AND_NAMED: unknown };
  const items = src.items;
  const importedIds = new Set((await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true } })).map((i) => i.id));
  requirePopulation('emit:maths-for-annie', { 'staged maths items held here': items.length });

  // ---- the orphan-mechanism screen ----
  const opMismatch: Array<Record<string, unknown>> = [];
  const executed: Array<Record<string, unknown>> = [];
  let ranCount = 0;
  for (const it of items) {
    const stem = normaliseMathsNotation(String(it.stem ?? ''));
    const hint = normaliseMathsNotation(String((it.explanation as Record<string, unknown> ?? {}).hintCore ?? ''));
    const opts = it.options as Array<{ value: string; isKey?: boolean }>;
    const key = opts.find((o) => o.isKey)?.value ?? null;
    const ho = opsIn(hint); const so = opsIn(stem);
    if (ho.size && so.size && ![...ho].some((o) => so.has(o))) opMismatch.push({ itemId: it.itemId, stem, hint, key, signal: `the hint names ${[...ho].join(',')} where the stem names ${[...so].join(',')}` });
    const ex = executable(stem, hint, key);
    if (ex.ran) { ranCount++; if (ex.agrees === false) executed.push({ itemId: it.itemId, stem, hint, key, detail: ex.detail }); }
  }

  // ---- the population ----
  const rows = items.map((it) => {
    const opts = it.options as Array<{ label: string; value: string; isKey?: boolean; misconceptionId?: string | null; misconceptionBehaviour?: string }>;
    const row = {
      itemId: it.itemId, group: it.group, tier: it.tier,
      stem: normaliseMathsNotation(String(it.stem ?? '')),
      options: opts.map((o) => ({ label: o.label, value: normaliseMathsNotation(o.value), isKey: o.isKey === true, tag: o.misconceptionId ?? null, tagBehaviour: o.misconceptionBehaviour ?? null })),
      // R834: the key is normalised HERE TOO. Emitting the raw value beside normalised options
      // made the artefact show "68 cm2" against options of "68 cm²" and produced a finding about
      // a data fault that was an artefact fault.
      key: (() => { const k = opts.find((o) => o.isKey)?.value; return k == null ? null : normaliseMathsNotation(k); })(),
      hint: normaliseMathsNotation(String((it.explanation as Record<string, unknown> ?? {}).hintCore ?? '')),
      landedInTheServingStore: importedIds.has(String(it.itemId)),
    };
    const dg = digestOverText('this row as canonical JSON — keys sorted at every level, separators (",",":"), ensure_ascii false — with the rowSha256 fields absent', canonicalJson(row));
    return { ...row, rowSha256: dg.value, rowSha256Spec: dg.spec };
  });
  const refused = rows.filter((r) => !r.landedInTheServingStore);

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'maths-population-for-annie',
    THE_CUT: cut,
    SHE_READS_THE_FIRST_SECTION_AND_NAMES_THE_SITTING_SIZE: 'the orphan-mechanism screen is first because it is the one question that decides whether the sitting is a reading or an investigation.',
    ONE_THE_ORPHAN_MECHANISM_SCREEN: {
      herRuling: 'a hint signed against an entry is not a hint verified against its item, and one mis-join means a mechanism, not an accident.',
      whatWasTESTED: 'two signals, both mechanical. (a) OPERATION DISAGREEMENT — the hint names an operation and the stem names an operation and they share none. (b) EXECUTED — where the hint names exactly one operation, the stem holds exactly two numbers and the key is numeric, the operation is CARRIED OUT and compared with the key.',
      THE_MEMBERSHIP: '**NONE DELIVERABLE — THE SCREEN IS UNFIT AND ITS SIGNALS ARE WITHDRAWN.** Both produced members and EVERY ONE READ IS MY INSTRUMENT, not the data.',
      whatTheSignalsRETURNEDbeforeWITHDRAWAL: { operationDisagreements: opMismatch.length, executedDisagreeing: executed.length, ofExecutable: ranCount },
      WHY_THEY_ARE_WITHDRAWN: {
        theExecutor: 'it assumes ONE operation over the stem\'s FIRST TWO numbers. Maths hints are routinely multi-step and their operands are not the first two numbers. "25% of £80 — 25% is a quarter, so divide by four" was executed as 25 ÷ 80. "Add a long and a short side, then double" names TWO moves and was truncated to the first. "Divide the area by the length to get the width FIRST" says first.',
        theWordList: 'it conflates senses. "altogether" counted as addition in *how many hundreds are there altogether in 3,400*, where it is not an operation. "change" counted as subtraction in *change 6 kg into grams*, where it means convert.',
        soTHENUMBERSMEANNOTHING: 'a membership of 19 delivered to a sitting would have been 19 items to re-read, every one clean, and the reading would have been about my regexes.',
      },
      WHAT_WOULD_ACTUALLY_ANSWER_IT: 'the question — does a hint teach a move the key contradicts — is a READING of two texts against each other. It is not decidable from operation words and operand positions, and this store should not pretend otherwise. **Her ruling stands unserved: no screen here can find the mis-join she is looking for**, and saying so is the only honest membership report.',
      andTHEONETHINGTHATISSAID: 'ZERO rows were found by any signal that survived scrutiny. That is not "no mis-joins exist" — it is "this instrument cannot see them" (R60), and the difference is the whole finding.',
      AND_THE_BOUND_ON_IT: `**this screen decides ${ranCount} of ${items.length} rows and SCREENS the rest.** A hint that supplies a fact rather than naming an operation — "angles on a straight line add to 180°" — is not executable here, and its correctness is a reading, not a computation. **A zero from this screen is a zero about what it can execute, and nothing about the rest** (R60).`,
      andTHEFIRSTSIGNALWENTTHESAMEWAY: 'an earlier attempt flagged 22 rows where the hint names a number absent from the stem and key. Every one was a hint doing its job — supplying 180 for a straight line, 100 for place value. **THREE SIGNALS TRIED, THREE WITHDRAWN.** The consistency is the finding: every mechanical proxy for "the hint contradicts the key" measured something else that is normal and abundant.',
      PROPOSES_NOTHING: 'as instructed. No item is amended, no hint is rewritten, no verdict is offered.',
    },
    TWO_THE_POPULATION: {
      heldHere: items.length,
      theFourNotHeld: 'the staging walked 200 ids and staged 196. **The four held back are not on this side** — the authoring store would not pick between multiple hints for them, and one, MC05-MEAS-02, carries two hints about DIFFERENT PROBLEMS, which is a hint attached to the wrong item rather than a wording drift. They are named in the staging file and cannot be crossed from here.',
      eachRowCarries: 'item, group, tier, stem, every option with its value, key flag, tag and tag behaviour, the key, the hint, and whether it landed in the serving store — with a per-row digest.',
    },
    THREE_THE_EIGHTEEN_REFUSALS: {
      whatTheyARE: 'her house rules meeting a district that has never had a gate. These are the rows the child-facing gate refused on import; they are staged here and NOT in the serving store.',
      count: refused.length,
      andTHEDEGREEDECISIONISHERS: '**the °C rows are hers to decide because a bare "C" may be a label.** The rule reports the degree sign and never auto-inserts it, precisely so this decision is not made by a normaliser. Money WAS normalised — "5.00 pounds" to "£5.00" — because that normalisation is declared in the rule; the degree sign is not.',
      rows: refused.map((r) => ({ itemId: r.itemId, stem: r.stem, hint: r.hint, rowSha256: r.rowSha256 })),
    },
    ROWS: rows,
  };
  const lines = rows.map((r) => `${r.itemId}\t${r.rowSha256}`);
  const d = digestOverText('the row lines joined by \\n, each "<itemId>\\t<rowSha256>"', lines.join('\n'));
  const full = { ...payload, ROW_LINES: lines, rowLinesSha256: d.value, rowLinesSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_THE_ORPHAN_MECHANISM_SCREEN', 'TWO_THE_POPULATION', 'THREE_THE_EIGHTEEN_REFUSALS', 'ROWS', 'ROW_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('maths-population-for-annie', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'maths-population-for-annie');
  console.log(`rows ${rows.length} | orphan signals: op-mismatch ${opMismatch.length}, executed-disagreeing ${executed.length} (ran ${ranCount}/${items.length}) | refusals ${refused.length}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
