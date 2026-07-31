/**
 * The similarity gate, batch form (ADDENDUM-E §3).
 *
 *   pnpm similarity:scan            CI mode: screen unpublished items, exit 1
 *                                   on any hard fail. Runs on /content changes
 *                                   after the item bank is generated.
 *   pnpm similarity:scan -- --retro Retro mode: the one-time pass over
 *                                   existing DRAFTs when the index first
 *                                   lands — writes SIMILARITY_REVIEW flags so
 *                                   the reviewer queue picks them up.
 *
 * Reads the index from SIMILARITY_INDEX_PATH (private storage, read-only —
 * never in this repo, §5). No index yet = a loud skip, exit 0: the gate has
 * not landed, and blocking all authoring on its absence would be wrong. A
 * CONFIGURED path that fails to load exits 1 — a broken gate must never look
 * like a passing one.
 *
 * Output names items BY ID ONLY. The index holds hashes, not text, so there
 * is no source text anywhere in this process to leak.
 */
import { readFileSync } from 'node:fs';
import {
  fingerprintItem,
  screenAgainstIndex,
  similarityIndexSchema,
} from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const RETRO = process.argv.includes('--retro');

async function main() {
  const path = process.env.SIMILARITY_INDEX_PATH;
  if (!path) {
    console.log('similarity-scan: no SIMILARITY_INDEX_PATH — the index has not landed; skipping (Addendum E §3).');
    return;
  }
  const index = similarityIndexSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
  console.log(`similarity-scan: index loaded (${index.fingerprints.length} source fingerprints).`);

  const items = await prisma.item.findMany({
    where: { status: { in: ['DRAFT', 'REVIEWED'] } },
    include: { options: { select: { content: true } } },
  });

  let fails = 0;
  let flagged = 0;
  for (const item of items) {
    const verdict = screenAgainstIndex(
      fingerprintItem({
        stem: item.stem,
        optionContents: item.options.map((option) => option.content),
      }),
      index,
    );
    if (verdict.kind === 'clear') continue;

    if (verdict.kind === 'fail') {
      fails += 1;
      console.error(
        `  ✗ HARD FAIL item ${item.id} (${item.questionTypeId}) score ${verdict.score} vs source ${verdict.matchedId}`,
      );
    } else {
      flagged += 1;
      console.warn(
        `  · review item ${item.id} (${item.questionTypeId}) score ${verdict.score} vs source ${verdict.matchedId}`,
      );
    }
    if (RETRO && !item.similarityClearedBy) {
      await prisma.item.update({
        where: { id: item.id },
        data: { similarityFlaggedAt: new Date(), similarityScore: verdict.score },
      });
    }
  }

  console.log(
    `similarity-scan: ${items.length} unpublished items screened — ${fails} hard fail(s), ${flagged} for review${RETRO ? ' (flags written)' : ''}.`,
  );
  if (fails > 0) {
    console.error('Hard fails must be triaged: exact/near-exact matches may not enter the bank (L4).');
    process.exit(1);
  }
}

void main().finally(() => prisma.$disconnect());
