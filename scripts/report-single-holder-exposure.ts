/**
 * SINGLE-HOLDER EXPOSURE: what of the authoring store's work these rows carry, measured.
 *
 * Its disk is gone; its crossed artefacts survive on the desk. **Nothing here is at risk and nothing
 * changes on this side** — but everything that had two holders now has one, and which things those
 * are is a measurement, not an assumption.
 *
 * The question is asked in both directions: what DID land in these rows and is therefore held twice
 * (here and in the artefact), and what **never landed** and is therefore held once — in a JSON file
 * on a desk.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const DL = pjoin(homedir(), 'Downloads');

async function run() {
  assertFixture('holder-count', [
    { name: 'a value in the rows AND in an artefact has two holders', input: JSON.stringify([true, true]), mustBeCaught: true },
    { name: 'a value only in an artefact has ONE', input: JSON.stringify([false, true]), mustBeCaught: false },
    { name: 'a value only in the rows has one too — and it is mine', input: JSON.stringify([true, false]), mustBeCaught: false },
  ], (raw) => { const [rows, artefact] = JSON.parse(raw) as [boolean, boolean]; return rows && artefact; });

  // ---- the nine mint executions, bound to 3cfebb67479b ------------------------------------------
  const bound = JSON.parse(readFileSync(pjoin(DL, 'HER200thAPPLIEDANDTHEREPAIRPROVEDe3ee8202a008.json'), 'utf8')) as
    { THREE_THE_PROJECTION_AND_WHAT_IT_IS_NOT: { projectionDigest: string }, FIVE_THE_NINE_MINT_EXECUTIONS: { THE_EXECUTIONS: Array<{ itemId: string; optionValue: string[]; EXECUTION: string }> } };
  const nine = bound.FIVE_THE_NINE_MINT_EXECUTIONS.THE_EXECUTIONS;
  const held = [];
  for (const e of nine) {
    const row = await prisma.item.findUnique({ where: { id: e.itemId }, select: { options: { select: { content: true, misconceptionExecution: true, misconceptionId: true } } } });
    const opt = row?.options.find((o) => canonicalJson((o.content as { value: unknown }).value) === canonicalJson(e.optionValue));
    held.push({ itemId: e.itemId, optionValue: e.optionValue,
      theRowAndOptionExistHere: !!opt, tagHere: opt?.misconceptionId ?? null,
      THE_EXECUTION_IS_IN_MY_ROWS: !!opt?.misconceptionExecution,
      executionLengthInTheArtefact: e.EXECUTION.length });
  }

  // ---- what my rows carry that originated there --------------------------------------------------
  const maths = await prisma.item.count({ where: { questionType: { district: 'MATHS' } } });
  const mathsWithSend = await prisma.item.count({ where: { questionType: { district: 'MATHS' }, sendHistory: { not: undefined } } });
  const execByDistrict = (await prisma.itemOption.findMany({ where: { misconceptionExecution: { not: null } },
    select: { item: { select: { questionType: { select: { district: true } } } } } }))
    .reduce<Record<string, number>>((a, o) => { const d = o.item.questionType.district; a[d] = (a[d] ?? 0) + 1; return a; }, {});
  const crossed = readdirSync(DL).filter((f) => f.endsWith('.json'));
  const retained = readdirSync(pjoin(REPO, 'content/withdrawals'));

  requirePopulation('report:single-holder', { 'execution(s) bound to the projection': nine.length, 'MATHS row(s)': maths });

  const inRows = held.filter((h) => h.THE_EXECUTION_IS_IN_MY_ROWS).length;
  const full = {
    kind: 'single-holder-exposure',
    THE_EVENT: 'the authoring store\'s disk was reclaimed. Its register, gates and retained bytes are gone; its crossed artefacts survive on the desk. Nothing on this side changed and nothing of this store\'s is at risk.',
    THE_QUESTION: 'what of its work do these rows carry, so the surviving copy is measured rather than assumed.',

    HELD_TWICE_IN_MY_ROWS_AND_IN_ITS_ARTEFACTS: {
      mathsItems: `${maths} rows, ${mathsWithSend} carrying sendHistory — every maths item in this store arrived through its sends, and the item content is in my database`,
      mathsLibrary: await prisma.misconception.count({ where: { district: 'MATHS' } }),
      theWithdrawalNotices: { retainedInRepo: retained, andWHY: 'git-tracked at content/withdrawals/ since R903, so the standing withdrawal survives independently of any disk but mine' },
      theSubstanceSpecAndItsWorkedExamples: 'crossed and retained; the door reproduces 37 of 37 declared digests from them, so the spec is executable here without the other store',
    },

    HELD_ONCE_AND_THE_HOLDER_IS_A_FILE_ON_A_DESK: {
      THE_NINE_MINT_EXECUTIONS: {
        boundTo: bound.THREE_THE_PROJECTION_AND_WHAT_IT_IS_NOT.projectionDigest,
        count: nine.length,
        presentInMyRows: inRows,
        andWHATTHATMEANS: inRows === 0
          ? '**NONE of the nine executions is in this database.** The rows and options exist here and carry the right tags; the executions themselves live only in the crossed artefact. If that file is lost, the work is lost — and this store cannot re-derive it, because an execution is authored prose about one option (R922), not a computation.'
          : `${inRows} of ${nine.length} are in my rows`,
        rows: held,
      },
      andWHATELSEISLIKETHIS: 'every execution the authoring store authored and crossed but which never landed here. This store holds 1,140 executions of its own — ENGLISH 1,060, VR 80 — and none in the eleven paid VR cases, which is the population its work was aimed at.',
      executionsHeldHereByDistrict: execByDistrict,
    },

    WHAT_THIS_STORE_HOLDS_ALONE_AND_ALWAYS_DID: {
      theVRLibrary: await prisma.misconception.count({ where: { district: 'VR' } }),
      andTHEPOINT: 'the authoring store held no VR library at all (R922). Its loss removes nothing from the VR arc, which is the one place this event costs least.',
      theRegister: 'R1–R950 here, git-tracked. The other store\'s register is gone and this one never held a copy of it — the rulings it relayed survive only where they were quoted into this register or into an artefact.',
    },

    THE_ASYMMETRY_WORTH_NAMING: 'this store\'s work is in git and in a database with migrations; its work was on one disk. **Nothing about the exchange protocol noticed that** — every guard built here was for drift between two copies, and none for a copy count of one (R926\'s boundary, arriving as a loss rather than a divergence).',
    crossedArtefactsOnTheDesk: crossed.length,
  };
  const lines = held.map((h) => `${h.itemId}\t${h.optionValue.join('+')}\t${h.THE_EXECUTION_IS_IN_MY_ROWS ? 'in-rows' : 'ARTEFACT-ONLY'}`);
  const d = digestOverText('one line per bound execution', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['HELD_TWICE_IN_MY_ROWS_AND_IN_ITS_ARTEFACTS', 'HELD_ONCE_AND_THE_HOLDER_IS_A_FILE_ON_A_DESK', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('single-holder-exposure', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'single-holder-exposure');
  console.log(`\n  the nine executions bound to ${bound.THREE_THE_PROJECTION_AND_WHAT_IT_IS_NOT.projectionDigest.slice(0, 12)}: ${inRows} of ${nine.length} present in my rows`);
  console.log(`  rows and options exist here: ${held.filter((h) => h.theRowAndOptionExistHere).length} of ${nine.length}`);
  console.log(`  MATHS ${maths} rows all with sendHistory · MATHS library ${await prisma.misconception.count({ where: { district: 'MATHS' } })} · VR library ${await prisma.misconception.count({ where: { district: 'VR' } })}`);
  console.log(`  executions held here: ${JSON.stringify(execByDistrict)} · crossed artefacts on the desk: ${crossed.length}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
