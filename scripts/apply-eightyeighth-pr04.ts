/**
 * PR-04'S THIRD TEXT AND THE RECAST WALK, LANDED; THEN LIVE (David + Annie's eighty-eighth).
 *
 * **WRITES CONTENT UNGUARDED (R63)** — her authored wordings, authority the eighty-eighth return.
 *
 * **THE REPLACED-ASSERT IS WIDENED TO THE DOCUMENTED PRIORS AND NOTHING ELSE.** Her `replaced`
 * fields quote the BANK's strings; this store never held them (the hint move never crossed; the
 * walkScript is the Annie-approved repair). So each write asserts the row holds ITS documented
 * prior — hintCore: the pre-repair emission string; walkScript: the walk-repairs text recorded in
 * `_walkScriptKeptBecause`. **Any third text refuses: that would be a genuinely unexplained change,
 * and her amendment must not paper it.**
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const RET = '/Users/davidb/Downloads/annie-eightyeighth-return.md';
const EXPECTED = '4677bcb0d864a0ee35146a722a88e993df10ad703f92ffb26f7ceea39117ca4d';

const PRIOR_HINT = 'The humming came after, not before.';
const PRIOR_WALK = 'Line 13 says her ball had gone down the side of the shed. That is why she reached in. The day of the holidays tells you when, not why.';
const NEW_HINT = 'The humming started while she reached. It cannot be the reason she reached in.';
const NEW_WALK = 'Lines 13 and 14 say her ball had gone down the side of the shed. Line 14 says that while she was reaching in, the wall began to hum. The ball gives the reason her hand was in there. The humming is what happened while it was.';

async function main() {
  const sha = createHash('sha256').update(readFileSync(RET)).digest('hex');
  if (sha !== EXPECTED) throw new Error(`ABORTED — return digest ${sha}.`);
  const AUTH = `annie-eightyeighth-return.md, sha256 ${sha}`;

  for (const [role, label, text] of [['hint', 'PR-04.hintCore', NEW_HINT], ['hint', 'PR-04.walkScript', NEW_WALK]] as const) {
    const g = checkChildFacingText({ role, label, text }).filter(isBlocking);
    if (g.length) throw new Error(`ABORTED — ${label} fails the gate: ${g.map((f) => f.detail).join('; ')}`);
  }

  const i = await prisma.item.findUniqueOrThrow({ where: { id: 'ENG-028-PR-04' }, include: { options: true } });
  const e = (i.explanation ?? {}) as Record<string, unknown>;
  const problems: string[] = [];
  if (e.hintCore !== PRIOR_HINT) problems.push(`hintCore holds ${JSON.stringify(e.hintCore)} — not the documented prior`);
  if (e.walkScript !== PRIOR_WALK) problems.push(`walkScript holds ${JSON.stringify(e.walkScript)} — not the documented prior`);
  if (problems.length) {
    console.error('REFUSED — a genuinely unexplained change her amendment must not paper:');
    for (const p of problems) console.error(`    ${p}`);
    process.exitCode = 1; await prisma.$disconnect(); return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to drop them from `rest`
  const { _hintCoreDeliberatelyNotRepaired, _walkScriptKeptBecause, ...rest } = e as Record<string, unknown>;
  await prisma.item.update({
    where: { id: 'ENG-028-PR-04' },
    data: {
      status: 'LIVE',
      explanation: {
        ...rest,
        hintCore: NEW_HINT,
        _previousHintCore: PRIOR_HINT,
        hintAuthoredBy: 'Annie',
        hintAuthority: AUTH,
        walkScript: NEW_WALK,
        _previousWalkScript: PRIOR_WALK,
        _walkScriptAuthority: `${AUTH} — displaced the Annie-approved walk-repair text, superseded by her own later wording`,
        _hintFactDerivedFrom: 'stream-b-01 line 14, digest eeef2e810c180a6c263ebaa532b1835b0c164d30f4924fe75d2b86de07f11ea6, quoted verbatim in her section 1',
      } as object,
    },
  });
  console.log('landed. displaced walkScript, verbatim:');
  console.log(`  ${JSON.stringify(PRIOR_WALK)}`);
  await prisma.$disconnect();
}

void main();
