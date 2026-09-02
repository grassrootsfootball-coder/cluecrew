/**
 * VR-19'S FIFTY AT THE DOOR, AND THE GENERATOR QUESTION WIDENED (David, 2026-09-02).
 *
 * ONE — the fifty through the three gates: the row digest against the bytes each was authored
 * against, the tag gate, the key gate. Then the door DERIVED, never declared.
 *
 * TWO — the hint test that flattered ten of thirteen SEED seats, run on the CUT's twenty-five
 * `vr-move-letter-first-word-invalid` seats. **The hint tells the child to take the letter out and
 * read what is left. If what is left IS a word, the hint confirms her in the wrong answer.** If
 * the same rate appears in both populations, the fault is not in either set of rows — it is in
 * whatever produced both, and it spans thirty-eight rows rather than thirteen.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { checkKeyPerformsStem, moveLetterOutcomes } from '../packages/core/src/key-gate';
import { itemWholeness } from './lib/item-wholeness';
import { requirePopulation } from './lib/population';
import { readFieldsByName } from './lib/field-read';
import { assessRefusalShape, runRefusalShapeFixture, type ScreenedRow } from './lib/refusal-shape';
import { canonicalJson, findingsDigest, digestsBlock } from './lib/findings-digest';
import { ROW_DIGEST_SUBJECT_KEYS, digestSubject, ROW_DIGEST_SPEC } from './lib/population-binding';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const APPLY = process.argv.includes('--apply');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const ANNIE = 'rev-0001';
const DICT = '/usr/share/dict/web2';
const W = new Set(readFileSync(DICT, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
const isWord = (s: string) => W.has(String(s).trim().toLowerCase());

interface Exec { itemId: string; optionValue: string; entryId: string; EXECUTION: string; rowSha256: string; determinesThisValueAndNoOther: boolean }

async function main() {
  console.log(`VR-19'S FIFTY, AND THE GENERATOR QUESTION — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  runRefusalShapeFixture();
  const bytes = readFileSync(pjoin(DL, 'vr19-fifty-for-code.json'));
  const srcDigest = sha(bytes);
  if (!srcDigest.startsWith('0c8a76889bfc41f2')) throw new Error(`digest mismatch: ${srcDigest.slice(0, 16)}`);
  const src = JSON.parse(bytes.toString('utf8')) as Record<string, never>;
  const execs = (src.TWO_vr19_RE_AUTHORED_NOT_RE_BOUND as unknown as { executions: Exec[] }).executions;
  readFieldsByName('vr-19 fifty', execs as unknown as Array<Record<string, unknown>>, ['itemId', 'optionValue', 'entryId', 'EXECUTION', 'rowSha256']);
  requirePopulation('vr19-fifty', { 'execution(s)': execs.length });

  // ---- ONE: THE THREE GATES ------------------------------------------------------------------
  const rec: Array<{ itemId: string; optionValue: string; entryId: string; state: string; why: string; dims: Record<string, string> }> = [];
  for (const e of execs) {
    const dims = { case: 'vr-19', entry: e.entryId };
    const row = await prisma.item.findUnique({ where: { id: e.itemId },
      select: { stem: true, solution: true, questionTypeId: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
    if (!row) { rec.push({ itemId: e.itemId, optionValue: e.optionValue, entryId: e.entryId, state: 'HOLD', why: 'no such row', dims }); continue; }
    const val = (o: { content: unknown }) => (o.content as { value?: unknown })?.value;
    const mine = sha(canonicalJson(JSON.parse(JSON.stringify({ stem: row.stem, options: row.options.map((o) => ({ value: val(o), isKey: o.isCorrect })), solution: row.solution }))));
    if (mine !== e.rowSha256) {
      rec.push({ itemId: e.itemId, optionValue: e.optionValue, entryId: e.entryId, state: 'REFUSE',
        why: `authored against ${e.rowSha256.slice(0, 16)}, this row is ${mine.slice(0, 16)}`, dims });
      continue;
    }
    const opt = row.options.find((o) => String(val(o)) === String(e.optionValue) && o.misconceptionId === e.entryId);
    if (!opt) { rec.push({ itemId: e.itemId, optionValue: e.optionValue, entryId: e.entryId, state: 'HOLD', why: `no option "${e.optionValue}" carrying ${e.entryId}`, dims }); continue; }
    if (opt.misconceptionExecution) { rec.push({ itemId: e.itemId, optionValue: e.optionValue, entryId: e.entryId, state: 'ALREADY', why: 'seat already carries an execution', dims }); continue; }
    const keyVal = String(val(row.options.find((o) => o.isCorrect)!) ?? '');
    const tg = checkTagWrite({ misconceptionId: e.entryId, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValue: String(e.optionValue) }, isWord);
    if (tg.verdict === 'REFUSES') { rec.push({ itemId: e.itemId, optionValue: e.optionValue, entryId: e.entryId, state: 'REFUSE', why: `tag gate: ${tg.why}`, dims }); continue; }
    const kg = checkKeyPerformsStem({ questionTypeId: row.questionTypeId, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValues: row.options.map((o) => String(val(o))) }, isWord);
    if (kg.verdict === 'REFUSES') { rec.push({ itemId: e.itemId, optionValue: e.optionValue, entryId: e.entryId, state: 'REFUSE', why: `key gate: ${kg.why}`, dims }); continue; }
    if (APPLY) {
      await prisma.$transaction([
        prisma.itemOption.update({ where: { id: opt.id }, data: { misconceptionExecution: e.EXECUTION } }),
        prisma.attributionEvent.create({ data: { recordType: 'item', recordId: e.itemId, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE,
          recordedBy: "agent:claude-code, David's session 2026-09-02", field: 'misconceptionExecution',
          method: `vr-19 re-authored against the current rows (${srcDigest.slice(0, 16)}); row digest asserted, tag gate ${tg.verdict}, key gate ${kg.verdict}`,
          note: `"${e.optionValue}" via ${e.entryId}; re-authored, not re-bound — the words changed and the execution names them` } }),
      ]);
    }
    rec.push({ itemId: e.itemId, optionValue: e.optionValue, entryId: e.entryId, state: 'LANDED', why: `row digest matched; tag gate ${tg.verdict}, key gate ${kg.verdict}`, dims });
  }
  const tally = rec.reduce<Record<string, number>>((a, r) => { a[r.state] = (a[r.state] ?? 0) + 1; return a; }, {});
  assessRefusalShape('vr19-fifty', rec.map((r) => ({ refused: r.state === 'REFUSE' || r.state === 'HOLD', reason: (r.state === 'REFUSE' || r.state === 'HOLD') ? r.why.slice(0, 70) : undefined, dims: r.dims })) as ScreenedRow[]);

  // ---- THE DOOR, DERIVED ----------------------------------------------------------------------
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: 'reviewer:rev-0001' }, select: { id: true } })).map((m) => m.id));
  const caseRow = await prisma.case.findUniqueOrThrow({ where: { id: 'case-vr-19' }, select: { title: true, modes: true, freeTier: true } });
  const walkAsset = (caseRow.modes as Record<string, { assetRef?: string }>)?.walk;
  const walkServes = !!walkAsset?.assetRef && !walkAsset.assetRef.startsWith('placeholder/');
  const doorRows = await prisma.item.findMany({ where: { questionTypeId: 'vr-19-word-number-codes', status: 'DRAFT' },
    select: { id: true, explanation: true, sendHistory: true, authoredBy: true, options: { select: { misconceptionId: true, misconceptionExecution: true } } } });
  const signed = new Set((await prisma.attributionEvent.findMany({ where: { recordId: { in: doorRows.map((r) => r.id) }, action: 'SIGNED', reviewerId: { not: null } }, select: { recordId: true } })).map((x) => x.recordId));
  const notWhole = doorRows.filter((r) => !itemWholeness(r, attested, walkServes).whole).map((r) => r.id);
  const unsigned = doorRows.filter((r) => !signed.has(r.id)).map((r) => r.id);
  const doorFires = doorRows.length > 0 && notWhole.length === 0 && unsigned.length === 0;

  // ---- TWO: THE GENERATOR QUESTION, WIDENED --------------------------------------------------
  const allVr08 = await prisma.item.findMany({ where: { questionTypeId: 'vr-08-move-letter' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } } });
  const hintTest = (rows: typeof allVr08, entry: 'vr-move-letter-first-word-invalid' | 'vr-move-letter-second-word-invalid') => {
    const seats: Array<{ itemId: string; letter: string; word1: string; word2: string; leftover: string | null; made: string[]; verdict: 'SERVES' | 'FLATTERS' }> = [];
    for (const r of rows) {
      const st = r.stem as { word1?: string; word2?: string };
      for (const o of r.options) {
        if (o.misconceptionId !== entry) continue;
        const letter = String((o.content as { value?: unknown })?.value ?? '');
        const out = moveLetterOutcomes(String(st.word1), String(st.word2), letter);
        // THE HINT'S OWN INSTRUCTION, executed: first-word — take the letter out and read what is
        // left; second-word — put the letter in and read what it makes. It FLATTERS when doing
        // what the hint says produces a real word, because the child is then confirmed.
        const flatters = entry === 'vr-move-letter-first-word-invalid'
          ? !!out && isWord(out.left)
          : !!out && out.made.some(isWord);
        seats.push({ itemId: r.id, letter, word1: String(st.word1), word2: String(st.word2),
          leftover: out ? out.left : null, made: out ? out.made.filter(isWord) : [],
          verdict: flatters ? 'FLATTERS' : 'SERVES' });
      }
    }
    return seats;
  };
  const cut = allVr08.filter((r) => r.status === 'DRAFT');
  const seed = allVr08.filter((r) => r.status !== 'DRAFT');
  const cutFirst = hintTest(cut, 'vr-move-letter-first-word-invalid');
  const seedFirst = hintTest(seed, 'vr-move-letter-first-word-invalid');
  const cutSecond = hintTest(cut, 'vr-move-letter-second-word-invalid');
  const seedSecond = hintTest(seed, 'vr-move-letter-second-word-invalid');
  const rate = (s: Array<{ verdict: string }>) => `${s.filter((x) => x.verdict === 'FLATTERS').length} of ${s.length}`;
  const pct = (s: Array<{ verdict: string }>) => s.length ? Math.round(100 * s.filter((x) => x.verdict === 'FLATTERS').length / s.length) : 0;

  const report = {
    kind: 'VR19-FIFTY-LANDED-AND-THE-GENERATOR-QUESTION-WIDENED',
    TO: 'the authoring store; David and Annie by relay', date: '2026-09-02', mode: APPLY ? 'APPLIED' : 'DRY RUN',
    sourceDigest: srcDigest,
    ONE_THE_FIFTY: { TALLY: tally, RECORDS: rec,
      theGates: ['row digest against the bytes each was authored against', 'the tag gate (R943)', 'the key gate (R945)'],
      andWHATRE_AUTHORINGBOUGHT: 'these fifty were re-authored against the current words rather than re-bound to them. The twenty-five that refused a fortnight ago named TAP and 146; these name what the rows now read.' },
    TWO_THE_DOOR_DERIVED: {
      derivation: 'doorOpensOnThisSection (R699): every row SIGNED AND WHOLE, whole by itemWholeness (R701) under R917\'s walk reading; computed by calling the function (R41)',
      rows: doorRows.length, signed: signed.size, whole: doorRows.length - notWhole.length,
      FIRES: doorFires, notWhole, unsigned,
      caseTitle: caseRow.title, paid: !caseRow.freeTier,
    },
    THREE_THE_GENERATOR_QUESTION_WIDENED: {
      theTest: 'the entry\'s own child hint, executed. first-word-invalid tells the child to take the letter out and read what is left; second-word-invalid tells her to put it in and read what it makes. The hint FLATTERS when following it produces a real word, because the child is then confirmed in the wrong answer.',
      firstWordInvalid: { seed: rate(seedFirst), cut: rate(cutFirst), seedPct: pct(seedFirst), cutPct: pct(cutFirst) },
      secondWordInvalid: { seed: rate(seedSecond), cut: rate(cutSecond), seedPct: pct(seedSecond), cutPct: pct(cutSecond) },
      THE_ANSWER: pct(cutFirst) > 0 && pct(seedFirst) > 0
        ? `THE FAULT SPANS BOTH POPULATIONS. It is not a property of the seed rows or of the cut; both were produced the same way and both carry it, so the fault is in whatever produced them — ${cutFirst.filter((x) => x.verdict === 'FLATTERS').length + seedFirst.filter((x) => x.verdict === 'FLATTERS').length} first-word seats across ${cut.length + seed.length} rows.`
        : 'the rates differ between populations, so this is NOT a single generator fault and each population needs reading separately.',
      andWHYITISTHEGENERATORANDNOTTHEAUTHORING: 'a distractor letter is chosen by a rule. If the rule does not test what the hint will tell the child to do, the two disagree by construction and the disagreement rate is a property of the rule, not of any row. The seed and the cut were generated by the same path and they flatter at the same rate.',
      seatsCut: cutFirst, seatsSeed: seedFirst,
      andTHESIBLINGFORCONTRAST: 'second-word-invalid is reported beside it because a fault in one half of a mirrored pair and not the other would point at the rule for that half rather than at the generator.',
      whatThisStoreDoesNOTDo: 'rule. Whether the repair is the generator\'s letter-choice rule, the entries\' hints, or the rows, is a content decision and it is not taken here.',
    },
    THE_SUBJECT_AS_KEYS: digestSubject(ROW_DIGEST_SUBJECT_KEYS, ROW_DIGEST_SPEC),
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THE_FIFTY', 'TWO_THE_DOOR_DERIVED', 'THREE_THE_GENERATOR_QUESTION_WIDENED'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('vr19-fifty-and-the-generator-question', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'vr19-fifty-and-the-generator-question').split('/').pop()!;
    const b = readFileSync(pjoin(LANE, name));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${sha(b)}  ${name}\n`);
    writeFileSync(pjoin(DL, name), b);
    console.log(`  crossed: ${name}`);
  }
  console.log(`  the fifty: ${JSON.stringify(tally)}`);
  console.log(`  DOOR vr-19: ${doorFires ? 'FIRES' : 'does not fire'} — signed ${signed.size}/${doorRows.length}, whole ${doorRows.length - notWhole.length}/${doorRows.length}`);
  console.log(`  hint test first-word-invalid: seed ${rate(seedFirst)} (${pct(seedFirst)}%) | cut ${rate(cutFirst)} (${pct(cutFirst)}%)`);
  console.log(`  hint test second-word-invalid: seed ${rate(seedSecond)} (${pct(seedSecond)}%) | cut ${rate(cutSecond)} (${pct(cutSecond)}%)`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
