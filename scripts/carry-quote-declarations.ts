/**
 * CARRY THE QUOTE DECLARATIONS — `pnpm carry:quotes [--write]`
 *
 * `stem.quotes[].exemptFrom` was the last CRITICAL field the manifest reported as DROPPED, and it
 * is critical for a specific reason: it names the child-facing ceilings a quotation is exempt from.
 * Drop it and the gate either REFUSES A LEGAL ITEM or PASSES AN ILLEGAL ONE, depending which way
 * the default falls. Six items declare it; this store held it on none.
 *
 * IT IS WORSE THAN ONE MISSING FIELD. The whole store held FIVE object quotes, and ENG-001-WIW-14
 * had no `quotes` array at all while its source declares one with three exemptions on it. So an
 * item whose stem quotes the passage under R4 was being measured against ceilings it had been
 * declared exempt from, with nothing anywhere recording that a declaration had gone missing.
 *
 * MATCHED BY TEXT, WHICH IS THE QUOTE'S IDENTITY. Not by position: a quotes array has no stable
 * order across two stores, and matching on index would silently attach one quotation's exemptions
 * to another's text — a worse outcome than the loss being repaired.
 *
 * A BARE STRING IS A DECLARED CONVENTION (R78) and is carried as-is. It declares a text and not a
 * place; converting it to an object here would invent a claim its author did not make.
 *
 * IT NEVER DELETES AND NEVER OVERWRITES. A quote present here and absent from the source is
 * reported, never removed. A FIELD present on both sides and disagreeing is HELD — reported and
 * left alone — while the fields that are merely ABSENT are carried. Holding the whole item instead
 * would have cost WIW-18 and pp-19 their `exemptFrom`, the very field this script exists for, over
 * a disagreement about a different field entirely. Since nothing is ever overwritten, carrying the
 * absent and holding the disputed is strictly safer than refusing both.
 *
 * SOURCE PRECEDENCE IS DECLARED, NOT INFERRED FROM A SWEEP. The first version of this script read
 * every directory as one corpus and refused on seven items — correctly, because two copies of
 * `eng005-draft.json` and `eng007-draft.json` exist at different hashes and declare quotes ON
 * DIFFERENT ITEMS. They are not a corpus; they are two vintages of one delivery. `from-cluecrew/`
 * is the return path Cowork exports to and is newer on both files (2026-08-12 23:32 and 2026-08-13
 * 13:31, against 2026-08-12 13:33), and it is the directory the cluster importer read. It wins.
 *
 * Every item the precedence resolves is PRINTED, with both hashes. A precedence that silently
 * picks is a sweep with extra confidence — the point is that the drift stays visible.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/** Highest precedence LAST: a later entry supersedes an earlier one for the same item. */
const SEARCH = [
  '/Users/davidb/Downloads/11+',
  '/Users/davidb/Downloads/11+/items',
  '/Users/davidb/Downloads/11+/from-cluecrew',
];
const DAVID = 'human:david@cluecrew.test';

const canonical = (v: unknown): string => {
  const walk = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === 'object') {
      return Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, walk((x as Record<string, unknown>)[k])]));
    }
    return x;
  };
  return JSON.stringify(walk(v));
};

/** A quote's identity: its text, under either shape. */
const quoteText = (q: unknown): string =>
  typeof q === 'string' ? q.trim()
    : q && typeof q === 'object' && typeof (q as { text?: unknown }).text === 'string'
      ? String((q as { text: string }).text).trim() : '';

type Quotes = Array<unknown>;

async function main(): Promise<void> {
  const write = process.argv.includes('--write');

  // One declaration per item per field, or a refusal.
  const src = new Map<string, { stem?: Quotes; explanation?: Quotes; from: string[] }>();
  const superseded: string[] = [];
  for (const dir of SEARCH) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.json')) continue;
      const raw = readFileSync(join(dir, name), 'utf8');
      if (!raw.includes('"quotes"')) continue;
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { continue; }
      const items = (parsed as { items?: unknown }).items;
      if (!Array.isArray(items)) continue;
      const sha = createHash('sha256').update(raw).digest('hex').slice(0, 16);
      for (const it of items as Array<Record<string, unknown>>) {
        if (typeof it?.itemId !== 'string') continue;
        const sq = (it.stem as { quotes?: unknown })?.quotes;
        const eq = (it.explanation as { quotes?: unknown })?.quotes;
        if (!Array.isArray(sq) && !Array.isArray(eq)) continue;
        const cur = src.get(it.itemId) ?? { from: [] };
        for (const [key, val] of [['stem', sq], ['explanation', eq]] as const) {
          if (!Array.isArray(val)) continue;
          const held = cur[key];
          if (held && canonical(held) !== canonical(val)) {
            // Not a conflict: a LATER SOURCE ROOT supersedes an earlier one. Recorded so the
            // drift between two vintages of one delivery stays visible rather than being resolved
            // out of sight.
            superseded.push(
              `${it.itemId}.${key}.quotes: ${sha} supersedes ${cur.from[cur.from.length - 1]} `
              + `(${(held as Quotes).length} -> ${val.length} quote(s))`,
            );
          }
          cur[key] = val;
        }
        cur.from.push(sha);
        src.set(it.itemId, cur);
      }
    }
  }
  requirePopulation('carry:quotes', { 'source items declaring quotes': src.size });
  if (superseded.length > 0) {
    console.log(`\n${superseded.length} item(s) where a later source root superseded an earlier one:`);
    for (const c of superseded) console.log(`  · ${c}`);
    console.log('  Two vintages of one delivery, not two sources. from-cluecrew wins by declaration.');
  }

  const rows = await prisma.item.findMany({
    where: { id: { in: [...src.keys()] } },
    select: { id: true, stem: true, explanation: true },
    orderBy: { id: 'asc' },
  });

  const updates: Array<{ id: string; stem: unknown; explanation: unknown; detail: string[] }> = [];
  const orphaned: string[] = [];
  /** Fields present on both sides and disagreeing: held, reported, never written. */
  const held: string[] = [];
  let fieldsAdded = 0;
  let quotesAdded = 0;

  for (const row of rows) {
    const want = src.get(row.id)!;
    const stem = { ...((row.stem ?? {}) as Record<string, unknown>) };
    const explanation = { ...((row.explanation ?? {}) as Record<string, unknown>) };
    const detail: string[] = [];

    for (const [key, holder] of [['stem', stem], ['explanation', explanation]] as const) {
      const wanted = want[key];
      if (!Array.isArray(wanted)) continue;
      const have: Quotes = Array.isArray(holder.quotes) ? [...(holder.quotes as Quotes)] : [];
      const byText = new Map(have.map((q, i) => [quoteText(q), i]));

      for (const w of wanted) {
        const text = quoteText(w);
        if (!text) continue;
        const at = byText.get(text);
        if (at === undefined) {
          // A declaration this store never held. WIW-14's three exemptions were in this class.
          have.push(w);
          quotesAdded += 1;
          detail.push(`${key}: added a quote (${text.slice(0, 30)}…)`);
          continue;
        }
        const cur = have[at];
        if (typeof w === 'string' || typeof cur === 'string') continue; // R78 convention; nothing to merge
        const merged = { ...(cur as Record<string, unknown>) };
        const added: string[] = [];
        for (const [k, v] of Object.entries(w as Record<string, unknown>)) {
          if (v === undefined || v === null) continue;
          if (merged[k] === undefined) { merged[k] = v; added.push(k); }
          else if (canonical(merged[k]) !== canonical(v)) {
            held.push(
              `${row.id}.${key}.quotes["${text.slice(0, 24)}…"].${k}: `
              + `db ${canonical(merged[k])} vs source ${canonical(v)}`,
            );
          }
        }
        if (added.length) {
          have[at] = merged;
          fieldsAdded += added.length;
          detail.push(`${key}: +${added.join(',')}`);
        }
      }

      // Never deleted, only reported.
      for (const q of Array.isArray(holder.quotes) ? (holder.quotes as Quotes) : []) {
        if (!wanted.some((w) => quoteText(w) === quoteText(q))) {
          orphaned.push(`${row.id}.${key}: "${quoteText(q).slice(0, 40)}…" is here and not in the source`);
        }
      }
      if (have.length) holder.quotes = have;
    }

    if (detail.length) updates.push({ id: row.id, stem, explanation, detail });
  }

  console.log(`${src.size} source item(s) declare quotes · ${rows.length} present in the database`);
  console.log(`  items to repair: ${updates.length} · quote objects added: ${quotesAdded} · fields added: ${fieldsAdded}`);
  if (orphaned.length) {
    console.log(`\n${orphaned.length} stored quote(s) have no counterpart in the source — reported, never removed:`);
    for (const o of orphaned.slice(0, 8)) console.log(`  ? ${o}`);
  }
  if (held.length > 0) {
    console.log(`\n${held.length} field(s) present on BOTH sides and disagreeing — HELD, not written:`);
    for (const m of held) console.log(`  ! ${m}`);
    console.log('  Two claims about one declaration. This script has no standing to choose; the');
    console.log('  fields that were merely ABSENT are carried, and these are left exactly as they are.');
  }
  if (updates.length === 0) {
    console.log('\nNothing to carry: every declaration the source holds is already present.');
    await prisma.$disconnect();
    return;
  }
  if (!write) {
    for (const u of updates) console.log(`  · ${u.id}: ${u.detail.join(' | ')}`);
    console.log('\nDry run. Re-run with --write to apply.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(updates.map((u) => prisma.item.update({
    where: { id: u.id }, data: { stem: u.stem as object, explanation: u.explanation as object },
  })));
  for (const u of updates) {
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: u.id, action: 'AMENDED',
        actor: DAVID, recordedBy: DAVID, field: 'stem.quotes, explanation.quotes',
        method: 'Quote declarations carried, 2026-08-16',
        note:
          `Restored quote declarations from the Cowork source unchanged: ${u.detail.join('; ')}. ` +
          'exemptFrom names the child-facing ceilings a quotation is exempt from; without it the ' +
          'gate refuses a legal item or passes an illegal one. Matched by quote TEXT, never position.',
      },
    });
  }

  const after = await prisma.item.findMany({
    where: { id: { in: updates.map((u) => u.id) } }, select: { id: true, stem: true, explanation: true },
  });
  let withExempt = 0;
  let ok = 0;
  for (const r of after) {
    const want = src.get(r.id)!;
    let good = true;
    for (const [key, holder] of [['stem', r.stem], ['explanation', r.explanation]] as const) {
      const wanted = want[key];
      if (!Array.isArray(wanted)) continue;
      const have = Array.isArray((holder as { quotes?: unknown })?.quotes)
        ? ((holder as { quotes: Quotes }).quotes) : [];
      for (const w of wanted) {
        const cur = have.find((q) => quoteText(q) === quoteText(w));
        if (!cur) { good = false; continue; }
        if (typeof w === 'object' && w !== null && typeof cur === 'object') {
          for (const [k, v] of Object.entries(w as Record<string, unknown>)) {
            if (v == null) continue;
            if (canonical((cur as Record<string, unknown>)[k]) !== canonical(v)) good = false;
          }
          if ((w as { exemptFrom?: unknown }).exemptFrom) withExempt += 1;
        }
      }
    }
    if (good) ok += 1;
  }
  console.log(`\nVERIFIED by re-reading all ${after.length} repaired rows:`);
  console.log(`  holding every declaration the source carries: ${ok} of ${after.length}`);
  console.log(`  quotes now carrying exemptFrom: ${withExempt}`);
  await prisma.$disconnect();
}

void main();
