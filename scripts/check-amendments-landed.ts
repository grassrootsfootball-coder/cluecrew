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
import { describeShapes, readAmendments } from './lib/return-amendments';
import { requirePopulation } from './lib/population';

const RETURNS = '/Users/davidb/Downloads';
/**
 * **TWO SHAPES, AND MISSING ONE MADE THE CHECK REPORT A FALSE LANDING.**
 *
 * The labelled form — `- authored: **…**` — and the INLINE form her eighteenth return uses
 * throughout: `` - `entry-id`, replacing *old text*: **new text** ``. The first version read only
 * the labelled form, so it extracted ONE amendment from a return carrying many, and every
 * unextracted amendment was invisible rather than absent.
 *
 * **A check that cannot see an amendment reports the return as clean**, which is worse than
 * reporting it missing: an absence gets worked and a false landing closes the row.
 */
// ONE READER (R429). This script and `apply-all-unlanded` import the same parser, so they cannot
// disagree about what a record contains — which is what orphaned `en-attribute-transfer`.

async function main() {
  const { amendments, files } = readAmendments(RETURNS);
  const found = amendments.map((a) => ({ file: a.file, text: a.authored, targetId: a.targetId }));
  console.log(`  SHAPES READ:\n${describeShapes()}`);

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
    '\n  SCOPE: misconception childHint (VR entries included), item hintCore, Word definitionChild.\n' +
      '  The earlier "VR hint text is out of scope" line was WRONG: `vr14-step-size` and\n' +
      '  `vr-letter-series-direction` are misconception rows and were always in scope. The exclusion\n' +
      '  was mine, and it read as a property of the store — which is the same fault as calling a\n' +
      '  target absent when it lives in a table the WRITER, not the reader, was not touching.',
  );

  const byFile = new Map<string, { landed: string[]; absent: string[] }>();
  for (const a of found) {
    /**
      * **EXACT, NOT SUBSTRING.** `includes` reports a landing whenever her wording happens to sit
      * inside a longer stored string — which is precisely what a PARTIAL application looks like.
      * Normalised for the trailing full stop the extractor strips, and for nothing else.
      */
    const norm = (s: string) => s.trim().replace(/\.$/, '');
    /**
      * **THE TARGET IS USED WHERE THE SHAPE CARRIES ONE.** Matching by wording alone across the
      * whole store answers "does this string exist somewhere", which is a weaker question than
      * "did this amendment reach ITS row" — and a wording that happens to match another entry
      * would report a landing on the wrong row.
      */
    const scoped = a.targetId ? haystack.filter((h) => h.where.endsWith(`:${a.targetId}`)) : haystack;
    const hit = scoped.find((h) => norm(h.text) === norm(a.text));
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
