/**
 * LIBRARY HINTS WITH THEIR CARRIERS — the FIT reading (Annie, 2026-08-22 — R572).
 *
 * **A library hint and an item hint take different questions, and she has ruled that they do.**
 *
 *   AN ITEM HINT   is read against its KEY and asked whether it gives it away.
 *   A LIBRARY HINT is read against its CARRIERS and asked whether it fits them all.
 *
 * The characteristic failures follow from the difference and are not a quality gap between the two
 * kinds. An item hint is written by somebody looking at one item, and **the sentence that settles
 * that item is the sentence that contains the answer** — so its failure is coaching. A library hint
 * cannot make that mistake, because it does not know which item it will land on; its failure is the
 * opposite one — **so general that it fits everything and helps nobody.**
 *
 * **WHICH MAKES THE SIX KEY-ONLY EXPORTERS NOT THE BLOCKER, and they were being treated as it.**
 * A key without its siblings is a defect in an ITEM-level artefact (R472). A library-hint row does
 * not want an option set at all; it wants the items the entry lands on. **No exporter produced
 * those** — `export-misconception-library` delivers every entry's verbatim `childHint` and a gate
 * verdict, which is the TRANSFORM read (R-library-text), and carries no carriers. So this reading
 * was not deferred behind the six. It had no artefact.
 *
 * Ordered by carrier count, biggest first, because **fit is hardest where reach is widest** — one
 * wording on 193 items is 193 chances to be wrong, and it is the row where "does it fit them all"
 * stops being rhetorical.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { readFieldsByName } from './lib/field-read';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAMILY = 'library-hints-with-carriers';
const BATCH_SIZE = 9;
const batchArg = process.argv.indexOf('--batch');
const BATCH = batchArg === -1 ? null : Number(process.argv[batchArg + 1]);
/** English only. NVR and maths take separate questions and she has not asked for them. */
const ENGLISH = /^(ENG|en-)/;

async function main() {
  const items = await prisma.item.findMany({ include: { options: true } });
  const lib = await prisma.misconception.findMany({ select: { id: true, childHint: true, description: true } });

  readFieldsByName(
    'deliver:library-hints-with-carriers / item.stem',
    items.map((i) => (i.stem ?? {}) as Record<string, unknown>),
    // Every name this delivery actually reads. `text` is on 373 of 1033 — `prompt` is the commoner
    // one and `sentence` the punctuation shape — so requesting only `text` would state a true count
    // for the wrong key and silently drop two thirds of the stems into the fallback.
    ['text', 'prompt', 'sentence', 'passageRef'],
  );

  const carriersOf = new Map<string, Array<{
    itemId: string; status: string; questionTypeId: string; stem: string;
    theOptionItTags: string; isKeyOption: boolean;
  }>>();
  for (const i of items) {
    for (const o of i.options) {
      const m = (o as { misconceptionId?: string | null }).misconceptionId;
      if (!m) continue;
      const c = ((o as { content?: { value?: unknown } }).content ?? {}) as { value?: unknown };
      const stem = (i.stem as Record<string, unknown>);
      carriersOf.set(m, [...(carriersOf.get(m) ?? []), {
        itemId: i.id,
        status: i.status,
        questionTypeId: i.questionTypeId,
        stem: [stem.text, stem.prompt, stem.sentence].find((t): t is string => typeof t === 'string') ?? '',
        theOptionItTags: typeof c.value === 'string' ? c.value : JSON.stringify(c.value),
        isKeyOption: o.isCorrect,
      }]);
    }
  }

  const rows = lib
    .filter((m) => ENGLISH.test(m.id) && (carriersOf.get(m.id)?.length ?? 0) > 0)
    .map((m) => {
      const cs = carriersOf.get(m.id) ?? [];
      const live = cs.filter((c) => c.status === 'LIVE');
      return {
        entryId: m.id,
        childHint: String(m.childHint ?? ''),
        herQuestion: 'Does this one wording fit every item below, or is it general enough to fit anything?',
        carrierCount: cs.length,
        liveCarrierCount: live.length,
        /** The distinct question types it lands on — one wording across many types is the fit risk. */
        questionTypesItLandsOn: [...new Set(cs.map((c) => c.questionTypeId))].sort(),
        carriers: cs.sort((a, b) => a.itemId.localeCompare(b.itemId)),
      };
    })
    .sort((a, b) => b.carrierCount - a.carrierCount || a.entryId.localeCompare(b.entryId));

  requirePopulation('deliver:library-hints-with-carriers', {
    'English library entr(ies) with at least one carrier': rows.length,
    'item(s) scanned': items.length,
  });

  const batches = Math.ceil(rows.length / BATCH_SIZE);
  if (BATCH !== null && (!Number.isInteger(BATCH) || BATCH < 1 || BATCH > batches)) {
    throw new Error(`--batch ${process.argv[batchArg + 1]} out of range: ${rows.length} row(s) make ${batches} batch(es).`);
  }
  const slice = BATCH === null ? rows : rows.slice((BATCH - 1) * BATCH_SIZE, BATCH * BATCH_SIZE);
  const family = BATCH === null ? FAMILY : `${FAMILY}-batch-${BATCH}`;

  const payload = {
    what: 'English library hints, each with EVERY item it lands on. The FIT reading.',
    theQuestionThisKindTakes: 'A library hint is read against its carriers and asked whether it fits them all. It is NOT read against a key — it does not know which item it will land on, which is exactly why it cannot coach one.',
    theCharacteristicFailure: 'Generality. A wording that fits every carrier because it says almost nothing is the library-side equivalent of coaching, and it is invisible from any single item.',
    whyNotOptionSets: 'An option set answers the ITEM-hint question. This row does not want one — it wants the items the entry reaches. The six key-only exporters are an item-level defect and were never on this path.',
    ordering: 'By carrier count, biggest first. Fit is hardest where reach is widest.',
    denominators: { englishEntriesWithCarriers: rows.length, itemsScanned: items.length },
    thisBatch: BATCH === null
      ? { of: 'all', rows: rows.length }
      : {
        batch: BATCH, of: batches, rowsInThisBatch: slice.length,
        rowsBefore: (BATCH - 1) * BATCH_SIZE,
        rowsAfter: Math.max(0, rows.length - BATCH * BATCH_SIZE),
        entryIds: slice.map((r) => r.entryId),
      },
    rows: slice,
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'English library hints with every carrying item, for the fit reading',
    ['what', 'theQuestionThisKindTakes', 'theCharacteristicFailure', 'whyNotOptionSets', 'ordering', 'denominators', 'thisBatch', 'rows']);
  const path = join(REPO, 'content/exports', stampedName(family, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, family);
  console.log(`\n${slice.length} entr(ies) emitted${BATCH === null ? '' : ` (batch ${BATCH} of ${batches})`}.`);
  await prisma.$disconnect();
}

void main();
