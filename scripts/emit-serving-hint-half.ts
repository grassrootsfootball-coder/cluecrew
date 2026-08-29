/**
 * THE SERVING HALF OF THE HINT JOIN (R811) — every hint a child can be served, by row id, with the
 * text and a digest over that text.
 *
 * **This answers half of her eightieth and cannot answer the other half.** She asks *which store
 * does a child's hint come from, and which store was each lookup run against*. **Neither store can
 * answer that alone** (R794/R810): this side can say, by digest, exactly what it would serve. It
 * cannot say what any authored artefact holds. The desk joins the two halves.
 *
 * **NO COUNTS ON THE FACE, deliberately.** Her §4 is the reason: *"Two hundred and ninety-eight
 * without a hint against twenty-three without a hint is not a rounding, a scope or an ordering; it
 * is a disagreement about the corpus."* A total published here would be compared against a total
 * from a store whose population is not known to be the same one, and the comparison would look like
 * arithmetic. **The population is DEFINED on the face and the rows are listed; anyone who wants a
 * number can count the rows they actually mean.**
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chooseHint } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { beginCut, sealCut } from './lib/cut-stamp';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('serving-hint-half', [
    { name: 'an item hint read by a named reviewer serves from the item', input: JSON.stringify({ hintCore: 'x', hintAuthoredBy: 'Annie', hintAuthority: 'ruling' }), mustBeCaught: true },
    { name: 'a second such item hint does too', input: JSON.stringify({ hintCore: 'y', hintAuthoredBy: 'Annie', hintAuthority: 'return' }), mustBeCaught: true },
    { name: 'an unread item hint falls to the library', input: JSON.stringify({ hintCore: 'z' }), mustBeCaught: false },
    { name: 'a ruling to withhold falls to the library', input: JSON.stringify({ hintCore: 'z', hintAuthoredBy: 'Annie', hintAuthority: 'r', hintServes: 'library' }), mustBeCaught: false },
  ], (raw) => chooseHint(JSON.parse(raw)).serves === 'item');

  const items = await prisma.item.findMany({
    where: { status: 'LIVE' },
    select: { id: true, explanation: true, options: { select: { misconceptionId: true } } },
    orderBy: { id: 'asc' },
  });
  requirePopulation('emit:serving-hint-half', { 'LIVE items examined': items.length });

  const itemHints: Array<Record<string, unknown>> = [];
  const libraryTagIds = new Set<string>();
  for (const it of items) {
    const choice = chooseHint(it.explanation as Parameters<typeof chooseHint>[0]);
    if (choice.serves === 'item') {
      const text = choice.text;
      itemHints.push({
        source: 'ITEM', rowId: it.id, field: 'explanation.hintCore', text,
        textSha256: sha(text), readBy: choice.readBy, authority: choice.authority,
      });
    } else {
      for (const o of it.options) if (o.misconceptionId) libraryTagIds.add(o.misconceptionId);
    }
  }

  const lib = await prisma.misconception.findMany({
    where: { id: { in: [...libraryTagIds] } },
    select: { id: true, childHint: true },
    orderBy: { id: 'asc' },
  });
  const libraryHints = lib
    .filter((m) => typeof m.childHint === 'string' && m.childHint.trim() !== '')
    .map((m) => ({ source: 'LIBRARY', rowId: m.id, field: 'Misconception.childHint', text: m.childHint!.trim(), textSha256: sha(m.childHint!.trim()) }));

  const rows = [...itemHints, ...libraryHints];
  const lines = rows.map((r) => `${r.source}\t${r.rowId}\t${r.textSha256}`);
  const d = digestOverText('the ROW_LINES joined by \\n, no trailing newline, each "<source>\\t<rowId>\\t<sha256 of the hint text>"', lines.join('\n'));

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'serving-hint-half',
    THE_CUT: cut,
    WHAT_THIS_ANSWERS: 'half of her eightieth: which store does a child\'s hint come from. This is what THIS store would serve, by digest. It says nothing about any authored artefact, and cannot — a claim about another store cannot be evidenced from files on this one (R794). The desk joins the halves.',
    THE_POPULATION: {
      definition: 'every hint a child CAN be served from this store: for each LIVE item, either its own hint or the library hints its option tags can reach.',
      itemSide: 'an item contributes its `explanation.hintCore` when `chooseHint` returns serves:item — that is, the text is non-empty, no ruling withholds it, and it carries BOTH an authoring name and an authority.',
      librarySide: 'an item whose `chooseHint` returns serves:library contributes the `childHint` of every misconception tagged on any of its options. CAN be served, not IS served: which one a child meets depends on the option chosen.',
      excludedAndWhy: 'items not LIVE (a child cannot meet them); library entries with an empty childHint (nothing to serve); library entries reached only through non-LIVE items.',
    },
    THE_METHOD: {
      decisionFunction: 'packages/core/src/item-hint.ts chooseHint — the serving path\'s own function, called directly and not re-implemented (R41).',
      digestPerRow: 'sha256 over the hint TEXT as served, trimmed, UTF-8. Not over the row, not over the file — so it compares against any other store\'s text of the same hint regardless of packaging.',
      rerunnableAs: 'pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/emit-serving-hint-half.ts',
    },
    NO_COUNTS_ON_THE_FACE: 'her §4 is the reason — 298 without a hint against 23 without a hint is a disagreement about the corpus, not a rounding. A total here would be compared against a total from a population not known to be the same, and the comparison would look like arithmetic. The population is defined above; the rows are below; anyone who wants a number can count the rows they actually mean.',
    AND_WHAT_THIS_CANNOT_SETTLE: 'her §3 — that three of four tags selecting what serves on WIW-19 are wrong. A wrong tag reaches the WRONG library hint, and this artefact reports which hints are reachable, not whether the reaching is correct. That is a separate half again.',
    ROWS: rows,
    ROW_LINES: lines,
    rowLinesSha256: d.value,
    rowLinesSha256Spec: d.spec,
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['THE_POPULATION', 'THE_METHOD', 'ROWS', 'ROW_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('serving-hint-half', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'serving-hint-half');
  console.log('serving half emitted; item-sourced and library-sourced rows listed, no totals on the face.');
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
