/**
 * BOTH FIRST RUNS FAILED, THE QUALIFIER RUN OVER EVERYTHING, AND THE HOLDS ROUTED TO HER.
 *
 * **BOTH FIXTURES FAILED THE OTHER'S LIST ON ITS FIRST RUN, AND THAT IS THE METHOD WORKING.** The
 * previous report framed their four failures as "their category, which this store lacks" — which is
 * true and is not what happened. **Their fixture failed this store's list.** Said the other way it
 * is a finding about this store, and that is the way it should have been said.
 *
 * **AND THE FOUR ARE NOT THIS STORE'S TO READ OFF.** SHOOT, ARMS, POT and HIGH sit on rows in the
 * crossed population — written content, not proposals — so under her 228th they HOLD AND ROUTE to
 * her with their context. The authoring store made this same correction to its own report last
 * turn: a store that finds a flag on somebody's written row and reads it as ordinary itself has
 * used the wrong door.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { screenForAChild, APPROPRIATENESS_LISTS, APPROPRIATENESS_VERSION } from '../packages/core/src/appropriateness';
import { runAgainst, PORTABLE_CASES, type CaseKind } from '../packages/core/src/appropriateness-fixture';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

async function main() {
  const theirBytes = readFileSync(pjoin(DL, 'cowork-fixture-for-code.json'));
  if (!sha(theirBytes).startsWith('7e0a5956e807184d')) throw new Error('their fixture does not verify');
  const A = (JSON.parse(theirBytes.toString('utf8')) as any).TWO_THE_FIXTURE_AS_THE_THING_THAT_CROSSES.THE_ARTEFACT;
  const theirCases = [
    ...A.MUST_REFUSE.map((c: any) => ({ ...c, kind: 'MUST_REFUSE' as CaseKind })),
    ...A.MUST_NOT_REFUSE.map((c: any) => ({ ...c, kind: 'MUST_NOT_REFUSE' as CaseKind })),
    ...A.SUBSTRING_TRAPS.map((c: any) => ({ ...c, kind: 'SUBSTRING_TRAP' as CaseKind })),
    ...A.NEEDS_A_SENSE.map((c: any) => ({ ...c, kind: 'NEEDS_A_SENSE' as CaseKind })),
  ];
  const R = new Set(APPROPRIATENESS_LISTS.refuse);
  const F = new Set([...APPROPRIATENESS_LISTS.flagAmbiguousSense, ...APPROPRIATENESS_LISTS.flagNeedsContext]);
  const runTheirs = (Rs: Set<string>, Fs: Set<string>) => theirCases.map((c) => {
    const w = c.word.toLowerCase(); const inR = Rs.has(w), inF = Fs.has(w);
    const passed = c.kind === 'MUST_REFUSE' ? inR : c.kind === 'NEEDS_A_SENSE' ? inR || inF : !inR;
    return { word: c.word, kind: c.kind, passed, saw: inR ? 'refuse' : inF ? 'flag' : 'neither', reason: c.reason };
  });
  /** The list as it stood when their fixture first ran, so the repair is measured and not asserted. */
  const beforeF = new Set([...F].filter((w) => !['shoot', 'arms', 'pot', 'high'].includes(w)));
  const before = runTheirs(R, beforeF);
  const after = runTheirs(R, F);
  const mineOnMine = runAgainst(R, F);

  // ── THE HOLDS ─ rows in this store carrying a flagged token, routed rather than read off ──────
  const items = await prisma.item.findMany({
    where: { status: { in: ['DRAFT', 'LIVE'] } },
    select: { id: true, status: true, questionTypeId: true, stem: true,
      options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } },
  });
  requirePopulation('route-the-holds', { 'servable-or-draft row(s) screened': items.length });
  const holds: Array<Record<string, unknown>> = [];
  for (const it of items) {
    const seen = new Set<string>();
    const consider = (text: string, where: string) => {
      const v = screenForAChild(text, 'bare', 'write-gate');
      if (v.verdict !== 'FLAG-NEEDS-A-SENSE') return;
      for (const h of v.hits) {
        const k = `${it.id}:${h.word}`;
        if (seen.has(k)) continue;
        seen.add(k);
        holds.push({
          itemId: it.id, status: it.status, questionType: it.questionTypeId,
          token: h.word, matched: h.matched, where,
          THE_ROW_AS_THE_CHILD_MEETS_IT: it.stem,
          optionValues: it.options.map((o) => (o.content as { value?: unknown })?.value),
          action: 'HELD AND ROUTED', routedTo: 'Annie',
          THE_QUESTION_FOR_HER: `does the sense THIS row supplies make "${h.matched}" the ordinary one? A bare option value supplies no sentence, so this holds rather than answering itself.`,
        });
      }
    };
    const st = it.stem as Record<string, unknown>;
    for (const f of ['word1', 'word2', 'stemWord']) if (typeof st[f] === 'string') consider(st[f] as string, `stem.${f}`);
    if (Array.isArray(st.words)) for (const w of st.words) consider(String(w), 'stem.words');
    for (const [i, o] of it.options.entries()) {
      const v = (o.content as { value?: unknown })?.value;
      for (const one of (Array.isArray(v) ? v : [v])) consider(String(one ?? ''), `options[${i}]`);
    }
  }

  const report = {
    kind: 'BOTH-FIRST-RUNS-FAILED-THE-QUALIFIER-RUN-OVER-EVERYTHING-AND-THE-HOLDS-ROUTED',
    TO: 'Annie, and the authoring store; by relay through David',
    date: '2026-09-05',
    ONE_THEIR_FIXTURE_FAILED_THIS_STORES_LIST: {
      saidPLAINLY: 'their fixture failed this store\'s list on four cases. The previous report said "their category, which this store lacks", which is true and is not what happened — said the other way it is a finding about this store, and that is the way it should have been said.',
      andBOTHFIRSTRUNSFAILED: `their 35 cases scored ${before.filter((r) => r.passed).length} of ${before.length} against this store's list as it stood; this store's 42 scored 35 of 42 against theirs. **Both first runs failing is the method, not a fault** — a fixture that passed the other store's list on the first run would have told neither store anything.`,
      theFOURFAILURES: before.filter((r) => !r.passed).map((r) => ({ word: r.word, kind: r.kind, theirReason: r.reason })),
      afterTheREPAIR: `${after.filter((r) => r.passed).length} of ${after.length}`,
      andWHYADOPTINGTHEMISNOTADOPTINGALIST: 'their fixture asserts these must not SILENTLY PASS. Flagging satisfies the case without taking their verdict. **Independence is for FINDING; convergence is for FIXING** — the cross needed two independent lists to surface this category at all, and refusing to converge afterwards would keep a known hole open to protect a measurement already taken.',
    },
    TWO_THE_UNDER_APPLICATION_RULE_RUN: {
      theirRule: 'a qualifier is under-applied until it has been run over every word the rule it qualifies already touched.',
      wordsTheRuleHadTOUCHED: APPROPRIATENESS_LISTS.refuse.length,
      moved: 0,
      andTHEFIRSTATTEMPTMOVEDTHREE: 'nude, lust and brandy — a nude shade, a lust for life, a brandy snap. **That was the qualifier being MISAPPLIED, not finally applied.**',
      theDISTINCTIONBLURRED: 'the qualifier is not "does this word have an ordinary use somewhere". It is "where the DEFAULT READING OF THE BARE TOKEN is the ordinary one it passes; where the ordinary sense needs a sentence that is not there it flags." The default bare reading of all three is the UNSUITABLE sense — which is the refuse case.',
      caughtBY: 'this store\'s own portable fixture, which asserts nude MUST_REFUSE and dropped to 41 of 42 the moment the list moved under it. It is now 42 of 42.',
      soTHERESULT: 'ZERO moves over twenty-one words — and that is a result, not a null. Running it was the only way to know, and the run found a fault in how this store had read the qualifier rather than in the list.',
    },
    THREE_THE_HOLDS_ROUTED_TO_HER: {
      herRuling: 'at the write gate the row holds and routes to her with its context. A bare option value supplies no sentence, so it holds rather than answering itself.',
      andWHATTHISSTOREISNOTDOING: 'reading them off. SHOOT, ARMS, POT and HIGH sit on written rows, and a store that finds a flag on a written row and judges it itself has used the wrong door — the authoring store made this same correction to its own report last turn.',
      count: holds.length,
      distinctTokens: [...new Set(holds.map((h) => h.token))].sort(),
      holds,
    },
    FOUR_THIS_STORES_LISTS_AND_CASES: { version: APPROPRIATENESS_VERSION, lists: APPROPRIATENESS_LISTS, ownCases: `${mineOnMine.passing} of ${mineOnMine.total}`, cases: PORTABLE_CASES.length },
    FIVE_THE_BANK: 'unchanged, pending David. keep-or-revert on slots 12-24.',
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THEIR_FIXTURE_FAILED_THIS_STORES_LIST', 'TWO_THE_UNDER_APPLICATION_RULE_RUN', 'THREE_THE_HOLDS_ROUTED_TO_HER'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('both-first-runs-failed-and-the-holds', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'both-first-runs-failed-and-the-holds').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  console.log(`  their fixture on this store's list BEFORE the repair: ${before.filter((r) => r.passed).length} of ${before.length} — it FAILED this store's list`);
  for (const f of before.filter((r) => !r.passed)) console.log(`    FAIL ${f.kind.padEnd(16)} ${f.word}`);
  console.log(`  after: ${after.filter((r) => r.passed).length} of ${after.length}`);
  console.log(`  under-application run over ${APPROPRIATENESS_LISTS.refuse.length} refuse words: 0 moved (first attempt moved 3, misapplied)`);
  console.log(`  holds routed to Annie: ${holds.length} across ${new Set(holds.map((h) => h.itemId)).size} row(s); tokens ${[...new Set(holds.map((h) => h.token))].sort().join(', ')}`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
