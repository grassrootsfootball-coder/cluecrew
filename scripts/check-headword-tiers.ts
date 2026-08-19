/**
 * A HEADWORD SERVED TO A CHILD CARRIES A TIER — on the population the rule was written for.
 *
 * **ANNIE'S RULE, ON ITS OWN POPULATION** (R294). *A headword served to a child must carry a tier*
 * makes "hard" a measured property rather than an accident of who chose the word. Against
 * `stem.words[]` as a whole it refused 25 compound parts — "tooth", "rain", "butter" — and touched
 * none of the vocabulary headwords it exists for. `wordsRoleFor` splits the field by its declared
 * job so the rule lands where it means something.
 *
 * **AN UNDECLARED TYPE FAILS.** There is no safe default: guess `components` and a vocabulary
 * family silently leaves the rule's scope; guess `headword-under-test` and a compound bank is
 * blocked over words nobody would tier. Where every default is wrong, refuse.
 *
 * **AND A DRAFT VAULT ENTRY IS NOT A TIER.** A word whose Word row exists but is not LIVE has a
 * tiering that was authored and never published — the judgement exists and the child-facing
 * record of it does not. Counted separately from a word with no entry at all, because the two are
 * different amounts of work: one is a publication, the other is an authoring.
 */
import { tierRequirementApplies, wordsRoleFor } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

async function main() {
  const words = await prisma.word.findMany({ select: { headword: true, tier: true, status: true } });
  const vault = new Map(words.map((w) => [w.headword.toLowerCase(), w]));
  const cases = await prisma.case.findMany({ select: { questionTypeId: true } });
  const doors = new Set(cases.map((c) => c.questionTypeId));
  const items = await prisma.item.findMany({
    where: { status: 'LIVE' },
    select: { id: true, questionTypeId: true, stem: true },
    orderBy: { id: 'asc' },
  });
  const bearing = items.filter((i) => Array.isArray((i.stem as { words?: unknown })?.words));
  requirePopulation('headword tiers', {
    'vault entries': vault.size,
    'LIVE items carrying stem.words[]': bearing.length,
  });

  const undeclared = new Set<string>();
  const missing: string[] = [];
  const draftEntry: string[] = [];
  let ok = 0, exempt = 0;

  for (const item of bearing) {
    const applies = tierRequirementApplies(item.questionTypeId);
    if (applies === null) { undeclared.add(item.questionTypeId); continue; }
    if (!applies) { exempt += 1; continue; }
    const reachable = doors.has(item.questionTypeId);
    for (const raw of ((item.stem as { words?: unknown }).words ?? []) as unknown[]) {
      const word = String(raw).toLowerCase();
      const entry = vault.get(word);
      const where = `${item.id} "${raw}"${reachable ? '' : ' (no door)'}`;
      if (!entry) missing.push(where);
      else if (entry.status !== 'LIVE') draftEntry.push(`${where} — tier ${entry.tier}, ${entry.status}`);
      else ok += 1;
    }
  }

  const roles = new Map<string, number>();
  for (const i of bearing) {
    const r = wordsRoleFor(i.questionTypeId) ?? 'UNDECLARED';
    roles.set(r, (roles.get(r) ?? 0) + 1);
  }

  console.log('headword tiers — the rule on its own population');
  console.log(`  LIVE items carrying stem.words[] : ${bearing.length}`);
  for (const [r, n] of [...roles].sort()) console.log(`      ${r.padEnd(22)} ${n}`);
  console.log(`  headwords with a LIVE tier       : ${ok}`);
  console.log(`  vault entry exists but is DRAFT  : ${draftEntry.length}`);
  console.log(`  no vault entry at all            : ${missing.length}`);
  console.log(`  items exempt by declared role    : ${exempt}`);

  if (undeclared.size > 0) {
    console.error(`\nFAULT: ${undeclared.size} question type(s) carry stem.words[] with no declared role:`);
    for (const t of undeclared) console.error(`  - ${t} — declare it in WORDS_ROLE_BY_TYPE. There is no safe default.`);
    await prisma.$disconnect();
    process.exit(1);
  }
  if (missing.length > 0) {
    console.error(`\n${missing.length} headword(s) with NO vault entry — an authoring job:`);
    for (const m of missing.slice(0, 10)) console.error(`  - ${m}`);
  }
  if (draftEntry.length > 0) {
    console.log(`\n  ${draftEntry.length} headword(s) tiered but NOT PUBLISHED — a publication job, not an authoring one:`);
    for (const d of draftEntry.slice(0, 6)) console.log(`      ${d}`);
    if (draftEntry.length > 6) console.log(`      … and ${draftEntry.length - 6} more`);
  }
  if (missing.length > 0) { await prisma.$disconnect(); process.exit(1); }
  console.log('\n  Every served headword has a tier authored. The rule lands where it was written for.');
  await prisma.$disconnect();
}

main();
