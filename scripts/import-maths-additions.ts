/**
 * MATHS GAP-FAMILY ADDITIONS (61–97) — `pnpm import:maths-additions <file.md>`.
 *
 * The reviewer named and worded the 37 gap families surfaced by the calibration
 * batch. Same discipline as her seed library: her six groupings preserved as
 * the category, every hint screened by the child-facing gates with failures
 * reported rather than imported, passing entries PROPOSED then approved through
 * the written-review path (method "written review — maths gap families and tier
 * rulings"). `--dry-run` gates but writes nothing.
 */
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '@cluecrew/core';
import { parseMathsSeed } from './lib/parse-maths-seed';
import { prisma, recordMisconceptionApprovals } from '../packages/db/src/index';

const DRY = process.argv.includes('--dry-run');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const METHOD = 'written review — maths gap families and tier rulings';

async function main(): Promise<void> {
  const path = process.argv.find((a) => a.endsWith('.md'));
  if (!path) { console.error('usage: … <file.md> [--dry-run]'); process.exit(1); }
  const entries = parseMathsSeed(readFileSync(path, 'utf8')).filter((e) => e.n >= 61);
  console.log(`Parsed ${entries.length} additions across ${new Set(entries.map((e) => e.category)).size} categories.`);

  const passing = entries.filter((e) => checkChildFacingText({ role: 'hint', label: e.id, text: e.hint }).filter(isBlocking).length === 0);
  const failing = entries.filter((e) => !passing.includes(e));
  console.log(`Gate: ${passing.length} pass · ${failing.length} FAIL (reported, not imported).`);
  for (const e of failing) console.log(`  ✗ ${e.id}: ${checkChildFacingText({ role: 'hint', label: e.id, text: e.hint }).filter(isBlocking).map((f) => f.detail).join(' | ')}`);

  const operator = await prisma.parentAccount.findUnique({ where: { email: RECORDER.replace(/^human:/, '') }, select: { id: true } });
  if (!operator) throw new Error(`${RECORDER} is not an account`);
  let created = 0;
  if (!DRY) for (const e of passing) {
    if (await prisma.misconception.findUnique({ where: { id: e.id } })) continue;
    await prisma.misconception.create({ data: { id: e.id, district: 'MATHS', description: e.description, childHint: e.hint, category: e.category, status: 'PROPOSED', proposedBy: REVIEWER, sourcePattern: `reviewer:maths-seed#${e.n}` } });
    created += 1;
  }
  const audit = async (id: string, detail: Record<string, unknown>) => { await prisma.adminAuditLog.create({ data: { actorId: operator.id, action: 'misconception.approve_recorded', targetKind: 'Misconception', targetId: id, detail: { ...detail, via: 'maths gap families 61-97' } } }); };
  const approved = DRY ? { recorded: [], skipped: [] } : await recordMisconceptionApprovals({ ids: passing.map((e) => e.id), record: { approvedBy: REVIEWER, recordedBy: RECORDER, method: METHOD, note: 'Gap families named and worded on the reviewer\'s written review.' }, audit });
  console.log(`\n${DRY ? '--dry-run. ' : ''}Imported PROPOSED: ${created} · approved: ${approved.recorded.length}`);
  for (const s of approved.skipped) console.log(`  skipped ${s.id}: ${s.reason}`);
  const total = await prisma.misconception.count({ where: { district: 'MATHS', status: 'ACTIVE' } });
  console.log(`\nMATHS misconceptions ACTIVE now: ${total}`);
  await prisma.$disconnect();
}
void main();
