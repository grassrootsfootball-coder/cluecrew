/**
 * REVIEWER-HANDOVER ATTRIBUTION BACKFILL (2026-08-06) — `--apply` to write.
 *
 * Writes one AttributionEvent per record, naming the INDIVIDUAL behind work that
 * the single generic staff-reviewer account cannot distinguish:
 *   - MATHS misconceptions (library + additions 61-97) -> previous-reviewer
 *   - NVR misconceptions + template signatures          -> current-reviewer
 *   - VR misconceptions + reviewed items                -> current-reviewer
 *   - ENGLISH misconceptions                            -> UNATTRIBUTED (honest gap)
 * maths-36 is the two-person test case: AUTHORED(previous) + AMENDED(current) for
 * her description correction. Events are additive — approvedBy/signedBy are left
 * as the role cache. Deterministic ids make the backfill idempotent, and every
 * row is itself the visible audit entry (no silent correction).
 */
import { prisma } from '../packages/db/src/index';

const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const BASIS = 'handover attribution backfill 2026-08-06 (audit: single generic staff-reviewer account)';

type Ev = { recordType: string; recordId: string; action: 'AUTHORED' | 'APPROVED' | 'AMENDED' | 'SIGNED' | 'UNATTRIBUTED'; actor: string; field?: string; note?: string };

async function main(): Promise<void> {
  const events: Ev[] = [];

  // Scope to EXACTLY the two reviewers' identified work — not by district alone.
  // Corpus-proposed and unreviewed rows get no event (an honest gap), per spec.
  const misc = await prisma.misconception.findMany({ select: { id: true, district: true, status: true, approvedBy: true, sourcePattern: true } });
  let skipped = 0;
  for (const m of misc) {
    if (m.district === 'MATHS') events.push({ recordType: 'misconception', recordId: m.id, action: 'AUTHORED', actor: 'previous-reviewer', note: 'maths library / additions 61-97 — authored before the handover' });
    else if (m.district === 'NVR') events.push({ recordType: 'misconception', recordId: m.id, action: 'AUTHORED', actor: 'current-reviewer' });
    else if (m.district === 'VR' && m.approvedBy) events.push({ recordType: 'misconception', recordId: m.id, action: 'AUTHORED', actor: 'current-reviewer' }); // only the 3 reviewer-approved
    else if (m.district === 'ENGLISH' && m.status === 'ACTIVE') events.push({ recordType: 'misconception', recordId: m.id, action: 'UNATTRIBUTED', actor: 'unattributed', note: 'authorship not established at handover — not assigned by inference' });
    else skipped++; // VR corpus/proposed (65) + English proposed (3): no event, an honest gap
  }
  console.log(`misconceptions with no event (corpus/proposed, honest gap): ${skipped}`);

  // Two-person record: maths-36 — predecessor authored, current reviewer corrected.
  const m36 = misc.find((m) => /#36\b/.test(m.sourcePattern ?? ''));
  if (m36) events.push({ recordType: 'misconception', recordId: m36.id, action: 'AMENDED', actor: 'current-reviewer', field: 'description', note: 'Corrected to "Child gives 100 cm = 10,000 m where the answer is 1 m" and proposed the "child gives X where the answer is Y" frame.' });

  const sigs = await prisma.nvrTemplateSignature.findMany({ select: { templateId: true, version: true } });
  for (const s of sigs) events.push({ recordType: 'nvr-signature', recordId: `${s.templateId}@${s.version}`, action: 'SIGNED', actor: 'current-reviewer' });

  const items = await prisma.item.findMany({ where: { reviewedBy: { not: null } }, select: { id: true } });
  for (const it of items) events.push({ recordType: 'item', recordId: it.id, action: 'APPROVED', actor: 'current-reviewer' });

  // Summary
  const byActor: Record<string, number> = {};
  for (const e of events) byActor[`${e.actor}/${e.action}`] = (byActor[`${e.actor}/${e.action}`] ?? 0) + 1;
  console.log(`events to write: ${events.length}`);
  for (const [k, v] of Object.entries(byActor).sort()) console.log(`  ${k.padEnd(28)} ${v}`);
  if (m36) console.log(`  two-person: ${m36.id} carries AUTHORED(previous) + AMENDED(current)`);

  if (APPLY) {
    for (const e of events) {
      const id = `attr-${e.recordType}-${e.recordId}-${e.action}-${e.actor}`;
      await prisma.attributionEvent.upsert({
        where: { id },
        create: { id, recordType: e.recordType, recordId: e.recordId, action: e.action, actor: e.actor, recordedBy: DAVID, field: e.field ?? null, note: e.note ?? null, method: BASIS },
        update: { action: e.action, actor: e.actor, field: e.field ?? null, note: e.note ?? null, method: BASIS },
      });
    }
    const total = await prisma.attributionEvent.count();
    console.log(`\nAPPLIED. AttributionEvent rows now: ${total}`);
  } else {
    console.log('\n--dry-run (no --apply)');
  }
  await prisma.$disconnect();
}

void main();
