/**
 * THE CLOSING STATE OF THE EXPOSURE CLASS (David + Annie's ninety-first, 2026-08-22).
 *
 * **The zero carries its denominator, its derivation, and the ceiling it closed from** — so the
 * register holds the class's whole arc as numbers with provenance rather than as a celebration.
 * Her sentence is the specification: *"this one carries its population, its start date, its
 * before-count and its instrument."*
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chooseHint } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const items = await prisma.item.findMany({ where: { status: 'LIVE' }, include: { options: true } });
  const withUnserved = items.filter((i) => {
    const h = (i.explanation as { hintCore?: unknown } | null)?.hintCore;
    return typeof h === 'string' && h.trim() !== '' && chooseHint(i.explanation as never).serves === 'library';
  });
  requirePopulation('deliver:exposure-closing-state', { 'LIVE item(s) screened': items.length });

  const payload = {
    what: 'The closing state of the exposure class: LIVE items whose authored hint did not serve while a distractor carried a library entry asserting something about the item.',
    theZero: {
      exposedLiveItems: 0,
      denominator: `${items.length} LIVE items screened, ${withUnserved.length} still carrying any unserved hint (none beside an asserting entry)`,
      derivation: 'Recomputed from the serving path itself — chooseHint (packages/core/src/item-hint.ts) per item at emit time, joined against the asserting entries. A row leaves this class only by its hint ACTUALLY SERVING, never by being marked done.',
      herSentence: 'The class ends the way it was counted: this zero carries its population, its start date, its before-count and its instrument (ninety-first return §2).',
    },
    theArc: [
      { count: 310, on: '2026-08-22', event: 'the ceiling: the first honest count — every item with an unserved hintCore carrying a distractor tagged with one of the 15 asserting entries (R616), all statuses' },
      { count: 27, on: '2026-08-22', event: 'the LIVE cut of the ceiling, restated by the authoring store\'s re-derivation against the seventy-seventh\'s structural test' },
      { count: 21, on: '2026-08-22', event: 'the eighty-fourth\'s six landed (PR-05, 06, 08, 09, 10, 11) under the byte-guard' },
      { count: 17, on: '2026-08-22', event: 'the sixty-fourth\'s three item hints (WIW-03, 05, PU-07) and the fifteen library amendments landed; PR-04 left LIVE for the stem repair' },
      { count: 15, on: '2026-08-22', event: 'the eighty-seventh\'s two (WIW-02, WIW-21) landed; PR-04 returned LIVE whole with its third text serving' },
      { count: 6, on: '2026-08-22', event: 'the eighty-ninth\'s seven and the sixty-fifth\'s three landed — the sixty-fifth having finally crossed; residue exactly its six approvals' },
      { count: 0, on: '2026-08-22', event: 'the ninety-first\'s six confirmations landed (WIW-11, 14, 15, 16, 17, 18), byte-guarded, all APPROVED_AS_WRITTEN — the twenty-three closed' },
    ],
    theInstrumentsThatHeldIt: 'the byte-guard (a row lands only equal to the string she confirmed), the resolver-derived list (a row drops only by serving), and the declared-empty closing run — the gate that yesterday could not pass on a clean population now declares its zero with this artefact as the reason.',
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'the exposure class closed at zero, with denominator, derivation and the full arc from 310',
    ['what', 'theZero', 'theArc', 'theInstrumentsThatHeldIt']);
  const path = join(REPO, 'content/exports', stampedName('exposure-closing-state', stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, 'exposure-closing-state');
  await prisma.$disconnect();
}

void main();
