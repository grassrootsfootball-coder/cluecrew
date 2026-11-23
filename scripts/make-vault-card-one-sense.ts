/**
 * MAKE A VAULT CARD ONE-SENSE (R1057). Setting `twoMeanings` false is FAMILY COMPOSITION (CLAUDE.md):
 * a two-sense card is a seed for the vocabulary-in-context family (`isTwoSenseSeed`), and its
 * `likelierKnown` drives that family's sense flip. So, before any write, this:
 *   · requires a ruling (`--ruling`) and a card that is two-sense now;
 *   · runs the vault-guard audit (`VOCAB_GUARD_OK`, via `guardAudit`) and refuses if any VOCAB_BANK
 *     guard outcome or likelierKnown would move;
 *   · prints the two-sense seed count before and after.
 * The removed sense (definition, sentence, word class, likelierKnown and its note, the image prompt)
 * is appended VERBATIM to `supersedeNote`, so the card's history keeps it. Sense A is untouched.
 * One AMENDED event (actor `ruling:david`).
 *
 *   tsx scripts/make-vault-card-one-sense.ts <wordId> --ruling="<words>" [--apply]
 */
import { isTwoSenseSeed } from '../packages/core/src/english/vocab-in-context';
import { prisma } from '../packages/db/src/index';
import { exportContentSnapshot } from './content-snapshot';
import { guardAudit, readVault } from './agent-review/vault-guard-audit';

const ID = process.argv[2];
const RULING = process.argv.find((a) => a.startsWith('--ruling='))?.slice(9);
const APPLY = process.argv.includes('--apply');
const RECORDED_BY = 'human:dbamgbade@gmail.com';

async function main() {
  if (!ID || ID.startsWith('--')) throw new Error('pass a word id');
  if (!RULING?.trim()) throw new Error('pass --ruling="<the words that decided this>"');
  const w = await prisma.word.findUniqueOrThrow({ where: { id: ID } });
  const faults: string[] = [];
  if (!w.twoMeanings) faults.push('card is already one-sense');

  const before = await readVault();
  const after = new Map(before);
  after.set(w.headword.toLowerCase(), { ...before.get(w.headword.toLowerCase())!, likelierKnown: null });
  const g = guardAudit(before, after).find((r) => r.headword === w.headword.toLowerCase());
  if (g && (g.guardBefore !== g.guardAfter || g.before?.likelierKnown !== g.after?.likelierKnown)) faults.push(`VOCAB_BANK headword: likelierKnown/guard would move (${g.before?.likelierKnown} → ${g.after?.likelierKnown}) — the bank's flip reads it`);
  const all = await prisma.word.findMany({ select: { headword: true, tier: true, definitionChild: true, senseBDefinition: true } });
  const seeds = all.filter((c) => isTwoSenseSeed(c)).length;
  console.log(`one-sense ${ID} — ${APPLY ? 'APPLY' : 'DRY RUN'}: ${g ? `VOCAB_BANK card (bank rarity ${g.bankRarity})` : 'not a VOCAB_BANK headword'}; two-sense seeds ${seeds} → ${seeds - (isTwoSenseSeed(w) ? 1 : 0)}`);
  console.log(`  removing sense B: "${w.senseBDefinition}" / "${w.senseBSentence}" (${w.senseBWordClass}); likelierKnown ${w.likelierKnown}`);
  for (const f of faults) console.log(`  ✗ ${f}`);
  if (faults.length) throw new Error('refused before any write');
  if (!APPLY) return;
  const removed = { senseBDefinition: w.senseBDefinition, senseBSentence: w.senseBSentence, senseBWordClass: w.senseBWordClass, likelierKnown: w.likelierKnown, likelierKnownNote: w.likelierKnownNote, imagePromptB: w.imagePromptB };
  const history = `Made one-sense ${new Date().toISOString().slice(0, 10)} (R1057) on: "${RULING}". Removed sense: ${JSON.stringify(removed)}.`;
  await prisma.$transaction(async (tx) => {
    await tx.word.update({ where: { id: ID }, data: {
      twoMeanings: false, senseBDefinition: null, senseBSentence: null, senseBWordClass: null,
      likelierKnown: null, likelierKnownNote: null, imagePromptB: null,
      supersedeNote: w.supersedeNote ? `${w.supersedeNote} | ${history}` : history } });
    await tx.attributionEvent.create({ data: { recordType: 'word', recordId: ID, action: 'AMENDED', actor: 'ruling:david', recordedBy: RECORDED_BY, field: 'twoMeanings/senseB/likelierKnown', method: 'one-sense under R1057; removed sense kept verbatim in supersedeNote', note: history } });
  });
  console.log(`  ${ID}: now one-sense`);
}
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); }).catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
