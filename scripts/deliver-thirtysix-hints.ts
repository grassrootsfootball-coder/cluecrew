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
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAMILY = 'unread-item-hints-for-annie';

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

  const rows = items
    .filter((i) => {
      const h = (i.explanation as { hintCore?: unknown } | null)?.hintCore;
      return typeof h === 'string' && h.trim() !== '' && chooseHint(i.explanation as never).serves === 'library';
    })
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

  const payload = {
    what: 'The 36 LIVE items that CARRY an authored hintCore which is not yet served. These are a READ, not an authoring job — every row already has a hint. (The 298 LIVE items with NO hintCore are a different population and are not here.)',
    theFourThings: 'the item and its stem; its options with the KEY marked; its own hintCore; and the library hint(s) it would replace.',
    whyBoth: 'A hint that is worse than the general one it replaces is a regression dressed as specificity, and that is invisible without both strings.',
    howServingWorks: 'An item hint serves only where a named reviewer has read it. Ruling one makes it serve; ruling none changes nothing.',
    denominators: { liveItems: items.length, carryingAnUnreadHint: rows.length },
    rows,
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'LIVE items whose own hint is authored and not yet served, with their option sets and the library hints they would replace',
    ['what', 'theFourThings', 'whyBoth', 'howServingWorks', 'denominators', 'rows']);
  const path = join(REPO, 'content/exports', stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);
  console.log(`\n${rows.length} row(s) emitted.`);
  await prisma.$disconnect();
}

void main();
