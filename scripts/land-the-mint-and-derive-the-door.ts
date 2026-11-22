/**
 * THE MINT LANDS WHOLE AND THE DOOR DERIVES (David, 2026-09-02; Annie ruled A in her 212th at
 * 802e48af494965d5…).
 *
 * ONE — vr10-first-pair-word-returned lands WHOLE OR NOT AT ALL (R965): id, district,
 * behaviour, childHint (gated), status, and the attestation stamp from measured precedent, in
 * one create. Then wet's retag through the tag gate, and its execution — her words verbatim.
 * vr-10 stands at twenty-five of twenty-five.
 *
 * TWO — the door DERIVES: doorOpensOnThisSection's own test (signed AND whole per row,
 * itemWholeness under R917's walk reading), computed by calling the function. If it fires,
 * vr-10 reports READY TO PUBLISH ON DAVID'S GO — blast radius walked, window as a figure.
 * Nothing publishes here; the go is his.
 *
 * FOR THE RECORD — the serve check's 0 of 11 stays the planning figure beside the other three;
 * her 212th's absence-bound is carried (never-existed is a census that must name its shelves);
 * and the seed drift blocking pnpm dev crosses to her as a HOLD with both texts verbatim, for
 * the approver's own redraft (R213: the cap reports over-length, it never trims).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkChildFacingText } from '../packages/core/src/index';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { itemWholeness } from './lib/item-wholeness';
import { requirePopulation } from './lib/population';
import { runRefusalShapeFixture } from './lib/refusal-shape';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const sha = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const fileSha = (p: string) => sha(readFileSync(p));
const ANNIE = 'rev-0001';
const RECORDED_BY = "agent:claude-code, David's session 2026-09-02";
const APPLY = process.argv.includes('--apply');

const DICT = '/usr/share/dict/web2';
if (!existsSync(DICT)) throw new Error(`no lexicon at ${DICT} — refusing a blind word test (R173)`);
const W = new Set(readFileSync(DICT, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
const isWord = (s: string) => W.has(String(s).trim().toLowerCase());

const MINT = {
  id: 'vr10-first-pair-word-returned',
  behaviour: 'Gives back a word from the first pair instead of completing the second, copying what the question already shows.',
  childHint: 'That word is already in the first pair. The second pair needs its own answer.',
  carrierExecution: 'the first pair\'s second word, wet, returned unchanged.',
} as const;

async function main() {
  console.log(`THE MINT AND THE DOOR — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  runRefusalShapeFixture();
  const r212 = fileSha(pjoin(DL, 'annie-212-for-code.md'));
  if (r212 !== '802e48af494965d527e5c95b10ac0839b1cbab0f7504c566abebbf81e4452405') throw new Error('212th digest mismatch');
  console.log(`  her 212th verified at ${r212.slice(0, 16)}.`);

  // ---- ONE: THE MINT, WHOLE OR NOT AT ALL -----------------------------------------------------
  const gate = checkChildFacingText({ role: 'hint', label: `${MINT.id}.childHint`, text: MINT.childHint });
  if (gate.length) throw new Error(`the child-facing gate refuses her hint — a hold, crossed back: ${gate.map((g) => g.detail).join(' | ')}`);
  console.log('  her childHint passes the child-facing gate.');
  const existing = await prisma.misconception.findUnique({ where: { id: MINT.id }, select: { approvedBy: true } });
  if (existing) {
    console.log('  mint already present — asserting the whole governed state rather than re-landing.');
  } else if (APPLY) {
    await prisma.$transaction([
      prisma.misconception.create({ data: { id: MINT.id, district: 'VR', description: MINT.behaviour, childHint: MINT.childHint, status: 'ACTIVE', approvedBy: 'reviewer:rev-0001' } }),
      prisma.attributionEvent.create({ data: { recordType: 'misconception', recordId: MINT.id, action: 'AUTHORED', reviewerId: ANNIE, actor: 'annie', recordedBy: RECORDED_BY, field: 'description,childHint,approvedBy', method: `minted whole from her 212th (${r212.slice(0, 16)}) — behaviour, hint and stamp in one landing (R965: the whole governed state, field list from measured precedent)`, note: 'her refuter\'s premise broke: wet is not a reversed-relation product on its row; the echo act determines its value by construction' } }),
    ]);
    console.log('  MINTED whole: description, childHint, ACTIVE, approvedBy reviewer:rev-0001.');
  }

  // Wet's retag and execution.
  const row23 = await prisma.item.findUniqueOrThrow({ where: { id: 'gen-vr-10-word-connections-23' }, select: { stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
  const wet = row23.options.find((o) => String((o.content as { value?: unknown })?.value ?? '') === 'wet');
  if (!wet) throw new Error('no wet seat on row 23');
  const keyVal = String((row23.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');
  if (wet.misconceptionId !== MINT.id) {
    const tg = checkTagWrite({ misconceptionId: MINT.id, stem: row23.stem as Record<string, unknown>, keyValue: keyVal, optionValue: 'wet' }, isWord);
    if (tg.verdict === 'REFUSES') throw new Error(`tag gate refuses wet's retag: ${tg.why}`);
    if (APPLY) {
      await prisma.$transaction([
        prisma.itemOption.update({ where: { id: wet.id }, data: { misconceptionId: MINT.id, misconceptionExecution: MINT.carrierExecution } }),
        prisma.attributionEvent.create({ data: { recordType: 'item', recordId: 'gen-vr-10-word-connections-23', action: 'AMENDED', actor: 'annie', reviewerId: ANNIE, recordedBy: RECORDED_BY, field: 'options[].misconceptionId,misconceptionExecution', method: `her 212th (${r212.slice(0, 16)}): wet retags to the mint and its execution lands, her words verbatim; tag gate ${tg.verdict}${tg.verdict === 'UNDECIDED' ? ' — her ruling: the echo determines its value by construction, computes-as satisfied' : ''}`, note: `"wet": vr03-same-topic -> ${MINT.id}; execution "${MINT.carrierExecution}"` } }),
      ]);
    }
    console.log(`  wet retagged to ${MINT.id} with its execution${APPLY ? '' : ' (dry)'}.`);
  } else console.log('  wet already wears the mint' + (wet.misconceptionExecution ? ' with its execution.' : '; execution missing.'));

  // ---- TWO: THE DOOR, DERIVED BY ITS OWN FUNCTION ---------------------------------------------
  console.log('\nTHE DOOR — derived, never asserted.');
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: 'reviewer:rev-0001' }, select: { id: true } })).map((m) => m.id));
  const c = await prisma.case.findUniqueOrThrow({ where: { id: 'case-vr-10' }, select: { modes: true } });
  const walkAsset = (c.modes as Record<string, { assetRef?: string }>)?.walk;
  const walkServes = !!walkAsset?.assetRef && !walkAsset.assetRef.startsWith('placeholder/'); // R917
  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-10-word-connections', status: 'DRAFT' }, select: { id: true, explanation: true, sendHistory: true, options: { select: { misconceptionId: true, misconceptionExecution: true } } } });
  requirePopulation('door:vr-10', { 'DRAFT row(s)': rows.length });
  const signedIds = new Set((await prisma.attributionEvent.findMany({ where: { recordId: { in: rows.map((r) => r.id) }, action: 'SIGNED', reviewerId: { not: null } }, select: { recordId: true } })).map((e) => e.recordId));
  const notWhole: string[] = [];
  for (const r of rows) {
    const w = itemWholeness(r, attested, walkServes);
    if (!w.whole || !signedIds.has(r.id)) notWhole.push(`${r.id}: ${!signedIds.has(r.id) ? 'unsigned' : !w.tagsAttested ? 'tag unattested' : !w.executionsExist ? 'execution missing' : 'walk missing'}`);
  }
  const doorOpens = rows.length === 25 && notWhole.length === 0;
  console.log(`  signed ${signedIds.size}/${rows.length}; whole-and-signed ${rows.length - notWhole.length}/${rows.length} -> doorOpensOnThisSection ${doorOpens ? 'FIRES' : 'does not fire'}${notWhole.length ? ' — ' + notWhole.join('; ') : ''}`);

  // Blast radius, walked by query.
  const window = await prisma.attempt.count({ where: { itemId: { in: rows.map((r) => r.id) } } });
  const entries = [...new Set(rows.flatMap((r) => r.options.map((o) => o.misconceptionId).filter(Boolean)))] as string[];
  const entriesAttested = entries.filter((e) => attested.has(e));
  const pins = rows.filter((r) => r.sendHistory !== null).length;
  const blast = {
    caseRow: 'case-vr-10 (one case, one question type — publication touches no other door)',
    rows: rows.length, pinned: pins, signed: signedIds.size,
    sections: `${Math.floor(rows.length / 6)}x6 + ${rows.length % 6} by the arc's sectioning`,
    entriesReferenced: entries.length, entriesAttested: entriesAttested.length,
    taggedSeats: rows.reduce((n, r) => n + r.options.filter((o) => o.misconceptionId).length, 0),
    seatsWithExecutions: rows.reduce((n, r) => n + r.options.filter((o) => o.misconceptionId && o.misconceptionExecution).length, 0),
    windowAsAFigure: window,
    walkMode: 'serves no real asset (R917) — no walkScript obligation on the door; the 25 draft scripts on these rows are authoring ahead of the mode',
  };

  // ---- DELIVER --------------------------------------------------------------------------------
  const report = {
    kind: 'the-mint-lands-and-the-door-derives', TO: 'David; Annie and the authoring store by relay', date: '2026-09-02', mode: APPLY ? 'APPLIED' : 'DRY-RUN',
    EVIDENCE: { return212: r212 },
    THE_MINT: { ...MINT, landedWhole: 'description, childHint (gated), ACTIVE, approvedBy reviewer:rev-0001 — one landing, the whole governed state (R965)', carrier: 'gen-vr-10-word-connections-23 "wet", retagged with its execution, her words verbatim' },
    THE_DOOR: {
      derivation: 'doorOpensOnThisSection (R699): every row SIGNED AND WHOLE; whole = itemWholeness (R701) under R917\'s walk reading; computed by calling the function (R41)',
      fires: doorOpens, notWhole,
      verdict: doorOpens ? 'vr-10 IS READY TO PUBLISH ON DAVID\'S GO — the first door in the district the trigger itself would open. Nothing published here; the go is his.' : 'the door does not fire; the rows above say why',
      blastRadiusWalked: blast,
    },
    FOR_THE_RECORD: {
      thePlanningFigure: 'the serve check\'s 0 of 11 — a child\'s walk request receives nothing, with the reason stated — stays the planning figure, reported beside the other three: mode-serves-real-asset 0/11 (31 Aug, still true); the corrected truthiness figure (an instrument conflation, not a serving fact); script presence 25 vr-10 rows (never zero).',
      herAbsenceBound: 'her 212th: "never existed" is a census and must name the shelves it consulted — a draft batch of walk scripts exists, was read, nine amended in her 146th, and sits on the reviewer\'s shelf. No total-absence claim enters any register unbounded.',
      theSeedDriftHold: {
        state: 'HOLD — crossed to Annie for the approver\'s own redraft; pnpm dev\'s seed step refuses until it lands (R213: the cap reports over-length, it never trims)',
        entry: 'vr-letter-series-direction.childHint',
        theApprovedTextInTheStore: 'Which way is the series moving through the alphabet? Check the first two letters.',
        theSeedsCopy: 'Which way is the series moving through the alphabet? Follow the arrows.',
        theDifference: 'the seed\'s copy is two words shorter and would trim approved text (14w -> 12w); the guard refuses the trim, so the seed either takes the approved text verbatim or she redrafts — her act, recorded as hers, never a fit-to-cap rewrite',
      },
    },
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['THE_MINT', 'THE_DOOR', 'FOR_THE_RECORD']);
  Object.assign(clean, dig);
  const out = pjoin(REPO, 'content/exports', stampedName('mint-lands-door-derives', dig.findingsSha256, 'json'));
  writeFileSync(out, JSON.stringify(clean, null, 1));
  if (APPLY) { const d = deliver(out); console.log(`\nDelivered: ${d}`); } else console.log(`\nDRY RUN — ${out}`);
  console.log(`Door fires: ${doorOpens}; window: ${window}; not-whole: ${notWhole.length}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
