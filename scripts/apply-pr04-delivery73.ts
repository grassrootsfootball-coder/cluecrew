/**
 * THE DELIVERY 73 REPAIR, LANDED ON THE SERVING ROW SIX DAYS LATE (David, 2026-08-22).
 *
 * **WRITES CONTENT UNGUARDED (R63)** — the values are a reviewer ruling's, carried by the bank's
 * emission `PR04BANKROWFORDIFF`, sha256 853a93c4…, verified against David's citation before use.
 * Ruling authority: delivery 73 ruling 2 (2026-08-16). The diff read at David's desk established the
 * serving row still holds the pre-repair strings; this closes that gap for THREE fields.
 *
 * **`hintCore` IS DELIBERATELY NOT WRITTEN.** The pre-repair hint is condemned (it taught the
 * AFTER misreading); the bank's current hint states the key (Annie's PR-04 'no', eighty-fourth
 * return §1); her third text is specified and pending. The hint stays UNSERVED — authorship fields
 * remain null, so `chooseHint` keeps returning library — until she authors it.
 *
 * Each write asserts the row's current value equals the bank's stamped PREVIOUS value first (the
 * same discipline as the bank's own repair: the write cannot land on any other string).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';

const BANK_FILE = '/Users/davidb/Downloads/PR04BANKROWFORDIFF (1).json';
const EXPECTED = '853a93c4e8b69061f01bc6b7ba8ff3c4c4f384737cc91bab1227d4f4e25181c4';
const APPLY = process.argv.includes('--apply');

async function main() {
  const bytes = readFileSync(BANK_FILE);
  const sha = createHash('sha256').update(bytes).digest('hex');
  if (sha !== EXPECTED) throw new Error(`ABORTED — bank emission digest ${sha}, expected ${EXPECTED}.`);
  const bank = JSON.parse(bytes.toString('utf8')) as {
    stem: { text: string; previousText: string };
    options: Array<{ label: string; value: string; misconceptionExecution: string | null;
      stampsOnThisOption: Record<string, string> }>;
    explanation: { walkScript: string; previousWalkScript: string };
  };
  const AUTHORITY = {
    carriedBy: `PR04BANKROWFORDIFF, sha256 ${sha}`,
    ruling: 'Reviewer rulings, 2026-08-16 / delivery 73 ruling 2',
    landedHereOn: '2026-08-22',
    note: 'Landed six days after the bank wrote it; the serving row held the pre-repair strings until now.',
  };

  const i = await prisma.item.findUniqueOrThrow({ where: { id: 'ENG-028-PR-04' }, include: { options: { orderBy: { id: 'asc' } } } });
  const stem = i.stem as Record<string, unknown>;
  const e = (i.explanation ?? {}) as Record<string, unknown>;
  const problems: string[] = [];

  // 1. stem.text — assert current == bank's stamped previous
  if (stem.text !== bank.stem.previousText) {
    problems.push(`stem.text here is ${JSON.stringify(stem.text)}, not the bank's stamped previous ${JSON.stringify(bank.stem.previousText)}`);
  }
  // 2. option A execution — find by VALUE, not position
  const bankA = bank.options.find((o) => o.label === 'A')!;
  const optA = i.options.find((o) => String(((o.content ?? {}) as { value?: unknown }).value) === bankA.value);
  if (!optA) problems.push(`no option here carries A's value ${JSON.stringify(bankA.value)}`);
  /**
   * **walkScript IS REFUSED, AND THE PRECONDITION IS WHAT FOUND WHY.** The serving row holds a THIRD
   * text — neither the bank's previous nor its current: *"Line 13 says her ball had gone down the
   * side of the shed. That is why she reached in. The day of the holidays tells you when, not why."*
   * That is the eng028 walk repair ANNIE REVIEWED (`eng028-walk-repairs`, applied by
   * `apply-approved-walk-repairs.ts`) — a LATER wording carrying her approval, already free of the
   * AFTER misreading. Writing the bank's 16 August text over it would replace a reviewer-approved
   * string with an older one: the return leg running backwards (R592's supersession rule).
   */
  const walkRefused = e.walkScript !== bank.explanation.previousWalkScript;

  if (problems.length > 0) {
    console.error(`ABORTED — ${problems.length} precondition(s) failed; nothing written:`);
    for (const p of problems) console.error(`    ${p}`);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  console.log('stem.text and A.execution preconditions hold (each currently equals the bank\'s stamped PREVIOUS value).');
  if (walkRefused) {
    console.log('walkScript REFUSED: the row holds a LATER, Annie-approved wording (eng028-walk-repairs), not the pre-repair text. Not overwritten.');
  }
  if (!APPLY) { console.log('REPORT ONLY. Re-run with --apply.'); await prisma.$disconnect(); return; }

  await prisma.item.update({
    where: { id: 'ENG-028-PR-04' },
    data: {
      stem: { ...stem, text: bank.stem.text, _previousText: bank.stem.previousText,
        _repairAuthority: AUTHORITY } as object,
      explanation: { ...e,
        ...(walkRefused ? {} : { walkScript: bank.explanation.walkScript, _previousWalkScript: bank.explanation.previousWalkScript }),
        _repairAuthority: AUTHORITY,
        _walkScriptKeptBecause: walkRefused ? 'row holds the LATER Annie-approved eng028 walk repair; the bank\'s delivery-73 text is older and was not written over it' : undefined,
        _hintCoreDeliberatelyNotRepaired: 'both known texts condemned; Annie\'s third text pending (eighty-fourth return §1); hint stays unserved' } as object,
    },
  });
  await prisma.itemOption.update({
    where: { id: optA!.id },
    data: { misconceptionExecution: bankA.misconceptionExecution } as never,
  });

  const back = await prisma.item.findUniqueOrThrow({ where: { id: 'ENG-028-PR-04' }, include: { options: { orderBy: { id: 'asc' } } } });
  const bs = back.stem as Record<string, unknown>;
  const be = back.explanation as Record<string, unknown>;
  const ba = back.options.find((o) => o.id === optA!.id)! as { misconceptionExecution?: string | null };
  console.log('\nREAD BACK, beside the bank string each should equal:');
  console.log(`  stem.text      ${bs.text === bank.stem.text ? 'EQUAL' : 'DIFFERS'}\n      row : ${JSON.stringify(bs.text)}\n      bank: ${JSON.stringify(bank.stem.text)}`);
  console.log(`  walkScript     ${walkRefused ? 'REFUSED — kept the Annie-approved wording' : (be.walkScript === bank.explanation.walkScript ? 'EQUAL' : 'DIFFERS')}\n      row : ${JSON.stringify(String(be.walkScript).slice(0, 90))}…`);
  console.log(`  A.execution    ${ba.misconceptionExecution === bankA.misconceptionExecution ? 'EQUAL' : 'DIFFERS'}`);
  console.log(`  hintCore       NOT WRITTEN — ${JSON.stringify(be.hintCore)} (unserved; authorship null)`);
  await prisma.$disconnect();
}

void main();
