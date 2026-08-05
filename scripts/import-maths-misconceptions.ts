/**
 * KS2 MATHS MISCONCEPTION SEED LIBRARY — `pnpm import:maths-misconceptions <file.md>`
 *
 * The specialist reviewer authored 60 maths misconceptions (her wording verbatim);
 * David's import notes at the foot of her file govern the mechanics:
 *
 *   · her six groupings are preserved as a `category` field;
 *   · every hint is screened by the child-facing gates, and a FAILURE is
 *     reported and NOT imported — her wording is not amended, faults go back to
 *     her (the English hint set had 13 such faults, so some are expected);
 *   · passing entries land PROPOSED, then are approved through the EXISTING
 *     written-review path — approvedBy the reviewer, recordedBy David, method
 *     "written review — maths misconception seed library". She authored these,
 *     so the authorship is hers and the record says so.
 *
 * A derivable/conceptual split is reported (not stored): a derivable
 * misconception executes on an item's own numbers to yield one specific wrong
 * answer, so a gate can machine-verify a distractor the way the insert-letter
 * and compound gates do; a conceptual one relies on authoring and review.
 *
 * `--dry-run` gates and classifies but writes nothing.
 */
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '@cluecrew/core';
import { parseMathsSeed as parse, type MathsSeedEntry as Entry } from './lib/parse-maths-seed';
import { prisma, recordMisconceptionApprovals } from '../packages/db/src/index';

const DRY = process.argv.includes('--dry-run');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const METHOD = 'written review — maths misconception seed library';

/**
 * David's classification, anchored on his examples (derivable 11/21/22/23/24/
 * 26/51/52; conceptual 15/20/41/42/50). A CONCEPTUAL entry is a belief or a
 * definition that does not reduce to one arithmetic procedure yielding a single
 * wrong number; everything else is derivable. Reported for confirmation, not
 * treated as final.
 */
const CONCEPTUAL = new Set([15, 20, 27, 28, 30, 40, 41, 42, 43, 49, 50, 58, 59]);

async function main(): Promise<void> {
  const path = process.argv.find((arg) => arg.endsWith('.md'));
  if (!path) { console.error('usage: … <file.md> [--dry-run]'); process.exit(1); }
  const entries = parse(readFileSync(path, 'utf8'));
  console.log(`Parsed ${entries.length} entries across ${new Set(entries.map((e) => e.category)).size} categories.`);
  if (entries.length !== 60) console.log(`  ! expected 60, got ${entries.length} — check the parse.`);

  // --- Gate every hint. Failures are reported, never imported. -------------
  const passing: Entry[] = [];
  const failing: Array<{ entry: Entry; faults: string[] }> = [];
  for (const entry of entries) {
    const faults = checkChildFacingText({ role: 'hint', label: entry.id, text: entry.hint })
      .filter(isBlocking)
      .map((f) => f.detail);
    if (faults.length > 0) failing.push({ entry, faults });
    else passing.push(entry);
  }

  console.log(`\nGate: ${passing.length} pass · ${failing.length} FAIL (reported, not imported).`);
  for (const { entry, faults } of failing) {
    console.log(`  ✗ ${entry.id} (#${entry.n}): ${faults.join(' | ')}`);
    console.log(`      hint: "${entry.hint}"`);
  }

  // --- Import the passing set PROPOSED, then approve via the shared path ----
  const operator = await prisma.parentAccount.findUnique({ where: { email: RECORDER.replace(/^human:/, '') }, select: { id: true } });
  if (!operator) throw new Error(`${RECORDER} is not an account on this system`);

  let created = 0;
  if (!DRY) {
    for (const entry of passing) {
      const exists = await prisma.misconception.findUnique({ where: { id: entry.id } });
      if (exists) continue;
      await prisma.misconception.create({
        data: {
          id: entry.id,
          district: 'MATHS',
          description: entry.description,
          childHint: entry.hint,
          category: entry.category,
          status: 'PROPOSED',
          proposedBy: 'human:staff-reviewer@cluecrew.test',
          sourcePattern: `reviewer:maths-seed#${entry.n}`,
        },
      });
      created += 1;
    }
  }

  const audit = async (id: string, detail: Record<string, unknown>) => {
    await prisma.adminAuditLog.create({
      data: { actorId: operator.id, action: 'misconception.approve_recorded', targetKind: 'Misconception', targetId: id, detail: { ...detail, via: 'maths seed library' } },
    });
  };
  const approved = DRY
    ? { recorded: [], skipped: [] }
    : await recordMisconceptionApprovals({
        ids: passing.map((e) => e.id),
        record: { approvedBy: REVIEWER, recordedBy: RECORDER, method: METHOD, note: 'Maths misconception seed library, authored by the reviewer; approved on her written review.' },
        audit,
      });

  console.log(`\n${DRY ? '--dry-run: nothing written. ' : ''}Imported PROPOSED: ${created} · approved (written-review path): ${approved.recorded.length}`);
  for (const skip of approved.skipped) console.log(`  skipped ${skip.id}: ${skip.reason}`);

  // --- Derivable vs conceptual ---------------------------------------------
  const derivable = entries.filter((e) => !CONCEPTUAL.has(e.n));
  const conceptual = entries.filter((e) => CONCEPTUAL.has(e.n));
  console.log(`\nDistractor class — DERIVABLE ${derivable.length} (machine-verifiable) · CONCEPTUAL ${conceptual.length} (authoring + review):`);
  console.log(`  conceptual: ${conceptual.map((e) => e.n).join(', ')}`);
  const byCat = entries.reduce<Record<string, { d: number; c: number }>>((acc, e) => {
    acc[e.category] ??= { d: 0, c: 0 };
    if (CONCEPTUAL.has(e.n)) acc[e.category]!.c += 1; else acc[e.category]!.d += 1;
    return acc;
  }, {});
  for (const [cat, { d, c }] of Object.entries(byCat)) console.log(`    ${cat}: ${d} derivable, ${c} conceptual`);

  await prisma.$disconnect();
}

void main();
