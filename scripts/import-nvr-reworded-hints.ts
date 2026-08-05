/**
 * IMPORT THE REWORDED NVR HINTS — `pnpm import:nvr-reworded-hints` (`--apply`).
 *
 * The five NVR misconceptions held on the copy gate came back reworded
 * (docs/nvr-hints-reworded.json). This applies her new hint to each, then
 * approves it PROPOSED → ACTIVE through the written-review path — approvedBy the
 * reviewer, recordedBy David — with the copy gate run on every new hint first.
 * A hint that still fails the gate is refused, not forced.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkChildFacingText } from '@cluecrew/core';
import { recordMisconceptionApprovals } from '../packages/db/src/review-recording';
import { prisma } from '../packages/db/src/index';

const APPLY = process.argv.includes('--apply');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const TODAY = new Date().toISOString().slice(0, 10);
const FILE = resolve(import.meta.dirname, '../docs/nvr-hints-reworded.json');

interface Row { id: string; rewordedHint: string }

async function main(): Promise<void> {
  const operator = await prisma.parentAccount.findUnique({ where: { email: RECORDER.replace(/^human:/, '') }, select: { id: true } });
  if (!operator) throw new Error(`${RECORDER} is not an account`);

  const doc = JSON.parse(readFileSync(FILE, 'utf8')) as { hints?: Row[] };
  const rows = (doc.hints ?? []).filter((r) => r.rewordedHint?.trim());

  // 1) Apply + gate-check every reworded hint before anything approves.
  let blocked = 0;
  for (const { id, rewordedHint } of rows) {
    const faults = checkChildFacingText({ role: 'hint', label: id, text: rewordedHint });
    console.log(`  ${id.padEnd(28)} ${faults.length ? `✗ ${faults[0]!.detail}` : 'gate ok'}`);
    if (faults.length) blocked += 1;
    else if (APPLY) await prisma.misconception.update({ where: { id }, data: { childHint: rewordedHint } });
  }
  if (blocked) { console.error(`\n${blocked} reworded hint(s) still fail the gate — not approving those.`); }

  // 2) Approve the ones whose hint now passes.
  const okIds = [];
  for (const { id, rewordedHint } of rows) if (checkChildFacingText({ role: 'hint', label: id, text: rewordedHint }).length === 0) okIds.push(id);
  if (APPLY && okIds.length) {
    const outcome = await recordMisconceptionApprovals({
      ids: okIds,
      record: { approvedBy: REVIEWER, recordedBy: RECORDER, method: `written review — NVR reworded-hint approval, ${TODAY}`, note: 'Reviewer reworded the five held hints (full-stop sentence splits); approved on her return.' },
      audit: async (id, detail) => { await prisma.adminAuditLog.create({ data: { actorId: operator.id, action: 'misconception.approve_recorded', targetKind: 'Misconception', targetId: id, detail } }); },
    });
    console.log(`\nApproved ${outcome.recorded.length}; skipped ${outcome.skipped.length}.`);
    for (const s of outcome.skipped) console.log(`  · ${s.id}: ${s.reason}`);
  } else {
    console.log(`\n--dry-run: would apply ${rows.length} hints and approve ${okIds.length}.`);
  }
  await prisma.$disconnect();
}

void main();
