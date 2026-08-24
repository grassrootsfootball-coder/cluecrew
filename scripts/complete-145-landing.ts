/**
 * COMPLETES THE 145TH LANDING (R702). The first apply landed the thirteen amendments, the mint,
 * the five retags, the trim and the eight approvals, then FAILED on the seed removal: REJECTED
 * is the Misconception enum, and Items run DRAFT → REVIEWED → LIVE → RETIRED. The never-shippable
 * rows RETIRE — out of the review population and out of service, with the author's own marker in
 * the event. This script verifies every already-landed act from the live rows, performs ONLY the
 * remainder, and emits the one landing artefact.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const DAVID = 'human:david@cluecrew.test';
const SHA145 = '73ef2ee342552c85731d537799300736416197924723d2171b44a927469f799a';
const AUTH = `annie-145-for-code.md, sha256 ${SHA145}`;
const MARKER = 'synthetic seed item — never shippable';
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

const AMENDED = ['vr02-partial-group','vr02-surface-link','vr05-almost-letters','vr05-single-word-only','vr13-not-a-word','vr16-synonym-pull','vr17-arith-slip','vr17-one-side-only','vr18-partial-rule','vr18-rule-swap','vr20-common-letter','vr20-sound-alike','vr21-too-strong'];
const APPROVED = ['vr-move-letter-both-invalid','vr-move-letter-first-word-invalid','vr-move-letter-second-word-invalid','vr13-wrong-pieces','vr16-loose-opposite','vr19-letter-order','vr19-shared-letter-miss','vr21-associated-not-same'];

async function run() {
  // Verify the already-landed acts from the live rows.
  const landed: Array<Record<string, unknown>> = [];
  for (const id of AMENDED) {
    const r = await prisma.misconception.findUniqueOrThrow({ where: { id }, select: { childHint: true, approvedBy: true, textProvenance: true } });
    if (r.approvedBy !== 'reviewer:rev-0001') throw new Error(`${id} not stamped`);
    const prev = (r.textProvenance as { previous?: { childHint?: string; sha256?: string } }).previous;
    landed.push({ id, act: 'AMENDED (landed first apply, verified now)', before: prev?.childHint, beforeSha256: prev?.sha256, after: r.childHint, afterSha256: sha256(r.childHint), authority: AUTH });
  }
  const mint = await prisma.misconception.findUniqueOrThrow({ where: { id: 'vr02-real-link-wrong-rule' }, select: { description: true, childHint: true, status: true } });
  landed.push({ id: 'vr02-real-link-wrong-rule', act: 'MINTED (verified)', status: mint.status, description: mint.description, childHint: mint.childHint, childHintSha256: sha256(mint.childHint), authority: AUTH });
  const retagged = await prisma.itemOption.findMany({ where: { misconceptionId: 'vr02-real-link-wrong-rule' }, select: { itemId: true } });
  if (retagged.length !== 5) throw new Error(`retag count ${retagged.length}`);
  landed.push({ act: 'RETAGGED (verified)', rows: retagged.map((r) => r.itemId).sort(), to: 'vr02-real-link-wrong-rule', citationNote: 'her block cites the scan at f68c3e1f, which carries no row ids; the five were named in the entries artefact (b2b43a26) and re-derived from the rows', authority: AUTH });
  const wiw12 = await prisma.itemOption.findFirstOrThrow({ where: { item: { id: 'ENG-001-WIW-12' }, attractorQuote: { not: null } }, select: { attractorQuote: true } });
  landed.push({ id: 'ENG-001-WIW-12', act: 'TRIMMED (verified)', attractorQuoteNow: wiw12.attractorQuote, branch: 'the cheaper branch per the 143rd advance ruling', authority: AUTH });
  for (const id of APPROVED) {
    const r = await prisma.misconception.findUniqueOrThrow({ where: { id }, select: { childHint: true, approvedBy: true } });
    if (r.approvedBy !== 'reviewer:rev-0001') throw new Error(`${id} not stamped`);
    landed.push({ id, act: 'APPROVED-BY-REFERENCE (verified)', wording: r.childHint, wordingSha256: sha256(r.childHint), authority: AUTH });
  }

  // The remainder: the seed rows RETIRE.
  const seeds = await prisma.item.findMany({ where: { id: { startsWith: 'seed-vr08-' } }, select: { id: true, status: true, explanation: true } });
  if (seeds.length !== 13 || !seeds.every((s) => (s.explanation as { note?: string }).note === MARKER)) throw new Error('seed premise changed');
  const stillDraft = seeds.filter((s) => s.status === 'DRAFT');
  if (stillDraft.length > 0) {
    await prisma.item.updateMany({ where: { id: { startsWith: 'seed-vr08-' }, status: 'DRAFT' }, data: { status: 'RETIRED' } });
    await prisma.attributionEvent.createMany({
      data: stillDraft.map((s) => ({
        recordType: 'item', recordId: s.id, action: 'AMENDED' as const,
        reviewerId: null, actor: 'David', recordedBy: DAVID, field: 'status',
        method: 'the seed ruling — the notes artefact read at the desk (940d5613)',
        note: `DRAFT -> RETIRED; author's own marker verbatim: "${MARKER}". REJECTED was refused by the enum — Items run DRAFT/REVIEWED/LIVE/RETIRED; RETIRED is the out-of-service, out-of-population state.`,
      })),
    });
    console.log(`  RETIRED ${stillDraft.length} seed rows`);
  }
  landed.push({ act: 'SEED ROWS LEAVE THE POPULATION', ids: seeds.map((s) => s.id).sort(), to: 'RETIRED', enumNote: 'the instruction said REJECTED; the Item enum has no REJECTED — RETIRED is the state that exists and does the ruled work (out of every review and serving population). Stated, not silently substituted.', authority: 'David\'s ruling on the notes artefact (940d5613)' });

  // The walk, on the post-removal population.
  const qts = (await prisma.case.findMany({ where: { id: { in: ['case-vr-02','case-vr-05','case-vr-08','case-vr-10','case-vr-13','case-vr-16','case-vr-17','case-vr-18','case-vr-19','case-vr-20','case-vr-21'] } }, select: { questionTypeId: true } })).map((c) => c.questionTypeId);
  const remaining = await prisma.item.findMany({ where: { questionTypeId: { in: qts }, status: 'DRAFT', reviewedBy: null }, select: { id: true, stem: true, explanation: true, questionTypeId: true } });
  const suspicious = remaining.filter((r) => /never shippable|synthetic seed|seed item|placeholder-only|do not ship|not for children|internal only/i.test(JSON.stringify({ s: r.stem, e: r.explanation })));
  const vr08 = remaining.filter((r) => r.questionTypeId === 'vr-08-move-letter').length;
  if (suspicious.length !== 0) throw new Error(`walk NOT clean: ${suspicious.map((s) => s.id).join(', ')}`);
  if (vr08 !== 25 || remaining.length !== 275) throw new Error(`recount refused: vr-08 ${vr08}, total ${remaining.length}`);
  console.log(`  WALK CLEAN; vr-08 ${vr08}, total ${remaining.length}`);

  const artefact = {
    kind: 'annie-145-landing',
    what: 'Her 145th landed whole and the seed rows left the population. The first apply failed midway on an enum (stated below); every earlier act verified from the live rows before this artefact shipped.',
    authority: AUTH,
    firstApplyNote: 'the seed removal specified REJECTED, which is the Misconception enum; the Item enum refused it (DRAFT/REVIEWED/LIVE/RETIRED). The rows RETIRED instead — the substitution is stated here and in every event, not silent. The partial first apply left no inconsistency: every prior act verified from the rows.',
    rows: landed,
    seedWalk: {
      population: `${remaining.length} rows after removal`,
      method: 'marker PHRASES only (never shippable / synthetic seed / seed item / placeholder-only / do not ship / not for children / internal only) — the first walk matched bare "seed" and flagged gen-vr-10-word-connections-13, whose stem pairs the WORD seed with plant; a marker is authoring metadata, not a content word',
      verdict: 'CLEAN — no other row carries the marker or an equivalent',
    },
    populationRecount: { vr08: 25, total: 275, sittingsAtSix: 'eleven cases at ceil(25/6) = 5 each: FIFTY-FIVE sittings (was fifty-seven)' },
    attestationProgress: 'all twenty-two entries now attested (13 amended + 8 approved + the known member), plus the mint as a twenty-third. Executions remain the binding absence for wholeness.',
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('annie-145-landing', sha256(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'annie-145-landing');
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
