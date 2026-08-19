/**
 * ALL FORTY vr-04 PAIRS, WITH THEIR RANKS WHERE RANKS EXIST — per her condition that all forty come
 * to her before any threshold does.
 *
 * **THE UNMEASURABLE ARE NAMED, NOT ABSENT.** A file of the measurable ones would read as a
 * complete measurement of a small set, when it is a fragment of a large one. Every pair appears;
 * the ones with no signal say so and say why.
 *
 * **AND THE COUNT DAVID AND I BOTH CARRIED WAS WRONG.** Publishing the fifteen DRAFT vault rows
 * makes **ONE** pair measurable, not fifteen. **The vault covers STEMS and not KEYS**: all 40 stems
 * have entries, and of the 40 keys exactly one does — `brave`, which is itself another item's stem.
 * No number of stem publications fixes that, and the shape of the gap is the finding.
 *
 * **NO THRESHOLD IS SET AND NONE IS DEFAULTED.** She sets it after seeing the distribution. A
 * default here would be an opinion wearing a parameter's clothes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { FREQUENCY_SIGNAL_LIMIT } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'vr04-forty-ranks';

async function main() {
  const bank = await prisma.item.findMany({
    where: { questionTypeId: 'vr-04-closest-meaning', id: { startsWith: 'bank-' } },
    include: { options: true }, orderBy: { id: 'asc' },
  });
  const words = await prisma.word.findMany();
  const vault = new Map(words.map((w) => [w.headword.toLowerCase(), w]));
  requirePopulation('vr-04 forty ranks', { 'bank items': bank.length, 'vault entries': vault.size });

  const pairs = bank.map((item) => {
    const stem = String((((item.stem as { words?: unknown[] }).words ?? [])[0] ?? ''));
    const key = String(((item.options.find((o) => o.isCorrect)?.content ?? {}) as { value?: string }).value ?? '');
    const vs = vault.get(stem.toLowerCase());
    const vk = vault.get(key.toLowerCase());
    const measurable = Boolean(vs && vk);
    return {
      itemId: item.id,
      stem,
      key,
      stemTier: vs?.tier ?? null,
      stemVaultStatus: vs?.status ?? 'NO VAULT ENTRY',
      keyTier: vk?.tier ?? null,
      keyVaultStatus: vk?.status ?? 'NO VAULT ENTRY',
      // Positive means the KEY is the rarer word — the direction of her first fault.
      tierDelta: measurable ? (vk!.tier - vs!.tier) : null,
      state: measurable
        ? (vk!.tier > vs!.tier ? 'KEY RARER THAN HEADWORD' : vk!.tier < vs!.tier ? 'key commoner — correct direction' : 'same tier')
        : 'UNMEASURABLE — no vault entry for the key',
      stemIsTwoMeanings: vs?.twoMeanings ?? null,
    };
  });

  const measurable = pairs.filter((p) => p.tierDelta !== null);
  const payload = {
    what: 'All forty vr-04 bank pairs, with tier ranks where both sides have a vault entry.',
    herCondition: 'All forty come to her before any threshold does. The threshold comes back with them.',
    noThresholdIsSet: 'None, and none defaulted. A default would be an opinion wearing a parameter\'s clothes.',
    theLimit: FREQUENCY_SIGNAL_LIMIT,
    signalUsed: 'The Word vault tier (1-5), which is OUR judgement of difficulty and not an independent frequency measure. SUBTLEX-UK is not installed; its licence is UNESTABLISHED.',
    correction: {
      claimed: 'Publishing the fifteen DRAFT vault rows makes fifteen pairs measurable.',
      measured: `It makes ONE. The vault covers STEMS and not KEYS: all 40 stems have entries and exactly one key does (brave, itself another item's stem). ${39} keys need entries before the pairs can be ranked.`,
    },
    denominators: {
      pairs: pairs.length,
      measurableNow: measurable.length,
      unmeasurable: pairs.length - measurable.length,
      keysNeedingAVaultEntry: pairs.filter((p) => p.keyVaultStatus === 'NO VAULT ENTRY').length,
    },
    pairs,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'all forty vr-04 stem/key pairs with vault tiers where both sides exist, unmeasurable ones named', ['pairs']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\npairs: ${pairs.length} · measurable now: ${measurable.length} · unmeasurable: ${pairs.length - measurable.length}`);
  for (const p of measurable) console.log(`    ${p.stem}(t${p.stemTier}) -> ${p.key}(t${p.keyTier})  delta ${p.tierDelta} — ${p.state}`);
  console.log(`  keys with no vault entry: ${payload.denominators.keysNeedingAVaultEntry}`);
  await prisma.$disconnect();
}

main();
