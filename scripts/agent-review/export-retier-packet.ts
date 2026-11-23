/**
 * ITEM RE-TIER PACKET (R1054). One LIVE item whose tier a ratified vault-tier change moves, for an
 * independent reviewer: the item as served, its option tags with their childHint, the tier the
 * generator derives before and after (via the generator's own `vocabTierOfSet`/`vocabTier`, never a
 * re-derivation), the vr-04 rule text that bears on tier, the ratification, and every LIVE vr-04 item
 * at the tiers in question as calibration. Reads the store (R60, R173).
 *
 *   tsx scripts/agent-review/export-retier-packet.ts <itemId> <headword> <fromVault> <toVault>
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { vocabTierOfSet } from '../../packages/core/src/index';
import { isCommon, vocabTier } from '../../packages/db/prisma/difficulty';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const [ITEM, HEAD, FROM, TO] = process.argv.slice(2);
const canon = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x));
async function main() {
  if (!ITEM || !HEAD || !FROM || !TO) throw new Error('usage: <itemId> <headword> <fromVault> <toVault>');
  const it = await prisma.item.findUniqueOrThrow({ where: { id: ITEM }, include: { options: { orderBy: { id: 'asc' }, include: { misconception: { select: { id: true, childHint: true } } } } } });
  const key = String((it.options.find((o) => o.isCorrect)?.content as { value?: string }).value);
  const k = { word: key, familiar: isCommon(key), vaultTier: vocabTier(key) };
  const derive = (t: number) => vocabTierOfSet([{ word: HEAD, familiar: isCommon(HEAD), vaultTier: t }, k]);
  const calib = await prisma.item.findMany({
    where: { status: 'LIVE', questionTypeId: 'vr-04-closest-meaning', difficultyTier: { in: [3, 4, 5] }, id: { not: ITEM } },
    include: { options: { orderBy: { id: 'asc' } } }, orderBy: [{ difficultyTier: 'asc' }, { id: 'asc' }],
  });
  requirePopulation('re-tier calibration', { 'LIVE vr-04 items at T3-T5': calib.length });
  const card = await prisma.word.findUniqueOrThrow({ where: { id: HEAD } });
  const servedHash = createHash('sha256').update(canon({ stem: it.stem, options: it.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), difficultyTier: it.difficultyTier })).digest('hex');
  const vr04 = readFileSync(join(__dirname, '..', '..', 'packages', 'core', 'src', 'vr', 'vr04.ts'), 'utf8').split('\n').slice(0, 24).join('\n');
  const packet = {
    task: 'R1054 item re-tier',
    item: { id: it.id, status: it.status, pool: it.pool, storedTier: it.difficultyTier, stem: it.stem, servedHash,
      options: it.options.map((o) => ({ value: (o.content as { value?: string }).value, isCorrect: o.isCorrect, tag: o.misconception?.id ?? null, tagChildHint: o.misconception?.childHint ?? null })) },
    derivation: { rule: 'item tier = vocabTierOfSet([headword, key]) (generate-content.ts closestMeaningTyped)', headword: HEAD, key, keyTier: vocabTier(key), withVaultFrom: { vault: Number(FROM), itemTier: derive(Number(FROM)) }, withVaultTo: { vault: Number(TO), itemTier: derive(Number(TO)) } },
    ratification: card.supersedeNote,
    card: { headword: card.headword, tier: card.tier, definitionChild: card.definitionChild, twoMeanings: card.twoMeanings, senseB: card.senseBDefinition },
    vr04RuleText: vr04,
    serving: 'BUILD-PHASE-3: item selection chooses LIVE items of the type at the difficultyTier matching the child\'s estimated level, stepping one tier at a time.',
    calibration: calib.map((c) => ({ id: c.id, tier: c.difficultyTier, words: (c.stem as { words?: string[] }).words, sentence: (c.stem as { sentence?: string }).sentence ?? null, options: c.options.map((o) => `${(o.content as { value?: string }).value}${o.isCorrect ? ' (key)' : ''}`) })),
  };
  const out = join(__dirname, '..', '..', 'content', 'agent-review', 'vault', `retier-${ITEM}-packet.json`);
  writeFileSync(out, JSON.stringify(packet, null, 2) + '\n');
  console.log(`re-tier packet ${ITEM}: stored T${it.difficultyTier}; derived T${packet.derivation.withVaultFrom.itemTier} → T${packet.derivation.withVaultTo.itemTier}; ${calib.length} calibration items; served hash ${servedHash.slice(0, 16)}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
