/**
 * CARRY COWORK'S preReview ONTO THE 78 ITEMS — `pnpm backfill:draft-assessment [--write]`
 *
 * It lands on `Item.draftSelfAssessment`, which is not `reviewedBy`, not `reviewRecordedBy` and
 * nothing `recordSignature` writes. `pnpm check:review-queries` is what enforces that; this door
 * is declared there.
 *
 * IT COMPUTES A SUBJECT HASH, which Cowork's version does not have. Its rubric covers the key, the
 * distractors, the reading age, the tier fit, the fairness and the ban list — the whole
 * child-facing item plus its tier — so that is what gets fingerprinted. Without it the claim
 * survives any later edit and goes on describing an item that no longer exists. Carrying it across
 * unfixed would import a known defect (David, 2026-08-16).
 *
 * IT REFUSES TO CHOOSE BETWEEN DISAGREEING COPIES. Three disk copies of ENG-001 exist at three
 * hashes and 22 of 22 items differ between the oldest and the other two. The loose copies are
 * evidence of a TRANSFER MECHANISM, not of content: so this reads every copy it can find, compares
 * the preReview blocks item by item, and REFUSES the cluster if they disagree rather than picking
 * one. Every hash it read is named in the output.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { draftAssessmentSubjectHash, readDraftSelfAssessment, unknownCoworkKeys } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const SEARCH = ['/Users/davidb/Downloads/11+', '/Users/davidb/Downloads/11+/items', '/Users/davidb/Downloads/11+/from-cluecrew'];
const DAVID = 'human:david@cluecrew.test';

const textOf = (c: unknown): string =>
  typeof c === 'string' ? c
    : c && typeof c === 'object' && 'value' in c ? String((c as { value: unknown }).value) : '';

interface Found { file: string; sha: string; items: Array<Record<string, unknown>> }

function collect(): Found[] {
  const out: Found[] = [];
  for (const dir of SEARCH) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.json')) continue;
      const raw = readFileSync(join(dir, name), 'utf8');
      if (!raw.includes('"preReview"')) continue;
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { continue; }
      const items = (parsed as { items?: unknown }).items;
      if (!Array.isArray(items)) continue;
      const withPr = (items as Array<Record<string, unknown>>).filter((i) => i && 'preReview' in i);
      if (withPr.length === 0) continue;
      out.push({ file: join(dir, name), sha: createHash('sha256').update(raw).digest('hex').slice(0, 16), items: withPr });
    }
  }
  return out;
}

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  const found = collect();
  console.log(`${found.length} file(s) carry preReview:`);
  for (const f of found) console.log(`  sha ${f.sha}  ${f.items.length.toString().padStart(2)} items  ${f.file}`);

  // ONE CLAIM PER ITEM ID, or none. A disagreement between copies is a transfer problem and this
  // script has no standing to resolve it.
  const claims = new Map<string, { pr: unknown; from: string[] }>();
  const conflicts: string[] = [];
  for (const f of found) {
    for (const it of f.items) {
      const id = String(it.itemId);
      const cur = claims.get(id);
      const canon = JSON.stringify(it.preReview, Object.keys(it.preReview as object).sort());
      if (!cur) { claims.set(id, { pr: it.preReview, from: [`${f.sha}`] }); continue; }
      const prev = JSON.stringify(cur.pr, Object.keys(cur.pr as object).sort());
      if (prev !== canon) conflicts.push(`${id}: copies ${cur.from.join(',')} disagree with ${f.sha}`);
      else cur.from.push(f.sha);
    }
  }
  if (conflicts.length > 0) {
    console.error(`\nREFUSED — ${conflicts.length} item(s) whose copies disagree about the pre-review:`);
    for (const c of conflicts.slice(0, 10)) console.error(`  x ${c}`);
    console.error('Choosing one would be this script settling a transfer problem. Nothing written.');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`\n${claims.size} distinct item(s) carry a pre-review, and every copy agrees.`);

  // The ENG-001/002/003 door predates the key registry, so these files carry keys nobody has
  // decided about. Reported, not refused: this backfill reads ONE field and has no standing to
  // block on the rest — but a door that imports these whole must deal with them.
  const unregistered = new Set<string>();
  for (const f of found) for (const it of f.items) {
    for (const u of unknownCoworkKeys(it)) unregistered.add(`${u.level}.${u.key}`);
  }
  if (unregistered.size > 0) {
    console.log(`\n${unregistered.size} key(s) in these files are not in the key registry:`);
    console.log(`  ${[...unregistered].sort().join(', ')}`);
    console.log('  Reported, not refused — this reads one field. A door importing these whole must not.');
  }

  const rows = await prisma.item.findMany({
    where: { id: { in: [...claims.keys()] } },
    include: { options: { orderBy: { id: 'asc' } } },
  });
  const absent = [...claims.keys()].filter((id) => !rows.some((r) => r.id === id));

  const updates: Array<{ id: string; pr: unknown; hash: string }> = [];
  let alreadyHeld = 0;
  let unreadable = 0;
  for (const r of rows) {
    const claim = claims.get(r.id)!;
    if (readDraftSelfAssessment(claim.pr) === null) { unreadable += 1; continue; }
    if (r.draftSelfAssessment !== null) { alreadyHeld += 1; continue; }
    const stem = (r.stem ?? {}) as Record<string, unknown>;
    const prompt = typeof stem.prompt === 'string' ? stem.prompt
      : typeof stem.text === 'string' ? stem.text : null;
    updates.push({
      id: r.id, pr: claim.pr,
      hash: draftAssessmentSubjectHash({
        prompt, tier: r.difficultyTier,
        options: r.options.map((o) => ({ text: textOf(o.content), isCorrect: o.isCorrect })),
      }),
    });
  }

  console.log(`\n${claims.size} claimed · ${rows.length} present in the database · ${updates.length} to write · `
    + `${alreadyHeld} already held · ${unreadable} unreadable · ${absent.length} not in the database`);
  if (unreadable > 0) {
    console.error(`REFUSED — ${unreadable} claim(s) did not parse as a pre-review. Nothing written.`);
    await prisma.$disconnect();
    process.exit(1);
  }
  if (updates.length === 0 || !write) {
    console.log(updates.length === 0 ? '\nNothing to write.' : '\nDry run. Re-run with --write to apply.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(updates.map((u) => prisma.item.update({
    where: { id: u.id },
    data: { draftSelfAssessment: u.pr as object, draftSelfAssessmentHash: u.hash },
  })));
  for (const u of updates) {
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: u.id, action: 'AMENDED',
        // NOT a review event. No reviewerId, and the note says what the field is so nobody reads
        // this event as the item having been looked at by a person.
        actor: DAVID, recordedBy: DAVID, field: 'draftSelfAssessment',
        method: 'Cowork pre-review carried across, 2026-08-16',
        note:
          'Stored a DRAFTING AGENT\'S assessment of its own work as authoring metadata, with a ' +
          'subject hash computed here because Cowork\'s version has none. This item has NOT been ' +
          'reviewed by a person; both of Cowork\'s verdict values mean exactly that.',
      },
    });
  }

  // VERIFY BY RE-READING THE ROWS ACTED ON.
  // TWO QUERIES, DELIBERATELY. The claim and the review state are different facts from different
  // sources, and reading them in one select is what `check:review-queries` leg B flags — it caught
  // this line. Splitting them is not evasion of the gate: it is the code expressing the separation
  // the ruling is about, instead of asserting it in a comment while doing the opposite.
  const after = await prisma.item.findMany({
    where: { id: { in: updates.map((u) => u.id) } },
    select: { id: true, draftSelfAssessment: true, draftSelfAssessmentHash: true },
  });
  const reviewState = await prisma.item.findMany({
    where: { id: { in: updates.map((u) => u.id) } },
    select: { id: true, reviewedBy: true, status: true },
  });
  const byId = new Map(updates.map((u) => [u.id, u]));
  const held = after.filter((r) => r.draftSelfAssessment !== null && r.draftSelfAssessmentHash === byId.get(r.id)!.hash);
  console.log(`\nVERIFIED by re-reading all ${after.length} rows:`);
  console.log(`  holding the claim with its subject hash: ${held.length} of ${after.length}`);
  console.log(`  still DRAFT: ${reviewState.filter((r) => r.status === 'DRAFT').length} of ${reviewState.length}`);
  console.log(`  with a reviewer recorded: ${reviewState.filter((r) => r.reviewedBy !== null).length} — this changes no review state.`);
  await prisma.$disconnect();
}

void main();
