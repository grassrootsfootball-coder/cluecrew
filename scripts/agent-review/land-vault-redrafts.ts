/**
 * VAULT REDRAFTS under the agent-review regime (R1047). For held DRAFT cards whose only faults were
 * WORDING. A drafting agent rewrites them in `content/agent-review/vault/cards-<batch>.json`, against
 * `redraft-<batch>-packet.json`. A SEPARATE agent attests or refuses each one in
 * `review-<batch>.json` → `cards`. An attested card has its text replaced and goes LIVE (the drafts
 * were real vocabulary held from publication only for these faults).
 *
 * A card is landed only if ALL hold, else the run refuses before any write:
 *   · ATTESTED by rev-agent-01;
 *   · its row is still DRAFT and its stored text is word-for-word the packet's `current`, so nobody
 *     changed it after the drafter read it;
 *   · tier, twoMeanings and likelierKnown are UNCHANGED from the packet's `fixed` (CLAUDE.md: those
 *     are family composition, and a redraft is not the place to move them);
 *   · it passes `gateCard` (`checkWordCard`, the CMS publish door's gate);
 *   · the vault-guard audit shows no VOCAB_BANK tier, likelierKnown or guard change.
 * The displaced text is appended verbatim to `supersedeNote` (the Word table's existing history
 * field), so a reader can see what a card said before. The warm-up position of each newly LIVE card
 * is printed.
 *
 *   tsx scripts/agent-review/land-vault-redrafts.ts --batch=V2 [--apply]
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { exportContentSnapshot } from '../content-snapshot';
import { gateCard, slug, type VaultCard } from './gate-vault-cards';
import { printGuardAudit, readVault } from './vault-guard-audit';

const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'vault');
const BATCH = process.argv.find((a) => a.startsWith('--batch='))?.slice(8);
const APPLY = process.argv.includes('--apply');
const AGENT = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

type PacketCard = {
  fixed: { headword: string; tier: number; twoMeanings: boolean; likelierKnown: string | null };
  current: { wordClass: string | null; definitionChild: string; sentence: string; senseB: { definition: string | null; sentence: string | null; wordClass: string | null } | null; likelierKnownNote: string | null; imagePrompt?: string | null };
};

async function main() {
  if (!BATCH) throw new Error('pass --batch=<name>');
  const packetText = readFileSync(pjoin(DIR, `redraft-${BATCH}-packet.json`), 'utf8');
  const cardsText = readFileSync(pjoin(DIR, `cards-${BATCH}.json`), 'utf8');
  const revText = readFileSync(pjoin(DIR, `review-${BATCH}.json`), 'utf8');
  const packet = (JSON.parse(packetText) as { cards: PacketCard[] }).cards;
  const cards = (JSON.parse(cardsText) as { cards: VaultCard[] }).cards;
  const rev = JSON.parse(revText) as { reviewer: string; cards: Array<{ headword: string; verdict: string; reason?: string }> };
  if (!packet?.length || !cards?.length) throw new Error(`${BATCH}: empty packet or cards — a failed read, not a clean run (R173)`);
  if (rev.reviewer !== AGENT) throw new Error(`review signed "${rev.reviewer}", expected ${AGENT}`);
  if (cards.length !== packet.length) throw new Error(`${cards.length} cards for ${packet.length} packet entries`);
  const verdict = new Map(rev.cards.map((v) => [v.headword, v]));

  const faults: string[] = [];
  const land: Array<{ id: string; card: VaultCard; was: PacketCard['current'] }> = [];
  for (const p of packet) {
    const h = p.fixed.headword;
    const c = cards.find((x) => x.headword === h);
    const f: string[] = [];
    if (!c) { faults.push(`${h}: no redrafted card`); continue; }
    const row = await prisma.word.findUnique({ where: { id: slug(h) } });
    if (!row) f.push('no Word row');
    else {
      if (row.status !== 'DRAFT') f.push(`status ${row.status}`);
      // A packet cut before R1059 carries no imagePrompt; then the stored prompt is not compared (and the card may not change it).
      const ip = (v: string | null | undefined) => (p.current.imagePrompt === undefined ? null : v ?? null);
      const stored = JSON.stringify([row.wordClass, row.definitionChild, row.sentence, row.twoMeanings ? [row.senseBDefinition, row.senseBSentence, row.senseBWordClass] : null, row.likelierKnownNote, ip(row.imagePrompt)]);
      const shown = JSON.stringify([p.current.wordClass, p.current.definitionChild, p.current.sentence, p.current.senseB ? [p.current.senseB.definition, p.current.senseB.sentence, p.current.senseB.wordClass] : null, p.current.likelierKnownNote, ip(p.current.imagePrompt)]);
      if (stored !== shown) f.push('stored text changed since the packet was cut');
      if (row.tier !== p.fixed.tier || row.twoMeanings !== p.fixed.twoMeanings || row.likelierKnown !== p.fixed.likelierKnown) f.push('stored tier/twoMeanings/likelierKnown changed since the packet was cut');
    }
    if (c.tier !== p.fixed.tier) f.push(`tier changed ${p.fixed.tier} → ${c.tier} (composition: needs a ruling)`);
    if (c.twoMeanings !== p.fixed.twoMeanings) f.push('twoMeanings changed (composition: needs a ruling)');
    if ((c.twoMeanings ? c.likelierKnown ?? null : null) !== p.fixed.likelierKnown) f.push('likelierKnown changed (composition: needs a ruling)');
    if (p.current.imagePrompt === undefined && c.imagePrompt !== undefined) f.push('imagePrompt given, but this packet does not carry the stored prompt to compare against');
    f.push(...gateCard(c));
    const v = verdict.get(h);
    if (v?.verdict !== 'ATTEST') f.push(`not attested (${v?.verdict ?? 'no verdict'}${v?.reason ? `: ${v.reason}` : ''})`);
    if (f.length) faults.push(`${h}: ${f.join('; ')}`);
    else land.push({ id: slug(h), card: c, was: p.current });
  }

  const before = await readVault();
  const ids = land.map((l) => l.id);
  const after = new Map([...before].map(([k, v]) => [k, ids.includes(slug(k)) ? { ...v, status: 'LIVE' } : v]));
  const guardMoves = await printGuardAudit(after, before);
  const order = await prisma.word.findMany({ where: { OR: [{ status: 'LIVE' }, { id: { in: ids } }] }, orderBy: [{ tier: 'asc' }, { id: 'asc' }], select: { id: true } });
  console.log(`  warm-up positions of the newly LIVE cards (of ${order.length}): ${ids.map((id) => `${id} ${order.findIndex((o) => o.id === id) + 1}`).join(', ')}`);
  console.log(`redrafts ${BATCH} — ${APPLY ? 'APPLY' : 'DRY RUN'}: ${land.length} land, ${faults.length} refused`);
  for (const f of faults) console.log(`  ✗ ${f}`);
  if (faults.length) throw new Error('refused before any write: every card in the batch must clear');
  if (guardMoves > 0) throw new Error(`${guardMoves} VOCAB_BANK headword(s) would move — refused before any write`);
  if (!APPLY) return;

  const method = `VAULT REDRAFT under R1047: wording-only redraft of a held card by an agent, ATTESTED by the machine reviewer ${AGENT}; packet sha256 ${sha(packetText).slice(0, 16)}, cards-${BATCH} sha256 ${sha(cardsText).slice(0, 16)}, review sha256 ${sha(revText).slice(0, 16)}; tier/twoMeanings/likelierKnown held fixed; gated by checkWordCard; vault-guard audit 0 moves. Not read by a person.`;
  const date = new Date().toISOString().slice(0, 10);
  await prisma.$transaction(async (tx) => {
    for (const { id, card: c, was } of land) {
      const row = await tx.word.findUniqueOrThrow({ where: { id } });
      const history = `Redrafted ${date} (R1047, wording only). Previous text: ${JSON.stringify(was)}.`;
      await tx.word.update({ where: { id }, data: {
        wordClass: c.wordClass, definitionChild: c.definitionChild, sentence: c.sentence,
        senseBDefinition: c.senseB?.definition ?? null, senseBSentence: c.senseB?.sentence ?? null, senseBWordClass: c.senseB?.wordClass ?? null,
        likelierKnownNote: c.twoMeanings ? c.likelierKnownNote ?? row.likelierKnownNote : null,
        ...(c.imagePrompt !== undefined ? { imagePrompt: c.imagePrompt } : {}),
        supersedeNote: row.supersedeNote ? `${row.supersedeNote} | ${history}` : history,
        status: 'LIVE', reviewedBy: `reviewer:${AGENT}`, reviewNotes: null } });
      await tx.attributionEvent.create({ data: { recordType: 'word', recordId: id, action: 'AMENDED', reviewerId: AGENT, actor: 'agent-drafter', recordedBy: RECORDED_BY, field: c.imagePrompt !== undefined ? 'definitionChild/sentence/senseB/imagePrompt' : 'definitionChild/sentence/senseB', method, note: c.why } });
      await tx.attributionEvent.create({ data: { recordType: 'word', recordId: id, action: 'APPROVED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'status', method, note: verdict.get(c.headword)?.reason ?? null } });
    }
  });
  console.log(`  redrafted and published ${land.length}; ${land.length * 2} attribution events`);
}
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); }).catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
