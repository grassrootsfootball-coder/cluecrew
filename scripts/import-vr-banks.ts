/**
 * Re-authored VR vocabulary banks — `pnpm import:vr-banks <dir>`
 *
 * vr-04 (synonyms, 40), vr-06 (missing-word, 40), vr-02 (odd-ones-out, 25),
 * each bound to Word-Vault tiers. These REPLACE the procedurally-generated
 * items for those three types (generate-content skips them now), so the old
 * gen-* items are removed and the bank items land in their place, DRAFT.
 *
 * The stored difficultyTier is the bank's DECLARED (vault-bound) tier — the
 * authoritative one per David's note. Alongside, the generator's own
 * `vocabTier` derivation is computed and compared: if it does not reproduce the
 * declared distribution, that is the finding the reviewer asked for, reported
 * at the end rather than silently reconciled.
 *
 * Nothing publishes. Gate failures are reported; the items are DRAFT regardless.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkChildFacingText, isBlocking, type ContentFailure } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { vocabTier, vocabTierOfSet } from '../packages/db/prisma/difficulty';

const PROVENANCE = 'ai-draft:cowork-vocab-banks';

const BANKS: Array<{ file: string; questionTypeId: string }> = [
  { file: 'vr04-bank.json', questionTypeId: 'vr-04-closest-meaning' },
  { file: 'vr06-bank.json', questionTypeId: 'vr-06-missing-word' },
  { file: 'vr02-bank.json', questionTypeId: 'vr-02-two-odd-ones-out' },
];

interface BankOption { value: unknown; isKey?: boolean; misconceptionId?: string }
interface BankItem { tier: number; target?: string; prompt?: string; stem?: Record<string, unknown>; frame?: string; options: BankOption[] }

const DRY = process.argv.includes('--dry-run');

async function main(): Promise<void> {
  const dir = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? '/Users/davidb/Downloads/11+/items/vr-banks';
  const gateFailures: ContentFailure[] = [];

  for (const { file, questionTypeId } of BANKS) {
    const bank = JSON.parse(readFileSync(join(dir, file), 'utf8')) as { items: BankItem[]; tierDistribution: Record<string, number> };
    const declared: Record<number, number> = {};
    const derived: Record<number, number> = {};
    let agree = 0;
    const disagreements: string[] = [];

    // Referenced misconceptions must exist (FK).
    const refIds = [...new Set(bank.items.flatMap((it) => it.options.map((o) => o.misconceptionId).filter(Boolean)))] as string[];
    const present = new Set((await prisma.misconception.findMany({ where: { id: { in: refIds } }, select: { id: true } })).map((m) => m.id));
    const missing = refIds.filter((id) => !present.has(id));
    if (missing.length) console.log(`  ! ${questionTypeId}: missing misconceptions ${missing.join(', ')} — options will drop the tag`);

    if (!DRY) {
      const old = await prisma.item.findMany({ where: { questionTypeId }, select: { id: true } });
      await prisma.itemOption.deleteMany({ where: { itemId: { in: old.map((o) => o.id) } } });
      await prisma.item.deleteMany({ where: { questionTypeId } });
    }

    const asText = (v: unknown): string => (Array.isArray(v) ? v.join(' ') : String(v ?? ''));
    for (const [i, it] of bank.items.entries()) {
      const id = `bank-${questionTypeId}-${String(i + 1).padStart(2, '0')}`;
      const stem = it.stem ?? { prompt: it.prompt, words: it.target ? [it.target] : undefined };
      // Derive the generator's tier from vocabulary, to compare with declared.
      const words: string[] = it.target
        ? [it.target]
        : Array.isArray((stem as { words?: unknown }).words)
          ? (stem as { words: string[] }).words
          : [];
      const derivedTier = words.length ? vocabTierOfSet(words) : vocabTier(String(it.target ?? ''));
      declared[it.tier] = (declared[it.tier] ?? 0) + 1;
      derived[derivedTier] = (derived[derivedTier] ?? 0) + 1;
      if (derivedTier === it.tier) agree += 1;
      else if (disagreements.length < 4) disagreements.push(`${words.join('/') || it.target}: declared T${it.tier}, derived T${derivedTier}`);

      gateFailures.push(...checkChildFacingText({ role: 'item-stem', label: `${id} stem`, text: String((stem as { prompt?: string }).prompt ?? '') }).filter(isBlocking));
      for (const o of it.options) {
        gateFailures.push(...checkChildFacingText({ role: 'item-option', label: `${id} option`, text: asText(o.value) }).filter(isBlocking));
      }

      if (!DRY) {
        await prisma.item.create({
          data: {
            id,
            questionTypeId,
            difficultyTier: it.tier,
            stem: stem as object,
            explanation: {},
            status: 'DRAFT',
            authoredBy: PROVENANCE,
            options: {
              create: it.options.map((o) => ({
                content: { value: o.value },
                isCorrect: Boolean(o.isKey),
                misconceptionId: o.misconceptionId && present.has(o.misconceptionId) ? o.misconceptionId : null,
              })),
            },
          },
        });
      }
    }

    const dist = (d: Record<number, number>) => [1, 2, 3, 4, 5].map((t) => `${t}:${d[t] ?? 0}`).join(' ');
    console.log(`\n${questionTypeId} (${bank.items.length} items)`);
    console.log(`  declared tiers: ${dist(declared)}`);
    console.log(`  derived tiers : ${dist(derived)}  — generator vocabTier reproduces declared on ${agree}/${bank.items.length}`);
    for (const d of disagreements) console.log(`     e.g. ${d}`);
  }

  if (gateFailures.length) {
    const byRule = gateFailures.reduce<Record<string, number>>((a, f) => { a[f.rule] = (a[f.rule] ?? 0) + 1; return a; }, {});
    console.log(`\nGATE FAILURES (${gateFailures.length}) — ` + Object.entries(byRule).map(([r, n]) => `${r}: ${n}`).join(', '));
    for (const f of gateFailures.slice(0, 12)) console.log(`  ✗ ${f.where}: ${f.detail}`);
  } else {
    console.log('\nAll imported strings pass the child-facing gates.');
  }
  await prisma.$disconnect();
}

void main();
