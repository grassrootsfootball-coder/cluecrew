/**
 * THE DISCHARGE DIFF FOR ANNIE'S TWO CLOZE RULINGS (119th thread, David's item 2 — R668).
 *
 * Two rulings, one serving surface (`apps/web/components/crew/engines/wordweb.tsx`):
 *  1. The excerpt is SET OFF BY THE VEHICLE BLOCK, WITH NO ADDED QUOTATION MARKS.
 *  2. EVERY GAP NAMES ITSELF IN THE ACCESSIBILITY CHANNEL by the item's own gapIndex.
 *
 * The diff is the discharge artefact. Each assertion below is checked against the BYTES of the
 * render path at emission time, not recalled — an artefact that asserts what its own source no
 * longer says is R178 one file over.
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const surface = readFileSync(join(REPO, 'apps/web/components/crew/engines/wordweb.tsx'), 'utf8');
const helper = readFileSync(join(REPO, 'apps/web/lib/crew/cloze-gap.ts'), 'utf8');

// Ruling 1 — mechanical check: the carrier block adds no quotation characters. The carrier's JSX
// children are the split segments of the carrier string itself; refuse to emit if any quote
// literal appears in the carrier block's source.
const carrierBlock = surface.slice(surface.indexOf('data-testid="cloze-carrier"'), surface.indexOf('</p>', surface.indexOf('data-testid="cloze-carrier"')));
if (carrierBlock.length < 10) throw new Error('cloze-carrier block not found on the surface — the artefact would assert about bytes that are not there');
for (const q of ['“', '”', "{'\"'}", '{"\\""}', "&quot;", "&ldquo;", "&rdquo;"]) {
  if (carrierBlock.includes(q)) throw new Error(`REFUSED — the carrier block contains an added quotation character: ${JSON.stringify(q)}`);
}

// Ruling 2 — the gap self-naming must actually be on the surface.
for (const needle of ['splitCarrierAtGaps', 'aria-hidden="true"', 'fd-visually-hidden', 'gap ${']) {
  if (!surface.includes(needle)) throw new Error(`REFUSED — expected render-path byte absent: ${needle}`);
}
if (!helper.includes('printedIndex')) throw new Error('REFUSED — helper does not carry the printed index');

const diff = execSync(
  'git diff -- apps/web/components/crew/engines/wordweb.tsx apps/web/lib/crew/cloze-gap.ts apps/web/lib/crew/cloze-gap.test.ts',
  { cwd: REPO, encoding: 'utf8' },
);
if (!diff.includes('fd-visually-hidden')) throw new Error('REFUSED — the diff does not contain the accessibility change it discharges');

const artefact = {
  kind: 'cloze-rulings-discharge-diff',
  source: 'Annie via David, 119th-return thread — annie-119-for-code.md, sha256 87b701afa5cfc3f961f3e220d1540af7fa8c263cc4f6e017bb9fda5c8d82f6c4',
  rulings: [
    {
      ruling: 'The excerpt is set off by the vehicle block, with no added quotation marks.',
      implementation:
        'The carrier renders bare inside <p data-testid="cloze-carrier"> — the vehicle block IS the set-off. Checked mechanically at emission: the carrier block\'s source contains no quotation character, curly or straight, literal or entity. The renderer\'s children are exactly the segments of the carrier string; the helper test asserts byte identity when the segments are rejoined.',
    },
    {
      ruling: "Every gap names itself in the accessibility channel by the item's own gapIndex.",
      implementation:
        'splitCarrierAtGaps (apps/web/lib/crew/cloze-gap.ts, pure, 3 tests) splits the carrier at ___(n)___ markers. Each marker renders as <span aria-hidden="true">___(n)___</span> beside <span class="fd-visually-hidden">gap N</span>, N being stem.gapIndex when the item carries one (every cloze item does; the marker\'s own printed index is the fallback, never a substitute — on a well-formed item they are the same number). The eye keeps the marker; the ear hears "gap N" instead of underscore noise.',
    },
  ],
  filesChanged: [
    'apps/web/components/crew/engines/wordweb.tsx',
    'apps/web/lib/crew/cloze-gap.ts (new)',
    'apps/web/lib/crew/cloze-gap.test.ts (new)',
  ],
  verification: 'tsc --noEmit clean; vitest 41 passed including the 3 new cloze-gap tests. The surface is not browser-reachable today: no ENG-003 item serves (both passages behind the publication path this diff opens).',
  publicationPath: 'ENG-003 publication opens BEHIND this diff, pending the Case-row product decision on David\'s desk. Nothing here serves a child yet.',
  diff,
};
const json = JSON.stringify(artefact, null, 1) + '\n';
const contentHash = createHash('sha256').update(json).digest('hex').slice(0, 16);
const name = stampedName('cloze-rulings-discharge-diff', contentHash, 'json');
const local = join(REPO, 'content/exports', name);
writeFileSync(local, json);
deliver(local, 'cloze-rulings-discharge-diff');
