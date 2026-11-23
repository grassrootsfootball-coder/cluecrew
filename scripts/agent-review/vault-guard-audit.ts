/**
 * THE VAULT-GUARD AUDIT — run BEFORE any vault row is written (CLAUDE.md: a vault `likelierKnown` or
 * tier edit is a change to FAMILY COMPOSITION, not a data correction; R1045).
 *
 * SOURCE (stated before it runs, per the verifier rule alongside R41): it calls the family's OWN
 * functions — `VOCAB_GUARD_OK` and `vocabTier` from `packages/core/src/english/vocab-context.ts` —
 * and reads `Word.tier`, `Word.status` and `Word.likelierKnown` directly. It never re-derives the guard.
 *
 * For every headword in `VOCAB_BANK` it compares three things: the bank's declared `headwordRarity`,
 * the vault tier BEFORE, and the vault tier AFTER a proposed set of cards is applied. Then the guard
 * outcome of each, the vault `likelierKnown` before and after, and which halves the bank carries
 * (familiar / rare). A MOVE is any bank headword whose vault tier, guard outcome, likelierKnown or
 * status differs between before and after.
 *
 * It also counts the LIVE items in the family (`en-vocab-in-context`). When that population is empty
 * it says so in terms that cannot be read as a pass (R60). A zero there means no served item can move.
 * It does NOT mean the bank is unaffected: the bank is in code and is generated from it.
 */
import { type Tier } from '../../packages/core/src/maths/generator';
import { VOCAB_BANK, VOCAB_GUARD_OK } from '../../packages/core/src/english/vocab-context';
import { prisma } from '../../packages/db/src/index';

export interface VaultCardLite { headword: string; tier: number; status: string; likelierKnown: string | null }
export interface GuardRow {
  headword: string; bankRarity: number; halves: string;
  before: VaultCardLite | null; after: VaultCardLite | null;
  guardByBank: boolean; guardBefore: boolean | null; guardAfter: boolean | null;
  moved: boolean; disagreesWithBank: boolean;
}

export function guardAudit(before: Map<string, VaultCardLite>, after: Map<string, VaultCardLite>): GuardRow[] {
  const byHead = new Map<string, { rarity: number; halves: Set<string> }>();
  for (const v of VOCAB_BANK) {
    const h = byHead.get(v.headword) ?? { rarity: v.headwordRarity, halves: new Set<string>() };
    h.halves.add(v.testedSense);
    byHead.set(v.headword, h);
  }
  return [...byHead].sort(([a], [b]) => a.localeCompare(b)).map(([headword, h]) => {
    const b = before.get(headword) ?? null;
    const a = after.get(headword) ?? null;
    const g = (c: VaultCardLite | null) => (c ? VOCAB_GUARD_OK(c.tier as Tier) : null);
    const moved = JSON.stringify(b) !== JSON.stringify(a);
    return {
      headword, bankRarity: h.rarity, halves: [...h.halves].sort().join('+'), before: b, after: a,
      guardByBank: VOCAB_GUARD_OK(h.rarity as Tier), guardBefore: g(b), guardAfter: g(a), moved,
      disagreesWithBank: a !== null && VOCAB_GUARD_OK(a.tier as Tier) !== VOCAB_GUARD_OK(h.rarity as Tier),
    };
  });
}

export async function readVault(): Promise<Map<string, VaultCardLite>> {
  const rows = await prisma.word.findMany({ select: { headword: true, tier: true, status: true, likelierKnown: true } });
  return new Map(rows.map((r) => [r.headword.toLowerCase(), { headword: r.headword.toLowerCase(), tier: r.tier, status: r.status, likelierKnown: r.likelierKnown }]));
}

/** Prints the audit and returns the number of bank headwords whose vault state MOVES. */
export async function printGuardAudit(after: Map<string, VaultCardLite>, before?: Map<string, VaultCardLite>): Promise<number> {
  const b = before ?? (await readVault());
  const rows = guardAudit(b, after);
  const live = await prisma.item.count({ where: { status: 'LIVE', questionTypeId: 'en-vocab-in-context' } });
  console.log(`vault-guard audit — ${rows.length} VOCAB_BANK headwords screened (source: VOCAB_GUARD_OK + Word.tier/status/likelierKnown)`);
  if (live === 0) {
    console.log('  LIVE en-vocab-in-context items in the store: 0. NOTHING SERVED READS THIS GUARD, so no LIVE item can move.');
    console.log('  That is not a pass on the bank. The bank composition below is what the family would serve once generated.');
  } else console.log(`  LIVE en-vocab-in-context items in the store: ${live}`);
  const moved = rows.filter((r) => r.moved);
  const disagree = rows.filter((r) => r.disagreesWithBank);
  for (const r of moved) {
    const f = (c: VaultCardLite | null) => (c ? `T${c.tier} ${c.status} lk=${c.likelierKnown ?? '-'} guard=${VOCAB_GUARD_OK(c.tier as Tier)}` : 'no card');
    console.log(`  MOVES ${r.headword.padEnd(12)} bank T${r.bankRarity} (${r.halves}, guard=${r.guardByBank}) · before ${f(r.before)} → after ${f(r.after)}`);
  }
  console.log(`  bank headwords whose vault state moves: ${moved.length}; of those, guard outcome changes: ${moved.filter((r) => r.guardBefore !== r.guardAfter).length}`);
  console.log(`  bank headwords whose vault guard disagrees with the bank's declared rarity (after): ${disagree.length}${disagree.length ? ' — ' + disagree.map((r) => r.headword).join(', ') : ''}`);
  return moved.filter((r) => r.guardBefore !== r.guardAfter || r.before?.likelierKnown !== r.after?.likelierKnown || r.before?.tier !== r.after?.tier).length;
}

if (process.argv[1]?.endsWith('vault-guard-audit.ts')) {
  readVault().then((v) => printGuardAudit(v, v)).finally(() => prisma.$disconnect());
}
