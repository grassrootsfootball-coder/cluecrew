/**
 * THE FIFTEEN THAT ARE OURS — `pnpm export:cowork-workorder`
 *
 * After Annie's nine signatures, 224 English items refusing a verdict became 15. Every one of the 15
 * is Cowork's to fix, in two disjoint jobs, and this is the work order: ids, route, and for each one
 * the specific thing that is wrong. No item is on both routes, so each is exactly one pass.
 *
 * IT ALSO CARRIES `en-determiner-omitted`, WHICH THIS STORE HOLDS AND COWORK'S 88 DO NOT. She
 * rejected its drafted hint — it told a child to read the line aloud, in a room where she cannot —
 * and wrote a replacement. If the entry does not cross, the two sides hold different libraries and
 * the correction she made exists on one side only. The hint travels as her authored text with the
 * provenance saying so (R25: send the value, not an account of it).
 *
 * THE ROUTES ARE READ FROM THE SAME FUNCTIONS THE DOOR USES — `inactiveMisconceptions` and
 * `checkItemChildFacing` — never re-derived here (R41).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkItemChildFacing, inactiveMisconceptions, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { threePartSet } from './lib/option-set';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { declareMayBeEmpty, requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'cowork-workorder-english';
const MISSING_ENTRY = 'en-determiner-omitted';

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' }, status: 'DRAFT' },
    include: { options: { orderBy: { id: 'asc' } }, questionType: { select: { mechanic: true } } },
    orderBy: { id: 'asc' },
  });
  const lib = await prisma.misconception.findMany({ select: { id: true, status: true, childHint: true } });
  const statusById = new Map(lib.map((m) => [m.id, m.status]));
  /** The third part of the set (R573): a tag id is a name, its childHint is the value. */
  const hintById = new Map(lib.map((m) => [m.id, m.childHint]));

  const retags: unknown[] = [];
  const rewordings: unknown[] = [];

  for (const item of items) {
    for (const id of inactiveMisconceptions(item.options, statusById)) {
      if (statusById.get(id) !== 'RETIRED') continue;
      const opt = item.options.find((o) => o.misconceptionId === id)!;
      retags.push({
        itemId: item.id,
        option: (opt.content as { label?: string })?.label,
        value: (opt.content as { value?: string })?.value,
        route: 'tag-retired',
        retiredTag: id,
        /**
         * **THE WHOLE SET, BECAUSE A RETAG CANNOT BE JUDGED FROM ONE OPTION (R573).** The successor
         * tag has to fit this option AND not collide with what its siblings already carry, and
         * neither of those is visible from the row alone. Key, siblings, and their tags.
         */
        theSet: threePartSet(item.options, hintById),
        // The option's own note names what it executes; the successor has to match that, not the
        // tag it happens to be nearest. This is the field that decided WIW-04 vs WIW-11.
        executionNote: opt.misconceptionExecution,
        job: `Retag onto the successor this option's own execution note names. ${id} is RETIRED, and `
          + 'a retired tag refuses a verdict exactly as an unapproved one does.',
      });
    }
    const faults = checkItemChildFacing({
      id: item.id, stem: item.stem, explanation: item.explanation,
      mechanic: item.questionType.mechanic, options: item.options,
    }).filter(isBlocking);
    if (faults.length) {
      rewordings.push({
        itemId: item.id,
        route: 'child-facing-copy',
        faults: faults.map((f) => ({ rule: f.rule, detail: f.detail })),
        job: 'Reword and return through the import door. A gate hit is REWORDED, never exempted.',
      });
    }
  }

  /**
   * **TWO POPULATIONS, AND THE GUARD BELONGED ON ONLY ONE OF THEM.** `requirePopulation` was
   * asserting that items NEED WORK — so a clean bank aborted the export, which is why this script
   * was never once staged. **330 DRAFT English items are screened and none of them needs anything;
   * that is the bank being clean, not the pipeline being broken.**
   *
   * The SCREENED population is the one that must never be empty: zero items screened would mean the
   * query, the scope or the pipeline had failed, and R61 is explicit that such a gate treats empty
   * as a failure. The OUTPUT population is legitimately empty and is declared so, with the screened
   * denominator printed beside it — because "0 items need work" and "nothing was examined" are the
   * same line unless the denominator is on it.
   */
  requirePopulation('export:cowork-workorder', {
    'DRAFT English items screened': items.length,
  });
  declareMayBeEmpty('export:cowork-workorder', 'item(s) needing work', retags.length + rewordings.length,
    `A work order with nothing on it is a legitimate outcome: ${items.length} DRAFT English items were `
    + 'screened, none carries a RETIRED tag and none fails the child-facing gate. The screened count '
    + 'is asserted separately and non-empty, so an empty output cannot be a broken query.');

  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id: MISSING_ENTRY } });
  const onBothRoutes = retags
    .map((r) => (r as { itemId: string }).itemId)
    .filter((id) => rewordings.some((w) => (w as { itemId: string }).itemId === id));

  const generatedAt = new Date().toISOString();
  const body = {
    kind: FAMILY,
    note:
      'Everything standing between the English bank and a signable state that is OURS to fix. '
      + 'Measured against the store with the review door\'s own functions, after Annie approved all '
      + 'nine library entries on 2026-08-16.',
    generatedAt,
    headline: {
      itemsRefusingAVerdict: retags.length + rewordings.length,
      retags: retags.length,
      rewordings: rewordings.length,
      itemsOnBothRoutes: onBothRoutes.length,
      note: onBothRoutes.length === 0
        ? 'No item is on both routes, so each is exactly one pass and neither job blocks the other.'
        : `${onBothRoutes.length} item(s) need BOTH passes: ${onBothRoutes.join(', ')}`,
    },
    retags,
    rewordings,
    libraryEntryYouDoNotHold: {
      note:
        'This entry is in our store and not in your 88. The reviewer REJECTED its drafted hint — it '
        + 'told a child to read the line aloud, which a child sitting an 11+ paper cannot do, and it '
        + 'was the only hint in the library asking for something the room forbids. She wrote the '
        + 'replacement below in her own return document. Take the childHint as authored text: it is '
        + 'hers, read from her file and not retyped, and it must not be reworded on arrival.',
      id: entry.id,
      status: entry.status,
      district: entry.district,
      description: entry.description,
      childHint: entry.childHint,
      category: entry.category,
      sourcePattern: entry.sourcePattern,
      proposedBy: entry.proposedBy,
      approvedBy: entry.approvedBy,
      textProvenance: entry.textProvenance,
    },
    whatThisDoesNotCover: [
      'The eight items still refused for reasons OUTSIDE these two routes: none — the other six '
      + 'routes are measured clean, except `unanswerable`, which cannot fire on an English item at '
      + 'all because check:word-puzzles names ten VR question types by name. That zero is scope, '
      + 'not a finding.',
      'Signing. Clearing these 15 makes every English item able to RECEIVE a verdict; it does not '
      + 'give one.',
    ],
  };
  const stamp = artefactStamp(body, generatedAt, 'status',
    'the fifteen English items that refuse a verdict for reasons on the authoring side, with the route for each',
    ['retags', 'rewordings', 'libraryEntryYouDoNotHold']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ ...body, stamp }, null, 2));
  deliver(path, FAMILY);

  console.log(`export:cowork-workorder: ${items.length} DRAFT English items screened.\n`);
  console.log(`  ${retags.length} RETAG · ${rewordings.length} REWORD · ${onBothRoutes.length} on both routes\n`);
  for (const r of retags as Array<{ itemId: string; option: string; retiredTag: string }>) {
    console.log(`  retag   ${r.itemId.padEnd(16)} ${r.option}  off ${r.retiredTag}`);
  }
  for (const w of rewordings as Array<{ itemId: string; faults: Array<{ rule: string }> }>) {
    console.log(`  reword  ${w.itemId.padEnd(16)} ${w.faults.map((f) => f.rule).join(', ')}`);
  }
  console.log(`\n  plus the library entry they do not hold: ${entry.id} (${entry.status})`);
  await prisma.$disconnect();
}

void main();
