/**
 * A CARD IS GATED AGAINST THE WHOLE OPTION SET (Annie, 2026-08-21 — R472).
 *
 * **The gate she specified on the eighteenth checked ONE property of four**: does the card contain
 * the key. Every redraft passed it, and two of today's redrafts closed a key leak while opening a
 * DISTRACTOR leak on the same card — invisible to a key-only check.
 *
 * So: **key AND every distractor, on EVERY ITEM the card serves.** A card serving four items is
 * gated against four option sets, because a phrase innocent on one item is a giveaway on another.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const inCard = (card: string, v: string) => {
  const k = v.trim().toLowerCase();
  return k.length >= 3 && card.toLowerCase().includes(k);
};

export interface Collision { item: string; status: string; headword: string; card: string; value: string; role: 'KEY' | 'DISTRACTOR'; tag: string | null }

export async function cardOptionSetCollisions(only?: string[]): Promise<{ collisions: Collision[]; screened: number }> {
  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });
  const words = await prisma.word.findMany({ select: { headword: true, definitionChild: true, status: true } });
  const card = new Map(words.map((w) => [w.headword.toLowerCase(), w]));
  const collisions: Collision[] = [];
  let screened = 0;
  for (const i of items) {
    const ws = (i.stem as { words?: unknown })?.words;
    const h = Array.isArray(ws) ? ws[0] : undefined;
    if (typeof h !== 'string') continue;
    if (only && !only.includes(h.toLowerCase())) continue;
    const w = card.get(h.toLowerCase());
    if (!w?.definitionChild) continue;
    screened++;
    for (const o of i.options) {
      const v = ((o as { content?: { value?: unknown } }).content ?? {}).value;
      if (typeof v !== 'string') continue;
      if (!inCard(w.definitionChild, v)) continue;
      collisions.push({
        item: i.id, status: i.status, headword: w.headword, card: w.definitionChild,
        value: v, role: o.isCorrect ? 'KEY' : 'DISTRACTOR',
        tag: (o as { misconceptionId?: string | null }).misconceptionId ?? null,
      });
    }
  }
  return { collisions, screened };
}

async function main() {
  const { collisions, screened } = await cardOptionSetCollisions();
  requirePopulation('check:card-option-set', { 'item-and-card pair(s)': screened });
  const keys = collisions.filter((c) => c.role === 'KEY');
  const dis = collisions.filter((c) => c.role === 'DISTRACTOR');
  console.log(`\n  KEY in card       : ${keys.length}\n  DISTRACTOR in card: ${dis.length}`);
  if (collisions.length === 0) { await prisma.$disconnect(); return; }
  for (const c of collisions) {
    console.log(`  ${c.role.padEnd(10)} ${c.item} (${c.status})  "${c.headword}" card "${c.card}"\n      collides on: "${c.value}"${c.tag ? `  tag=${c.tag}` : ''}`);
  }
  process.exitCode = 1;
  await prisma.$disconnect();
}

if (process.argv[1]?.endsWith('check-card-option-set.ts')) void main();
