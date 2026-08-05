/**
 * MATHS CALIBRATION REVIEW PACK — `pnpm export:maths-review-pack`.
 *
 * The 40 calibration items in the shared reviewer-pack format (same as VR and
 * English): stem, options with the key marked, each distractor's misconception
 * — a named library id where mapped, otherwise its gap-family slug — and the
 * walk script. The three tier-calibration queries (MEAS-03, MEAS-06, GEOM-06)
 * are flagged prominently, and repeated on the decisions page for a ruling.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { DECISION_BOXES, PRINT_CSS, esc, renderPdf, writingSpace } from './lib/review-pack-format';
import { CATEGORY_NAMES, FAMILIES, GROUP_ORDER, buildCalibration } from './lib/maths-calibration-source';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const ROOT = resolve(import.meta.dirname, '..');
const FAMILY = 'maths-calibration-pack';
const famTitle = new Map(FAMILIES.map((f) => [f.slug, f.title]));

async function main(): Promise<void> {
  const { items, families } = buildCalibration();
  const stamp = freshnessStamp(items, new Date().toISOString());
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');

  const misText = (o: { misconceptionRef: string | null; familySlug: string | null; behaviour: string | null }): string => {
    if (o.misconceptionRef) return `<code>${esc(o.misconceptionRef)}</code> (named) — ${esc(o.behaviour ?? '')}`;
    if (o.familySlug) return `<code>${esc(o.familySlug)}</code> (gap family: ${esc(famTitle.get(o.familySlug) ?? '')}) — ${esc(o.behaviour ?? '')}`;
    return `<strong>UNMAPPED</strong> — ${esc(o.behaviour ?? '')}`;
  };

  const sections = GROUP_ORDER.map((group) => {
    const groupItems = items.filter((it) => it.group === group);
    const blocks = groupItems.map((it, i) => `<div class="block${it.tierQuery ? ' flagged' : ''}">
      <div class="block-head">
        <span class="num">${i + 1} of ${groupItems.length}</span>
        <span class="tag">tier ${it.tier}</span><span class="tag">${esc(it.steps)}</span>
        <code>${esc(it.itemId)}</code>
        ${it.tierQuery ? '<span class="flag">TIER QUERY — see decisions page</span>' : ''}
      </div>
      <p class="stem">${esc(it.stem)}</p>
      <p class="muted">solution <code>${esc(it.solution)}</code></p>
      <ul class="options">
        ${it.options.map((o) => `<li class="${o.isKey ? 'correct' : ''}">
          <span class="mark">${o.isKey ? '✔' : '☐'}</span>
          <span class="opt">${esc(o.label)}. ${esc(o.value)}</span>
          <span class="mis">${o.isKey ? '<em>key</em>' : misText(o)}</span>
        </li>`).join('')}
      </ul>
      <p class="walk">${esc(it.walkScript)}</p>
      ${DECISION_BOXES}${writingSpace(2, 'notes')}
    </div>`).join('\n');
    return `<section><h2>${esc(CATEGORY_NAMES[group])}</h2>${blocks}</section>`;
  }).join('\n');

  const queries = items.filter((it) => it.tierQuery);
  const decisions = `<section>
    <h2>Decisions</h2>
    <div class="decision">
      <p class="desc"><strong>1 · Three tier-calibration queries</strong></p>
      <p>These surfaced on the two-pass review; a retier would shift the ratified GL mix, so they were
      left as authored for your ruling.</p>
      ${queries.map((it) => `<div class="block flagged">
        <div class="block-head"><span class="num">${esc(it.itemId)}</span> <span class="tag">tier ${it.tier}</span></div>
        <p>${esc(it.stem)}</p>
        ${it.itemId.includes('MEAS-0') ? '<p class="muted">MEAS-03 (T2) and MEAS-06 (T3) are structurally identical unitary two-step proportion problems — one is mistiered relative to the other.</p>' : '<p class="muted">GEOM-06 is a two-step isosceles missing-angle item tagged T5; it reads as a T4 stretch. Kept at T5 to hold the two-T5 mix.</p>'}
      </div>`).join('')}
      ${writingSpace(3, 'your tier ruling')}
    </div>
    <div class="decision">
      <p class="desc"><strong>2 · The gap families</strong></p>
      <p>${families.length} recurring misconceptions here are not yet named in your library — they are in the
      companion file <code>maths-gap-families</code>, listed by item. Numbering and wording them makes this
      batch importable, since every distractor must reference an approved id.</p>
    </div>
    <div class="decision">
      <p class="desc"><strong>3 · Sign-off</strong></p>
      <p>Signing confirms the items you have not marked otherwise are fit to serve, pending the id-mapping.</p>
      ${writingSpace(1, 'reviewer name')}${writingSpace(1, 'date')}
      ${writingSpace(3, 'confirmation, in your own words — quoted verbatim in the record')}
    </div>
  </section>`;

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>Maths calibration review pack — ${items.length} items</title><style>
${PRINT_CSS}
</style></head><body>
<div class="cover">
  <h1>Reviewer pack — Maths calibration batch 01</h1>
  <p>Generated ${stamp.generatedAt.slice(0, 10)}. ${items.length} items, grouped by curriculum area.
  Print single-sided; there is writing space on every item.</p>
  <dl>
    <dt>What this is</dt><dd>The first maths calibration batch — every item's key computed from its
    solution, every distractor an executed misconception, each with a walk script.</dd>
    <dt>Misconception column</dt><dd>A <code>#named</code> id where you supplied it (#11, #21, #24); otherwise
    a <code>gap-family</code> slug from the companion file, which you number and word.</dd>
    <dt>Tier queries</dt><dd>MEAS-03, MEAS-06 and GEOM-06 carry a flag and a ruling box on the last page.</dd>
  </dl>
  <p class="muted">Nothing here is LIVE. The batch cannot import until the gap families are named — a
  distractor may only reference an approved id.</p>
</div>
${sections}
${decisions}
</body></html>`;

  mkdirSync(OUT_DIR, { recursive: true });
  const htmlPath = join(OUT_DIR, `${base}.html`);
  writeFileSync(htmlPath, html);
  const pdfPath = await renderPdf(html, OUT_DIR, base, ROOT);
  const manifestPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(manifestPath, JSON.stringify({ kind: 'maths-calibration-pack', ...stamp, itemCount: items.length, tierQueries: queries.map((q) => q.itemId), artifacts: [`${base}.html`, `${base}.pdf`] }, null, 2));

  console.log(`${items.length} items · sourceHash ${stamp.sourceHash}`);
  for (const p of [htmlPath, pdfPath, manifestPath]) if (p) deliver(p, FAMILY);
}

void main();
