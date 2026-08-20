/**
 * DO THE TWO STORES HOLD THE SAME ITEMS? (David, 2026-08-20 — R355.)
 *
 * `check:declaration-sets` found `ENG-019-BV-02` — an item Cowork holds and this store does not —
 * **by accident.** A declaration set compares DECLARATIONS; it surfaced a missing item only because
 * that item happened to carry two of them. **If the two stores hold different item populations in
 * the same bank, that is a bigger question than 64 declarations**, and nothing was asking it.
 *
 * **WHAT THIS COMPARES, AND WHAT IT DOES NOT — the bound is the whole honesty of the check.**
 * It compares our item table against **every item id appearing in any Cowork artefact we hold.**
 * That is NOT Cowork's item population. An item Cowork holds that appears in none of the artefacts
 * it has sent is invisible here and always will be. **Only Cowork can report Cowork's population**,
 * exactly as only the receiving store can report arrival (R255).
 *
 * So the two findings are asymmetric and are labelled differently:
 *
 *   THEIRS_NOT_OURS   an id in their artefacts with no row here. A REAL divergence — they named it,
 *                     so it exists there, and it does not exist here.
 *   OURS_NOT_MENTIONED  a row here no artefact of theirs names. **NOT a divergence** — it is the
 *                     limit of the instrument, and it is reported as a COUNT, never as a finding.
 *
 * The id pattern is DERIVED from our own ids (R57), never hand-written: every distinct id shape in
 * the item table becomes a matcher, so a new family cannot silently fall outside the scan.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const DOWNLOADS = '/Users/davidb/Downloads';

function inboundFiles(): string[] {
  const dirs = [DOWNLOADS, join(DOWNLOADS, '11+')];
  try {
    for (const d of readdirSync(join(DOWNLOADS, '11+'))) {
      const p = join(DOWNLOADS, '11+', d);
      try {
        if (statSync(p).isDirectory() && !p.endsWith('from-cluecrew')) dirs.push(p);
      } catch { /* unreadable entry */ }
    }
  } catch { /* no 11+ directory */ }
  const files: string[] = [];
  for (const d of dirs) {
    try {
      for (const n of readdirSync(d)) {
        if (/\.(json|md|txt|jsonl)$/i.test(n)) {
          const p = join(d, n);
          try {
            if (statSync(p).isFile()) files.push(p);
          } catch { /* unreadable */ }
        }
      }
    } catch { /* unreadable dir */ }
  }
  return files;
}

/**
 * One regex per distinct id SHAPE in our own table — `ENG-001-WIW-06` becomes
 * `ENG-\d+-WIW-\d+`. Derived, so a family added tomorrow is scanned tomorrow.
 */
function matchersFrom(ids: readonly string[]): RegExp[] {
  const shapes = new Set<string>();
  for (const id of ids) {
    shapes.add(id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\d+/g, '\\d+'));
  }
  return [...shapes].map((s) => new RegExp(`\\b${s}\\b`, 'g'));
}

async function main() {
  const rows = await prisma.item.findMany({ select: { id: true, status: true } });
  const ours = new Map(rows.map((r) => [r.id, r.status]));
  const matchers = matchersFrom([...ours.keys()]);

  const mentioned = new Map<string, string[]>();
  const files = inboundFiles();
  for (const file of files) {
    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const re of matchers) {
      re.lastIndex = 0;
      for (const m of text.matchAll(re)) {
        mentioned.set(m[0], [...(mentioned.get(m[0]) ?? []), file]);
      }
    }
  }

  requirePopulation('check:item-population', {
    'item(s) here': ours.size,
    'inbound artefact(s) scanned': files.length,
    'distinct item id(s) named in them': mentioned.size,
  });

  const theirsNotOurs = [...mentioned.keys()].filter((id) => !ours.has(id)).sort();
  const oursNotMentioned = [...ours.keys()].filter((id) => !mentioned.has(id)).length;

  console.log(
    `\n  OURS_NOT_MENTIONED: ${oursNotMentioned} — reported as a COUNT and never as a finding.\n` +
      '  It is the limit of this instrument, not a divergence: an item of ours that no artefact of\n' +
      "  theirs happens to name says nothing about whether they hold it.",
  );

  if (theirsNotOurs.length === 0) {
    console.log(
      '\ncheck:item-population: 0 items named in their artefacts are missing here.\n' +
        '  This does NOT say the two populations match — only Cowork can report Cowork\'s population.',
    );
    await prisma.$disconnect();
    return;
  }

  console.error(`\nTHEIRS_NOT_OURS — named in a Cowork artefact, no row in this store: ${theirsNotOurs.length}`);
  for (const id of theirsNotOurs) {
    const where = [...new Set(mentioned.get(id) ?? [])];
    // Siblings place the gap: BV-02 absent while BV-09..12 are present is a different fact from a
    // whole family being absent, and the two want different explanations.
    const stem = id.replace(/\d+$/, '');
    const siblings = [...ours.keys()].filter((o) => o.startsWith(stem)).sort();
    console.error(`  ${id}`);
    console.error(`      named in: ${where.map((w) => w.replace(`${DOWNLOADS}/`, '')).join(', ')}`);
    console.error(
      siblings.length > 0
        ? `      siblings HERE: ${siblings.join(', ')} — the family exists, this member does not`
        : '      no siblings here — the whole family is absent from this store',
    );
  }
  console.error(
    '\n  Each is an ITEM-POPULATION divergence, not a declaration one. A declaration set would only\n' +
      '  ever surface these by accident, and did: ENG-019-BV-02 was found because it carried two\n' +
      '  declarations, not because anything was comparing item populations.',
  );
  await prisma.$disconnect();
  process.exitCode = 1;
}

void main();
