/**
 * APPLY A RATIFIED VAULT TIER (R1050). On 2026-08-02 David ratified tier moves for superseded vault
 * cards. The import wrote them, and by 2026-08-16 (where the write log begins) the old tiers were back.
 * The seed upserts `content/words/words.json` over the store, and that file still carried the old
 * tiers. So a tier fix lands in BOTH places, or the next seed run undoes it again.
 *
 * A vault tier is FAMILY COMPOSITION (CLAUDE.md), and the tier also feeds the generator's DERIVED
 * item difficulty (`packages/db/prisma/difficulty.ts` reads words.json, and
 * `vocabTierOfSet([headword, key])` sets the tier of every vr-04/16/21 item). So before any write
 * this refuses unless ALL hold:
 *   · the card's own supersedeNote records "Tier moved <from> → <to>" and David's ratification;
 *   · the store and words.json both hold <from>;
 *   · the vault-guard audit shows no guard-outcome or likelierKnown change (it calls VOCAB_GUARD_OK);
 *   · every LIVE generated item carrying the headword would DERIVE its STORED tier (it calls the
 *     generator's own `vocabTierOfSet` and `vocabTier`, never a re-derivation). A disagreement does
 *     NOT fail CI: `content:generate` skips reviewed rows whose stem and options are unchanged, so
 *     the item would serve at its old tier while its own derivation said another, and nothing would
 *     report it (R1054 corrects R1050's claim that the guard would catch it). Re-tier the item
 *     through review first.
 *
 *   tsx scripts/apply-ratified-vault-tier.ts <headword> --ruling="<words>" [--apply]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { vocabTierOfSet } from '../packages/core/src/index';
import { isCommon, vocabTier } from '../packages/db/prisma/difficulty';
import { prisma } from '../packages/db/src/index';
import { exportContentSnapshot } from './content-snapshot';
import { guardAudit, readVault } from './agent-review/vault-guard-audit';

const WORDS_FILE = join(__dirname, '..', 'content', 'words', 'words.json');
const HEAD = process.argv[2];
const RULING = process.argv.find((a) => a.startsWith('--ruling='))?.slice(9);
const APPLY = process.argv.includes('--apply');
const RECORDED_BY = 'human:dbamgbade@gmail.com';

async function main() {
  if (!HEAD || HEAD.startsWith('--')) throw new Error('pass a headword');
  if (!RULING?.trim()) throw new Error('pass --ruling="<the words that asked for this>"');
  const row = await prisma.word.findUniqueOrThrow({ where: { id: HEAD } });
  const m = row.supersedeNote?.match(/Tier moved (\d) → (\d) on corpus evidence\..*David ratified/);
  if (!m) throw new Error(`${HEAD}: supersedeNote records no ratified tier move`);
  const from = Number(m[1]), to = Number(m[2]);
  const fileText = readFileSync(WORDS_FILE, 'utf8');
  const file = JSON.parse(fileText) as { words: Array<{ id: string; tier: number }> };
  const fileCard = file.words.find((w) => w.id === HEAD);
  const faults: string[] = [];
  if (row.tier !== from) faults.push(`store tier is ${row.tier}, the note moves it from ${from}`);
  if (fileCard && fileCard.tier !== from) faults.push(`words.json tier is ${fileCard.tier}, the note moves it from ${from}`);

  // The guard, through the family's own function.
  const before = await readVault();
  const after = new Map(before);
  after.set(HEAD, { ...before.get(HEAD)!, tier: to });
  const g = guardAudit(before, after).find((r) => r.headword === HEAD);
  if (g && g.guardBefore !== g.guardAfter) faults.push(`guard outcome moves ${g.guardBefore} → ${g.guardAfter}`);
  console.log(`  vault-guard: ${g ? `VOCAB_BANK card (bank rarity ${g.bankRarity}, ${g.halves}); guard ${g.guardBefore} → ${g.guardAfter}` : 'not a VOCAB_BANK headword'}`);

  // Every LIVE item carrying the headword: the tier the generator would derive, before and after.
  const items = await prisma.item.findMany({ where: { status: 'LIVE' }, select: { id: true, difficultyTier: true, stem: true, options: { orderBy: { id: 'asc' }, where: { isCorrect: true }, select: { content: true } } } });
  const carrying = items.filter((i) => ((i.stem as { words?: unknown[] }).words ?? []).map((w) => String(w).toLowerCase()).includes(HEAD));
  for (const it of carrying) {
    const key = String((it.options[0]?.content as { value?: string })?.value ?? '');
    const k = { word: key, familiar: isCommon(key), vaultTier: vocabTier(key) };
    const d0 = vocabTierOfSet([{ word: HEAD, familiar: isCommon(HEAD), vaultTier: from }, k]);
    const d1 = vocabTierOfSet([{ word: HEAD, familiar: isCommon(HEAD), vaultTier: to }, k]);
    const derived = it.id.startsWith('gen-');
    console.log(`  ${it.id}: stored T${it.difficultyTier}; ${derived ? `derived T${d0} → T${d1}` : 'authored tier (not derived)'}`);
    // What must hold is that the derivation AGREES WITH THE STORED TIER of each reviewed item (R1054).
    // `content:generate` never rewrites a reviewed item's tier, so a disagreement here would sit
    // silently: the item serves at its stored tier while its own derivation says another. Re-tier the
    // item through review first (scripts/agent-review/land-item-retier.ts); then this passes.
    if (derived && d1 !== it.difficultyTier) faults.push(`${it.id} would derive T${d1} but is stored at T${it.difficultyTier}: re-tier the item through review first`);
  }
  console.log(`ratified tier ${HEAD} ${from} → ${to} — ${APPLY ? 'APPLY' : 'DRY RUN'}: ${carrying.length} LIVE item(s) screened, ${faults.length} fault(s)`);
  for (const f of faults) console.log(`  ✗ ${f}`);
  if (faults.length) throw new Error('refused before any write');
  if (!APPLY) return;

  if (fileCard) {
    const anchor = `"id": "${HEAD}"`;
    const at = fileText.indexOf(anchor);
    if (at < 0 || fileText.indexOf(anchor, at + 1) >= 0) throw new Error(`words.json: anchor ${anchor} not found exactly once (R87)`);
    const end = fileText.indexOf('}', at);
    const block = fileText.slice(at, end);
    const tierRe = new RegExp(`"tier": ${from}\\b`);
    if ((block.match(new RegExp(tierRe, 'g')) ?? []).length !== 1) throw new Error(`words.json: "tier": ${from} not found exactly once in the ${HEAD} card (R87)`);
    writeFileSync(WORDS_FILE, fileText.slice(0, at) + block.replace(tierRe, `"tier": ${to}`) + fileText.slice(end));
  }
  const method = `RATIFIED TIER APPLIED under R1050: the card's supersedeNote records "Tier moved ${from} → ${to} on corpus evidence", ratified by David 2026-08-02, never in force by 2026-08-16. Applied on: "${RULING}". Store and content/words/words.json written together. Guard outcome unchanged; ${carrying.length} LIVE item(s) screened, no derived tier moves.`;
  await prisma.$transaction(async (tx) => {
    await tx.word.update({ where: { id: HEAD }, data: { tier: to, supersedeNote: `${row.supersedeNote} | Tier ${from} → ${to} applied ${new Date().toISOString().slice(0, 10)} (R1050).` } });
    await tx.attributionEvent.create({ data: { recordType: 'word', recordId: HEAD, action: 'AMENDED', actor: 'ruling:david', recordedBy: RECORDED_BY, field: 'tier', method } });
  });
  console.log(`  ${HEAD}: tier ${from} → ${to} in the store${fileCard ? ' and words.json' : ''}`);
}
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); }).catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
