/**
 * vr-21's TWENTY-FIVE PAIRS, STAGED FOR A COMPARISON READ — as a model, not a backlog entry.
 *
 * **THE SIGNAL: vr-21 is missing 18 of 25 keys where vr-04 misses 55 of 56 and vr-16 24 of 25.**
 * Its keys are commoner words that already happen to be in the vault. **vr-04's actual fault is
 * keys RARER than their headwords**, so a bank whose keys are already common may be selecting them
 * by a rule worth copying rather than simply being further behind.
 *
 * **ONE SITTING, BEFORE 95 WORDS ARE AUTHORED.** If vr-21's selection is the model, it changes how
 * the other 95 are chosen and the reading pays for itself many times over. If it is coincidence —
 * an easier word list rather than a better rule — that is worth knowing before anyone builds a
 * theory on it.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'vr21-comparison-read';

async function main() {
  const words = await prisma.word.findMany({ select: { headword: true, tier: true, status: true } });
  const vault = new Map(words.map((w) => [w.headword.toLowerCase(), w]));
  const items = await prisma.item.findMany({
    where: { questionTypeId: 'vr-21-same-meaning' }, include: { options: true }, orderBy: { id: 'asc' },
  });
  requirePopulation('vr-21 comparison', { 'vr-21 items': items.length, 'vault rows': vault.size });

  const pairs = items.map((item) => {
    const stem = String((((item.stem as { words?: unknown[] }).words ?? [])[0] ?? ''));
    const key = String(((item.options.find((o) => o.isCorrect)?.content ?? {}) as { value?: string }).value ?? '');
    const vs = vault.get(stem.toLowerCase());
    const vk = vault.get(key.toLowerCase());
    return {
      itemId: item.id, status: item.status, stem, key,
      stemTier: vs?.tier ?? null, stemInVault: Boolean(vs),
      keyTier: vk?.tier ?? null, keyInVault: Boolean(vk),
      tierDelta: vs && vk ? vk.tier - vs.tier : null,
      distractors: item.options.filter((o) => !o.isCorrect)
        .map((o) => String((o.content as { value?: string }).value ?? '')),
    };
  });

  const keysInVault = pairs.filter((p) => p.keyInVault).length;
  const measurable = pairs.filter((p) => p.tierDelta !== null);
  const payload = {
    what: "vr-21-same-meaning's 25 stem/key pairs, staged for a comparison read against vr-04.",
    whyThisIsAModelQuestion:
      'vr-21 is missing 18 of 25 keys; vr-04 misses 55 of 56 and vr-16 24 of 25. Its keys are commoner words already in the vault — and vr-04\'s fault is keys RARER than their headwords. So its selection may be the rule worth copying rather than the bank furthest behind.',
    theQuestionForHer:
      'Is vr-21 choosing keys by a better rule, or does it simply run over an easier word list? One is a model for the other 95; the other is a coincidence someone would otherwise build a theory on.',
    denominators: {
      pairs: pairs.length,
      keysAlreadyInTheVault: keysInVault,
      keysMissing: pairs.length - keysInVault,
      pairsMeasurableNow: measurable.length,
      comparison: 'vr-04: 1 of 40 pairs measurable. vr-16: 1 of 25 keys in the vault.',
    },
    pairs,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    "vr-21's 25 stem/key pairs with vault coverage and tier deltas, for a comparison read", ['pairs']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\nvr-21 pairs ${pairs.length} · keys already in the vault ${keysInVault} · measurable now ${measurable.length}`);
  for (const p of measurable.slice(0, 8)) console.log(`    ${p.stem}(t${p.stemTier}) -> ${p.key}(t${p.keyTier})  delta ${p.tierDelta}`);
  await prisma.$disconnect();
}

main();
