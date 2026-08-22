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
import { declaredCounts, describeShapes, readAmendments } from './lib/return-amendments';
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
  /**
   * **SURFACE amendments are declared OUT, never counted absent.** A group label is not a row in any
   * table this check reads, so searching for it finds nothing and reports the true absence of a
   * thing that was never here — the R60 fault wearing a correct answer.
   */
  const surface = amendments.filter((a) => a.kind === 'SURFACE');
  const found = amendments
    .filter((a) => a.kind === 'STORE')
    // `when` travels with the row. The first version of the SUPERSEDED test dropped it here and
    // compared against `undefined`, so every comparison was false and the class reported zero —
    // a true-looking count produced by a field that was never carried.
    .map((a) => ({ file: a.file, text: a.authored, targetId: a.targetId, when: a.when }));
  console.log(`  SHAPES READ:\n${describeShapes()}`);

  /**
   * **THE READER IS MEASURED AGAINST THE AUTHOR'S OWN COUNT BEFORE IT REPORTS ANYTHING.** Her block
   * declares how many amendments it carries. Extracting fewer is a READER FAULT, and it is the one
   * fault here no downstream check can ever see: an amendment that is not read is not absent, it is
   * INVISIBLE, and invisible reads as landed.
   */
  const declared = declaredCounts(RETURNS);
  const shortfalls = declared
    .map((d) => ({ ...d, read: amendments.filter((a) => a.file === d.file).length }))
    .filter((d) => d.read < d.declared);
  if (shortfalls.length > 0) {
    console.error(`\n  READER FAULT — ${shortfalls.length} return(s) declare more than was extracted.`);
    for (const s of shortfalls) {
      console.error(`    ${s.file}: block declares ${s.declared}, reader found ${s.read}`);
    }
    console.error(
      '  **Nothing below this line can be trusted for these returns.** An unread amendment is not\n'
      + '  reported absent — it is not reported at all, and the return prints as FULLY LANDED.',
    );
    process.exitCode = 1;
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
  /**
   * **EVERY ROW CARRIES ITS ID AS A FIELD, because the scoping matched on a string suffix and an
   * item row could never satisfy it.** `where` was `item:ENG-001-WIW-20(LIVE)`, and the scope test
   * was `where.endsWith(':' + targetId)` — true for a library row, true for a word row, and **false
   * for every item that has ever existed**, because the status suffix sits after the id. So an item
   * hint amendment could not be reported LANDED under any circumstances: it was either filed SURFACE
   * and declared out of scope, or filed STORE and reported ABSENT while the store held it verbatim.
   * Both readings were reassuring and wrong in opposite directions.
   */
  const haystack = [
    ...lib.map((m) => ({ id: m.id, where: `library:${m.id}`, text: m.childHint ?? '' })),
    ...items.map((i) => ({ id: i.id, where: `item:${i.id}(${i.status})`, text: String((i.explanation as { hintCore?: unknown })?.hintCore ?? '') })),
    ...words.map((w) => ({ id: w.id, where: `word:${w.id}`, text: String((w as { definitionChild?: unknown }).definitionChild ?? '') })),
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
  const unlanded: Array<{ file: string; text: string; targetId: string | null; when: Date }> = [];
  /** One normaliser for every comparison here — two would disagree, which is R429's whole finding. */
  const norm = (s: string) => s.trim().replace(/\.$/, '');
  for (const a of found) {
    /**
      * **EXACT, NOT SUBSTRING.** `includes` reports a landing whenever her wording happens to sit
      * inside a longer stored string — which is precisely what a PARTIAL application looks like.
      * Normalised for the trailing full stop the extractor strips, and for nothing else.
      */
    /**
      * **THE TARGET IS USED WHERE THE SHAPE CARRIES ONE.** Matching by wording alone across the
      * whole store answers "does this string exist somewhere", which is a weaker question than
      * "did this amendment reach ITS row" — and a wording that happens to match another entry
      * would report a landing on the wrong row.
      */
    const scoped = a.targetId ? haystack.filter((h) => h.id === a.targetId) : haystack;
    const hit = scoped.find((h) => norm(h.text) === norm(a.text));
    const e = byFile.get(a.file) ?? { landed: [], absent: [] };
    (hit ? e.landed : e.absent).push(a.text);
    byFile.set(a.file, e);
    if (!hit && a.targetId) unlanded.push(a);
  }

  /**
   * **SUPERSEDED IS NOT ABSENT, AND CONFLATING THEM MANUFACTURES WORK.** She amended `hostile`
   * three times across the thirty-ninth, fortieth and forty-first returns. The forty-first landed;
   * the two earlier wordings are not in the store and never should be. Reporting them as ABSENT
   * says two of her rulings were dropped, when what happened is that she changed her mind twice and
   * the store holds her latest word — **the outcome the whole return leg exists to produce.**
   *
   * The test is the TARGET, not the wording: another amendment to the SAME row, from a LATER
   * return, that DID land. Anything else is genuinely absent.
   */
  const landedByTarget = new Map<string, Date>();
  for (const a of amendments) {
    if (!a.targetId) continue;
    const scoped = haystack.filter((h) => h.id === a.targetId);
    if (!scoped.some((h) => norm(h.text) === norm(a.authored))) continue;
    const prev = landedByTarget.get(a.targetId);
    if (!prev || a.when > prev) landedByTarget.set(a.targetId, a.when);
  }
  const superseded = unlanded.filter((a) => {
    const t = landedByTarget.get(a.targetId as string);
    return t !== undefined && t > a.when;
  });
  const supersededSet = new Set(superseded.map((a) => `${a.file}|${a.text}`));
  const trulyAbsent = unlanded.filter((a) => !supersededSet.has(`${a.file}|${a.text}`));
  /**
   * **A THIRD CLASS, AND IT IS NOT A ROUNDING ERROR.** An amendment read from a shape that carries
   * no target cannot be scoped to a row, so "not found anywhere in the store" is the strongest thing
   * that can be said about it — and that is weaker than ABSENT. Counted separately, or the three
   * numbers do not add up and someone reconciles them by picking one.
   */
  const unplaceable = [...byFile.values()].reduce((n, e) => n + e.absent.length, 0) - unlanded.length;

  const partial: string[] = [];
  console.log('');
  console.log(
    `  SUPERSEDED — an EARLIER wording for a row whose LATER amendment did land: ${superseded.length}\n`
    + '  Not absent, and not work. She changed her mind and the store holds her latest word.'
    // `.text` — these rows are the projection, not the amendment. Reading `.authored` here printed
    // "undefined" for every superseded row: R568's own fault, in the turn after building its guard.
    + superseded.map((s) => `\n      ${s.file} — ${s.targetId}: "${s.text}"`).join('') + '\n',
  );
  for (const [file, e] of [...byFile].sort()) {
    const state = e.absent.length === 0 ? 'FULLY LANDED' : e.landed.length === 0 ? 'NONE LANDED  ' : 'PARTLY LANDED';
    if (state === 'PARTLY LANDED') partial.push(file);
    console.log(`  ${state}  ${file}  (${e.landed.length} in, ${e.absent.length} not in the store)`);
      for (const t of e.absent) {
      // The row list carries the SAME three labels as the summary. A list that says ABSENT while
      // the total says UNPLACEABLE invites the reader to reconcile them by choosing one.
      const tag = superseded.some((s) => s.file === file && s.text === t)
        ? 'SUPERSEDED '
        : unlanded.some((u) => u.file === file && u.text === t)
          ? 'ABSENT     '
          : 'UNPLACEABLE';
      console.log(`      ${tag}: "${t}"`);
    }
  }

  const absent = trulyAbsent.length;
  const absentIncludingSuperseded = [...byFile.values()].reduce((n, e) => n + e.absent.length, 0);
  console.log(
    `\n  ${absentIncludingSuperseded} wording(s) are not in the store, and they are three things:\n`
    + `      ${superseded.length} SUPERSEDED  — a later amendment to the same row DID land\n`
    + `      ${unplaceable} UNPLACEABLE — read from a shape carrying no target, so unscopeable to a row\n`
    + `      ${absent} ABSENT      — a ruling with a named row, and the row does not hold it`,
  );
  console.log(
    `\n  SURFACE amendment(s), declared OUT OF SCOPE and NOT counted above: ${surface.length}`
    + surface.map((s) => `\n      ${s.file} — ${s.target}: "${s.authored}"`).join(''),
  );
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
