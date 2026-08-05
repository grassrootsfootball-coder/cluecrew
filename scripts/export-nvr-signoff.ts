/**
 * NVR TEMPLATE SIGN-OFF PACK — `pnpm export:nvr-signoff`.
 *
 * The reviewer's sign-off pack for the NVR district. Unlike the VR/English/Maths
 * packs it does not list items to tick one by one — NVR items are generated on
 * demand and never stored, so what she signs is a TEMPLATE VERSION. The pack
 * gives her, per template: a 30-per-tier sample of that version's deterministic
 * output to judge, its fingerprint, and a sign-off line; a decisions page that
 * spells out what a signature means (version, not items; inheritance; void on
 * change); and the 19 PROPOSED misconceptions whose tags her approval activates.
 *
 * Delivery follows the house pattern: hash-named, freshness-stamped, delivered
 * to the outbound tree, and copied to a ~/Downloads root folder for sending.
 *
 * Scale note (surfaced, per the manifesto — deviations are never silent): the
 * 13 templates × 5 tiers × 30 items are ~1,950 figures / ~13,800 SVGs. Rendered
 * naively that is 29 MB, because every SVG re-embeds the gradient/marker defs.
 * We emit the defs ONCE globally and strip the per-figure copies (inline SVG
 * ids are document-global), which brings the single HTML file to ~14 MB — large
 * but emailable and openable. A PDF at this figure count would be hundreds of
 * pages and tens of MB and is deliberately not produced; the HTML is the print
 * artifact, and it prints the same as every other pack.
 */
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { renderVisual, svgDefs } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { esc, writingSpace } from './lib/review-pack-format';
import { buildNvrSignoff, buildNvrSignoffSource, type SignoffTemplate } from './lib/nvr-signoff-source';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const DOWNLOADS_DIR = join(homedir(), 'Downloads', 'nvr-signoff');
const FAMILY = 'nvr-template-signoff';
const TODAY = new Date().toISOString();

/** The defs live once at the top of the document; strip every figure's copy. */
const DEFS_RE = /<defs>[\s\S]*?<\/defs>/;
const figure = (svg: string): string => svg.replace(DEFS_RE, '');

/** A compact figure cell (panel or option) — the SVG scales to its box. */
function cell(svg: string, extra = ''): string {
  return `<span class="fig ${extra}">${figure(svg)}</span>`;
}

function renderItem(t: SignoffTemplate, tier: number, index: number, item: SignoffTemplate['tiers'][number]['items'][number]): string {
  const panels = item.panels
    .map((p, i) => cell(renderVisual(p, { decoration: item.stemDecoration, label: item.panelLabels?.[i] })))
    .join('');
  const opts = item.options
    .map((o) => {
      const cls = o.isCorrect ? 'key' : '';
      const tag = o.isCorrect ? '<span class="mtag">key</span>' : o.misconceptionId ? `<span class="mtag mis">${esc(o.misconceptionId.replace(/^nvr-/, ''))}</span>` : '';
      return `<span class="optcell ${cls}">${cell(renderVisual(o.visual, { decoration: item.optionDecoration }))}${tag}</span>`;
    })
    .join('');
  return `<div class="item">
    <div class="itemhead"><span class="inum">${tier}.${String(index + 1).padStart(2, '0')}</span> <span class="seed">seed ${item.seed}</span></div>
    <div class="panels">${panels}</div>
    <div class="opts">${opts}</div>
  </div>`;
}

function renderTemplate(t: SignoffTemplate): string {
  const tiers = t.tiers
    .map(
      (tierSheet) => `<div class="tier">
      <h3>Tier ${tierSheet.tier} <span class="muted">— ${tierSheet.items.length} of ${tierSheet.items.length} sampled${tierSheet.failures ? `, ${tierSheet.failures} seed(s) refused` : ''}</span></h3>
      <div class="grid">${tierSheet.items.map((it, i) => renderItem(t, tierSheet.tier, i, it)).join('')}</div>
    </div>`,
    )
    .join('');
  return `<section class="template">
    <div class="thead">
      <h2>${esc(t.id)} <span class="ver">v${t.version}</span></h2>
      <p class="meta"><span class="tag">${esc(t.engineFamily)}</span> <span class="tag">${esc(t.sectionType)}</span> ${t.glPool ? '<span class="tag">GL pool</span>' : '<span class="tag">bank only</span>'}</p>
      <p class="fp">fingerprint <code>${esc(t.fingerprint)}</code></p>
    </div>
    ${tiers}
    <div class="signoff">
      <p class="signline"><strong>Sign-off — ${esc(t.id)} v${t.version}</strong> (fingerprint <code>${esc(t.fingerprint)}</code>)</p>
      <div class="boxes"><span class="box">☐ approve this version</span><span class="box">☐ reject</span><span class="box">☐ amend (note below)</span></div>
      ${writingSpace(1, 'reviewer name')}${writingSpace(1, 'date')}${writingSpace(2, 'notes')}
    </div>
  </section>`;
}

async function main(): Promise<void> {
  const pack = await buildNvrSignoff(prisma);
  const stamp = freshnessStamp(await buildNvrSignoffSource(prisma), TODAY);
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');

  const totalItems = pack.templates.reduce((s, t) => s + t.tiers.reduce((a, x) => a + x.items.length, 0), 0);
  const proposed = pack.misconceptions.filter((m) => m.status === 'PROPOSED');
  const notProposed = pack.misconceptions.filter((m) => m.status !== 'PROPOSED');

  const misconceptionRows = pack.misconceptions
    .map(
      (m, i) => `<div class="block${m.status === 'PROPOSED' ? '' : ' settled'}">
      <div class="block-head"><span class="num">${i + 1}</span> <code>${esc(m.id)}</code> <span class="tag">${esc(m.status)}</span></div>
      ${m.missing ? '<p class="flag">NOT IN DATABASE — this id is referenced by a constructor but has no row. Flag for import.</p>' : `<p class="desc">${esc(m.description)}</p>
      <p class="hint"><strong>child hint:</strong> ${esc(m.childHint)}</p>`}
      ${m.status === 'PROPOSED' ? `<div class="boxes"><span class="box">☐ approve</span><span class="box">☐ reject</span><span class="box">☐ amend</span></div>${writingSpace(2, 'notes')}` : '<p class="muted">Already settled — shown for completeness, no decision needed.</p>'}
    </div>`,
    )
    .join('\n');

  const templateSections = pack.templates.map(renderTemplate).join('\n');

  const decisionsList = pack.templates
    .map((t) => `<tr><td><code>${esc(t.id)}</code></td><td>v${t.version}</td><td><code>${esc(t.fingerprint)}</code></td></tr>`)
    .join('');

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>NVR template sign-off pack — ${pack.templates.length} templates</title>
<style>${PACK_CSS}</style></head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">${svgDefs()}</svg>

<div class="cover">
  <h1>Reviewer pack — Non-Verbal Reasoning templates</h1>
  <p>Generated ${stamp.generatedAt.slice(0, 10)}. ${pack.templates.length} templates · ${pack.samplesPerTier} samples per tier across tiers ${pack.tiers.join(', ')} · ${totalItems} figures shown · ${proposed.length} misconceptions awaiting your approval.</p>
  <dl>
    <dt>What you are signing</dt><dd>A template <strong>version</strong>, not a list of items. NVR items are generated on the spot from a template and never stored, so there is no fixed set of items to tick. You judge each version by the 30-per-tier sample of its output printed here.</dd>
    <dt>What a signature covers</dt><dd>Every item that signed version will ever generate — at any seed, in any sitting — inherits your approval. That is the whole point of signing the version rather than items.</dd>
    <dt>What voids it</dt><dd>Any change to the template. Each version carries a <em>fingerprint</em> computed from its full sampled output; if the template changes, the fingerprint changes and the signature no longer matches, so a changed template cannot serve on an old signature. This is enforced in code, not by anyone remembering.</dd>
    <dt>The misconceptions</dt><dd>${proposed.length} distractor tags are still PROPOSED. A generated item cannot serve while any of its wrong-answer tags is unapproved, so approving these in the same pass is what lets the signed templates actually run.</dd>
  </dl>
  <p class="muted">Nothing here is LIVE. No NVR item can reach a child until both the template version is signed and its distractor tags are ACTIVE.</p>
</div>

<section class="decisions">
  <h2>What your signature does</h2>
  <div class="decision">
    <p class="desc"><strong>1 · You are signing a version, and it inherits</strong></p>
    <p>Each template below generates items deterministically from its version. Signing <code>template-id vN</code> approves <em>every</em> item that version produces, not the 30 samples alone — the samples are your evidence that the version is sound across the tier, nothing more.</p>
  </div>
  <div class="decision">
    <p class="desc"><strong>2 · Any change voids the signature</strong></p>
    <p>The fingerprint is a hash of the version's full sampled output across all five tiers. Change the template — a new shape, a different rule, a tier tweak — and the fingerprint moves, the version number should bump, and the old signature stops matching. The serving door refuses an item whose live template fingerprint does not match a signed one, so a silent edit cannot ride an old approval.</p>
    <table class="fptable"><thead><tr><th>Template</th><th>Version</th><th>Fingerprint (what you are signing)</th></tr></thead><tbody>${decisionsList}</tbody></table>
  </div>
  <div class="decision">
    <p class="desc"><strong>3 · The misconceptions must be approved too</strong></p>
    <p>${proposed.length} PROPOSED distractor tags are listed after the templates. Until each is ACTIVE, any generated item carrying it is held back. Approving the templates without the tags would sign versions that still cannot serve.</p>
  </div>
  <div class="decision">
    <p class="desc"><strong>4 · Overall sign-off</strong></p>
    <p>Sign each template's own line as you go; this space is for any blanket note or condition.</p>
    ${writingSpace(1, 'reviewer name')}${writingSpace(1, 'date')}${writingSpace(3, 'confirmation, in your own words — quoted verbatim in the record')}
  </div>
</section>

${templateSections}

<section class="misconceptions">
  <h2>Misconceptions awaiting approval (${proposed.length} PROPOSED${notProposed.length ? `, ${notProposed.length} already settled` : ''})</h2>
  <p class="muted">Each is a wrong-answer pattern a distractor is built to model. Approving it activates the tag so items using it can serve.</p>
  ${misconceptionRows}
</section>

</body></html>`;

  mkdirSync(OUT_DIR, { recursive: true });
  const htmlPath = join(OUT_DIR, `${base}.html`);
  writeFileSync(htmlPath, html);
  const manifestPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        kind: 'nvr-signoff',
        ...stamp,
        templates: pack.templates.map((t) => ({ id: t.id, version: t.version, fingerprint: t.fingerprint })),
        proposedMisconceptions: proposed.map((m) => m.id),
        missingMisconceptions: pack.misconceptions.filter((m) => m.missing).map((m) => m.id),
        totalFigures: totalItems,
        artifacts: [`${base}.html`],
      },
      null,
      2,
    ),
  );

  const bytes = Buffer.byteLength(html);
  console.log(`${pack.templates.length} templates · ${totalItems} figures · ${proposed.length} PROPOSED misconceptions`);
  console.log(`HTML ${(bytes / 1e6).toFixed(1)} MB · sourceHash ${stamp.sourceHash}`);
  const missing = pack.misconceptions.filter((m) => m.missing);
  if (missing.length) console.log(`  ⚠ ${missing.length} misconception id(s) referenced but not in DB: ${missing.map((m) => m.id).join(', ')}`);

  // Outbound tree (the delivery discipline), then a Downloads root copy for easy sending.
  const delivered = [htmlPath, manifestPath].map((p) => deliver(p, FAMILY));
  mkdirSync(DOWNLOADS_DIR, { recursive: true });
  for (const p of delivered) {
    const dest = join(DOWNLOADS_DIR, p.split('/').pop()!);
    copyFileSync(p, dest);
    console.log(`  copied → ${dest}`);
  }

  await prisma.$disconnect();
}

const PACK_CSS = `
  @page { size: A4; margin: 14mm 12mm 16mm; }
  html { font-size: 10.5pt; }
  body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff; line-height: 1.4; margin: 0; }
  h1 { font-size: 20pt; margin: 0 0 3mm; }
  h2 { font-size: 15pt; border-bottom: 1.5pt solid #000; padding-bottom: 2mm; margin: 0 0 4mm; page-break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 4mm 0 2mm; page-break-after: avoid; }
  code { font-family: "SF Mono", Menlo, monospace; font-size: 8.5pt; }
  .muted { color: #555; font-size: 9.5pt; }
  .tag { font-family: Helvetica, Arial, sans-serif; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.3pt; border: 0.4pt solid #000; padding: 0.2mm 1.2mm; border-radius: 1mm; }
  .cover { page-break-after: always; }
  .cover dl { margin-top: 6mm; } .cover dt { font-weight: bold; margin-top: 3mm; } .cover dd { margin: 0 0 0 0; }
  section { page-break-before: always; }
  .decisions .decision { page-break-inside: avoid; margin-bottom: 6mm; }
  .desc { font-size: 11.5pt; margin: 0 0 2mm; }
  .fptable { border-collapse: collapse; width: 100%; margin: 3mm 0; font-size: 9.5pt; }
  .fptable th, .fptable td { border: 0.4pt solid #999; padding: 1.2mm 2mm; text-align: left; }
  /* Template blocks */
  .template .thead { page-break-after: avoid; }
  .template h2 .ver { font-family: Helvetica, Arial, sans-serif; font-size: 11pt; color: #444; }
  .template .meta { margin: 0 0 1mm; } .template .fp { margin: 0 0 3mm; font-size: 9pt; color: #333; }
  .tier { margin-bottom: 3mm; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
  .item { border: 0.5pt solid #000; border-radius: 1.5mm; padding: 2mm; page-break-inside: avoid; }
  .itemhead { font-family: Helvetica, Arial, sans-serif; font-size: 7.5pt; color: #444; display: flex; justify-content: space-between; margin-bottom: 1mm; }
  .inum { font-weight: bold; color: #000; }
  .panels { display: flex; gap: 1mm; flex-wrap: wrap; margin-bottom: 1.5mm; padding-bottom: 1.5mm; border-bottom: 0.3pt dotted #bbb; }
  .opts { display: flex; gap: 1mm; flex-wrap: wrap; }
  .fig { width: 13mm; height: 13mm; display: inline-block; }
  .panels .fig { width: 14mm; height: 14mm; }
  .optcell { display: flex; flex-direction: column; align-items: center; }
  .optcell.key .fig { outline: 1.2pt solid #000; border-radius: 1mm; }
  .mtag { font-family: Helvetica, Arial, sans-serif; font-size: 5.5pt; text-transform: uppercase; letter-spacing: 0.2pt; margin-top: 0.4mm; }
  .optcell.key .mtag { font-weight: bold; }
  .mtag.mis { color: #333; max-width: 13mm; text-align: center; line-height: 1.05; }
  .signoff { page-break-inside: avoid; border-top: 1pt solid #000; margin-top: 4mm; padding-top: 2mm; }
  .signline { margin: 0 0 1mm; } .signline code { font-size: 8pt; }
  .boxes { display: flex; gap: 6mm; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; margin: 1.5mm 0; }
  .box { white-space: nowrap; }
  /* Misconception blocks */
  .block { page-break-inside: avoid; border: 0.6pt solid #000; border-radius: 2mm; padding: 3mm; margin: 0 0 4mm; }
  .block.settled { border-color: #999; color: #333; }
  .block-head { display: flex; gap: 3mm; align-items: baseline; border-bottom: 0.4pt dotted #666; padding-bottom: 1.5mm; margin-bottom: 2mm; }
  .num { font-weight: bold; }
  .hint { margin: 1mm 0; }
  .flag { font-family: Helvetica, Arial, sans-serif; font-weight: bold; font-size: 9pt; border: 1.2pt solid #000; padding: 1mm 2mm; }
  .write { margin: 1mm 0 2mm; }
  .write-label { font-family: Helvetica, Arial, sans-serif; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.4pt; color: #555; }
  .rule { border-bottom: 0.4pt solid #999; height: 7mm; }
  @media screen { body { max-width: 200mm; margin: 0 auto; padding: 8mm; } }`;

void main();
