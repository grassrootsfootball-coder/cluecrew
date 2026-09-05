/**
 * check:gate-silence — EVERY RULE GETS A LINE EVERY RUN, INCLUDING THE ZEROS (R1007).
 *
 * The subject-matter screen was inert for three turns and the gate said nothing, because there was
 * nothing to say. **A report over FAULTS cannot show an absent fault; a report over RULES can.**
 */
import { existsSync, readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { sweepGate, undeclaredRules } from './lib/gate-report';
import { loadClearances } from './lib/clearances';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');

/** The closed set, read from the type's own declaration rather than re-listed (R57). */
function rulesFromTheType(): string[] {
  const src = readFileSync(pjoin(REPO, 'packages/core/src/content-gates.ts'), 'utf8');
  const line = /rule:\s*((?:'[a-z0-9-]+'\s*\|\s*)+'[a-z0-9-]+');/.exec(src);
  if (!line) throw new Error('could not read the ContentFailure rule union from content-gates.ts — a reader refuses a shape it cannot parse (R173)');
  return [...line[1]!.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]!);
}

async function main() {
  console.log('check:gate-silence — every rule the gate can emit, reported every run, zeros included.');
  const allRules = rulesFromTheType();
  const declared = existsSync(pjoin(REPO, 'content/silent-rules.json'))
    ? (JSON.parse(readFileSync(pjoin(REPO, 'content/silent-rules.json'), 'utf8')) as { silent: Record<string, string> }).silent : {};

  const items = await prisma.item.findMany({
    include: { options: { orderBy: { id: 'asc' } }, questionType: { select: { mechanic: true } } }, orderBy: { id: 'asc' },
  });
  requirePopulation('check:gate-silence', { 'row(s) screened': items.length, 'rule(s) the gate can emit': allRules.length });

  const clearances = loadClearances();
  const faults: Array<{ rule: string; itemId: string }> = [];
  for (const i of items) {
    for (const f of checkItemChildFacing({
      id: i.id, stem: i.stem, explanation: i.explanation, mechanic: i.questionType.mechanic,
      options: i.options, clearedAppropriatenessTokens: clearances.get(i.id),
    }).filter(isBlocking)) faults.push({ rule: f.rule, itemId: i.id });
  }

  /**
   * **A CANARY SEPARATES THE TWO SILENCES, AND NOTHING ELSE CAN.** A rule at zero is either
   * enforcing and finding nothing, or inert and finding nothing, and the corpus cannot tell them
   * apart — that is exactly the state the subject-matter screen sat in for three turns. So every
   * rule is fed a string it MUST catch. A rule whose canary fires is working; a rule whose canary
   * does NOT fire is INERT and is refused whatever its declaration says (R60's second question,
   * made mechanical instead of remembered).
   */
  const CANARIES: Record<string, { stem: unknown; options?: Array<{ content: unknown; isCorrect?: boolean }> }> = {
    'sentence-length': { stem: { prompt: 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen.' } },
    'four-syllable-words': { stem: { prompt: 'The extraordinary situation.' } },
    'banned-vocabulary': { stem: { prompt: 'You must be careless.' } },
    'subject-matter': { stem: {}, options: [{ content: { value: 'HELL' }, isCorrect: false }] },
    'internal-id-leak': { stem: { prompt: 'See en-plausible-not-stated for more.' } },
    'us-spelling': { stem: { prompt: 'The color of the harbor.' } },
    'notation': { stem: { prompt: 'It cost 5.00 pounds and was 4C outside.' } },
    'four-syllable-words': { stem: { prompt: 'The extraordinary situation required immediate consideration and preparation.' } },
    'unclassified-path': { stem: {}, explanation: { someUndeclaredField: 'a string on a path nobody has classified' } },
  };
  /**
   * **THE TYPE'S CLOSED SET IS NOT THIS GATE'S.** `notice-standard` and `placeholder-tag` are
   * emitted by `checkNoticeStandard` and the misconception checks — different gates sharing one
   * `ContentFailure` type. Screening them here reported two rules as SILENT AND INERT when this
   * gate simply does not emit them, which is R1006 one level up: **a shared TYPE makes the rules of
   * several gates look like the rules of one.** They are named, with their owner, rather than
   * dropped — a rule out of scope is a fact, not an absence.
   */
  const OWNED_BY_ANOTHER_GATE: Record<string, string> = {
    'notice-standard': 'checkNoticeStandard / checkServabilityNotice in content-gates.ts — a notice gate, not the item gate',
    'placeholder-tag': 'the misconception field checks in content-gates.ts — emitted over library rows, not item rows',
  };
  const canaryFired: Record<string, boolean> = {};
  const missingCanary: string[] = [];
  for (const rule of allRules) {
    if (rule in OWNED_BY_ANOTHER_GATE) continue;
    const c = CANARIES[rule];
    if (!c) { missingCanary.push(rule); continue; }
    const got = checkItemChildFacing({ id: `canary:${rule}`, stem: c.stem, explanation: (c as { explanation?: unknown }).explanation, options: c.options ?? [] });
    canaryFired[rule] = got.some((f) => f.rule === rule);
  }

  const mine = allRules.filter((r) => !(r in OWNED_BY_ANOTHER_GATE));
  const sweep = sweepGate(mine, faults, items.length, declared);
  const unknown = undeclaredRules(allRules, faults);

  console.log(`  ${sweep.screened} row(s) screened against ${mine.length} rule(s) THIS gate emits; ${faults.length} blocking fault(s).`);
  for (const [r, owner] of Object.entries(OWNED_BY_ANOTHER_GATE)) console.log(`       ${r.padEnd(24)} OUT OF SCOPE — owned by ${owner}`);
  console.log('');
  for (const r of sweep.rules) {
    const mark = !r.silent ? '     ' : r.declared ? ' ·   ' : ' !!  ';
    const canary = canaryFired[r.rule] === undefined ? 'no canary' : canaryFired[r.rule] ? 'canary fires' : 'CANARY DID NOT FIRE';
    console.log(`  ${mark}${r.rule.padEnd(24)} ${String(r.count).padStart(5)} fault(s) on ${String(r.rows).padStart(4)} row(s)  [${canary}]${r.silent ? (r.declared ? `  declared: ${r.declared.slice(0, 48)}` : '  SILENT — NO DECLARATION') : ''}`);
  }

  const inert = sweep.silent.filter((r) => canaryFired[r.rule] === false);
  if (missingCanary.length) {
    console.error(`\n  REFUSED — ${missingCanary.length} rule(s) have no canary, so their silence cannot be read: ${missingCanary.join(', ')}`);
    process.exitCode = 1; return;
  }
  if (inert.length) {
    console.error(`\n  REFUSED — ${inert.length} rule(s) are SILENT AND INERT: their canary did not fire, so they are not enforcing anything:`);
    for (const r of inert) console.error(`    ${r.rule}`);
    console.error('  A declaration cannot excuse this. An inert rule reports zero for the same reason a working one does.');
    process.exitCode = 1; return;
  }

  if (unknown.length) {
    console.error(`\n  REFUSED — ${unknown.length} rule(s) reached a reader that the closed set does not know: ${unknown.join(', ')}`);
    process.exitCode = 1; return;
  }
  console.log(`\n  ${sweep.rules.length - sweep.silent.length} rule(s) fired; ${sweep.silent.length} silent, ${sweep.undeclaredSilent.length} of those undeclared.`);
  if (sweep.undeclaredSilent.length === 0) {
    console.log('  Every silent rule is declared. A rule at zero is reported as a zero and never as an absence.');
    return;
  }
  console.error(`\n  REFUSED — ${sweep.undeclaredSilent.length} rule(s) fired ZERO times with no declared reason:`);
  for (const r of sweep.undeclaredSilent) console.error(`    ${r.rule}`);
  console.error('\n  A rule at zero is either enforcing nothing or LOOKING at nothing, and the output cannot');
  console.error('  tell you which. The subject-matter screen sat at zero for three turns while inert, and');
  console.error('  nothing was printed to distrust. Declare the reason in content/silent-rules.json.');
  process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
