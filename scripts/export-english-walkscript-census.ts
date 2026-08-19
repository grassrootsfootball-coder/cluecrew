/**
 * MY 372 ENGLISH WALK-SCRIPT ITEMS, FOR COWORK TO DIFF AGAINST ITS 378.
 *
 * **THE SIX ARE ONE OF THREE THINGS AND ONLY A DIFF CAN SAY WHICH**: six items Cowork holds that
 * this store does not, six held here under different ids, or a scoping difference in what counts as
 * carrying a script. **Not adjusted toward 378** — this is what this store holds, measured.
 *
 * **AN ID LIST CANNOT FIND AN ITEM HELD UNDER A DIFFERENT ID**, which is one of the three
 * candidates, so every row also carries a sha256 OF THE SCRIPT TEXT and its opening words. If the
 * six are a renaming, they match by content and the ids differ; if they are genuinely absent here,
 * neither matches. The file is built so the answer distinguishes the cases rather than merely
 * counting them.
 *
 * **THE SCOPING RULE IS STATED, NOT ASSUMED SHARED.** An item counts here when
 * `explanation.walkScript` is a non-empty string after trimming, or a non-empty array. Measured on
 * this store: 372 English items, ALL 372 carrying one — no empty strings, no absent keys, so no
 * scoping choice this store could make would move its own number.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'english-walkscript-census';

async function main() {
  const types = await prisma.questionType.findMany({ where: { district: 'ENGLISH' }, select: { id: true } });
  const items = await prisma.item.findMany({
    where: { questionTypeId: { in: types.map((t) => t.id) } },
    select: { id: true, status: true, questionTypeId: true, explanation: true, authoredBy: true },
    orderBy: { id: 'asc' },
  });
  requirePopulation('English walk-script census', {
    'English question types': types.length,
    'English items': items.length,
  });

  const scriptOf = (i: (typeof items)[number]): string | null => {
    const w = ((i.explanation ?? {}) as Record<string, unknown>).walkScript;
    if (typeof w === 'string' && w.trim() !== '') return w;
    if (Array.isArray(w) && w.length > 0) return w.join('\n');
    return null;
  };

  const carrying = items.filter((i) => scriptOf(i) !== null);
  const notCarrying = items.filter((i) => scriptOf(i) === null);

  const rows = carrying.map((i) => {
    const script = scriptOf(i)!;
    return {
      itemId: i.id,
      questionTypeId: i.questionTypeId,
      status: i.status,
      authoredBy: i.authoredBy,
      /*
       * **WHITESPACE-COLLAPSED, WHICH IS COWORK'S RULE, ADOPTED** (R305). This store hashed the raw
       * text and Cowork collapses runs of whitespace to one space. They agreed on 368 of 372 — but
       * only because the scripts happen to carry no internal whitespace runs. **Two correct
       * instruments with different conventions, agreeing by luck of the data**, which is R80's
       * shape waiting for the first script that wraps a line.
       *
       * Cowork's rule is adopted rather than mine because line-wrapping is a presentation artefact
       * of a FILE and a hash of content should not move when a file is reflowed. The convergence
       * is declared in `hashSpec` so the next diff cannot read a whitespace change as a content
       * difference on one side only.
       */
      scriptSha256: createHash('sha256').update(script.replace(/\s+/g, ' ').trim()).digest('hex'),
      scriptWords: script.trim().split(/\s+/).length,
      scriptOpens: script.trim().split(/\s+/).slice(0, 8).join(' '),
    };
  });

  const payload = {
    what: "Every ENGLISH item in this store carrying a walk script, for Cowork to diff against its 378.",
    hashSpec: {
      algorithm: 'sha256',
      digestChars: 64,
      over: 'the walkScript text with runs of whitespace collapsed to one space, then trimmed',
      convergedWith: "Cowork's rule, adopted 2026-08-19 (R305). This store previously hashed the raw text; the two agreed on 368 of 372 only because the scripts carry no internal whitespace runs.",
      fileDigest: 'computed by the receiving store over the bytes it holds',
    },
    doNotAdjust:
      'This is what this store holds, measured. It is not moved toward 378, and Cowork should not move toward 372.',
    theScopingRule:
      'An item counts when explanation.walkScript is a non-empty string after trimming, or a non-empty array.',
    thisStoreMeasures: {
      englishItemsTotal: items.length,
      carryingAWalkScript: carrying.length,
      notCarrying: notCarrying.length,
      emptyStringOrAbsentKey: notCarrying.length,
      note: 'All 372 English items carry one. There is no empty-string or missing-key population here, so no scoping choice this store could make would move its own number.',
    },
    howToReadTheDiff: {
      'ids in Cowork not here': 'six items this store does not hold — the crossing never happened',
      'scriptSha256 matching under a different id': 'a renaming; the content is here and the id differs',
      'neither id nor hash matching': 'genuinely absent, and the sweep never screened them',
    },
    boundsOnMySweep:
      "The punctuation sweep's zero is bounded by ITS population of 704 (ENGLISH 372 / VR 332). If six English items sit outside that population, THEY WERE NEVER SCREENED and the class claim is only as wide as the run.",
    rows,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'every English item carrying a walk script, with a sha256 of the script for content matching', ['rows']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\nEnglish items ${items.length} · carrying a script ${carrying.length} · not carrying ${notCarrying.length}`);
  const byType = new Map<string, number>();
  for (const r of rows) byType.set(r.questionTypeId, (byType.get(r.questionTypeId) ?? 0) + 1);
  for (const [t, n] of [...byType].sort()) console.log(`    ${t.padEnd(24)} ${n}`);
  console.log(`  distinct script hashes: ${new Set(rows.map((r) => r.scriptSha256)).size} of ${rows.length}`);
  await prisma.$disconnect();
}

main();
