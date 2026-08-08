/**
 * ALL THIRTEEN SPaG FAMILIES, IN BOTH UNITS — `pnpm export:spag-depth`
 *
 * Annie is restating every signed depth note in ITEMS rather than SENTENCES, so she needs both
 * figures side by side rather than a claim about their relationship.
 *
 * The two are different things and the notes never said which they meant:
 *
 *   BANK SENTENCES — how many authored sentences the family draws from. This is what the signed
 *   notes count, because it is what a reviewer counts when reading a bank.
 *
 *   GENERABLE ITEMS — how many distinct items the generator can actually emit, measured by
 *   generating to exhaustion. This is what a child meets, and it is what "exhausts the family in
 *   one sitting" has to mean.
 *
 * They diverge because an N-keyed family yields two distinct items per sentence — the error form
 * and the no-mistake form — and because a sentence is only usable at the rung it was written for.
 * Neither figure is wrong; the notes simply carry no units, which is why nothing could reconcile
 * them and why measuring settles it.
 *
 * Every figure here is measured, not asserted. The bank counts come from the banks; the item counts
 * come from running the generator.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  SPAG_FAMILIES,
  HOMOPHONE_BANK,
  DOUBLE_BANK,
  SUFFIX_BANK,
  SILENT_BANK,
  CONTRACTION_BANK,
  POSSESSIVE_BANK,
  COMMA_BANK,
  TERMINAL_BANK,
  SPEECH_BANK,
} from '../packages/core/src/english/spag-families';
import { familyDepth, spagFamilyTiers } from '../packages/core/src/english/spag-fingerprint';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';
import { prisma as defaultPrisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY_FILE = 'spag-depth-both-figures';

/** Bank sizes, from the banks themselves. Cloze families draw from per-family banks inside the
 *  module and expose no export, so their sentence count IS their item count — they are not
 *  N-keyed and each sentence yields one item. That is stated per row rather than inferred. */
const BANKS: Record<string, number> = {
  'spag-spell-homophone-by-sound': HOMOPHONE_BANK.length,
  'spag-spell-double-consonant-boundary': DOUBLE_BANK.length,
  'spag-spell-unstressed-suffix-vowel': SUFFIX_BANK.length,
  'spag-spell-silent-letter-dropped': SILENT_BANK.length,
  'spag-punct-apostrophe-contraction': CONTRACTION_BANK.length,
  'spag-punct-apostrophe-possessive': POSSESSIVE_BANK.length,
  'spag-punct-comma-needs': COMMA_BANK.length,
  'spag-punct-terminal-boundary': TERMINAL_BANK.length,
  'spag-punct-speech': SPEECH_BANK.length,
};

function statedDepth(note: string): string {
  const m = note.match(/DEPTH:\s*([^.]*)\./i);
  return m ? m[1]!.trim() : '(the signature states no depth figure)';
}

async function main(): Promise<void> {
  const prisma = defaultPrisma;
  const events = await prisma.attributionEvent.findMany({
    where: { action: 'SIGNED', recordType: { contains: 'template-family' } },
  });
  const sig = new Map(events.map((e) => [e.recordId, e]));

  const rows = SPAG_FAMILIES.map((f) => {
    const depth = familyDepth(f);
    const bank = BANKS[f.id] ?? null;
    const ev = sig.get(f.id);
    return {
      id: f.id,
      subtype: f.subtype,
      tiers: spagFamilyTiers(f).map((t) => `T${t}`),
      bankSentences: bank,
      generableItems: depth.total,
      itemsPerTier: depth.perTier,
      ratio: bank ? Number((depth.total / bank).toFixed(2)) : null,
      signedNoteDepth: statedDepth(String(ev?.note ?? '')),
      nKeyed: bank !== null && depth.total > bank,
    };
  });

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(rows, generatedAt, 'mixed', 'every SPaG family in both units — bank sentences and generable items — beside the figure its signature states');

  const table = rows
    .map(
      (r) =>
        `| \`${r.id}\` | ${r.tiers.join(',')} | ${r.bankSentences ?? '—'} | **${r.generableItems}** | ${r.ratio ?? '—'} | ${JSON.stringify(r.itemsPerTier)} |`,
    )
    .join('\n');

  const notes = rows
    .map((r) => `**\`${r.id}\`** — signature says: *${r.signedNoteDepth}*\n  · bank ${r.bankSentences ?? 'n/a'} sentences · **${r.generableItems} generable items** · per tier ${JSON.stringify(r.itemsPerTier)}\n`)
    .join('\n');

  const md =
    `# SPaG families — both figures\n\n${stampHeader(stamp, 'md')}\n\n` +
    `All thirteen families, with bank sentences and generable items side by side. Every number is\n` +
    `measured: the bank counts from the banks, the item counts by running the generator to\n` +
    `exhaustion.\n\n` +
    `**Why the two differ.** An N-keyed family yields two distinct items per sentence — the error\n` +
    `form and the no-mistake form — so its item count runs to roughly twice its bank. A family with\n` +
    `no N option yields one item per sentence and the two figures agree. Neither is wrong; the signed\n` +
    `notes simply carry no units, which is why nothing could reconcile them.\n\n` +
    `The four cloze families draw from per-family banks with no separate export, and are not N-keyed:\n` +
    `for them the item count IS the sentence count, which is why their signed notes already say\n` +
    `"items".\n\n` +
    `| family | tiers | bank sentences | generable items | items per sentence | per tier |\n` +
    `|---|---|---:|---:|---:|---|\n${table}\n\n` +
    `**Totals: ${rows.reduce((s, r) => s + (r.bankSentences ?? 0), 0)} authored sentences across the nine banked families → ` +
    `${rows.reduce((s, r) => s + r.generableItems, 0)} generable items across all thirteen.**\n\n` +
    `## Each family beside the figure its signature states\n\n${notes}\n` +
    `## One caution on the item figure\n\n` +
    `A generable item is not automatically a SERVABLE one. These counts are what the generator can\n` +
    `emit distinctly; they do not model the diversity and matched-pair caps that \`generateSpagSample\`\n` +
    `applies when it builds an actual sample, nor the same-session constraints still without an owner\n` +
    `(R19). Read them as a ceiling on depth, not a promise of it.\n`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY_FILE, stamp.sourceHash, '').replace(/\.$/, '');
  const mdPath = join(OUT_DIR, `${base}.md`);
  const jsonPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(mdPath, md);
  writeFileSync(jsonPath, JSON.stringify({ kind: FAMILY_FILE, ...stamp, rows }, null, 2));
  for (const p of [mdPath, jsonPath]) deliver(p, FAMILY_FILE);
  console.log(`${rows.length} families · ${rows.reduce((s, r) => s + (r.bankSentences ?? 0), 0)} bank sentences · ${rows.reduce((s, r) => s + r.generableItems, 0)} generable items`);
  await prisma.$disconnect();
}

void main();
