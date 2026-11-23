/**
 * THE 553 THAT NEVER ARRIVED — landing what R758's door dropped in silence.
 *
 * **THIS SCRIPT WRITES REVIEWED CONTENT WITHOUT THE DERIVED-WRITE GUARD, AND THAT IS CORRECT
 * (R63).** Every value it writes was AUTHORED BY A PERSON in a batch file; none is computed by a
 * derivation function, so no code change can alter what it writes. It is a ruling-applier, and the
 * ruling is R758: the door dropped these, so they are landed from the authored source.
 *
 * **IT NEVER OVERWRITES.** A field already holding a value is left alone and reported — as EQUAL
 * where it matches the authored source and as DIVERGED where it does not, because a diverged field
 * is a two-store question and not a fill-in-the-blank. Only NULL becomes non-null.
 *
 * Child-facing content is not touched at all: the fields here are reviewer-facing columns
 * (`misconceptionExecution`, `tagStatus`, …) and retention keys.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { requirePopulation } from './lib/population';

const APPLY = process.argv.includes('--apply');
const DIRS = [join(__dirname, '..', 'content'), '/Users/davidb/Downloads/11+'];
const KNOWN_AUTHORED = new Set(['label', 'content', 'isCorrect', 'misconceptionId']);
/** Read out of the schema itself, so a new column is covered the day it lands (R57). */
const OPTION_COLUMNS = (() => {
  const schema = readFileSync(join(__dirname, '..', 'packages/db/prisma/schema.prisma'), 'utf8');
  const model = /^model ItemOption \{$([\s\S]*?)^\}$/m.exec(schema);
  if (!model?.[1]) throw new Error('could not read model ItemOption from schema.prisma — refusing rather than treating every authored key as unknown (R173)');
  const names = [...model[1].matchAll(/^\s{2}(\w+)\s+\S/gm)].map((m) => m[1]!)
    .filter((n) => !['id', 'itemId', 'item', 'content', 'isCorrect', 'misconceptionId', 'misconception', 'tags'].includes(n));
  if (names.length === 0) throw new Error('read no ItemOption columns — refusing (R173)');
  return new Set(names);
})();

interface Src { file: string; itemId: string; label?: string; content: string; key: string; value: unknown }

const identities = new Map<string, string>();
const conflicts = new Set<string>();

function collect(): Src[] {
  const out: Src[] = [];
  const seen = new Set<string>();
  const walkDir = (dir: string, depth = 0): string[] => {
    if (depth > 4) return [];
    let entries: string[] = [];
    try { entries = readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walkDir(join(dir, e.name), depth + 1) : (e.name.endsWith('.json') ? [join(dir, e.name)] : [])); }
    catch { return []; }
    return entries;
  };
  for (const file of DIRS.flatMap((d) => walkDir(d))) {
    let parsed: unknown;
    try { parsed = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
    const items = (parsed as { items?: unknown })?.items;
    if (!Array.isArray(items) || items.length === 0) continue;
    const shaped = items.every((i) => i && typeof i === 'object' && 'itemId' in i && 'questionTypeId' in i && Array.isArray((i as { options?: unknown }).options));
    if (!shaped) continue;
    for (const item of items as Array<Record<string, unknown>>) {
      for (const option of item.options as Array<Record<string, unknown>>) {
        if (typeof option?.content !== 'string') continue;
        for (const [key, value] of Object.entries(option)) {
          if (KNOWN_AUTHORED.has(key)) continue;
          if (value === null || value === undefined || value === '') continue;
          const fingerprint = `${item.itemId}|${option.label ?? option.content}|${key}|${JSON.stringify(value)}`;
          if (seen.has(fingerprint)) continue;
          seen.add(fingerprint);
          /**
           * **THE COPIES DISAGREE, AND THIS REFUSES RATHER THAN PICKING** (R762). Two files named
           * `eng006-draft.json` sit in different directories and disagree about what option B of
           * ENG-006-TM-02 IS and which option is CORRECT. The first version of this script matched
           * by label, took whichever copy it walked into first, and wrote a DISTRACTOR's execution
           * onto the KEY. Measured across the authored files: 135 (item, label) pairs disagree,
           * 48 of them about which option is correct, over 36 items.
           */
          const identity = `${item.itemId}|${option.label ?? ''}`;
          const shape = `${option.content}|${option.isCorrect === true}`;
          const prior = identities.get(identity);
          if (prior && prior !== shape) conflicts.add(identity);
          else if (!prior) identities.set(identity, shape);
          out.push({ file: file.split('/').slice(-1)[0]!, itemId: String(item.itemId), label: option.label as string | undefined, content: option.content, key, value });
        }
      }
    }
  }
  return out;
}

async function run() {
  assertFixture('dropped-option-fields', [
    { name: 'a column key is landable', input: 'misconceptionExecution', mustBeCaught: true },
    { name: 'a second column key is landable', input: 'tagStatus', mustBeCaught: true },
    { name: 'a retention key is not a column', input: '_previousMisconceptionId', mustBeCaught: false },
    { name: 'a key with no column anywhere is not landable', input: 'secondaryMisconceptionId', mustBeCaught: false },
  ], (k) => OPTION_COLUMNS.has(k));

  const sources = collect();
  requirePopulation('land:dropped-option-fields', { 'authored option field values found': sources.length });

  if (conflicts.size > 0) {
    console.error(`\nREFUSING: ${conflicts.size} (item, label) identities are described differently by different authored copies.`);
    console.error('  A value cannot be landed against an option whose identity two sources disagree about — matching by');
    console.error('  label across disagreeing copies is how a distractor\'s rationale reached a KEY on the first run.');
    for (const c of [...conflicts].slice(0, 6)) console.error(`    ${c}`);
    console.error('  Name the authoritative source and re-run against it alone. This script will not choose (R762).');
    process.exit(1);
  }

  const byKey = sources.reduce<Record<string, number>>((a, s) => { a[s.key] = (a[s.key] ?? 0) + 1; return a; }, {});
  console.log(`authored values found: ${sources.length}`);
  console.log(`  by key: ${JSON.stringify(byKey)}`);

  const outcome = { landed: 0, alreadyEqual: 0, DIVERGED: 0, noColumn: 0, retention: 0, noMatchingRow: 0, noMatchingOption: 0 };
  const diverged: Array<Record<string, unknown>> = [];
  const unmatched: string[] = [];

  for (const s of sources) {
    if (!OPTION_COLUMNS.has(s.key)) { if (s.key.startsWith('_')) outcome.retention++; else outcome.noColumn++; continue; }
    const item = await prisma.item.findUnique({ where: { id: s.itemId }, select: { id: true, options: { orderBy: { id: 'asc' }, select: { id: true, content: true, misconceptionExecution: true, tagStatus: true } } } });
    if (!item) { outcome.noMatchingRow++; unmatched.push(`${s.itemId} (no item)`); continue; }
    const match = item.options.find((o) => {
      const c = o.content as Record<string, unknown>;
      return (s.label && c.label === s.label) || c.value === s.content;
    });
    if (!match) { outcome.noMatchingOption++; unmatched.push(`${s.itemId} · ${s.label ?? s.content.slice(0, 24)} (no option)`); continue; }
    const current = (match as unknown as Record<string, unknown>)[s.key];
    if (current === null || current === undefined) {
      if (APPLY) await prisma.itemOption.update({ where: { id: match.id }, data: { [s.key]: s.value } as never });
      outcome.landed++;
    } else if (current === s.value) outcome.alreadyEqual++;
    else { outcome.DIVERGED++; diverged.push({ itemId: s.itemId, option: s.label ?? s.content.slice(0, 30), key: s.key, onTheRow: current, authored: s.value, file: s.file }); }
  }

  console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN — nothing written'}`);
  console.log(`  landed (was NULL):        ${outcome.landed}`);
  console.log(`  already present, equal:   ${outcome.alreadyEqual}`);
  console.log(`  already present, DIVERGED:${outcome.DIVERGED}   ← not overwritten; a two-store question`);
  console.log(`  retention keys (not columns, carried in content by the door): ${outcome.retention}`);
  console.log(`  keys with no column anywhere (the door now refuses these):    ${outcome.noColumn}`);
  console.log(`  no matching item / option: ${outcome.noMatchingRow} / ${outcome.noMatchingOption}`);
  for (const d of diverged.slice(0, 8)) console.log(`    DIVERGED ${d.itemId} · ${d.key}`);
  if (unmatched.length) console.log(`  unmatched sample: ${[...new Set(unmatched)].slice(0, 5).join(' | ')}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
