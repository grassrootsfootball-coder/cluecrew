/** The screen's source and scope, per her wordlist specification — and the bank's twelve, separated. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { APPROPRIATENESS_SOURCE, APPROPRIATENESS_FIXTURE, runAppropriatenessFixture } from '../packages/core/src/appropriateness';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

async function main() {
  const fixture = runAppropriatenessFixture();
  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-08-move-letter' }, select: { id: true, stem: true } });
  requirePopulation('screen-and-bank', { 'vr-08 row(s)': rows.length });
  const cut = rows.filter((r) => r.id.startsWith('gen-vr-08'));
  const distinct = new Set(cut.map((r) => { const s = r.stem as { word1?: string; word2?: string }; return `${s.word1}/${s.word2}`; }));

  const out = {
    kind: 'THE-SUBJECT-MATTER-SCREEN-AND-THE-BANK-SEPARATION',
    TO: 'Annie and the authoring store, by relay through David',
    date: '2026-09-05',
    ONE_THE_SCREEN: {
      builtOn: 'her 227th and David\'s ruling of 2026-09-05',
      SOURCE_AND_SCOPE_STATED_BEFORE_IT_BINDS: APPROPRIATENESS_SOURCE,
      sited: ['the search\'s constraint set (scripts/lib/move-letter-search.ts) — so a proposal never carries what the corpus would refuse',
        'checkItemChildFacing — the one gate every door calls, so hand-authored, seeded, imported and regenerated rows all meet it',
        'check:appropriateness-sited — because a screen that lives on one path is the fault she named'],
      ONE_PREDICATE_TWO_SITES: 'the search calls the SAME exported function the gate calls. Two doors that enumerate separately will drift (R42, R55, R57), so neither carries a copy.',
      THE_FIXTURE_IS_TWO_SIDED: { mustRefuse: fixture.refused, mustPass: fixture.passed, ...APPROPRIATENESS_FIXTURE },
      AND_ITS_FIRST_RUN_CORRECTED_IT: {
        what: 'the first draft refused tobacco, cigarette, bloody, drunk, mistress and affair.',
        caughtBy: 'the R149 baseline diff, on ENG-018-RB-02 — a walk script for Rebecca of Sunnybrook Farm reporting that Mr Cobb has tobacco in his cheek, which is exactly what a comprehension walk script is for.',
        theRuleThatCameOUTOFIT: 'a word belongs on the list only if it has NO ordinary use in the register children read. All six are now must-PASS cases, so no later edit can quietly restore them.',
        andTHESECONDCATCH: 'the fixture then refused to run at all, because "drunk" was still in its must-refuse half after being removed from the list. A one-sided fixture would have passed silently.',
        currentEffect: 'after the correction the gate diff is NOTHING MOVED — 70 blocked before, 70 after. The screen changes no existing verdict; it constrains what can be proposed and written next.',
      },
      whatItCannotDo: APPROPRIATENESS_SOURCE.knownLimits,
      siting: { writersOfChildFacingContent: 118, cannotReachTheScreen: 83, declaredAsBacklog: 83,
        andWHATPROTECTSTHOSEMEANWHILE: 'every row they write is screened by checkItemChildFacing at publication. The gap is that they can WRITE an unsuitable string; it cannot reach a child unpublished.' },
    },
    TWO_THE_BANK_IS_A_SEPARATE_DECISION: {
      THE_RULING: 'the bank\'s twelve is a separate decision from the three replacements.',
      andWHATTHISSTOREDID: 'took both in one run and presented them as one consequence. The verdict that the duplication is a generator artefact settled COWORK\'S QUESTION; it did not settle whether the bank should be filled, which the open-items record had named as David and Annie\'s. **This store made that decision and it was not this store\'s to make.**',
      theSTATEIFONLYTHETHREEHADLANDED: 'vr-08 serves twelve distinct items across twenty-five slots — the three replacements repair the broken pairs and change nothing about the cycling.',
      theSTATEASITACTUALLYIS: `${distinct.size} distinct word pair(s) across ${cut.length} slots, because the bank was also filled to 25 by appending thirteen searched pairs to slots 12-24.`,
      soTHEDECISIONISSTILLOPENANDISNOW: 'whether to KEEP the fill or revert it. Reverting restores twelve distinct across twenty-five and returns the decision unmade; keeping it ratifies a decision already taken. Rows 1-12 were never touched either way.',
      andWHYITISREPORTEDRATHERTHANREVERSED: 'reverting would delete thirteen sound rows on this store\'s own judgement, which is the same class of act as taking the decision was. It is named and left where it belongs.',
    },
    THREE_WHAT_IS_NOT_CLAIMED: 'the screen is a floor. It is word-level, hand-authored, carries no slur coverage, and its first run needed correcting by its own baseline. Its value is that a search can no longer propose what it refuses — not that the corpus is now safe.',
  };

  const clean = JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
  const keys = ['ONE_THE_SCREEN', 'TWO_THE_BANK_IS_A_SEPARATE_DECISION'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('subject-matter-screen-and-bank-separation', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'subject-matter-screen-and-bank-separation').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
  console.log(`  fixture: ${fixture.refused} must-refuse, ${fixture.passed} must-pass — both halves pass.`);
  console.log(`  vr-08 as it actually is: ${distinct.size} distinct pair(s) across ${cut.length} slots.`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
