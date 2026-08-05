/**
 * The reviewer's 20 reworded maths hints — `pnpm import:maths-reworded`.
 *
 * The 20 entries held on the first import (gate failures) come back reworded.
 * Description, category and id come from the ORIGINAL library (docs/…-library.md);
 * only the hint is new (docs/…-reworded.md). Per her footer notes:
 *   · written-review path — approvedBy the reviewer, recordedBy David, method
 *     "written review — maths hint rewords";
 *   · gates run on the way in; anything STILL failing is reported, not imported,
 *     and flagged as a NEW fault (not a missed correction);
 *   · #49 tested-token exemption: "isosceles"/"equilateral" are the vocabulary
 *     the misconception is ABOUT, exempt from the long-word ceiling in that hint
 *     only — same bounding as headwordInOwnCard.
 *
 * Both source files now live in the repo, not Downloads.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkChildFacingText, isBlocking } from '@cluecrew/core';
import { parseMathsReworded, parseMathsSeed } from './lib/parse-maths-seed';
import { prisma, recordMisconceptionApprovals } from '../packages/db/src/index';

const DRY = process.argv.includes('--dry-run');
const DOCS = resolve(import.meta.dirname, '../docs');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const METHOD = 'written review — maths hint rewords';

/** Ruled exemptions: entry number → the tokens the hint is ABOUT. */
const TESTED_TOKENS: Record<number, string[]> = { 49: ['isosceles', 'equilateral'] };

async function main(): Promise<void> {
  const original = parseMathsSeed(readFileSync(resolve(DOCS, 'maths-misconception-seed-library.md'), 'utf8'));
  const byN = new Map(original.map((e) => [e.n, e]));
  const reworded = parseMathsReworded(readFileSync(resolve(DOCS, 'maths-misconception-seed-reworded.md'), 'utf8'));
  console.log(`Reworded hints: ${reworded.size}`);

  const passing: Array<{ id: string; description: string; category: string; hint: string; n: number }> = [];
  const failing: Array<{ n: number; id: string; hint: string; faults: string[] }> = [];
  for (const [n, hint] of reworded) {
    const orig = byN.get(n);
    if (!orig) { console.log(`  ! #${n}: no matching entry in the original library`); continue; }
    const faults = checkChildFacingText({ role: 'hint', label: orig.id, text: hint, testedTokens: TESTED_TOKENS[n] ?? [] })
      .filter(isBlocking)
      .map((f) => f.detail);
    if (faults.length > 0) failing.push({ n, id: orig.id, hint, faults });
    else passing.push({ id: orig.id, description: orig.description, category: orig.category, hint, n });
  }

  console.log(`\nGate: ${passing.length} pass · ${failing.length} STILL failing (reported, not imported).`);
  for (const f of failing) {
    // Flag a fault of a DIFFERENT class than the sentence-length she was fixing.
    const newClass = f.faults.some((d) => /long words|banned|reading/.test(d)) ? '  [NEW FAULT — not sentence length]' : '';
    console.log(`  ✗ ${f.id} (#${f.n}): ${f.faults.join(' | ')}${newClass}`);
    console.log(`      hint: "${f.hint}"`);
  }

  const operator = await prisma.parentAccount.findUnique({ where: { email: RECORDER.replace(/^human:/, '') }, select: { id: true } });
  if (!operator) throw new Error(`${RECORDER} is not an account`);

  let created = 0;
  if (!DRY) {
    for (const e of passing) {
      if (await prisma.misconception.findUnique({ where: { id: e.id } })) continue;
      await prisma.misconception.create({
        data: { id: e.id, district: 'MATHS', description: e.description, childHint: e.hint, category: e.category, status: 'PROPOSED', proposedBy: 'human:staff-reviewer@cluecrew.test', sourcePattern: `reviewer:maths-seed#${e.n}`, testedTokens: TESTED_TOKENS[e.n] ?? [] },
      });
      created += 1;
    }
  }

  const audit = async (id: string, detail: Record<string, unknown>) => {
    await prisma.adminAuditLog.create({ data: { actorId: operator.id, action: 'misconception.approve_recorded', targetKind: 'Misconception', targetId: id, detail: { ...detail, via: 'maths hint rewords' } } });
  };
  const approved = DRY ? { recorded: [], skipped: [] } : await recordMisconceptionApprovals({
    ids: passing.map((e) => e.id),
    record: { approvedBy: REVIEWER, recordedBy: RECORDER, method: METHOD, note: 'Reworded maths hints; approved on the reviewer\'s written review.' },
    // The #49 tested-token exemption applies at the approval gate too, bounded
    // to that entry's tokens (David's ruling).
    testedTokensById: Object.fromEntries(passing.filter((e) => TESTED_TOKENS[e.n]).map((e) => [e.id, TESTED_TOKENS[e.n]!])),
    audit,
  });

  console.log(`\n${DRY ? '--dry-run: nothing written. ' : ''}Imported PROPOSED: ${created} · approved: ${approved.recorded.length}`);
  for (const s of approved.skipped) console.log(`  skipped ${s.id}: ${s.reason}`);
  const total = await prisma.misconception.count({ where: { district: 'MATHS', status: 'ACTIVE' } });
  console.log(`\nMATHS misconceptions ACTIVE now: ${total} / 60`);
  await prisma.$disconnect();
}

void main();
