/**
 * VAULT CARDS under the agent-review regime (R1045). Two jobs, one door:
 *   · AUTHOR — a drafting agent proposes cards in `content/agent-review/vault/cards-<batch>.json`. A
 *     SEPARATE agent attests or refuses each one in `review-<batch>.json` → `cards`. A card is created
 *     only if it is ATTESTED, its id is new, and it passes `gateCard`, which wraps `checkWordCard`
 *     (the same gate as the CMS publish door).
 *   · PUBLISH — the reviewer returns PUBLISH or HOLD on each existing DRAFT card listed in
 *     `packet.json` → `drafts`. A card is published only if it is PUBLISH, still DRAFT, still
 *     word-for-word the text the reviewer was shown, and it passes the gate.
 *
 * THE VAULT IS FAMILY COMPOSITION (CLAUDE.md). Before any write this runs the vault-guard audit
 * against the state the run WOULD produce. It REFUSES the whole run if any VOCAB_BANK headword's
 * vault tier, likelierKnown or guard outcome would change. A status-only move (DRAFT → LIVE, same
 * tier, same likelierKnown) is printed, not refused. It also prints the two-sense seed count before
 * and after, because a two-sense card is a new seed for the vocabulary-in-context family.
 *
 * NEW CARDS LAND DRAFT unless `--publish-new` is passed. The warm-up (orchestrator.ts) collects the
 * lowest-tier uncollected LIVE cards, so a LIVE tier-1 card changes what every child collects next.
 * That is a serving decision, so it needs its own flag.
 *
 * Machine provenance in its own fields: reviewedBy `reviewer:rev-agent-01`, authoredBy `agent:drafter
 * (R1045)`. No person's name is written (R94, R98).
 *
 *   tsx scripts/agent-review/land-vault-cards.ts --batch=V1 [--apply] [--publish-new]
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { isTwoSenseSeed } from '../../packages/core/src/english/vocab-in-context';
import { prisma } from '../../packages/db/src/index';
import { exportContentSnapshot } from '../content-snapshot';
import { gateCard, slug, type VaultCard } from './gate-vault-cards';
import { printGuardAudit, readVault, type VaultCardLite } from './vault-guard-audit';

const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'vault');
const BATCH = process.argv.find((a) => a.startsWith('--batch='))?.slice(8);
const APPLY = process.argv.includes('--apply');
const PUBLISH_NEW = process.argv.includes('--publish-new');
const AGENT = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

type Verdict = { headword: string; verdict: string; reason?: string };
type PacketDraft = { card: { headword: string; tier: number; definitionChild: string; sentence: string; senseB: { definition: string | null; sentence: string | null } | null; likelierKnown: string | null } };

async function main() {
  if (!BATCH) throw new Error('pass --batch=<name>');
  const cardsText = readFileSync(pjoin(DIR, `cards-${BATCH}.json`), 'utf8');
  const revText = readFileSync(pjoin(DIR, `review-${BATCH}.json`), 'utf8');
  const packetText = readFileSync(pjoin(DIR, 'packet.json'), 'utf8');
  const cards = (JSON.parse(cardsText) as { cards: VaultCard[] }).cards;
  const rev = JSON.parse(revText) as { reviewer: string; cards: Verdict[]; drafts: Verdict[] };
  const packet = JSON.parse(packetText) as { drafts: PacketDraft[] };
  if (!cards?.length) throw new Error(`${BATCH}: no cards proposed — nothing to land is a failed read, not a clean run (R173)`);
  if (rev.reviewer !== AGENT) throw new Error(`review file is signed "${rev.reviewer}", expected ${AGENT}`);
  if (!Array.isArray(rev.cards) || !Array.isArray(rev.drafts)) throw new Error('review file must carry `cards` and `drafts` arrays (R173: refuse a shape, never read it as empty)');
  const vCard = new Map(rev.cards.map((v) => [v.headword, v]));
  const vDraft = new Map(rev.drafts.map((v) => [v.headword, v]));

  const before = await readVault();
  const after = new Map<string, VaultCardLite>([...before].map(([k, v]) => [k, { ...v }]));
  const create: VaultCard[] = [];
  const publish: string[] = [];
  const out: Array<{ headword: string; job: string; outcome: string; faults: string[] }> = [];

  for (const c of cards) {
    const faults = gateCard(c);
    if (before.has(c.headword) || (await prisma.word.findUnique({ where: { id: slug(c.headword) } }))) faults.push('a Word row already exists');
    const v = vCard.get(c.headword);
    if (v?.verdict !== 'ATTEST') faults.push(`not attested (${v?.verdict ?? 'no verdict'}${v?.reason ? `: ${v.reason}` : ''})`);
    out.push({ headword: c.headword, job: 'author', outcome: faults.length ? 'HELD' : 'CREATE', faults });
    if (!faults.length) {
      create.push(c);
      after.set(c.headword, { headword: c.headword, tier: c.tier, status: PUBLISH_NEW ? 'LIVE' : 'DRAFT', likelierKnown: c.twoMeanings ? c.likelierKnown ?? null : null });
    }
  }
  for (const v of rev.cards) if (!cards.some((c) => c.headword === v.headword)) throw new Error(`review names "${v.headword}", which no card proposes`);

  for (const d of packet.drafts) {
    const h = d.card.headword.toLowerCase();
    const faults: string[] = [];
    const row = await prisma.word.findFirst({ where: { headword: d.card.headword } });
    if (!row) faults.push('no Word row');
    else {
      if (row.status !== 'DRAFT') faults.push(`status is ${row.status}, not DRAFT`);
      // The reviewer read the packet. A card edited since then is not the card that was reviewed.
      const shown = JSON.stringify([d.card.tier, d.card.definitionChild, d.card.sentence, d.card.senseB?.definition ?? null, d.card.senseB?.sentence ?? null, d.card.likelierKnown]);
      const now = JSON.stringify([row.tier, row.definitionChild, row.sentence, row.twoMeanings ? row.senseBDefinition : null, row.twoMeanings ? row.senseBSentence : null, row.likelierKnown]);
      if (shown !== now) faults.push('card changed since the reviewer was shown it');
      faults.push(...gateCard({ headword: h, tier: row.tier, wordClass: row.wordClass ?? 'unstated', definitionChild: row.definitionChild, sentence: row.sentence,
        twoMeanings: row.twoMeanings, senseB: row.twoMeanings ? { definition: row.senseBDefinition ?? '', sentence: row.senseBSentence ?? '', wordClass: row.senseBWordClass ?? '' } : null,
        likelierKnown: (row.likelierKnown as 'A' | 'B' | null) ?? null, why: 'existing card' }).filter((f) => !f.startsWith('wordClass')));
    }
    const v = vDraft.get(h);
    if (v?.verdict !== 'PUBLISH') faults.push(`not cleared to publish (${v?.verdict ?? 'no verdict'}${v?.reason ? `: ${v.reason}` : ''})`);
    out.push({ headword: h, job: 'publish', outcome: faults.length ? 'HELD' : 'PUBLISH', faults });
    if (!faults.length && row) { publish.push(row.id); after.set(h, { ...after.get(h)!, status: 'LIVE' }); }
  }

  // The audit, against the state this run would produce — BEFORE a single write.
  const guardMoves = await printGuardAudit(after, before);
  const seeds = (m: Map<string, VaultCardLite>) => [...m.values()].filter((c) => c.likelierKnown).length;
  const newTwo = create.filter((c) => c.twoMeanings && isTwoSenseSeed({ headword: c.headword, tier: c.tier, definitionChild: c.definitionChild, senseBDefinition: c.senseB?.definition }));
  console.log(`  two-sense cards (likelierKnown set) in the vault: ${seeds(before)} → ${seeds(after)}; new two-sense seeds: ${newTwo.length}${newTwo.length ? ' — ' + newTwo.map((c) => `${c.headword} lk=${c.likelierKnown}`).join(', ') : ''}`);
  const tally = (job: string, o: string) => out.filter((x) => x.job === job && x.outcome === o).length;
  console.log(`vault ${BATCH} — ${APPLY ? 'APPLY' : 'DRY RUN'}: author ${tally('author', 'CREATE')} create (${PUBLISH_NEW ? 'LIVE' : 'DRAFT'}), ${tally('author', 'HELD')} held; publish ${tally('publish', 'PUBLISH')} publish, ${tally('publish', 'HELD')} held`);
  for (const o of out) if (o.faults.length) console.log(`  ✗ ${o.job} ${o.headword}\n      ${o.faults.join('\n      ')}`);
  writeFileSync(pjoin(DIR, `landed-${BATCH}-${APPLY ? 'apply' : 'dry'}.json`), JSON.stringify(out, null, 1) + '\n');
  if (guardMoves > 0) throw new Error(`${guardMoves} VOCAB_BANK headword(s) would change vault tier, likelierKnown or guard outcome — family composition; refused before any write`);
  if (!APPLY) return;

  const method = `VAULT CARD under R1045: drafted by an agent, reviewed by the machine reviewer ${AGENT} acting in the reviewer role; cards-${BATCH} sha256 ${sha(cardsText).slice(0, 16)}, review sha256 ${sha(revText).slice(0, 16)}, packet sha256 ${sha(packetText).slice(0, 16)}; gated by checkWordCard before the write; vault-guard audit run first (0 moves). Not read by a person.`;
  await prisma.$transaction(async (tx) => {
    for (const c of create) {
      const id = slug(c.headword);
      await tx.word.create({ data: { id, headword: c.headword, definitionChild: c.definitionChild, sentence: c.sentence, wordClass: c.wordClass, tier: c.tier,
        twoMeanings: c.twoMeanings, senseBDefinition: c.senseB?.definition ?? null, senseBSentence: c.senseB?.sentence ?? null, senseBWordClass: c.senseB?.wordClass ?? null,
        likelierKnown: c.twoMeanings ? c.likelierKnown ?? null : null, likelierKnownNote: c.twoMeanings ? c.likelierKnownNote ?? null : null,
        status: PUBLISH_NEW ? 'LIVE' : 'DRAFT', authoredBy: 'agent:drafter (R1045)', reviewedBy: `reviewer:${AGENT}`,
        preReviewVerdict: `Drafter: ${c.why} | Reviewer (${AGENT}): ${vCard.get(c.headword)?.reason ?? ''}` } });
      await tx.attributionEvent.create({ data: { recordType: 'word', recordId: id, action: 'AUTHORED', reviewerId: AGENT, actor: 'agent-drafter', recordedBy: RECORDED_BY, field: 'card', method } });
      await tx.attributionEvent.create({ data: { recordType: 'word', recordId: id, action: 'APPROVED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'reviewedBy', method, note: vCard.get(c.headword)?.reason ?? null } });
    }
    for (const id of publish) {
      await tx.word.update({ where: { id }, data: { status: 'LIVE', reviewedBy: `reviewer:${AGENT}`, reviewNotes: null } });
      const h = (await tx.word.findUniqueOrThrow({ where: { id } })).headword.toLowerCase();
      await tx.attributionEvent.create({ data: { recordType: 'word', recordId: id, action: 'APPROVED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'status', method, note: `published: ${vDraft.get(h)?.reason ?? ''}` } });
    }
  });
  console.log(`  wrote ${create.length} card(s) and published ${publish.length}; ${create.length * 2 + publish.length} attribution events`);
}
// An apply script re-exports what it changed as its final step (CLAUDE.md; R1039/R1040).
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); }).catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
