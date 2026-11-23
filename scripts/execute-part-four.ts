/**
 * PART FOUR: THE DOOR OPENS, ONE TRANSACTION (David's go, 2026-08-24 — R690).
 *
 * The entry lands from HER 137TH'S FILE (the trimmed hint — "a hint lands from my file or not at
 * all"); CZ-A2 option D transports with its tag, bytes verified against the authoring emission's
 * per-option digest (8643fc1a…, recomputed here); the twenty-five move DRAFT→LIVE. ALL IN ONE
 * prisma.$transaction — the door does not stand open and empty between acts — and the visible-
 * but-empty window (face landing → LIVE commit) is REPORTED AS A MEASURED FIGURE.
 *
 * One field is carried, not silently dropped: the authoring store's `misconceptionExecutionBasis`
 * ("AUTHORED+ENTRY") has no column here; it rides in the event note and the artefact, and the
 * artefact says so (R57's spirit: what a door cannot home, it names).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const ANNIE = 'reviewer:rev-0001';

const F136 = '/Users/davidb/Downloads/annie-136-for-code.md';
const SHA136 = '5c029056066d3d6d13d68abbbea0671b0e401c9cece636d0dfb464b09d78d9b1';
const F137 = '/Users/davidb/Downloads/annie-137-for-code.md';
const SHA137 = '096f7738cc4cdc712fb0da7e8985c2fd672a6e6f19b45592548294890b0a4d97';
const FOPT = '/Users/davidb/Downloads/cza2-option-set-for-annie.json';
const SHAOPT = '502e3114df7d4c620e36ce82338ea39e65a316012d84e9db515c3f6e51f757f7';
const ENTRY_ID = 'en-article-avoids-the-sound-choice';

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const readVerified = (path: string, expected: string) => {
  const bytes = readFileSync(path);
  if (sha256(bytes) !== expected) throw new Error(`REFUSED — ${path} reads ${sha256(bytes)}, declared ${expected}`);
  return bytes.toString('utf8');
};

async function run() {
  const her136 = readVerified(F136, SHA136);
  const her137 = readVerified(F137, SHA137);
  const optSet = JSON.parse(readVerified(FOPT, SHAOPT)) as {
    options: Array<{ label: string; asHeld: Record<string, unknown>; optionSha256: string; value: string; isCorrect: boolean }>;
  };

  // The mint, from her 136th; the hint, from her 137th — replaced asserted against the mint.
  const mintMatch = /target: library:en-article-avoids-the-sound-choice\n\s+replaced: NONE\. New entry, minted this return\.\n\s+authored: (\{.+\})/.exec(her136);
  if (!mintMatch) throw new Error("REFUSED — the 136th's mint block not found");
  const mint = JSON.parse(mintMatch[1]!) as { id: string; description: string; childHint: string; mintedBy: string; mintedAt: string };
  const trimMatch = /target: library:en-article-avoids-the-sound-choice:childHint\n\s+replaced: (.+)\n\s+authored: (.+)/.exec(her137);
  if (!trimMatch) throw new Error("REFUSED — the 137th's trim block not found");
  if (trimMatch[1]!.trim() !== mint.childHint) throw new Error("REFUSED — the 137th's replaced string is not the 136th's mint hint, exact");
  const HINT = trimMatch[2]!.trim();
  const gate = checkChildFacingText({ role: 'hint', label: ENTRY_ID, text: HINT }).filter(isBlocking);
  if (gate.length > 0) throw new Error(`REFUSED — her trimmed hint fails the gate: ${gate.map((f) => f.detail).join('; ')}`);

  // The tag + execution for option D, from her 136th.
  const tagMatch = /target: item:ENG-003-A-CZ-A2:options:D\n\s+replaced: .+\n\s+authored: (\{.+\})/.exec(her136);
  if (!tagMatch) throw new Error("REFUSED — the 136th's option-D tag block not found");
  const tag = JSON.parse(tagMatch[1]!) as { misconceptionId: string; misconceptionExecution: string; misconceptionExecutionBasis: string };
  if (tag.misconceptionId !== ENTRY_ID) throw new Error('REFUSED — the tag does not name the minted entry');

  // Option D's bytes, verified against the authoring emission's per-option digest.
  const optD = optSet.options.find((o) => o.label === 'D');
  if (!optD) throw new Error('REFUSED — option D not in the authoring emission');
  const recomputed = sha256(JSON.stringify(optD.asHeld, Object.keys(optD.asHeld).sort()));
  const canonical = sha256(Buffer.from(JSON.stringify(sortKeys(optD.asHeld)), 'utf8'));
  if (canonical !== optD.optionSha256 && recomputed !== optD.optionSha256) {
    throw new Error(`REFUSED — option D's bytes recompute to ${canonical}, emission declares ${optD.optionSha256}`);
  }
  if (optD.value !== 'the' || optD.isCorrect !== false) throw new Error('REFUSED — option D is not the expected distractor');

  // Pre-flight on the live rows.
  const item = await prisma.item.findUniqueOrThrow({ where: { id: 'ENG-003-A-CZ-A2' }, select: { status: true, options: { orderBy: { id: 'asc' }, select: { content: true } } } });
  if (item.status !== 'DRAFT') throw new Error(`REFUSED — CZ-A2 is ${item.status}, expected DRAFT`);
  if (item.options.length !== 3) throw new Error(`REFUSED — CZ-A2 holds ${item.options.length} options, expected 3 before transport`);
  const existingEntry = await prisma.misconception.findUnique({ where: { id: ENTRY_ID } });
  if (existingEntry) throw new Error(`REFUSED — ${ENTRY_ID} already exists (${existingEntry.status}); the mint premise has changed`);
  const the25 = await prisma.item.findMany({ where: { questionTypeId: { in: ['en-spag-cloze', 'en-spag-spelling-spot'] }, id: { startsWith: 'ENG-003' } }, select: { id: true, status: true } });
  if (the25.length !== 25 || !the25.every((i) => i.status === 'DRAFT')) {
    throw new Error(`REFUSED — the 25 are not all DRAFT: ${JSON.stringify(the25.filter((i) => i.status !== 'DRAFT'))}`);
  }
  const faceEvent = await prisma.attributionEvent.findFirstOrThrow({ where: { recordType: 'case', recordId: 'case-en-06', field: 'face' }, orderBy: { at: 'desc' }, select: { at: true } });

  if (!APPLY) { console.log('DRY: all pre-flight assertions hold (entry mint, trim chain, option D bytes, 25 DRAFT). Run with --apply.'); await prisma.$disconnect(); return; }

  // ---- The one transaction ----
  await prisma.$transaction(async (tx) => {
    await tx.misconception.create({
      data: {
        id: ENTRY_ID, district: 'ENGLISH', status: 'ACTIVE',
        description: mint.description, childHint: HINT,
        proposedBy: 'reviewer:rev-0001', approvedBy: ANNIE, recordedBy: DAVID,
        approvalMethod: 'written review — minted in her 136th, hint trimmed in her 137th, landed from her files',
        textProvenance: {
          state: 'RECORDED', text: 'childHint',
          authoredBy: { kind: 'person', name: 'Annie' },
          approvedBy: { kind: 'person', name: 'Annie' },
          method: `minted whole in her 136th (annie-136-for-code.md, sha256 ${SHA136}); childHint trimmed in her 137th (annie-137-for-code.md, sha256 ${SHA137}) — the 137th's replaced string asserted exact against the 136th's mint`,
          previous: { childHint: mint.childHint, sha256: sha256(mint.childHint), note: "the 136th's mint hint, superseded by her own trim before first serve" },
          date: '2026-08-24',
        },
      },
    });
    await tx.itemOption.create({
      data: {
        itemId: 'ENG-003-A-CZ-A2',
        content: { label: 'D', value: 'the' },
        isCorrect: false,
        misconceptionId: ENTRY_ID,
        misconceptionExecution: tag.misconceptionExecution,
      },
    });
    await tx.item.updateMany({
      where: { questionTypeId: { in: ['en-spag-cloze', 'en-spag-spelling-spot'] }, id: { startsWith: 'ENG-003' }, status: 'DRAFT' },
      data: { status: 'LIVE' },
    });
    await tx.attributionEvent.createMany({
      data: [
        {
          recordType: 'misconception', recordId: ENTRY_ID, action: 'AUTHORED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
          method: `minted in her 136th (${SHA136.slice(0, 16)}), trimmed in her 137th (${SHA137.slice(0, 16)}), landed from her files`,
          note: `hint ${sha256(HINT)}; the mint's own hint stamped as prior`,
        },
        {
          recordType: 'item', recordId: 'ENG-003-A-CZ-A2', action: 'AMENDED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'options.D',
          method: `transport from the authoring emission (option digest ${optD.optionSha256.slice(0, 16)} recomputed here); tag and execution from her 136th`,
          note: `option D "the" lands WITH its tag ${ENTRY_ID}; executionBasis AUTHORED+ENTRY carried here (no column holds it — stated, not dropped)`,
        },
        ...the25.map((i) => ({
          recordType: 'item', recordId: i.id, action: 'AMENDED' as const,
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'status',
          method: "publication on David's go (part four), her 136th-138th chain",
          note: 'DRAFT -> LIVE; the door opens',
        })),
      ],
    });
  });
  const liveAt = new Date();
  const windowSeconds = Math.round((liveAt.getTime() - faceEvent.at.getTime()) / 1000);
  console.log(`  DOOR OPEN — entry landed, option D transported with its tag, 25 items LIVE.`);
  console.log(`  visible-but-empty window: face landed ${faceEvent.at.toISOString()} -> LIVE ${liveAt.toISOString()} = ${windowSeconds}s`);

  // ---- Reachability, walked from the rows after publication ----
  const caseRow = await prisma.case.findUniqueOrThrow({ where: { id: 'case-en-06' }, select: { title: true, questionTypeId: true, mappedQuestionTypeIds: true, freeTier: true } });
  const reachable = await prisma.item.findMany({
    where: { questionTypeId: { in: [caseRow.questionTypeId, ...caseRow.mappedQuestionTypeIds] }, status: 'LIVE', pool: 'PRACTICE' },
    select: { id: true, questionTypeId: true, difficultyTier: true, options: { orderBy: { id: 'asc' }, select: { id: true } } },
    orderBy: { id: 'asc' },
  });
  const cza2Options = await prisma.itemOption.count({ where: { itemId: 'ENG-003-A-CZ-A2' } });
  const artefact = {
    kind: 'case-en-06-door-opening',
    what: 'Part four executed as one transaction: the entry from her 137th\'s file, option D transported with its tag, twenty-five items DRAFT→LIVE. The whole opening in one artefact with the reachability arithmetic walked from the rows after publication.',
    authorities: {
      mint: `annie-136-for-code.md, sha256 ${SHA136}`,
      trimmedHint: `annie-137-for-code.md, sha256 ${SHA137} — landed from her file`,
      recross: 'annie-138-for-code.md, sha256 90fc7f98a1c3aad40572194e08b7f607f317b92c03ac4495caca3c2250164ef5',
      optionBytes: `cza2-option-set-for-annie.json, sha256 ${SHAOPT}; option D digest ${optD.optionSha256} recomputed here before transport`,
      go: "David's go, one gate: her trimmed hint from her file — satisfied by the 137th re-crossing verified",
    },
    visibleButEmptyWindow: {
      faceLandedAt: faceEvent.at.toISOString(), liveAt: liveAt.toISOString(),
      measured: `${windowSeconds} seconds during which case-en-06 was visible with an empty LIVE pool (the R689 surfaced gap, now closed and measured)`,
    },
    fieldWithoutAColumn: 'misconceptionExecutionBasis: "AUTHORED+ENTRY" — no ItemOption column holds it; carried in the transport event note and here, stated rather than dropped.',
    reachability: {
      method: 'walked from the live rows after the transaction: items whose questionTypeId is in case-en-06\'s primary + mapped set, status LIVE, pool PRACTICE — the exact filter the orchestrator\'s itemPool serves from',
      case: { id: 'case-en-06', title: caseRow.title, tier: caseRow.freeTier ? 'FREE' : 'PAID', types: [caseRow.questionTypeId, ...caseRow.mappedQuestionTypeIds] },
      itemsReachingAChild: reachable.map((i) => ({ id: i.id, questionType: i.questionTypeId, difficultyTier: i.difficultyTier, optionCount: i.options.length })),
      arithmetic: `${reachable.length} of 25 published items reach a child through case-en-06 (PAID tier) — ${reachable.filter((i) => i.questionTypeId === 'en-spag-cloze').length} cloze + ${reachable.filter((i) => i.questionTypeId === 'en-spag-spelling-spot').length} spelling-spot; CZ-A2 serves ${cza2Options} options.`,
    },
  };
  if (reachable.length !== 25) throw new Error(`REFUSED to close — reachability walked ${reachable.length} of 25; the arithmetic must be whole before the artefact ships`);
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('case-en-06-door-opening', sha256(json).slice(0, 16), 'json');
  const local = join(REPO, 'content/exports', name);
  writeFileSync(local, json);
  deliver(local, 'case-en-06-door-opening');
  await prisma.$disconnect();
}

function sortKeys(o: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));
}

run().catch((e) => { console.error(e); process.exit(1); });
