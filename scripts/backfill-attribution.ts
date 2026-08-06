/**
 * REVIEWER-HANDOVER ATTRIBUTION BACKFILL (2026-08-06).
 *
 * Run (loads .env so the identity names are in process.env — plain tsx does not):
 *   pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- \
 *     tsx ../../scripts/backfill-attribution.ts --apply
 *
 * Identity resolution reads the two real names from the gitignored .env
 * (ATTRIBUTION_PREVIOUS_REVIEWER, ATTRIBUTION_CURRENT_REVIEWER), so the whole
 * backfill is reproducible from source while the names stay out of git. With the
 * env unset it still writes the placeholder events; the mappings fill in later.
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
    // Identity resolution (per-actor, log-only). The real names live in the
    // root .env (gitignored), NOT in this tracked file — so the placeholder
    // backfill is reproducible while the identities stay out of git. Each mapping
    // is one REASSIGNED event keyed by the placeholder; resolution reads a record's
    // placeholder actor through to its mapping. The 400+ placeholder events above
    // are never rewritten, so the "unknown then known" period stays legible.
    const RESOLVE: Array<[string, string | undefined]> = [
      ['previous-reviewer', process.env.ATTRIBUTION_PREVIOUS_REVIEWER],
      ['current-reviewer', process.env.ATTRIBUTION_CURRENT_REVIEWER],
    ];
    let resolved = 0;
    for (const [placeholder, name] of RESOLVE) {
      if (!name) continue;
      await prisma.attributionEvent.upsert({
        where: { id: `attr-actor-identity-${placeholder}-REASSIGNED` },
        create: { id: `attr-actor-identity-${placeholder}-REASSIGNED`, recordType: 'actor-identity', recordId: placeholder, action: 'REASSIGNED', actor: name, recordedBy: DAVID, field: 'actor', note: `Resolves the placeholder actor '${placeholder}' to ${name}; identities were unknown at the backfill, so prior events keep the placeholder and this mapping resolves them.`, method: 'attribution identity resolution (names from env)' },
        update: { actor: name, method: 'attribution identity resolution (names from env)' },
      });
      resolved += 1;
    }
    const total = await prisma.attributionEvent.count();
    console.log(`\nAPPLIED. AttributionEvent rows now: ${total}. Identity mappings written: ${resolved}${resolved < 2 ? ' (set ATTRIBUTION_PREVIOUS_REVIEWER / ATTRIBUTION_CURRENT_REVIEWER in .env for the rest)' : ''}.`);
  } else {
    const set = [process.env.ATTRIBUTION_PREVIOUS_REVIEWER, process.env.ATTRIBUTION_CURRENT_REVIEWER].filter(Boolean).length;
    console.log(`\n--dry-run (no --apply). Identity names present in env: ${set}/2.`);
  }
  await prisma.$disconnect();
}

void main();
