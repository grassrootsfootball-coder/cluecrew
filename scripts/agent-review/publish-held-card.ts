/**
 * PUBLISH ONE HELD VAULT CARD AS IT STANDS (R1059). For a DRAFT card whose holds have been resolved
 * by rulings rather than by a redraft, so its text is not new but has not been read in its current
 * form. Two steps, with an independent reviewer between them:
 *   --cut    writes `content/agent-review/vault/publish-<id>-packet.json`: the card in full, a hash
 *            of every field a child or the guard reads, its LIVE items, its history note, and LIVE
 *            exemplars at its tier;
 *   (rev-agent-01 writes `publish-<id>-review.json`: { reviewer, wordId, cardHash, verdict: PUBLISH|HOLD, reason })
 *   default  dry run; `--apply` publishes.
 * Refuses unless: the review is rev-agent-01's PUBLISH on this card hash, the row is still DRAFT and
 * hashes the same, it passes `gateCard` (`checkWordCard`), and the vault-guard audit shows no tier,
 * likelierKnown or guard move. It prints the card's warm-up position, and writes one APPROVED event.
 *
 *   tsx scripts/agent-review/publish-held-card.ts <wordId> --cut | [--apply]
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { exportContentSnapshot } from '../content-snapshot';
import { gateCard } from './gate-vault-cards';
import { printGuardAudit, readVault } from './vault-guard-audit';

const ID = process.argv[2];
const CUT = process.argv.includes('--cut');
const APPLY = process.argv.includes('--apply');
const AGENT = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const DIR = join(__dirname, '..', '..', 'content', 'agent-review', 'vault');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

type Row = NonNullable<Awaited<ReturnType<typeof prisma.word.findUnique>>>;
const servedFields = (w: Row) => ({ headword: w.headword, tier: w.tier, wordClass: w.wordClass, definitionChild: w.definitionChild, sentence: w.sentence,
  twoMeanings: w.twoMeanings, senseBDefinition: w.senseBDefinition, senseBSentence: w.senseBSentence, senseBWordClass: w.senseBWordClass,
  likelierKnown: w.likelierKnown, imagePrompt: w.imagePrompt, imagePromptB: w.imagePromptB });
const cardHash = (w: Row) => sha(JSON.stringify(servedFields(w)));

async function main() {
  if (!ID || ID.startsWith('--')) throw new Error('pass a word id');
  const w = await prisma.word.findUniqueOrThrow({ where: { id: ID } });
  if (CUT) {
    if (w.status !== 'DRAFT') throw new Error(`${ID} is ${w.status}, not DRAFT`);
    const items = await prisma.item.findMany({ where: { status: 'LIVE' }, select: { id: true, difficultyTier: true, stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true } } } });
    const carrying = items.filter((i) => ((i.stem as { words?: unknown[] }).words ?? []).map((x) => String(x).toLowerCase()).includes(w.headword.toLowerCase()));
    const exemplars = await prisma.word.findMany({ where: { status: 'LIVE', tier: w.tier }, select: { headword: true, definitionChild: true, sentence: true, twoMeanings: true }, orderBy: { id: 'asc' } });
    const packet = { task: 'R1059 publish a held card', wordId: ID, cardHash: cardHash(w), card: servedFields(w), history: w.supersedeNote, preReviewVerdict: w.preReviewVerdict,
      liveItems: carrying.map((i) => ({ id: i.id, tier: i.difficultyTier, stem: i.stem, options: i.options.map((o) => ({ value: (o.content as { value?: string }).value, isCorrect: o.isCorrect, tag: o.misconceptionId })) })),
      exemplarsAtTier: exemplars };
    writeFileSync(join(DIR, `publish-${ID}-packet.json`), JSON.stringify(packet, null, 2) + '\n');
    console.log(`packet publish-${ID}: card hash ${packet.cardHash.slice(0, 16)}; ${carrying.length} LIVE item(s); ${exemplars.length} LIVE exemplars at T${w.tier}`);
    return;
  }
  const revText = readFileSync(join(DIR, `publish-${ID}-review.json`), 'utf8');
  const rev = JSON.parse(revText) as { reviewer: string; wordId: string; cardHash: string; verdict: string; reason: string };
  const faults: string[] = [];
  if (rev.reviewer !== AGENT) faults.push(`review signed "${rev.reviewer}"`);
  if (rev.wordId !== ID) faults.push(`review is for ${rev.wordId}`);
  if (rev.verdict !== 'PUBLISH') faults.push(`verdict ${rev.verdict}${rev.reason ? `: ${rev.reason}` : ''}`);
  if (w.status !== 'DRAFT') faults.push(`row is ${w.status}`);
  if (rev.cardHash !== cardHash(w)) faults.push('the card is not the one that was reviewed');
  faults.push(...gateCard({ headword: w.headword.toLowerCase(), tier: w.tier, wordClass: w.wordClass ?? '', definitionChild: w.definitionChild, sentence: w.sentence, twoMeanings: w.twoMeanings,
    senseB: w.twoMeanings ? { definition: w.senseBDefinition ?? '', sentence: w.senseBSentence ?? '', wordClass: w.senseBWordClass ?? '' } : null,
    likelierKnown: (w.likelierKnown as 'A' | 'B' | null) ?? null, why: 'published as it stands' }));
  const before = await readVault();
  const after = new Map(before);
  after.set(w.headword.toLowerCase(), { ...before.get(w.headword.toLowerCase())!, status: 'LIVE' });
  const moves = await printGuardAudit(after, before);
  if (moves > 0) faults.push(`${moves} VOCAB_BANK tier/likelierKnown/guard move(s)`);
  const order = await prisma.word.findMany({ where: { OR: [{ status: 'LIVE' }, { id: ID }] }, orderBy: [{ tier: 'asc' }, { id: 'asc' }], select: { id: true } });
  console.log(`publish ${ID} — ${APPLY ? 'APPLY' : 'DRY RUN'}: warm-up position ${order.findIndex((o) => o.id === ID) + 1} of ${order.length}`);
  for (const f of faults) console.log(`  ✗ ${f}`);
  if (faults.length) throw new Error('refused before any write');
  if (!APPLY) return;
  const method = `HELD CARD PUBLISHED AS IT STANDS under R1059: reviewed in its current form by the machine reviewer ${AGENT} (card hash ${rev.cardHash.slice(0, 16)}, review sha256 ${sha(revText).slice(0, 16)}); gated by checkWordCard; vault-guard audit 0 moves. Not read by a person.`;
  await prisma.$transaction(async (tx) => {
    await tx.word.update({ where: { id: ID }, data: { status: 'LIVE', reviewedBy: `reviewer:${AGENT}`, reviewNotes: null } });
    await tx.attributionEvent.create({ data: { recordType: 'word', recordId: ID, action: 'APPROVED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'status', method, note: rev.reason } });
  });
  console.log(`  ${ID}: LIVE`);
}
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); }).catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
