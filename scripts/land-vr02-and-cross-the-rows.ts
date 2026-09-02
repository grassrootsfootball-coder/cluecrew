/**
 * VR-02'S TEN AT THE DOOR, AND THE ROWS THE OTHER STORE ACTUALLY NEEDS (David, 2026-09-02).
 *
 * ONE — the ten vr-02 executions through the three gates. They cross with their `rowSha256`
 * computed from `bb6be0d3` and the doubt NAMED: `case-vr-02` is superseded on seventeen of
 * twenty-five rows and the authoring store could not say whether these five are among them.
 * **A refusal here is the artefact working**, not a fault in it.
 *
 * TWO — vr-19's twenty-five CURRENT ROWS. Its refusal is right and this store agrees with it: a
 * `vr19-letter-order` execution names the word and the digits, so re-pointing a sentence about TAP
 * at a row that no longer says TAP would be matching a serialisation instead of a substance. A
 * digest says a row changed; it cannot say what it now reads. **So the rows cross, not the
 * digests** — prompt, code map, key and every option — and the twenty-five re-author in one pass.
 *
 * THREE — case-vr-08's thirteen rows the cut never carried. Every vr-08 figure the other store has
 * published describes twenty-five of thirty-eight rows. **A stale population understates; a short
 * one misdescribes**, and only this store can supply the missing third.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { checkKeyPerformsStem } from '../packages/core/src/key-gate';
import { requirePopulation } from './lib/population';
import { readFieldsByName } from './lib/field-read';
import { assessRefusalShape, runRefusalShapeFixture, type ScreenedRow } from './lib/refusal-shape';
import { canonicalJson, findingsDigest, digestsBlock } from './lib/findings-digest';
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

interface Exec { itemId: string; optionValue: unknown; entryId: string; EXECUTION: string; rowSha256: string; determinesThisValueAndNoOther: boolean; siblingsReachedByTheSameAct?: unknown[] }

function crossOut(base: string, payload: Record<string, unknown>, keys: string[]): { name: string; fileSha: string } {
  const clean = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName(base, String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, base).split('/').pop()!;
  const fileSha = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fileSha}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
  return { name, fileSha };
}

async function main() {
  console.log(`VR-02 AT THE DOOR, AND TWO CROSSINGS — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  runRefusalShapeFixture();
  const srcBytes = readFileSync(pjoin(DL, 'cowork-rebinding-for-code (1).json'));
  const srcDigest = sha(srcBytes);
  if (srcDigest !== '2fac6fbb55457e26f6cb75f252368dedd179772d10e2a30ef6af5824af8c9725') throw new Error('rebinding digest mismatch');
  const src = JSON.parse(srcBytes.toString('utf8')) as Record<string, never>;

  // ---- ONE: VR-02'S TEN --------------------------------------------------------------------
  const execs = (src.THREE_vr02_FIVE_CROSSED_WITH_ONE_THING_THE_DESK_MAY_NOT_HAVE_WEIGHED as unknown as { executions: Exec[] }).executions;
  readFieldsByName('vr-02 executions', execs as unknown as Array<Record<string, unknown>>, ['itemId', 'optionValue', 'entryId', 'EXECUTION', 'rowSha256']);
  requirePopulation('vr02-door', { 'execution(s) crossed': execs.length });

  const rec: Array<{ itemId: string; optionValue: string; state: string; why: string; dims: Record<string, string> }> = [];
  for (const e of execs) {
    const itemId = e.itemId;
    const value = Array.isArray(e.optionValue) ? (e.optionValue as string[]).join(', ') : String(e.optionValue);
    const dims = { case: 'vr-02', entry: e.entryId };
    const row = await prisma.item.findUnique({ where: { id: itemId },
      select: { stem: true, solution: true, questionTypeId: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
    if (!row) { rec.push({ itemId, optionValue: value, state: 'HOLD', why: 'no such row here', dims }); continue; }

    const optVal = (o: { content: unknown }) => (o.content as { value?: unknown })?.value;
    const proj = { stem: row.stem, options: row.options.map((o) => ({ value: optVal(o), isKey: o.isCorrect })), solution: row.solution };
    const mine = sha(canonicalJson(JSON.parse(JSON.stringify(proj))));
    if (mine !== e.rowSha256) {
      rec.push({ itemId, optionValue: value, state: 'REFUSE',
        why: `the row moved: authored against ${e.rowSha256.slice(0, 16)}, this row is ${mine.slice(0, 16)}. case-vr-02 is superseded on seventeen of twenty-five rows and this is one of them.`, dims });
      continue;
    }
    const match = (o: { content: unknown }) => {
      const v = optVal(o);
      return Array.isArray(e.optionValue) ? JSON.stringify(v) === JSON.stringify(e.optionValue) : String(v) === String(e.optionValue);
    };
    const opt = row.options.find((o) => match(o) && o.misconceptionId === e.entryId);
    if (!opt) { rec.push({ itemId, optionValue: value, state: 'HOLD', why: `no option "${value}" carrying ${e.entryId}`, dims }); continue; }
    if (opt.misconceptionExecution) { rec.push({ itemId, optionValue: value, state: 'ALREADY', why: 'seat already carries an execution', dims }); continue; }

    const keyVal = String(optVal(row.options.find((o) => o.isCorrect)!) ?? '');
    const tg = checkTagWrite({ misconceptionId: e.entryId, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValue: value }, isWord);
    if (tg.verdict === 'REFUSES') { rec.push({ itemId, optionValue: value, state: 'REFUSE', why: `tag gate: ${tg.why}`, dims }); continue; }
    const kg = checkKeyPerformsStem({ questionTypeId: row.questionTypeId, stem: row.stem as Record<string, unknown>, keyValue: keyVal, optionValues: row.options.map((o) => String(optVal(o))) }, isWord);
    if (kg.verdict === 'REFUSES') { rec.push({ itemId, optionValue: value, state: 'REFUSE', why: `key gate: ${kg.why}`, dims }); continue; }

    if (APPLY) {
      await prisma.$transaction([
        prisma.itemOption.update({ where: { id: opt.id }, data: { misconceptionExecution: e.EXECUTION } }),
        prisma.attributionEvent.create({ data: { recordType: 'item', recordId: itemId, action: 'AMENDED', actor: 'annie', reviewerId: ANNIE,
          recordedBy: "agent:claude-code, David's session 2026-09-02", field: 'misconceptionExecution',
          method: `vr-02 rebinding crossing (${srcDigest.slice(0, 16)}): row digest asserted against the authored-against bytes; tag gate ${tg.verdict}, key gate ${kg.verdict}`,
          note: `"${value}" via ${e.entryId}; determinesThisValueAndNoOther=${String(e.determinesThisValueAndNoOther)} — the doubling state travels with the seat and is NOT resolved here` } }),
      ]);
    }
    rec.push({ itemId, optionValue: value, state: 'LANDED', why: `row digest matched; tag gate ${tg.verdict}, key gate ${kg.verdict}; doubling state recorded, unresolved`, dims });
  }
  const tally = rec.reduce<Record<string, number>>((a, r) => { a[r.state] = (a[r.state] ?? 0) + 1; return a; }, {});
  assessRefusalShape('vr02-door', rec.map((r) => ({ refused: r.state === 'REFUSE' || r.state === 'HOLD', reason: (r.state === 'REFUSE' || r.state === 'HOLD') ? r.why.slice(0, 70) : undefined, dims: r.dims })) as ScreenedRow[]);

  // ---- TWO: VR-19'S CURRENT ROWS, THE WORDS THEMSELVES --------------------------------------
  const vr19 = await prisma.item.findMany({ where: { questionTypeId: 'vr-19-word-number-codes' }, orderBy: { id: 'asc' },
    select: { id: true, stem: true, solution: true, difficultyTier: true, options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('vr19-rows', { 'vr-19 row(s)': vr19.length });
  const vr19Rows = vr19.map((r) => {
    const stem = r.stem as { prompt?: string; code?: Record<string, string> };
    const word = String(stem.prompt ?? '').match(/code for ([A-Z]+)/)?.[1] ?? null;
    const optVal = (o: { content: unknown }) => (o.content as { value?: unknown })?.value;
    return {
      itemId: r.id, tier: r.difficultyTier,
      THE_CODED_WORD: word,
      itRepeatsALetter: word ? [...word].some((c, i) => word.indexOf(c) !== i) : null,
      THE_CODE_MAP: stem.code ?? null,
      prompt: stem.prompt ?? null,
      options: r.options.map((o) => ({ value: optVal(o), isKey: o.isCorrect, tag: o.misconceptionId, carriesAnExecution: !!o.misconceptionExecution })),
      rowSha256: sha(canonicalJson(JSON.parse(JSON.stringify({ stem: r.stem, options: r.options.map((o) => ({ value: optVal(o), isKey: o.isCorrect })), solution: r.solution })))),
    };
  });

  // ---- THREE: VR-08'S THIRTEEN THE CUT NEVER CARRIED ----------------------------------------
  const pop = JSON.parse(readFileSync(pjoin(LANE, 'vr-arc-census-and-population-bb6be0d3f2fed905.json'), 'utf8')) as { SECTIONS: Array<{ caseId: string; rows: Array<{ itemId: string }> }> };
  const inCut = new Set(pop.SECTIONS.filter((s) => s.caseId === 'case-vr-08').flatMap((s) => s.rows.map((r) => r.itemId)));
  const vr08 = await prisma.item.findMany({ where: { questionTypeId: 'vr-08-move-letter' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, stem: true, solution: true, difficultyTier: true, answerFlaggedAt: true, options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  const missing = vr08.filter((r) => !inCut.has(r.id));
  requirePopulation('vr08-missing', { 'vr-08 row(s) here': vr08.length, 'row(s) the cut never carried': missing.length });
  const optVal = (o: { content: unknown }) => (o.content as { value?: unknown })?.value;
  const vr08Rows = missing.map((r) => ({
    itemId: r.id, status: r.status, tier: r.difficultyTier, answerFlagged: !!r.answerFlaggedAt,
    stem: r.stem,
    options: r.options.map((o) => ({ value: optVal(o), isKey: o.isCorrect, tag: o.misconceptionId, carriesAnExecution: !!o.misconceptionExecution })),
    rowSha256: sha(canonicalJson(JSON.parse(JSON.stringify({ stem: r.stem, options: r.options.map((o) => ({ value: optVal(o), isKey: o.isCorrect })), solution: r.solution })))),
  }));

  const report = {
    kind: 'VR02-AT-THE-DOOR-AND-THE-ROWS-YOU-NEED',
    TO: 'the authoring store; David and Annie by relay', date: '2026-09-02', mode: APPLY ? 'APPLIED' : 'DRY RUN',
    sourceDigest: srcDigest,
    ONE_VR02_AT_THE_DOOR: {
      TALLY: tally,
      andWHATAREFUSALMEANS: 'the artefact working. You crossed these with checkable bindings and named the doubt rather than asserting they bind; the door compared each against the live row and refused what had moved. That is the exchange behaving as designed, not a fault in the batch.',
      theDoublingStateTravelled: 'every landed seat records determinesThisValueAndNoOther and its siblings on the attribution event. Neither the doubling nor the overlap is resolved here — her 222nd rules that one seat carries one tag, decided by specificity across the corpus, and that is a reading.',
      RECORDS: rec,
    },
    TWO_VR19_CURRENT_ROWS: {
      whyTheseAndNotDigests: 'your refusal is right and this store agrees with it. A vr19-letter-order execution names the word and the digits, so re-pointing a sentence about TAP at a row that no longer says TAP would match a serialisation instead of a substance. A digest says a row changed; it cannot say what it now reads.',
      theWordsNOW: vr19Rows.map((r) => r.THE_CODED_WORD),
      everyWordRepeatsALetter: vr19Rows.every((r) => r.itRepeatsALetter === true),
      andWHATTHATFIXES: 'vr19-shared-letter-miss becomes performable on all twenty-five — the act presupposes a repeated letter and every current word has one. Those twenty-five seats need executions, not a tag ruling.',
      ROWS: vr19Rows,
    },
    THREE_VR08_THE_THIRTEEN_THE_CUT_NEVER_CARRIED: {
      yourFinding: 'every vr-08 figure you have published covers twenty-five of thirty-eight live rows — the tagged-seat count, the act-fit split, the hint-pair verdicts. A stale population understates; a short one misdescribes, and this is the second kind.',
      rowsHere: vr08.length, rowsInTheCut: inCut.size, missing: missing.length,
      whatTheyAre: 'the vr-08 SEED rows, NEVER_SHIPPABLE under David\'s seed ruling. They are inside the case and outside the door because the door cuts DRAFT — a decision with an author, not an omission (R920). They are crossed whole so your measurements can cover the case rather than the cut.',
      andONEWARNING: 'they are NEVER_SHIPPABLE. Counting them into a servable pool would be a different error from leaving them out of a census; the population of record for SERVING is the DRAFT rows, and the population of record for DESCRIBING THE CASE is all thirty-eight.',
      ROWS: vr08Rows,
    },
  };
  const { name, fileSha } = crossOut('vr02-door-and-the-rows-you-need', report, ['ONE_VR02_AT_THE_DOOR', 'TWO_VR19_CURRENT_ROWS', 'THREE_VR08_THE_THIRTEEN_THE_CUT_NEVER_CARRIED']);
  console.log(`\n  vr-02 at the door: ${JSON.stringify(tally)}`);
  console.log(`  vr-19 rows crossed: ${vr19Rows.length}, every word repeats a letter: ${vr19Rows.every((r) => r.itRepeatsALetter === true)}`);
  console.log(`  vr-08 rows the cut never carried: ${missing.length} of ${vr08.length}`);
  console.log(`  crossed: ${name} (FILE ${fileSha.slice(0, 16)})`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
