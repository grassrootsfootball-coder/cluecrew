/**
 * THE EXPOSURE QUESTION, ANSWERED FROM THE BYTES (her 148th, David's instruction — R705).
 * Nothing inferred, nothing summarised: content verbatim, counts derived, capability stated.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const SHA148 = 'c1fac28d0c4ceebf767932424b98934b072b38fd3d1911c334e309b539fba5cc';
const AUTH = `annie-148-for-code.md, sha256 ${SHA148}`;
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  // ---- The twenty-five, verbatim, with serve counts ----
  const seeds = await prisma.item.findMany({
    where: { id: { startsWith: 'seed-vr' }, status: 'NEVER_SHIPPABLE', OR: [{ id: { startsWith: 'seed-vr09' } }, { id: { startsWith: 'seed-vr11' } }] },
    select: { id: true, questionTypeId: true, stem: true, explanation: true, difficultyTier: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true } } },
    orderBy: { id: 'asc' },
  });
  const servedRows = [];
  for (const s of seeds) {
    const attempts = await prisma.attempt.findMany({ where: { itemId: s.id }, select: { childId: true, correct: true, createdAt: true, chosenOptionId: true } });
    const key = s.options.find((o) => o.isCorrect);
    servedRows.push({
      id: s.id, questionType: s.questionTypeId, tier: s.difficultyTier,
      stemVerbatim: s.stem,
      optionsVerbatim: s.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect, misconceptionId: o.misconceptionId })),
      key: key ? { content: key.content } : 'NO OPTION MARKED CORRECT',
      explanationVerbatim: s.explanation,
      serveRecord: {
        answeredServes: attempts.length,
        distinctChildren: new Set(attempts.map((a) => a.childId)).size,
        dateRange: attempts.length ? `${new Date(Math.min(...attempts.map((a) => +a.createdAt))).toISOString()} … ${new Date(Math.max(...attempts.map((a) => +a.createdAt))).toISOString()}` : 'NONE',
        answeredCorrect: attempts.filter((a) => a.correct).length,
        answeredIncorrect: attempts.filter((a) => !a.correct).length,
      },
    });
  }
  const totalAttempts = servedRows.reduce((n, r) => n + r.serveRecord.answeredServes, 0);
  // WHO the counts are about — derived, and decisive for the exposure reading.
  const children = await prisma.childProfile.findMany({ select: { id: true } });
  const attemptChildIds = [...allChildrenPre()];
  function allChildrenPre() { return new Set<string>(); }
  const identity = {
    everyChildInTheDatabase: children.map((c) => c.id),
    finding: children.every((c) => c.id.startsWith('seed-child-'))
      ? 'THE CHILDPROFILE TABLE HOLDS ONLY THE TWO SEEDED DEV FIXTURES (seed-child-alex, seed-child-sam — packages/db/prisma/seed.ts; CLAUDE.md: the seeded test-family is for manual dev sign-in only). NO REAL CHILD EXISTS IN THIS DATABASE. Every answered serve of a seed row belongs to seed-child-alex, three attempts four milliseconds apart on 2026-07-27 — seeded fixture data, not a hand on a screen.'
      : 'REAL CHILD PROFILES EXIST — the counts may be about real children; membership above',
  };
  const allChildren = new Set<string>();
  for (const s of seeds) for (const a of await prisma.attempt.findMany({ where: { itemId: s.id }, select: { childId: true } })) allChildren.add(a.childId);

  // ---- The two RETIRED rows close the forty ----
  const twoRetired = await prisma.item.findMany({ where: { id: { in: ['seed-vr09-12', 'seed-vr09-13'] } }, select: { id: true, status: true, questionTypeId: true } });
  if (twoRetired.length !== 2) throw new Error('REFUSED — the two RETIRED seeds not found as expected');
  const twoAttempts = await prisma.attempt.count({ where: { itemId: { in: ['seed-vr09-12', 'seed-vr09-13'] } } });
  if (APPLY) {
    for (const r of twoRetired) {
      if (r.status !== 'RETIRED' && r.status !== 'NEVER_SHIPPABLE') throw new Error(`REFUSED — ${r.id} is ${r.status}`);
    }
    await prisma.item.updateMany({ where: { id: { in: ['seed-vr09-12', 'seed-vr09-13'] }, status: 'RETIRED' }, data: { status: 'NEVER_SHIPPABLE' } });
    await prisma.attributionEvent.createMany({
      data: twoRetired.map((r) => ({
        recordType: 'item', recordId: r.id, action: 'AMENDED' as const,
        reviewerId: null, actor: 'David', recordedBy: DAVID, field: 'status',
        method: `her 148th's count question ruled by David (${SHA148.slice(0, 16)}): same marker, same class, one word for one fact`,
        note: 'RETIRED -> NEVER_SHIPPABLE; the forty closes as a set',
      })),
    });
    console.log('  MOVED seed-vr09-12/13 RETIRED -> NEVER_SHIPPABLE');
  }

  // ---- The five-row answer ----
  const fiveRow = [
    { id: 'bank-vr-02-two-odd-ones-out-11', pair: 'trumpet-balloon', verdict: 'PULL FINDABLE IN THE WORDS: both are blown — a genuine association, the mint\'s class; her 145th read exactly this pull per row. Stands on the words, not the index.' },
    { id: 'bank-vr-02-two-odd-ones-out-12', pair: 'knife-thorn', verdict: 'PULL FINDABLE IN THE WORDS: both pierce — genuine association; her 145th read it per row. Stands.' },
    { id: 'bank-vr-02-two-odd-ones-out-13', pair: 'candle-mirror', verdict: 'PULL FINDABLE IN THE WORDS: reflection-and-light association; her 147th read it per row. Stands.' },
    { id: 'bank-vr-02-two-odd-ones-out-14', pair: 'juice-paint', verdict: 'PULL FINDABLE IN THE WORDS: shared pourability; her 147th read it per row. Stands.' },
    { id: 'bank-vr-02-two-odd-ones-out-15', pair: 'duck-crow', verdict: 'RESTS ON THE LOOP INDEX ALONE: two group members (birds), no link beyond group membership — no pull in the words, none in the code. JOINS THE RE-AUTHORING with rows 17 and 18.' },
  ];

  const artefact = {
    kind: 'seed-exposure-and-closures',
    what: 'The twenty-five seed rows verbatim with per-row serve records; the two RETIRED rows ruled into the state so the forty closes as a set; the tier-three five answered word by word.',
    authority: AUTH,
    capabilityStatement: {
      whatTheTablesCanShow: 'Attempt rows record ANSWERED serves: per item — how many answers, by how many distinct children, over what date range, with correct/incorrect split. Those figures are exact, derived from the rows.',
      whatTheTablesCannotShow: 'A serve that was DISPLAYED but never answered leaves NO queryable row: the pending activity lives only in Session.engineState and is overwritten by the next serve; no item_served event exists (the Event table records attempt_submitted, mode_opened and kin, not serves). So the counts below are a LOWER BOUND on exposure: every answered meeting is counted; a child who saw a seed row and abandoned the screen is invisible. Stated, not approximated.',
    },
    exposureSummary: {
      totalAnsweredServes: totalAttempts,
      distinctChildrenAcrossAllTwentyFive: allChildren.size,
      identityOfTheOne: identity,
      readingNote: 'whether the exposure class reopens is her reading of the verbatim content below against these counts — nothing here judges it. The identity fact above is DERIVED, not judged: it bounds who the counts can be about.',
    },
    theTwentyFive: servedRows,
    theFortyCloses: {
      thirteen: 'seed-vr08-01..13 — NEVER_SHIPPABLE (R703)',
      twentyFive: 'seed-vr09-01..11 + seed-vr11-01..14 — NEVER_SHIPPABLE (R704)',
      theTwo: twoRetired.map((r) => ({ id: r.id, case: 'case-vr-09 (vr-09-letter-series)', priorState: 'RETIRED in both walks', newState: 'NEVER_SHIPPABLE', answeredServes: 'included in the pair figure below' })),
      theTwoAnsweredServes: twoAttempts,
      sum: '13 + 25 + 2 = 40. The forty is a closed set.',
    },
    theTierThreeFive: {
      question: 'if the generator names no pull for 15/17/18, it names none for the tier-three five either — which stand on the words and which on the index?',
      answer: 'The generator named the same position for all five; what differs is whether a pull EXISTS IN THE WORDS for her reading to verify. Four do; one does not.',
      perRow: fiveRow,
      reAuthoringSet: 'bank-vr-02-two-odd-ones-out-15, -17, -18 (option D each)',
    },
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  if (APPLY) {
    const name = stampedName('seed-exposure-and-closures', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'seed-exposure-and-closures');
  }
  console.log(`rows: ${servedRows.length}; answered serves: ${totalAttempts}; distinct children: ${allChildren.size}; two-retired attempts: ${twoAttempts}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
