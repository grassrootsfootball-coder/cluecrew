/**
 * APPLY THE NVR MISCONCEPTION REVIEW — `pnpm apply:nvr-review` (`--apply` to write).
 *
 * The reviewer approved all 22 NVR misconceptions: 18 as written, 4 rewritten on
 * wording. Two more get a style edit she asked for (three hints had drifted into
 * the same "is the trap" formula). This updates the six hints, then approves all
 * 22 through the written-review path — approvedBy the reviewer, recordedBy David,
 * never merged — with the copy gate run on every hint on the way through.
 */
import { checkChildFacingText, NVR_MISCONCEPTION_IDS } from '@cluecrew/core';
import { recordMisconceptionApprovals } from '../packages/db/src/review-recording';
import { prisma } from '../packages/db/src/index';

const APPLY = process.argv.includes('--apply');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const TODAY = new Date().toISOString().slice(0, 10);

/** Her four rewrites (held on wording), plus two style edits breaking the shared
 * "is the trap" ending she flagged (count-by-glance keeps its established line). */
const HINTS: Record<string, string> = {
  'nvr-multi-part-tracking': 'Give every piece its own turn. Start with the big shape. Then the dot, then the shading.',
  'nvr-series-phase-slip': 'Each frame copies its own team, not its neighbour. Follow 1-3-5, or follow 2-4.',
  'nvr-relational-rule-miss': 'If nothing stands out, compare two parts inside the same picture. Sometimes they match each other.',
  'nvr-rotation-for-reflection': 'Imagine folding the page along the line. Every part lands exactly on its twin.',
  // Style edits (David, relaying her note): break the "is the trap" formula.
  'nvr-rotation-wrong-direction': 'Check which way to turn, like clock hands. Turning the other way lands you backwards.',
  'nvr-partial-reflection': 'Fold along the mirror line so every part flips. Miss one piece and it isn’t a true mirror.',
};

async function main(): Promise<void> {
  const operator = await prisma.parentAccount.findUnique({ where: { email: RECORDER.replace(/^human:/, '') }, select: { id: true } });
  if (!operator) throw new Error(`${RECORDER} is not an account`);

  // 1) Update the six hints (and gate-check every one before anything approves).
  let blocked = 0;
  for (const [id, text] of Object.entries(HINTS)) {
    const faults = checkChildFacingText({ role: 'hint', label: id, text });
    console.log(`  hint ${id.padEnd(30)} ${faults.length ? `✗ ${faults[0]!.detail}` : 'gate ok'}`);
    if (faults.length) blocked += 1;
    if (APPLY && !faults.length) await prisma.misconception.update({ where: { id }, data: { childHint: text } });
  }
  if (blocked) { console.error(`\n${blocked} rewritten hint(s) fail the gate — fix the text before approving.`); await prisma.$disconnect(); process.exit(1); }

  // 2) Approve all 22 (PROPOSED → ACTIVE) through the written-review path.
  const ids = [...NVR_MISCONCEPTION_IDS];
  if (APPLY) {
    const outcome = await recordMisconceptionApprovals({
      ids,
      record: {
        approvedBy: REVIEWER,
        recordedBy: RECORDER,
        method: `written review — NVR misconception approval, ${TODAY}`,
        note: 'Approved all 22 NVR misconceptions (18 as written, 4 rewritten on wording, 2 style-edited to David\'s relay of her note).',
      },
      audit: async (id, detail) => {
        await prisma.adminAuditLog.create({ data: { actorId: operator.id, action: 'misconception.approve_recorded', targetKind: 'Misconception', targetId: id, detail } });
      },
    });
    console.log(`\nApproved ${outcome.recorded.length}; skipped ${outcome.skipped.length}.`);
    for (const s of outcome.skipped) console.log(`  · ${s.id}: ${s.reason}`);
  } else {
    const proposed = await prisma.misconception.count({ where: { id: { in: ids }, status: 'PROPOSED' } });
    console.log(`\n--dry-run: would update 6 hints and approve ${proposed} PROPOSED of ${ids.length} NVR misconceptions.`);
  }
  await prisma.$disconnect();
}

void main();
