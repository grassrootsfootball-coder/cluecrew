/**
 * HER SIGN-OFF CONDITION (ninety-ninth §3): the amended card's containment check against the FULL
 * option set of every P&P item it serves beside, through the standing three-part gate. LIVE only
 * on a clean, reported run; DRAFT on any hit — a hit is a key in the vault.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { threePartSet } from './lib/option-set';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const STOP = new Set("a an the and or of in on at to for it is was were not no his her he she they i you".split(' '));

async function main() {
  const card = await prisma.word.findUniqueOrThrow({ where: { id: 'gave-a-disgust' } });
  const cardText = `${card.headword} ${card.definitionChild} ${card.sentence}`.toLowerCase();
  const items = await prisma.item.findMany({ where: { id: { startsWith: 'ENG-002-pp-' } }, include: { options: true }, orderBy: { id: 'asc' } });
  requirePopulation('idiom-containment', { 'P&P item(s)': items.length });

  const hits: string[] = [];
  const rows: Array<Record<string, unknown>> = [];
  for (const i of items) {
    const set = threePartSet(i.options);
    const opts = [
      ...(set.key ? [{ value: set.key.value, isKey: true }] : []),
      ...set.siblings.map((s) => ({ value: s.value, isKey: false })),
    ];
    for (const o of opts) {
      const words = String(o.value).toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
      const turns = /disgust/i.test(String(o.value));
      const shared = words.filter((w) => cardText.includes(w));
      const leak = shared.length > 0 && shared.length / Math.max(1, words.length) >= 0.5;
      if (turns || leak) {
        hits.push(`${i.id} ${o.isKey ? '[KEY]' : ''} ${JSON.stringify(String(o.value)).slice(0, 60)} — ${turns ? 'turns on disgust' : ''}${leak ? ` card contains: ${shared.join(',')}` : ''}`);
      }
    }
    rows.push({ itemId: i.id, status: i.status, optionsScreened: opts.length });
  }

  console.log(`${items.length} P&P items · ${rows.reduce((n, r) => n + (r.optionsScreened as number), 0)} options screened (key + siblings; tags travel in the set builder)`);
  console.log(`${hits.length} hit(s).`);
  for (const h of hits) console.log(`  HIT ${h}`);

  let outcome: string;
  if (hits.length === 0 && items.length === 23) {
    /**
     * The DB's own invariant refused a bare status flip: `word_live_needs_reviewer` (R95's family)
     * requires a named reviewer on any LIVE row. That is exactly her sign-off, so it is recorded
     * where the constraint demands it — the review door's fields, not a side note.
     */
    const prior = await prisma.word.findUniqueOrThrow({ where: { id: 'gave-a-disgust' }, select: { reviewNotes: true } as never }) as { reviewNotes?: string | null };
    await prisma.word.update({ where: { id: 'gave-a-disgust' }, data: {
      status: 'LIVE',
      reviewedBy: 'Annie',
      reviewNotes: `${prior.reviewNotes ?? ''} | SIGNED as amended, annie-ninetyninth-return.md sha256 cb80fc2f… — LIVE conditional on this containment run, clean and reported`,
    } as never });
    outcome = 'CLEAN on all 23 — the card is LIVE per her confirmation (ninety-ninth: "LIVE on the containment check, run and reported").';
  } else if (items.length !== 23) {
    outcome = `REFUSED TO COMPLETE — ${items.length} P&P items found where her condition names twenty-three. The denominator disagrees with her ruling and the card stays DRAFT until that is resolved.`;
  } else {
    outcome = 'HITS FOUND — the card stays DRAFT; a hit is a key in the vault.';
  }
  console.log(outcome);

  const payload = {
    what: 'The idiom card\'s containment run — her sign-off condition, run and reported.',
    card: { id: card.id, headword: card.headword, definitionChild: card.definitionChild },
    denominators: { ppItems: items.length, optionsScreened: rows.reduce((n, r) => n + (r.optionsScreened as number), 0), hits: hits.length },
    hits,
    outcome,
    authority: 'annie-ninetyninth-return.md, sha256 cb80fc2f163b7768c465131251cab05cef6bbf96d5c2a5cf21cd1e3e106e5bf0 — CONFIRMATIONS: SIGNED as amended; LIVE on this run crossing',
    rows,
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'the idiom card containment run for her sign-off completion',
    ['what', 'card', 'denominators', 'hits', 'outcome', 'rows']);
  const out = join(REPO, 'content/exports', stampedName('idiom-card-containment-run', stamp.sourceHash, 'json'));
  writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(out, 'idiom-card-containment-run');
  await prisma.$disconnect();
}

void main();
