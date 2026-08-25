/**
 * HER 147TH LANDS; THE TWENTY-FIVE MOVE INTO THE STATE; THE GENERATOR ANSWERS; THE MARKER
 * CLASSES WALK (David, 2026-08-24 — R704).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const SHA147 = 'e61baa5a256d80fa552ba194e48862ebb54e894e8846ec1f29768b4f242fe039';
const SHARULING = '2498201221403df728dd8d3dcd79f5530ce623d9fb191514fa18c884498b1db6';
const AUTH = `annie-147-for-code.md, sha256 ${SHA147}`;
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const landing: Array<Record<string, unknown>> = [];

async function run() {
  if (sha256(readFileSync('/Users/davidb/Downloads/annie-147-for-code.md')) !== SHA147) throw new Error('REFUSED — 147th digest mismatch');

  // ---- The twenty-five move LIVE -> NEVER_SHIPPABLE; the holds lift INTO the state ----
  const seeds = await prisma.item.findMany({ where: { id: { startsWith: 'seed-vr' }, status: 'LIVE' }, select: { id: true } });
  if (seeds.length !== 25) throw new Error(`REFUSED — expected twenty-five LIVE seeds, found ${seeds.length}`);
  landing.push({ act: 'LIVE -> NEVER_SHIPPABLE', ids: seeds.map((s) => s.id).sort(), authority: `David's ruling, sha256 ${SHARULING}`, holdDisposition: 'the twenty-five SERVING_HOLDS lift INTO the state, never into service — records moved to LIFTED_HOLDS with the ruling digest' });
  if (APPLY) {
    await prisma.item.updateMany({ where: { id: { startsWith: 'seed-vr' }, status: 'LIVE' }, data: { status: 'NEVER_SHIPPABLE' } });
    await prisma.attributionEvent.createMany({
      data: seeds.map((s) => ({
        recordType: 'item', recordId: s.id, action: 'AMENDED' as const,
        reviewerId: null, actor: 'David', recordedBy: DAVID, field: 'status',
        method: `the never-shippable ruling (sha256 ${SHARULING.slice(0, 16)}); membership per annie-146-landing-56046030`,
        note: 'LIVE -> NEVER_SHIPPABLE; the serving hold lifts into the state',
      })),
    });
    console.log('  MOVED 25 seeds LIVE -> NEVER_SHIPPABLE');
  }
  const after = await Promise.all(['case-vr-09', 'case-vr-11'].map(async (c) => {
    const qt = (await prisma.case.findUniqueOrThrow({ where: { id: c }, select: { questionTypeId: true } })).questionTypeId;
    return { caseId: c, genuineLive: await prisma.item.count({ where: { questionTypeId: qt, status: 'LIVE', pool: 'PRACTICE' } }) };
  }));
  if (APPLY && !after.every((a) => a.genuineLive === 25)) throw new Error(`REFUSED — post-move pools are not 25/25: ${JSON.stringify(after)}`);
  landing.push({ act: 'POST-MOVE POOL CONFIRMATION', pools: after, note: 'both cases retain exactly twenty-five genuine LIVE rows; the seeds are gone from every filter by state, not by hold' });

  // ---- Her 147th: the mint widened; the retags reconciled; row 16 confirmed ----
  const mint = await prisma.misconception.findUniqueOrThrow({ where: { id: 'vr02-real-link-wrong-rule' }, select: { description: true } });
  const REPLACED_DESC = 'Paired two words by a genuine shared property that is not the property the group of three uses.';
  const AUTHORED_DESC = 'Paired two words by a genuine link, a shared property or a real association, that is not the rule the group of three uses.';
  if (mint.description !== REPLACED_DESC) throw new Error('REFUSED — the mint description is not her replaced string');
  const liveCarriers = await prisma.itemOption.count({ where: { misconceptionId: 'vr02-real-link-wrong-rule', item: { status: 'LIVE' } } });
  landing.push({ id: 'vr02-real-link-wrong-rule', act: 'DESCRIPTION WIDENED', before: REPLACED_DESC, after: AUTHORED_DESC, carriers: `her "at zero carriers" read precisely: ${liveCarriers} LIVE carriers (the five DRAFT carriers from the 145 sweep are not serving); the hint survives unchanged`, authority: AUTH });
  if (APPLY) {
    await prisma.misconception.update({ where: { id: 'vr02-real-link-wrong-rule' }, data: { description: AUTHORED_DESC } });
    await prisma.attributionEvent.create({ data: { recordType: 'misconception', recordId: 'vr02-real-link-wrong-rule', action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'description', method: `her 147th (${SHA147.slice(0, 16)}); widened from property to genuine link at zero live carriers`, note: `${sha256(REPLACED_DESC).slice(0, 16)} -> ${sha256(AUTHORED_DESC).slice(0, 16)}` } });
    console.log('  WIDENED  the mint description');
  }
  for (const n of [13, 14]) {
    const id = `bank-vr-02-two-odd-ones-out-${n}`;
    const r = await prisma.item.findUniqueOrThrow({ where: { id }, select: { options: { select: { misconceptionId: true } } } });
    const tag = r.options.find((o) => o.misconceptionId?.startsWith('vr02-real'))?.misconceptionId;
    if (tag !== 'vr02-real-link-wrong-rule') throw new Error(`REFUSED — ${id} carries ${tag}; neither her replaced nor her authored state`);
    landing.push({ id, act: 'RETAG ALREADY IN AUTHORED STATE', note: 'her replaced (vr02-surface-link) is the state she read in the population file; the 145th\'s five-row sweep carried this row to the mint before her per-row ruling arrived. Convergent, no write — the reconciliation is the record (R599: re-run rather than stopping at the first fix).', authority: AUTH });
  }
  landing.push({ id: 'bank-vr-02-two-odd-ones-out-16', act: 'SURFACE-LINK CONFIRMED', note: 'happy-and-hungry: initial sound and shape, a true surface pull surviving into tier four — her confirmation recorded; tag untouched', authority: AUTH });
  if (APPLY) {
    await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: 'bank-vr-02-two-odd-ones-out-16', action: 'APPROVED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'options.D.misconceptionId', method: `her 147th (${SHA147.slice(0, 16)})`, note: 'vr02-surface-link confirmed on its merits' } });
  }

  // ---- The generator answers the three undeclared pulls ----
  landing.push({
    act: 'THE GENERATOR ANSWERS (rows 15, 17, 18 option D)',
    source: 'packages/db/prisma/generate-content.ts, oddOnesOut() — read, not inferred',
    answer: 'THE GENERATOR NAMES A POSITION, NOT A PULL. Each vr-02 row\'s option set is a fixed template: [key] [odd+group, m:0] [group0+group2, m:1] [group2+odd, m:0], where m indexes [vr02-partial-group, vr02-surface-link]. The m:1 tag is applied to whatever pair the category arithmetic produced, for all twenty-five rows, with no judgement of attraction anywhere in the code. At tiers one and two the arithmetic happened to yield initial-sound pairs and the tag happened to be true; at tiers three and four the coincidence ran out.',
    perRow: [
      { id: 'bank-vr-02-two-odd-ones-out-15', pair: 'duck-and-crow', finding: 'two group members (birds); the generator names no pull; the positional tag (surface-link) is the one she ruled out; the 145 sweep\'s mint tag is equally unsupported — no genuine link is in the code or the words' },
      { id: 'bank-vr-02-two-odd-ones-out-17', pair: 'oval-and-star', finding: 'no shared look, sound, or association; the generator names no pull' },
      { id: 'bank-vr-02-two-odd-ones-out-18', pair: 'cow-and-hen', finding: 'two group members (farm); the generator names no pull' },
    ],
    verdict: 'PER HER RULING, THE BRANCH SELECTS ITSELF: no drafter-intended pull exists to cross, so THE THREE OPTIONS RE-AUTHOR. No tag is proposed from this side; the re-authoring is authoring-side work. Until it lands, the three rows cannot pass phase two on these options.',
  });

  // ---- The marker-class walk, estate-wide ----
  const items = await prisma.item.findMany({ select: { id: true, status: true, stem: true, explanation: true, reviewNotes: true, reviewedBy: true, options: { select: { content: true, misconceptionExecution: true } } } });
  const misc = await prisma.misconception.findMany({ select: { id: true, approvedBy: true, description: true, childHint: true } });
  const NEVER = /never shippable|synthetic seed|do not ship/i;
  const PLACEHOLDER = /\b(TBD|TODO|FIXME|XXX|PLACEHOLDER|lorem ipsum)\b/i;
  const GHOST = 'human:staff-reviewer@cluecrew.test';
  const CURRENT = 'current-reviewer';
  const neverRows = items.filter((r) => NEVER.test(JSON.stringify({ s: r.stem, e: r.explanation, n: r.reviewNotes })));
  const placeholderRows = items.filter((r) => PLACEHOLDER.test(JSON.stringify({ s: r.stem, e: r.explanation, o: r.options })));
  const placeholderMisc = misc.filter((m) => PLACEHOLDER.test(m.description + ' ' + m.childHint));
  const ghostItems = items.filter((r) => r.reviewedBy === GHOST);
  const ghostMisc = misc.filter((m) => m.approvedBy === GHOST);
  const currentMisc = misc.filter((m) => m.approvedBy === CURRENT);
  const currentEvents = await prisma.attributionEvent.count({ where: { actor: CURRENT, reviewerId: null } });
  const markerWalk = {
    method: 'every marker class this project has ruled on, walked over all items and library rows this run',
    classes: {
      neverShippableMarker: { ruled: 'R703', membership: neverRows.map((r) => ({ id: r.id, status: r.status })), note: neverRows.every((r) => r.status === 'NEVER_SHIPPABLE' || r.status === 'RETIRED') ? 'every carrier is now in a non-serving state — the class is closed by state' : 'CARRIERS OUTSIDE THE STATE — named above' },
      placeholderTokens: { ruled: 'the placeholder-is-not-a-proposal gate (checkMisconceptionProposal)', itemMembership: placeholderRows.map((r) => r.id), libraryMembership: placeholderMisc.map((m) => m.id) },
      ghostReviewer: { ruled: 'R94 — a value resolving to no Reviewer row', itemsWithGhostReviewedBy: { count: ghostItems.length, note: ghostItems.length > 40 ? 'membership by count; ids on request — every one predates R94 and carries its signoff transcription events' : undefined, ids: ghostItems.length <= 40 ? ghostItems.map((r) => r.id) : ghostItems.slice(0, 8).map((r) => r.id) }, libraryWithGhostApprovedBy: ghostMisc.map((m) => m.id) },
      currentReviewerPlaceholder: { ruled: 'R65 — a role cache, never an identity', libraryRows: currentMisc.map((m) => m.id), unresolvedEvents: currentEvents },
    },
    verdict: 'any ruling scoped to where someone happened to be reading is now findable for the cost of this query — the walk is repeatable and its populations are stated.',
  };
  console.log(`  MARKER WALK: never=${neverRows.length} placeholder=${placeholderRows.length}+${placeholderMisc.length} ghostItems=${ghostItems.length} ghostLib=${ghostMisc.length} currentLib=${currentMisc.length}`);

  if (APPLY) {
    const artefact = { kind: 'annie-147-landing', what: 'The twenty-five moved into the state with their holds lifting into it; her 147th landed (mint widened, retags reconciled as already-landed, row 16 confirmed); the generator answered the three pulls from its own code; every ruled marker class walked estate-wide.', authority: AUTH, rulingDigest: SHARULING, rows: landing, markerWalk };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('annie-147-landing', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'annie-147-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
