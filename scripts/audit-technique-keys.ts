/**
 * TECHNIQUE-KEY AUDIT — `pnpm audit:technique-keys`
 *
 * R49's field, on the content side. `stem.techniqueKey` is required on every whole-text-purpose T4
 * comprehension item, and nothing currently checks it exists. This does two jobs:
 *
 *   1. PRESENCE. A whole-text-purpose candidate is derived, not asserted (the same discipline as
 *      R31): an item is one iff `difficultyTier === 4` and it carries no `lineRefs` — that is
 *      exactly `T4-PURPOSE-BOUNDING-RULE.md`'s own definition ("no line reference, a pattern
 *      recurring at three or more places"). No new "shape" field was added to encode this
 *      redundantly. Same SERVING/DRAFT split as `check-db-content.ts`: a LIVE item missing the key
 *      is a live gap in what `composeMockPaper` can protect against, and fails the build; a DRAFT
 *      item is a queue entry, reported with a count.
 *
 *   2. THE REGISTRY. Lists every distinct `techniqueKey` currently in use. There is deliberately no
 *      fixed enum — only 3 of the census's 9–10 distinct techniques are named so far
 *      (`AUTHORING-BRIEF-ADDENDUM-19.md`), so a closed list would reject genuine new devices as
 *      they're authored. This is a REPORT for a human to eyeball for near-duplicate spellings of
 *      the same device (e.g. `character-blind-spot` vs `reader-sees-what-character-cant`) — the
 *      machine checks presence and format, the reviewer checks whether two keys mean the same
 *      thing, same division as R21's tag-scope finding.
 */
import { techniqueKeyOf } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

async function main(): Promise<void> {
  // SCOPE BUG FOUND BY RUNNING THIS, NOT BY INSPECTION: the first version filtered on
  // `difficultyTier === 4` alone and caught 81 items, nearly all of them VR (`gen-vr-09-letter-
  // series-08`, `bank-vr-04-closest-meaning-32`...). `lineRefs` is an ENGLISH-only stem field, so
  // "T4 with no lineRefs" was true of every T4 item in every OTHER district too — they have no
  // lineRefs field at all, not because they're whole-text-purpose. The derivation needs district
  // scope BEFORE the lineRefs test, not instead of it — same shape of mistake as M-column's first
  // recompute (R41): a plausible-looking property check that wasn't actually checking the property.
  const items = await prisma.item.findMany({
    where: { difficultyTier: 4, questionTypeId: { startsWith: 'en-comp-' } },
    select: { id: true, status: true, stem: true },
  });

  const candidates = items.filter((item) => {
    const stem = item.stem as { lineRefs?: unknown } | null;
    return !stem?.lineRefs || (Array.isArray(stem.lineRefs) && stem.lineRefs.length === 0);
  });

  const missing = candidates.filter((item) => !techniqueKeyOf(item.stem));
  const servingMissing = missing.filter((item) => item.status === 'LIVE');
  const draftMissing = missing.filter((item) => item.status !== 'LIVE');

  const badFormat = candidates
    .map((item) => ({ id: item.id, key: techniqueKeyOf(item.stem) }))
    .filter((row): row is { id: string; key: string } => Boolean(row.key) && !SLUG.test(row.key));

  const registry = new Map<string, string[]>();
  for (const item of candidates) {
    const key = techniqueKeyOf(item.stem);
    if (!key) continue;
    (registry.get(key) ?? registry.set(key, []).get(key)!).push(item.id);
  }

  console.log(`${candidates.length} whole-text-purpose T4 candidates (T4, no lineRefs)`);
  console.log(`${missing.length} missing techniqueKey — ${servingMissing.length} SERVING, ${draftMissing.length} DRAFT`);
  if (servingMissing.length) console.log('  SERVING, missing:', servingMissing.map((i) => i.id).join(', '));
  if (draftMissing.length) console.log('  DRAFT backlog:', draftMissing.map((i) => i.id).join(', '));
  if (badFormat.length) console.log(`${badFormat.length} declared but not kebab-case:`, badFormat);

  console.log(`\nRegistry — ${registry.size} distinct technique(s) in use:`);
  for (const [key, ids] of [...registry].sort()) console.log(`  ${key} (${ids.length}): ${ids.join(', ')}`);
  console.log('\nEyeball the registry for near-duplicates before authoring a new key — this list is not deduplicated.');

  await prisma.$disconnect();
  if (servingMissing.length > 0) {
    console.log('\nFAILING: a LIVE whole-text-purpose T4 item has no techniqueKey — composeMockPaper cannot protect against a technique repeat for it.');
    process.exit(1);
  }
}

void main();
