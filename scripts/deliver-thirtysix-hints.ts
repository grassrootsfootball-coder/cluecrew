/**
 * The LIVE items carrying an unread `hintCore`, each with the four things her ruling requires
 * (R560): **the item, its options with the key marked, its own hint, and the library hint it would
 * replace.**
 *
 * **A hint that is worse than the general one it replaces is a regression dressed as specificity**,
 * and she cannot see that without both strings. **Sixth home for the rule**: an option needs its key
 * and siblings, a card needs every item it serves, a label needs its element, a template needs its
 * values, a claim needs its text — **and a replacement needs the thing it replaces.**
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chooseHint } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { readFieldsByName } from './lib/field-read';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAMILY = 'unread-item-hints-for-annie';
/**
 * **SHE READS NINE AT A TIME, SO SHE IS SENT NINE AT A TIME.** Sending all thirty-six and leaving
 * her to slice them makes the boundary hers to keep track of across four sittings — and a boundary
 * held in someone's head is the thing that silently moves. `--batch 2` emits rows 10-18 of the same
 * deterministic id sort, and names the batch on the face of the artefact.
 */
const BATCH_SIZE = 9;
const batchArg = process.argv.indexOf('--batch');
const BATCH = batchArg === -1 ? null : Number(process.argv[batchArg + 1]);

async function main() {
  const items = await prisma.item.findMany({ where: { status: 'LIVE' }, include: { options: true } });
  const libIds = new Set<string>();
  for (const i of items) for (const o of i.options) {
    const m = (o as { misconceptionId?: string | null }).misconceptionId;
    if (m) libIds.add(m);
  }
  const lib = new Map(
    (await prisma.misconception.findMany({ where: { id: { in: [...libIds] } }, select: { id: true, childHint: true } }))
      .map((m) => [m.id, m.childHint]),
  );

  /**
   * **THE KEYS BEFORE THE VALUES (R568).** This delivery is where the fault happened, so it is the
   * first place the guard goes. It reads three names out of `explanation`; if any of them is not a
   * key on a single row, the run STOPS rather than emitting thirty-six nulls that look like data.
   */
  readFieldsByName(
    'deliver:thirtysix-hints / item.explanation',
    items.map((i) => (i.explanation ?? {}) as Record<string, unknown>),
    ['hintCore', 'hintAuthoredBy', 'hintAuthority'],
  );

  /**
   * **A RULED ROW IS NOT AN UNREAD ROW (Annie's PU-08 question — R593).** `ENG-003-A-PU-08` carries
   * `hintRuledBy: "Annie"`, `hintServes: "library"` and her reasoning — **a DECISION to leave the
   * item hint unserved.** It reaches a child exactly as an unread hint does, so it sat in this
   * population for four batches indistinguishable from a field nobody had looked at.
   *
   * **The two states are opposite and the serving behaviour is identical**, which is the whole class:
   * withheld-because-undecided and withheld-because-decided produce the same output. Only a recorded
   * decision separates them, and only a reader looking for one would find it.
   */
  const isRuled = (e: unknown) => {
    const x = (e ?? {}) as Record<string, unknown>;
    return typeof x.hintRuledBy === 'string' && String(x.hintRuledBy).trim() !== '';
  };
  const unserved = items.filter((i) => {
    const h = (i.explanation as { hintCore?: unknown } | null)?.hintCore;
    return typeof h === 'string' && h.trim() !== '' && chooseHint(i.explanation as never).serves === 'library';
  });
  const ruled = unserved.filter((i) => isRuled(i.explanation));
  const rows = unserved
    .filter((i) => !isRuled(i.explanation))
    .map((i) => {
      const e = (i.explanation ?? {}) as Record<string, unknown>;
      const key = i.options.find((o) => o.isCorrect);
      return {
        itemId: i.id,
        stem: [(i.stem as Record<string, unknown>).text, (i.stem as Record<string, unknown>).prompt,
          (i.stem as Record<string, unknown>).sentence].find((t): t is string => typeof t === 'string') ?? '',
        options: i.options.map((o) => {
          const c = ((o as { content?: { value?: unknown; label?: unknown } }).content ?? {});
          return {
            label: c.label ?? null,
            value: typeof c.value === 'string' ? c.value : JSON.stringify(c.value),
            isKey: o.isCorrect,
            tag: (o as { misconceptionId?: string | null }).misconceptionId ?? null,
            libraryHintItWouldReplace: o.isCorrect ? null : (lib.get((o as { misconceptionId?: string }).misconceptionId ?? '') ?? null),
          };
        }),
        /**
         * **THE FIELD KEEPS ITS NAME** (R564). I renamed it `itsOwnHint` for readability, so a
         * lookup of `hintCore` — the name every ruling and every register entry uses — returned
         * undefined on all 36 rows. The value was present; the name she reads by was not.
         */
        hintCore: String(e.hintCore),
        libraryHintsItWouldReplace: [...new Set(i.options.filter((o) => !o.isCorrect)
          .map((o) => lib.get((o as { misconceptionId?: string }).misconceptionId ?? ''))
          .filter((h): h is string => Boolean(h)))],
        herQuestion: 'Is the item hint better than the library hint it displaces on this item?',
      };
    })
    .sort((a, b) => a.itemId.localeCompare(b.itemId));

  requirePopulation('deliver:thirtysix-hints', { 'LIVE item(s)': items.length, 'unread hint-carrying row(s)': rows.length });

  const batches = Math.ceil(rows.length / BATCH_SIZE);
  if (BATCH !== null && (!Number.isInteger(BATCH) || BATCH < 1 || BATCH > batches)) {
    throw new Error(`--batch ${process.argv[batchArg + 1]} is out of range: ${rows.length} row(s) make ${batches} batch(es).`);
  }
  const slice = BATCH === null ? rows : rows.slice((BATCH - 1) * BATCH_SIZE, BATCH * BATCH_SIZE);
  const family = BATCH === null ? FAMILY : `${FAMILY}-batch-${BATCH}`;

  const payload = {
    what: 'The 36 LIVE items that CARRY an authored hintCore which is not yet served. These are a READ, not an authoring job — every row already has a hint. (The 298 LIVE items with NO hintCore are a different population and are not here.)',
    theFourThings: 'the item and its stem; its options with the KEY marked; its own hintCore; and the library hint(s) it would replace.',
    whyBoth: 'A hint that is worse than the general one it replaces is a regression dressed as specificity, and that is invisible without both strings.',
    howServingWorks: 'An item hint serves only where a named reviewer has read it. Ruling one makes it serve; ruling none changes nothing.',
    denominators: {
      liveItems: items.length,
      carryingAnUnreadHint: rows.length,
      alreadyRuledUnserved: ruled.length,
      ruledRows: ruled.map((i) => ({
        itemId: i.id,
        ruledBy: String((i.explanation as Record<string, unknown>).hintRuledBy),
        serves: String((i.explanation as Record<string, unknown>).hintServes ?? ''),
        ruling: String((i.explanation as Record<string, unknown>).hintRuling ?? ''),
      })),
      note: 'A RULED row is excluded from the unread population. It is withheld BY DECISION, and a '
        + 'decision and an unread field serve identically — only the record separates them.',
    },
    /**
     * **THE BATCH NAMES ITS OWN PLACE IN THE WHOLE.** Which rows these are, out of how many, and
     * which remain — so a batch read out of order cannot be mistaken for the population.
     */
    thisBatch: BATCH === null
      ? { of: 'all', rows: rows.length }
      : {
        batch: BATCH,
        of: batches,
        rowsInThisBatch: slice.length,
        rowsBefore: (BATCH - 1) * BATCH_SIZE,
        rowsAfter: Math.max(0, rows.length - BATCH * BATCH_SIZE),
        itemIds: slice.map((r) => r.itemId),
      },
    /**
     * **THE LIBRARY HINTS BELOW ARE HER AMENDED WORDINGS AS OF THIS STAMP.** Fifteen library entries
     * changed on 22 August when amendments that had been reported applied turned out never to have
     * landed. A batch read against an older file would be comparing her item hint to a library hint
     * she has since replaced.
     */
    libraryTextAsOf: '2026-08-22, after the fifteen unlanded amendments were written',
    rows: slice,
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'LIVE items whose own hint is authored and not yet served, with their option sets and the library hints they would replace',
    ['what', 'theFourThings', 'whyBoth', 'howServingWorks', 'denominators', 'thisBatch', 'libraryTextAsOf', 'rows']);
  const path = join(REPO, 'content/exports', stampedName(family, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, family);
  console.log(`\n${slice.length} row(s) emitted${BATCH === null ? '' : ` (batch ${BATCH} of ${batches})`}.`);
  await prisma.$disconnect();
}

void main();
