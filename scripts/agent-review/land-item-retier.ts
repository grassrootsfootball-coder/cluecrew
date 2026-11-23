/**
 * LAND A REVIEWED ITEM RE-TIER (R1054). `difficultyTier` is what serving selects on (BUILD-PHASE-3),
 * so moving it moves which children meet the item. It is NOT in the item's signed projection
 * ({stem, options, explanation}), so the signature stands, and this door re-checks that instead of
 * assuming it. A reviewed generated item's tier is also never rewritten by `content:generate`: the
 * guard skips reviewed rows whose stem and options are unchanged. So a tier that should move moves
 * only through a door like this one.
 *
 * Refuses before any write unless: the review file is signed rev-agent-01 with a RETIER verdict and a
 * tier from 1 to 5; the item is LIVE; and its served hash (stem, options, tier) is exactly the one in
 * the packet the reviewer read.
 *
 *   tsx scripts/agent-review/land-item-retier.ts <itemId> [--apply]
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { exportContentSnapshot } from '../content-snapshot';

const ITEM = process.argv[2];
const APPLY = process.argv.includes('--apply');
const AGENT = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const DIR = join(__dirname, '..', '..', 'content', 'agent-review', 'vault');
const canon = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x));
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

async function main() {
  if (!ITEM || ITEM.startsWith('--')) throw new Error('pass an item id');
  const packetText = readFileSync(join(DIR, `retier-${ITEM}-packet.json`), 'utf8');
  const revText = readFileSync(join(DIR, `review-retier-${ITEM}.json`), 'utf8');
  const packet = JSON.parse(packetText) as { item: { servedHash: string; storedTier: number } };
  const rev = JSON.parse(revText) as { reviewer: string; itemId: string; servedHash: string; verdict: string; tier: number; reason: string };
  const it = await prisma.item.findUniqueOrThrow({ where: { id: ITEM }, include: { options: { orderBy: { id: 'asc' } } } });
  const now = sha(canon({ stem: it.stem, options: it.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), difficultyTier: it.difficultyTier }));
  const faults: string[] = [];
  if (rev.reviewer !== AGENT) faults.push(`review signed "${rev.reviewer}"`);
  if (rev.itemId !== ITEM) faults.push(`review is for ${rev.itemId}`);
  if (!/^RETIER_(T3|OTHER)$/.test(rev.verdict)) faults.push(`verdict ${rev.verdict} is not a re-tier`);
  if (!Number.isInteger(rev.tier) || rev.tier < 1 || rev.tier > 5) faults.push(`tier ${rev.tier} is not 1-5`);
  if (rev.tier === it.difficultyTier) faults.push(`tier ${rev.tier} is the stored tier: nothing to land`);
  if (it.status !== 'LIVE') faults.push(`item is ${it.status}`);
  if (now !== packet.item.servedHash || rev.servedHash !== packet.item.servedHash) faults.push('the item, or the review, is not the one in the packet');
  console.log(`re-tier ${ITEM}: T${it.difficultyTier} → T${rev.tier} — ${APPLY ? 'APPLY' : 'DRY RUN'}; verdict ${rev.verdict}`);
  for (const f of faults) console.log(`  ✗ ${f}`);
  if (faults.length) throw new Error('refused before any write');
  if (!APPLY) return;
  const method = `ITEM RE-TIER under R1054: reviewed by the machine reviewer ${AGENT} (packet sha256 ${sha(packetText).slice(0, 16)}, review sha256 ${sha(revText).slice(0, 16)}); difficultyTier ${it.difficultyTier} → ${rev.tier}. difficultyTier is outside the signed projection {stem, options, explanation}, so the signature stands. Not read by a person.`;
  await prisma.$transaction(async (tx) => {
    await tx.item.update({ where: { id: ITEM }, data: { difficultyTier: rev.tier } });
    await tx.attributionEvent.create({ data: { recordType: 'item', recordId: ITEM, action: 'AMENDED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'difficultyTier', method, note: rev.reason } });
    await tx.attributionEvent.create({ data: { recordType: 'item', recordId: ITEM, action: 'APPROVED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'difficultyTier', method } });
  });
  console.log(`  landed: ${ITEM} difficultyTier ${it.difficultyTier} → ${rev.tier}`);
}
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); }).catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
