/**
 * A PROPOSAL NAMING A CARRIER'S KEY IS MAKING A CHECKABLE CLAIM ABOUT THE STORE (Annie, 2026-08-21
 * — R508). **Nothing compared them.**
 *
 * `narrator-redraft-proposal-0413f8eef6a156f8.json` recorded
 * *"ENG-002-pp-23 … key: \"We are told what the writer thinks…\""*. **It is a DISTRACTOR.** She
 * approved the entry's hint quoting that proposal, and the misdescription stood for five days.
 *
 * **ONE LINE: READ THE ROW.** A proposal citing `key:` beside an item id is asserting which option
 * carries `isCorrect`, and the store can answer that in a single query. **It would have stopped this
 * at the source rather than five days later.**
 *
 * **It is the claim ledger with a PROPOSAL as the text and ONE ROW as the object** — the same shape
 * as a walk script against its cited lines, and the reason it belongs in code rather than in a
 * reading is that the object is a database row, not prose.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const DIRS = ['/Users/davidb/Downloads', '/Users/davidb/Downloads/11+/from-cluecrew'];
/** `ENG-002-pp-23 (DRAFT, en-comp-technique) — key: "…"` and the plainer `key: "…"` beside an id. */
/**
 * **THE OPTIONAL BACKSLASH IS THE WHOLE FIX.** Inside a JSON file the claim reads
 * `key: \"We are told…\"`, so a pattern demanding a quote immediately after `key:` finds a
 * BACKSLASH and matches nothing. The first run screened 944 artefacts and found ZERO key-claims —
 * and `requirePopulation` aborted it rather than printing that zero (R453 again, second time this
 * session a wrong scope query was caught before it became a number).
 */
const CLAIM = /([A-Za-z]{2,}-[\w-]*\d[\w-]*)[^"\n]{0,90}?\bkey:\s*\\?["“]([^"”\\\n]{4,200})\\?["”]/g;

async function main() {
  const files: string[] = [];
  for (const d of DIRS) {
    let names: string[];
    try { names = readdirSync(d); } catch { continue; }
    for (const n of names) {
      if (!/\.(json|md)$/.test(n)) continue;
      const p = join(d, n);
      try { if (statSync(p).isFile()) files.push(p); } catch { /* unreadable */ }
    }
  }

  const claims: Array<{ file: string; item: string; claimedKey: string }> = [];
  for (const f of files) {
    let body: string;
    try { body = readFileSync(f, 'utf8'); } catch { continue; }
    CLAIM.lastIndex = 0;
    for (const m of body.matchAll(CLAIM)) {
      claims.push({ file: f.split('/').pop()!, item: m[1]!, claimedKey: m[2]!.trim() });
    }
  }

  requirePopulation('check:proposal-carriers', {
    'artefact(s) scanned': files.length,
    'key-claim(s) found': claims.length,
  });

  const ids = [...new Set(claims.map((c) => c.item))];
  const rows = await prisma.item.findMany({ where: { id: { in: ids } }, include: { options: true } });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const wrong: string[] = [];
  let checked = 0;
  for (const c of claims) {
    const row = byId.get(c.item);
    if (!row) continue;
    checked++;
    const key = row.options.find((o) => o.isCorrect);
    const actual = String(((key as { content?: { value?: unknown } } | undefined)?.content ?? {}).value ?? '');
    const norm = (s: string) => s.trim().replace(/\.$/, '').toLowerCase();
    if (norm(actual) === norm(c.claimedKey)) continue;
    const asOption = row.options.find((o) => norm(String(((o as { content?: { value?: unknown } }).content ?? {}).value ?? '')) === norm(c.claimedKey));
    wrong.push(
      `  ${c.file}\n      claims  ${c.item} key: "${c.claimedKey}"\n`
      + `      the row: key is "${actual}"\n`
      + `      the claimed string is ${asOption ? (asOption.isCorrect ? 'the key' : 'a DISTRACTOR on that row') : 'not on that row at all'}`,
    );
  }

  console.log(`\n  ${checked} claim(s) resolvable against the store · ${claims.length - checked} name an item this store does not hold`);
  if (wrong.length === 0) {
    console.log('  Every proposal that names a carrier key names it correctly.');
    await prisma.$disconnect();
    return;
  }
  console.error(`\nPROPOSALS MISDESCRIBING A CARRIER'S KEY: ${wrong.length}`);
  wrong.forEach((w) => console.error(w));
  process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
