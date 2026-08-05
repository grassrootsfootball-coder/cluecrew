/**
 * Maths seed hints held on the gates — `pnpm export:maths-hints-to-reword <file.md>`
 *
 * The 20 entries whose hints fail the child-facing gates. Reported, never
 * imported, and NOT amended — the reviewer rewords her own copy, exactly as
 * with the English hint set. HTML to read/print and JSON to fill in and return.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText, isBlocking } from '@cluecrew/core';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { PRINT_CSS, esc } from './lib/review-pack-format';
import { parseMathsSeed } from './lib/parse-maths-seed';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'maths-hints-to-reword';

function main(): void {
  const path = process.argv.find((arg) => arg.endsWith('.md'));
  if (!path) { console.error('usage: … <file.md>'); process.exit(1); }
  const held = parseMathsSeed(readFileSync(path, 'utf8'))
    .map((entry) => ({ entry, faults: checkChildFacingText({ role: 'hint', label: entry.id, text: entry.hint }).filter(isBlocking).map((f) => f.detail) }))
    .filter((row) => row.faults.length > 0);

  const stamp = freshnessStamp(held.map((h) => ({ id: h.entry.id, hint: h.entry.hint, faults: h.faults })), new Date().toISOString());

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>Maths hints to reword — ${held.length}</title><style>
${PRINT_CSS}
</style></head><body>
<div class="cover">
  <h1>Maths hints to reword (${held.length})</h1>
  <p>These are seed hints whose wording trips the child-facing gates — sentence
  length over 16 words, the pressure phrase "you must", or two long words in one
  sentence. Nothing here has been amended: your copy, your call. The other 40
  passed and are already approved.</p>
</div>
${held.map(({ entry, faults }, i) => `<div class="block">
  <div class="block-head"><span class="num">${i + 1} of ${held.length}</span> <code>${esc(entry.id)}</code> <span class="tag">${esc(entry.category)}</span></div>
  <p class="lab">The misconception</p><p>${esc(entry.description)}</p>
  <p class="lab">Hint as it stands</p><p>“${esc(entry.hint)}”</p>
  ${faults.map((f) => `<p class="fault">${esc(f)}</p>`).join('')}
  <p class="lab">Reworded hint</p><div class="rule"></div><div class="rule"></div>
</div>`).join('\n')}
</body></html>`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY, stamp.sourceHash, '');
  const htmlPath = join(OUT_DIR, `${base}html`);
  const jsonPath = join(OUT_DIR, `${base}json`);
  writeFileSync(htmlPath, html);
  writeFileSync(jsonPath, JSON.stringify({
    kind: 'maths-hints-to-reword', ...stamp, note: 'Seed hints failing the child-facing gates. NOT amended — the reviewer rewords her own copy.',
    heldCount: held.length,
    hints: held.map(({ entry, faults }) => ({ id: entry.id, n: entry.n, category: entry.category, description: entry.description, currentHint: entry.hint, faults, rewordedHint: '' })),
  }, null, 2));

  console.log(`${held.length} held hint(s) → ${htmlPath}`);
  for (const { entry, faults } of held) console.log(`  ${entry.id}: ${faults.length} fault(s)`);
  deliver(htmlPath, FAMILY);
  deliver(jsonPath, FAMILY);
}

main();
