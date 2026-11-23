/**
 * PUBLISH REVIEWED VAULT CARDS (R1046). R1045 landed a batch's cards reviewed but DRAFT, because a
 * LIVE tier-1 card changes what the warm-up collects first (orchestrator.ts: lowest tier, then id).
 * That serving decision was left to David. This door carries it out when he gives it, and does
 * nothing else.
 *
 * A card is published only if ALL hold, else the run refuses before any write:
 *   · it is in `cards-<batch>.json` and ATTESTED in `review-<batch>.json` by rev-agent-01;
 *   · its row is DRAFT, `reviewedBy: reviewer:rev-agent-01`, and word-for-word the card that was
 *     reviewed (tier, definition, sentence, sense B, likelierKnown);
 *   · it still passes `gateCard` (`checkWordCard`, the CMS publish door's gate);
 *   · the vault-guard audit shows no VOCAB_BANK tier, likelierKnown or guard change.
 * It prints the warm-up's first collections before and after, so the serving change is on the record.
 *
 *   tsx scripts/agent-review/publish-vault-cards.ts --batch=V1 --ruling="<David's words>" [--apply]
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
const RULING = process.argv.find((a) => a.startsWith('--ruling='))?.slice(9);
const APPLY = process.argv.includes('--apply');
const AGENT = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

async function warmupHead(extra: string[], n: number): Promise<string[]> {
  const rows = await prisma.word.findMany({ where: { OR: [{ status: 'LIVE' }, { id: { in: extra } }] }, orderBy: [{ tier: 'asc' }, { id: 'asc' }], take: n, select: { id: true } });
  return rows.map((r) => r.id);
}

async function main() {
  if (!BATCH) throw new Error('pass --batch=<name>');
  if (!RULING?.trim()) throw new Error('pass --ruling="<the words that decided this>": a serving decision is published on a ruling, never on its own');
  const cardsText = readFileSync(pjoin(DIR, `cards-${BATCH}.json`), 'utf8');
  const revText = readFileSync(pjoin(DIR, `review-${BATCH}.json`), 'utf8');
  const cards = (JSON.parse(cardsText) as { cards: VaultCard[] }).cards;
  const rev = JSON.parse(revText) as { reviewer: string; cards: Array<{ headword: string; verdict: string }> };
  if (!cards?.length) throw new Error(`${BATCH}: no cards — a failed read, not a clean run (R173)`);
  if (rev.reviewer !== AGENT) throw new Error(`review signed "${rev.reviewer}", expected ${AGENT}`);
  const attested = new Set(rev.cards.filter((v) => v.verdict === 'ATTEST').map((v) => v.headword));

  const faults: string[] = [];
  const ids: string[] = [];
  for (const c of cards) {
    const id = slug(c.headword);
    const row = await prisma.word.findUnique({ where: { id } });
    const f: string[] = [];
    if (!attested.has(c.headword)) f.push('not attested');
    if (!row) f.push('no Word row');
    else {
      if (row.status !== 'DRAFT') f.push(`status ${row.status}`);
      if (row.reviewedBy !== `reviewer:${AGENT}`) f.push(`reviewedBy ${row.reviewedBy}`);
      const reviewed = JSON.stringify([c.tier, c.definitionChild, c.sentence, c.senseB?.definition ?? null, c.senseB?.sentence ?? null, c.twoMeanings ? c.likelierKnown ?? null : null]);
      const stored = JSON.stringify([row.tier, row.definitionChild, row.sentence, row.senseBDefinition, row.senseBSentence, row.likelierKnown]);
      if (reviewed !== stored) f.push('row differs from the card that was reviewed');
    }
    f.push(...gateCard(c));
    if (f.length) faults.push(`${c.headword}: ${f.join('; ')}`);
    else ids.push(id);
  }

  const before = await readVault();
  const after = new Map([...before].map(([k, v]) => [k, ids.includes(slug(k)) ? { ...v, status: 'LIVE' } : v]));
  const guardMoves = await printGuardAudit(after, before);
  const head0 = await warmupHead([], 12);
  const head1 = await warmupHead(ids, 12);
  const t1 = await prisma.word.count({ where: { tier: 1, OR: [{ status: 'LIVE' }, { id: { in: ids } }] } });
  console.log(`  warm-up's first 12 collections, before: ${head0.join(' ')}`);
  console.log(`  warm-up's first 12 collections, after : ${head1.join(' ')}`);
  console.log(`  LIVE tier-1 cards: ${await prisma.word.count({ where: { tier: 1, status: 'LIVE' } })} → ${t1}`);
  console.log(`publish ${BATCH} — ${APPLY ? 'APPLY' : 'DRY RUN'}: ${ids.length} of ${cards.length} cleared, ${faults.length} refused`);
  for (const f of faults) console.log(`  ✗ ${f}`);
  if (faults.length) throw new Error('refused before any write: every card in the batch must clear');
  if (guardMoves > 0) throw new Error(`${guardMoves} VOCAB_BANK headword(s) would move — refused before any write`);
  if (!APPLY) return;

  const method = `VAULT PUBLICATION under R1046: cards drafted and reviewed under R1045 (cards-${BATCH} sha256 ${sha(cardsText).slice(0, 16)}, review sha256 ${sha(revText).slice(0, 16)}), each re-gated by checkWordCard and checked word-for-word against the reviewed card; vault-guard audit 0 moves. Serving decision by ruling: "${RULING}".`;
  await prisma.$transaction(async (tx) => {
    for (const id of ids) {
      await tx.word.update({ where: { id }, data: { status: 'LIVE' } });
      await tx.attributionEvent.create({ data: { recordType: 'word', recordId: id, action: 'APPROVED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'status', method, note: `published on ruling: ${RULING}` } });
    }
  });
  console.log(`  published ${ids.length}; ${ids.length} attribution events`);
}
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); }).catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
