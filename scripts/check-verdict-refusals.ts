/**
 * WHAT STANDS BETWEEN THE ENGLISH BANK AND A SIGNED ONE — `pnpm check:verdict-refusals`
 *
 * Every account of this so far has been assembled from SHEETS: row 8 says 172 items carry an
 * unapproved tag, row 7 says the retag leaves one item on a retired one, row 3 counts 80 weak
 * distractors. Three different documents, three different populations, none of them the store, and
 * the one number anybody actually needs — how many items could not receive a verdict today — has
 * never been measured at all. Row 8 was out by 43 (R105).
 *
 * WHAT THIS CALLS, STATED BEFORE IT RUNS (R41). It does not re-derive any condition:
 *   · `publishBlockers`         — packages/core/src/verdict-blockers.ts, the SAME function
 *                                 `markReviewedAction` calls. Moved there from the action file for
 *                                 exactly this reason; reimplementing it is R41's fault.
 *   · `inactiveMisconceptions`  — same file, same decision the door's `assertMisconceptionsActive`
 *                                 now makes.
 *   · `checkItemChildFacing` + `isBlocking` — the door's `childFacingBlock` is a two-line wrapper
 *                                 over these; this calls them directly and identically.
 *   · similarity and status     — read straight off the row, no derivation.
 *
 * THE DOOR SHORT-CIRCUITS AND THIS DOES NOT, deliberately. `markReviewedAction` reports the first
 * blocker it meets; an item failing three routes looks like one problem and grows two more each
 * time the first is fixed. A reviewer planning work needs every fault on an item at once, so each
 * condition is evaluated independently and an item appears under every route it fails. The counts
 * therefore SUM TO MORE THAN THE ITEM TOTAL, and the headline is the distinct-item figure.
 *
 * ONE ROUTE IN CODE, TWO CAUSES IN THE STORE. `unapproved-misconception` fires on any tag that is
 * not ACTIVE. PROPOSED means nobody has approved it and it is hers to release; RETIRED means it was
 * approved and then withdrawn and the item needs RETAGGING, which is Cowork's. Reporting them as
 * one number tells her the wrong thing about her own workload, so they are split — and a tag with
 * no library row at all is a third cause and a different fault again.
 *
 * `own-item` IS NOT DECIDABLE WITHOUT A REVIEWER, so it is evaluated per named reviewer and
 * reported separately rather than folded into the headline.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  checkItemChildFacing,
  inactiveMisconceptions,
  isBlocking,
  publishBlockers,
} from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'verdict-refusals-english';

/** Every route out of `markReviewedAction`, in the order the door applies them. */
type Route =
  | 'unanswerable'
  | 'no-correct-option'
  | 'missing-misconceptions'
  | 'similarity-review'
  | 'tag-proposed'
  | 'tag-retired'
  | 'tag-missing'
  | 'child-facing-copy';

/**
 * A ZERO ON A ROUTE IS NOT SELF-EXPLANATORY, AND FOUR OF THESE EIGHT CAME BACK ZERO ON THE FIRST
 * RUN (R60/R61, applied to this check rather than by it). Two kinds of zero look identical:
 *
 *   MEASURED     — this check read the underlying data itself, or a screen that covers English
 *                  actually ran and found nothing. The zero is a finding.
 *   NOT-SCREENED — the route depends on a flag some OTHER process sets, and that process does not
 *                  cover English. The zero is guaranteed by scope and says nothing about the items.
 *                  R61's fourth shape: the check is correct, the population is structurally absent.
 *
 * `unanswerable` is the instance. `check:word-puzzles` names ten VR `questionTypeId`s explicitly
 * and no English type is among them, so no English item can ever carry `answerFlaggedAt` — 8 items
 * bank-wide do, all VR. Reporting that as "0 unanswerable" would read as a clean bill for a test
 * never administered.
 *
 * `similarity-review` looked like the same fault and is NOT. `similarity-scan` filters on status
 * only, so all 371 English items are in scope; it screened 729 unpublished items against 2114
 * source fingerprints and returned 0 for review. The flag COLUMN is empty bank-wide only because
 * CI runs the scan without `RETRO`, which is what writes flags. Screen clean, column empty, and
 * only one of those two facts is a finding — hence `basis` records which.
 */
const BASIS = { MEASURED: 'MEASURED', NOT_SCREENED: 'NOT-SCREENED' } as const;

const ROUTES: Record<Route, { note: string; basis: string; basisNote?: string }> = {
  unanswerable: {
    note: "check:word-puzzles found the item's own rule does not produce its key. No clearing path by design.",
    basis: BASIS.NOT_SCREENED,
    basisNote: 'check:word-puzzles screens ten VR questionTypeIds by name; no English type is among '
      + 'them, so no English item can carry answerFlaggedAt. A zero here is scope, not a finding.',
  },
  'no-correct-option': { note: 'No option is marked correct.', basis: BASIS.MEASURED },
  'missing-misconceptions': { note: 'A distractor carries no diagnosis.', basis: BASIS.MEASURED },
  'similarity-review': {
    note: 'ADDENDUM-E §3 flagged it against the corpus and no reviewer has cleared the flag.',
    basis: BASIS.MEASURED,
    basisNote: 'similarity-scan filters on status only, so English is in scope: 729 unpublished '
      + 'items screened against 2114 fingerprints, 0 for review. The flag column is empty bank-wide '
      + 'because CI runs the scan without RETRO, which is what writes flags — screen clean is the '
      + 'finding, empty column is not.',
  },
  'tag-proposed': { note: 'Carries a tag nobody has approved. HERS — the approval batch releases these.', basis: BASIS.MEASURED },
  'tag-retired': { note: 'Carries a tag that was approved and then withdrawn. COWORK\'S — the item needs retagging.', basis: BASIS.MEASURED },
  'tag-missing': { note: 'Carries a tag with no library row at all. Neither approval nor retagging reaches this.', basis: BASIS.MEASURED },
  'child-facing-copy': { note: 'checkItemChildFacing raises a blocking fault — reword, never exempt.', basis: BASIS.MEASURED },
};

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    include: { options: { orderBy: { id: 'asc' } }, questionType: { select: { mechanic: true } } },
    orderBy: { id: 'asc' },
  });
  const lib = await prisma.misconception.findMany({ select: { id: true, status: true } });
  const statusById = new Map(lib.map((m) => [m.id, m.status]));

  requirePopulation('check:verdict-refusals', {
    'English items': items.length,
    'misconception library rows': lib.length,
  });

  const byRoute = new Map<Route, string[]>();
  const byItem = new Map<string, Route[]>();
  const hit = (route: Route, id: string): void => {
    byRoute.set(route, [...(byRoute.get(route) ?? []), id]);
    byItem.set(id, [...(byItem.get(id) ?? []), route]);
  };

  // Items that already hold a verdict are not awaiting one. Reported as their own line rather than
  // filtered away silently — a denominator that quietly shrinks is how 172 happened.
  const awaiting = items.filter((i) => i.status === 'DRAFT');

  for (const item of awaiting) {
    // EACH CONDITION SEPARATELY. `publishBlockers` short-circuits, so calling it once would report
    // only an item's first fault; it is called per condition by feeding it the row three times and
    // reading which answer comes back. `reviewer` is null throughout — `own-item` is not decidable
    // without knowing who is asking and is reported below instead.
    const opts = item.options.map((o) => ({ isCorrect: o.isCorrect, misconceptionId: o.misconceptionId }));
    if (publishBlockers(opts, null, item.authoredBy, item.answerFlaggedAt) === 'unanswerable') {
      hit('unanswerable', item.id);
    }
    if (publishBlockers(opts, null, item.authoredBy, null) === 'no-correct-option') hit('no-correct-option', item.id);
    if (publishBlockers(opts, null, item.authoredBy, null) === 'missing-misconceptions') {
      hit('missing-misconceptions', item.id);
    }
    if (item.similarityFlaggedAt && !item.similarityClearedBy) hit('similarity-review', item.id);

    // The tag route, split by CAUSE. The door cannot tell these apart; a reviewer must.
    for (const id of inactiveMisconceptions(item.options, statusById)) {
      const status = statusById.get(id);
      hit(status === 'PROPOSED' ? 'tag-proposed' : status === 'RETIRED' ? 'tag-retired' : 'tag-missing', item.id);
    }

    const faults = checkItemChildFacing({
      id: item.id, stem: item.stem, explanation: item.explanation,
      mechanic: item.questionType.mechanic, options: item.options,
    }).filter(isBlocking);
    if (faults.length) hit('child-facing-copy', item.id);
  }

  // An item can hit the same route twice (two bad tags); the reviewer count is DISTINCT items.
  const distinct = (route: Route): string[] => [...new Set(byRoute.get(route) ?? [])].sort();
  const refused = [...byItem.keys()].sort();
  const clear = awaiting.filter((i) => !byItem.has(i.id)).map((i) => i.id);

  // `own-item`, per named reviewer, because it is the one route that depends on who is asking.
  const reviewers = await prisma.reviewer.findMany({ where: { heldUntil: null }, select: { displayName: true, staffEmail: true } });
  const ownItem = reviewers.map((r) => ({
    reviewer: r.displayName,
    staffEmail: r.staffEmail,
    items: r.staffEmail ? awaiting.filter((i) => i.authoredBy === `human:${r.staffEmail}`).map((i) => i.id) : [],
  }));

  const routes = (Object.keys(ROUTES) as Route[]).map((route) => ({
    route, ...ROUTES[route], items: distinct(route), count: distinct(route).length,
  }));

  const generatedAt = new Date().toISOString();
  const body = {
    kind: FAMILY,
    note:
      'Every English item that could NOT receive a verdict today, by route, measured against the '
      + 'store. Routes are evaluated independently, so an item appears under each one it fails and '
      + 'the route counts sum to more than the distinct total.',
    generatedAt,
    denominator: {
      englishItems: items.length,
      awaitingAVerdict: awaiting.length,
      alreadyHoldingOne: items.length - awaiting.length,
      note: 'Only DRAFT items are awaiting a verdict. The others are reported so the denominator is visible, not filtered away.',
    },
    headline: { refused: refused.length, clear: clear.length },
    routes,
    perItem: refused.map((id) => ({ id, routes: [...new Set(byItem.get(id)!)] })),
    clear,
    ownItem: {
      note: 'The one route that depends on WHO is reviewing. Not in the headline.',
      byReviewer: ownItem,
    },
    callsWhat: [
      'publishBlockers — packages/core/src/verdict-blockers.ts, the function markReviewedAction calls',
      'inactiveMisconceptions — same file, the decision assertMisconceptionsActive makes',
      'checkItemChildFacing + isBlocking — what childFacingBlock wraps',
      'similarityFlaggedAt / similarityClearedBy / status — read off the row, not derived',
    ],
  };
  const stamp = artefactStamp(
    body, generatedAt, 'status',
    'every English item that would refuse a verdict today, by route, with ids',
    ['routes', 'perItem', 'clear'],
  );
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ ...body, stamp }, null, 2));
  deliver(path, FAMILY);

  console.log(`check:verdict-refusals: screened ${awaiting.length} English item(s) awaiting a verdict `
    + `(of ${items.length} in the district; ${items.length - awaiting.length} already hold one).`);
  console.log(`\n  ${refused.length} would REFUSE a verdict today · ${clear.length} would take one.\n`);
  for (const r of routes) {
    // A zero that was never screened is printed as such. It is the one line a reader would
    // otherwise take for a clean bill on a test that was never administered.
    const mark = r.count === 0 && r.basis === BASIS.NOT_SCREENED ? 'NOT SCREENED' : String(r.count);
    console.log(`  ${mark.padStart(12)}  ${r.route.padEnd(24)} ${r.note}`);
    if (r.basisNote) console.log(`                ${' '.repeat(24)} ^ ${r.basis}: ${r.basisNote.replace(/\s+/g, ' ')}`);
  }
  const blind = routes.filter((r) => r.basis === BASIS.NOT_SCREENED);
  if (blind.length) {
    console.log(`\n  ${blind.length} of ${routes.length} route(s) are NOT SCREENED for English. Their `
      + 'zeros are scope, not findings, and the headline below excludes nothing they might hold.');
  }
  const multi = refused.filter((id) => new Set(byItem.get(id)!).size > 1);
  console.log(`\n  ${multi.length} item(s) fail MORE THAN ONE route — fixing the first would not release them.`);
  for (const o of ownItem.filter((x) => x.items.length)) {
    console.log(`  own-item: ${o.reviewer} authored ${o.items.length} of them and cannot rule on those.`);
  }
  console.log(`\n  Route counts sum to ${routes.reduce((n, r) => n + r.count, 0)} over ${refused.length} distinct items.`);
  await prisma.$disconnect();
}

void main();
