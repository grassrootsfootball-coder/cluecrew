/**
 * CLOSE A REVIEWER'S TENURE (R1052). A Reviewer row with `heldUntil: null` still holds the role:
 * the CMS signing door (`apps/web/lib/actions/admin-items.ts`) accepts its staff account as a
 * named reviewer, and `check:authority-shape` and `check:verdict-refusals` count it as current. R1031
 * ended Annie's reviewing on 2026-11-22 ("no more annie"), but her row was never closed, so no check
 * could ask whether an approver held the role at the time (raised in R1051).
 *
 * Refuses before any write unless: the row exists and is still open; the end is after its heldFrom;
 * and NO attribution event names this reviewer at or after the end. Closing a tenure must never turn
 * an existing act into one outside it. `staffEmail` is kept, because it is a record of who signed as
 * whom, not a live permission. The previous value is written into `evidence`, with one AMENDED
 * event (actor `ruling:<who>`).
 *
 *   tsx scripts/close-reviewer-tenure.ts <reviewerId> <ISO end> --ruling="<words>" [--apply]
 */
import { prisma } from '../packages/db/src/index';
import { exportContentSnapshot } from './content-snapshot';

const [ID, END] = process.argv.slice(2);
const RULING = process.argv.find((a) => a.startsWith('--ruling='))?.slice(9);
const APPLY = process.argv.includes('--apply');
const RECORDED_BY = 'human:dbamgbade@gmail.com';

async function main() {
  if (!ID || !END || END.startsWith('--')) throw new Error('usage: <reviewerId> <ISO end> --ruling="…" [--apply]');
  if (!RULING?.trim()) throw new Error('pass --ruling="<the words that decided this>"');
  const end = new Date(END);
  if (Number.isNaN(end.getTime())) throw new Error(`"${END}" is not a date`);
  const r = await prisma.reviewer.findUniqueOrThrow({ where: { id: ID } });
  const faults: string[] = [];
  if (r.heldUntil) faults.push(`tenure already closed at ${r.heldUntil.toISOString()}`);
  if (end <= r.heldFrom) faults.push(`end ${end.toISOString()} is not after heldFrom ${r.heldFrom.toISOString()}`);
  const after = await prisma.attributionEvent.count({ where: { reviewerId: ID, at: { gte: end } } });
  const last = await prisma.attributionEvent.findFirst({ where: { reviewerId: ID }, orderBy: { at: 'desc' }, select: { at: true, action: true } });
  if (after > 0) faults.push(`${after} event(s) name ${ID} at or after the end — closing here would put them outside the tenure`);
  const staffDoor = r.staffEmail ? `the CMS signing door will stop accepting ${r.staffEmail} as ${r.displayName}` : 'no staff account is bound';
  console.log(`close tenure ${ID} (${r.displayName}) at ${end.toISOString()} — ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`  heldFrom ${r.heldFrom.toISOString()}; last event ${last ? `${last.action} ${last.at.toISOString()}` : 'none'}; events at/after the end: ${after}`);
  console.log(`  effect: ${staffDoor}`);
  for (const f of faults) console.log(`  ✗ ${f}`);
  if (faults.length) throw new Error('refused before any write');
  if (!APPLY) return;
  const note = `Tenure closed ${end.toISOString()} (R1052) on: "${RULING}". Day precision: the ruling's time of day is not recorded, so the close is the start of that day (UTC); last act ${last?.at.toISOString() ?? 'none'}. heldUntil was null.`;
  await prisma.$transaction(async (tx) => {
    await tx.reviewer.update({ where: { id: ID }, data: { heldUntil: end, evidence: r.evidence ? `${r.evidence} | ${note}` : note } });
    await tx.attributionEvent.create({ data: { recordType: 'reviewer', recordId: ID, action: 'AMENDED', actor: 'ruling:david', recordedBy: RECORDED_BY, field: 'heldUntil', note, method: 'tenure close under R1031/R1052' } });
  });
  console.log(`  closed.`);
}
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); }).catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
