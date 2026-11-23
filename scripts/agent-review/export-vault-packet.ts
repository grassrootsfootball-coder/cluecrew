/**
 * VAULT PACKET for the headword-tiers task (R1045). Reads the store; writes
 * `content/agent-review/vault/packet.json`:
 *   · `missing` — every headword on a LIVE tier-bearing item with NO Word row, with each item's prompt, key and options;
 *   · `drafts`  — every headword on such an item whose Word row is DRAFT, the card in full plus its items;
 *   · `exemplars` — LIVE vault cards at tiers 1-3, the calibration the drafter tiers against.
 * Population is required, never assumed (R60, R173).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tierRequirementApplies } from '../../packages/core/src/index';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

async function main() {
  const words = await prisma.word.findMany({ orderBy: { id: 'asc' } });
  const vault = new Map(words.map((w) => [w.headword.toLowerCase(), w]));
  const items = await prisma.item.findMany({ where: { status: 'LIVE' }, include: { options: { orderBy: { id: 'asc' } } }, orderBy: { id: 'asc' } });
  const missing = new Map<string, unknown[]>();
  const drafts = new Map<string, unknown[]>();
  for (const it of items) {
    const ws = (it.stem as { words?: unknown }).words;
    if (!Array.isArray(ws) || !tierRequirementApplies(it.questionTypeId)) continue;
    for (const raw of ws) {
      const w = String(raw).toLowerCase();
      const e = vault.get(w);
      if (e?.status === 'LIVE') continue;
      const row = { itemId: it.id, questionType: it.questionTypeId, itemTier: it.difficultyTier, prompt: (it.stem as { prompt?: string }).prompt,
        key: it.options.filter((o) => o.isCorrect).map((o) => (o.content as { value?: string }).value),
        options: it.options.map((o) => (o.content as { value?: string }).value) };
      const m = e ? drafts : missing;
      m.set(w, [...(m.get(w) ?? []), row]);
    }
  }
  requirePopulation('vault packet', { 'headwords missing or draft': missing.size + drafts.size });
  const card = (w: (typeof words)[number]) => ({ headword: w.headword, tier: w.tier, wordClass: w.wordClass, definitionChild: w.definitionChild, sentence: w.sentence,
    twoMeanings: w.twoMeanings, senseB: w.twoMeanings ? { definition: w.senseBDefinition, sentence: w.senseBSentence, wordClass: w.senseBWordClass } : null,
    likelierKnown: w.likelierKnown, likelierKnownNote: w.likelierKnownNote, authoredBy: w.authoredBy, preReviewVerdict: w.preReviewVerdict, reviewNotes: w.reviewNotes, supersedeNote: w.supersedeNote });
  const exemplars = words.filter((w) => w.status === 'LIVE' && w.tier <= 3).map(card);
  const packet = {
    task: 'R1045 headword tiers',
    missing: [...missing].map(([headword, liveItems]) => ({ headword, liveItems })),
    drafts: [...drafts].map(([headword, liveItems]) => ({ card: card(vault.get(headword)!), liveItems })),
    exemplars,
  };
  writeFileSync(join(__dirname, '..', '..', 'content', 'agent-review', 'vault', 'packet.json'), JSON.stringify(packet, null, 2) + '\n');
  console.log(`vault packet: ${packet.missing.length} missing headwords, ${packet.drafts.length} draft cards, ${exemplars.length} LIVE exemplars (tiers 1-3)`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
