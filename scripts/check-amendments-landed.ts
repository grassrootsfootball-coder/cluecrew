/**
 * WHICH OF HER AMENDMENTS ACTUALLY LANDED? (David, 2026-08-21 — R403.)
 *
 * **A batch that half-lands is invisible to a check that treats a delivery as a unit**, and both
 * stores have been assuming exactly that. `en-apostrophe-possession` holds her 18 August amendment;
 * `en-paired-punctuation`, amended in the same breath, does not.
 *
 * This takes every authored wording from every return she has written and checks each against the
 * store — **present, absent, or landed alongside siblings that did not.**
 *
 * **ITS BOUND, STATED** (R60): it can only find amendments written in the shapes her returns use
 * (`- authored: **…**`, `replacement: **…**`). An amendment phrased in running prose is invisible
 * here, so **the absent count is a floor, not a census** — and the amendments it cannot see are the
 * ones most likely to have been missed, since a value in prose is what R25 exists to refuse.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const RETURNS = '/Users/davidb/Downloads';
const AUTHORED = /^\s*[-*]?\s*(?:authored|Authored|replacement)\s*:\s*\*\*(.+?)\*\*/gm;

async function main() {
  const files = readdirSync(RETURNS).filter((f) => /^annie-.*return.*\.md$/.test(f)).sort();
  const found: Array<{ file: string; text: string }> = [];
  for (const f of files) {
    const body = readFileSync(join(RETURNS, f), 'utf8');
    for (const m of body.matchAll(AUTHORED)) found.push({ file: f, text: m[1].trim().replace(/\.$/, '') });
  }

  const lib = await prisma.misconception.findMany({ select: { id: true, childHint: true } });
  const items = await prisma.item.findMany({ select: { id: true, status: true, explanation: true } });
  /**
   * **THE SCOPE IS NAMED, BECAUSE OUT-OF-SCOPE AND NOT-APPLIED LOOK IDENTICAL IN A COUNT THAT DOES
   * NOT NAME IT** (David, 2026-08-21). The first version searched misconception hints and item
   * `hintCore` only, and reported a Word card definition and a VR hint as ABSENT — they are real
   * amendments with real targets, in stores it was not looking at. Word cards are now searched;
   * **VR hints remain OUT and are declared so on the face of every run.**
   */
  const words = await prisma.word.findMany({ select: { id: true, definitionChild: true } }).catch(() => []);
  const haystack = [
    ...lib.map((m) => ({ where: `library:${m.id}`, text: m.childHint ?? '' })),
    ...items.map((i) => ({ where: `item:${i.id}(${i.status})`, text: String((i.explanation as { hintCore?: unknown })?.hintCore ?? '') })),
    ...words.map((w) => ({ where: `word:${w.id}`, text: String((w as { definitionChild?: unknown }).definitionChild ?? '') })),
  ];

  requirePopulation('check:amendments-landed', {
    'return file(s)': files.length,
    'authored wording(s) found': found.length,
    'store row(s) searched': haystack.length,
  });
  console.log(
    '\n  SCOPE: misconception childHint, item hintCore, Word definitionChild.\n' +
      '  NOT SEARCHED: VR hint text. An amendment whose target is a VR hint reports ABSENT here and\n' +
      '  may well have landed — out-of-scope and not-applied are indistinguishable unless the scope\n' +
      '  is named, which is why it is named on every run.',
  );

  const byFile = new Map<string, { landed: string[]; absent: string[] }>();
  for (const a of found) {
    const hit = haystack.find((h) => h.text.includes(a.text));
    const e = byFile.get(a.file) ?? { landed: [], absent: [] };
    (hit ? e.landed : e.absent).push(a.text);
    byFile.set(a.file, e);
  }

  const partial: string[] = [];
  console.log('');
  for (const [file, e] of [...byFile].sort()) {
    const state = e.absent.length === 0 ? 'FULLY LANDED' : e.landed.length === 0 ? 'NONE LANDED  ' : 'PARTLY LANDED';
    if (state === 'PARTLY LANDED') partial.push(file);
    console.log(`  ${state}  ${file}  (${e.landed.length} in, ${e.absent.length} absent)`);
    for (const t of e.absent) console.log(`      ABSENT: "${t}"`);
  }

  const absent = [...byFile.values()].reduce((n, e) => n + e.absent.length, 0);
  console.log(
    `\n  ${found.length} authored wording(s) across ${byFile.size} return(s): ` +
      `${found.length - absent} landed, ${absent} absent.\n` +
      `  PARTLY LANDED returns: ${partial.length}${partial.length ? ` — ${partial.join(', ')}` : ''}\n` +
      '\n  A PARTLY LANDED return is the finding. A delivery treated as a unit reports it as\n' +
      '  delivered, and every downstream check agrees, because each amendment is individually\n' +
      '  plausible whether or not its siblings arrived.',
  );
  if (absent > 0) process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
