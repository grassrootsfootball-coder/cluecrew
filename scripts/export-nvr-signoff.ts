/**
 * NVR TEMPLATE SIGN-OFF PACKS — `pnpm export:nvr-signoff`.
 *
 * The reviewer's sign-off pack for the NVR district, split into FOUR files —
 * one per engine family, because a reviewer signs one machine at a time, not a
 * 13-template omnibus:
 *
 *   THE MACHINE      series · matrix · analogy
 *   THE LINE-UP      like · odd one out · counting · codes
 *   THE TURNTABLE    rotation · reflection
 *   THE FOLDING ROOM nets · fold-and-punch · hidden shapes · plan views
 *
 * Each file has its own cover, decisions page and per-template sign-off lines.
 * Unlike the VR/English/Maths packs it does not list items to tick one by one —
 * NVR items are generated on demand and never stored, so what she signs is a
 * TEMPLATE VERSION, judged from a 30-per-tier sample of its deterministic
 * output. The shared PROPOSED distractor tags cut across every family, so they ride
 * with THE MACHINE (the first file) and are asked for once.
 *
 * Delivery follows the house pattern: each file is hash-named, freshness-
 * stamped, delivered to the outbound tree, and copied to ~/Downloads/nvr-signoff.
 *
 * Scale note (surfaced, per the manifesto — deviations are never silent): the
 * per-figure SVG re-embeds the gradient/marker defs, which is what made the
 * whole-district pack 29 MB. We emit the defs ONCE globally per file and strip
 * the per-figure copies (inline SVG ids are document-global; 0 dangling refs
 * verified), so each family file is a few MB — emailable and openable. A PDF at
 * these figure counts would be hundreds of pages and is deliberately not
 * produced; the HTML is the print artifact and prints the same as every pack.
 */
import { mkdirSync, writeFileSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { checkChildFacingText, renderVisual, svgDefs } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { esc, writingSpace } from './lib/review-pack-format';
import {
  NVR_FAMILIES,
  buildNvrSignoff,
  familySource,
  type NvrSignoff,
  type SignoffMisconception,
  type SignoffTemplate,
} from './lib/nvr-signoff-source';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const DOWNLOADS_DIR = join(homedir(), 'Downloads', 'nvr-signoff');
const TODAY = new Date().toISOString();

/** The defs live once at the top of the document; strip every figure's copy. */
const DEFS_RE = /<defs>[\s\S]*?<\/defs>/;
const figure = (svg: string): string => svg.replace(DEFS_RE, '');

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

/** What each template does, what its key must satisfy, and how tiers stretch it.
 * Derived from the constructors — every audit asked for this and none had it. */
const STATEMENTS: Record<string, { does: string; answer: string; tiers: string }> = {
  'machine-series': {
    does: 'A row of pictures changes one step at a time — a shape turning by a fixed angle, with a cycling number of satellite dots. Pick the picture that continues the row.',
    answer: 'The next step in the sequence: the shape turned one more increment, the dot count advanced one place in its cycle, framed exactly as the row.',
    tiers: 'T1–2 turn 45°/90° with a 2-count dot cycle; T3 adds 135° steps and a 3-count cycle; T4–5 add a shading change that compounds every two steps, and a denser frame.',
  },
  'machine-matrix': {
    does: 'A grid whose cells follow a rule across each row and (from T3) down each column; one cell is blank. Pick the picture that completes it.',
    answer: 'The cell both rules jointly produce — the across-row transform and the down-column transform each applied.',
    tiers: 'T1–2 is a 2×2 with one rule across a row; T3+ is a 3×3 with rotation across columns and size down rows; T4–5 add a shading rule down the rows.',
  },
  'machine-analogy': {
    does: 'A is to B as C is to ? — the first pair shows a transformation; apply the same one to the third shape.',
    answer: 'C with the exact A→B transformation applied (a rotation, and from T4 a shading change as well).',
    tiers: 'T1–2 use 90°/180° turns; T3 adds 45°/135°; T4–5 make it a compound rule — turn AND shading together.',
  },
  'lineup-like': {
    does: 'Several pictures share a hidden rule; pick the further picture that also belongs to the group.',
    answer: 'A picture obeying every clause of the group rule — its kind and its shading — with size and rotation free to vary.',
    tiers: 'T1–3 the rule is kind + shading; T4–5 add a relational clause — the number of satellite dots must equal the shape’s size.',
  },
  'lineup-odd': {
    does: 'Five pictures, four sharing a rule; pick the one that breaks it.',
    answer: 'The single picture that differs on the defining axis (its shading, or from T3 sometimes its kind) while the other four match.',
    tiers: 'T1–2 the odd one differs by shading; from T3 the defining axis sometimes switches to kind, so which feature marks the outsider cannot be assumed.',
  },
  'lineup-counting': {
    does: 'Pick the picture holding exactly as many shapes as the first — counting is the whole task.',
    answer: 'The option whose element count equals the target’s, exactly.',
    tiers: 'The count grows with tier (≈5–8 at T1 up to ≈28–43 at T5), always under the density cap; higher tiers reward systematic counting over a glance.',
  },
  'lineup-codes': {
    does: 'A small code table maps letters to features (kind, shading, and from T3 rotation); work out the last shape’s code.',
    answer: 'The letter string naming this shape’s features under the table — every letter legal, only the mapping telling the options apart.',
    tiers: 'T1–2 use 2-letter codes over two axes; T3+ use 3-letter codes adding a rotation axis, with three legal values per axis so no option is an eliminate-on-sight illegal string.',
  },
  'turntable-rotation': {
    does: 'One shape, then a stated clockwise turn; pick how it looks after turning.',
    answer: 'The shape turned by exactly the stated angle, same handedness — a rotation, never a mirror image.',
    tiers: 'T1–2 turn 90°/180°; T3+ add 45° and 135°, finer angles that make an off-by-a-step answer more tempting.',
  },
  'turntable-reflection': {
    does: 'One shape and a mirror line; pick its reflection (CEM-style practice; never in a GL paper).',
    answer: 'The shape flipped across the shown mirror line — a true reflection, not a turn.',
    tiers: 'T1–2 always use a vertical mirror; T3+ the line may be horizontal, so the child must read the mirror line rather than assume it.',
  },
  'folding-net': {
    does: 'A flat cube net; pick which two marked faces end up on OPPOSITE sides once it is folded.',
    answer: 'A pair one square apart on a straight strip — genuinely opposite on the cube — with each mark still the right way up.',
    tiers: 'The marks grow denser with tier; the fold logic is constant, so higher tiers tax tracking rather than change the rule.',
  },
  'folding-punch': {
    does: 'Paper is folded in half, then hole-punched; pick the sheet opened out flat.',
    answer: 'The punched holes plus their mirror images across the fold line — reflected, not shifted or turned.',
    tiers: 'T1–2 punch one hole; T3+ punch two, so more holes must be mirrored correctly and more ways exist to slip.',
  },
  'folding-hidden': {
    does: 'A small outline shape hides among clutter in one picture; find the picture that contains it exactly.',
    answer: 'The scene holding the target at its true size, kind and shading — no mirror twin, no resized or re-shaded look-alike.',
    tiers: 'The clutter count rises with tier (2 shapes at T1–2 up to 6 at T4–5), making the target harder to isolate.',
  },
  'folding-plans': {
    does: 'A 2.5-D arrangement of cube stacks seen at an angle; pick the plan view — what you would see looking straight down.',
    answer: 'The footprint: one filled cell for every column that holds cubes, including a shorter column hidden behind a taller one.',
    tiers: 'T1–2 use a 2×2 base with low stacks; T3+ use a 3×3 base with taller stacks and more hidden columns.',
  },
};

/** A blind figure cell — the SVG scales to its box, or a code renders as text. */
function cell(svg: string): string {
  return `<span class="fig">${figure(svg)}</span>`;
}

/** An item shown BLIND — options labelled A–E, no key marked, no tags. A code
 * option (empty visual, `codeLabel` set) renders its letters as text, which is
 * the whole figure for a codes item; that was the 750-blank-box bug. */
function renderItemBlind(tier: number, index: number, item: SignoffTemplate['tiers'][number]['items'][number]): string {
  const panels = item.panels
    .map((p, i) => cell(renderVisual(p, { decoration: item.stemDecoration, label: item.panelLabels?.[i] })))
    .join('');
  const opts = item.options
    .map((o, idx) => {
      const body = o.codeLabel ? `<span class="code">${esc(o.codeLabel)}</span>` : cell(renderVisual(o.visual, { decoration: item.optionDecoration }));
      return `<span class="optcell"><span class="olabel">${OPTION_LETTERS[idx]}</span>${body}</span>`;
    })
    .join('');
  return `<div class="item">
    <div class="itemhead"><span class="inum">${tier}.${String(index + 1).padStart(2, '0')}</span> <span class="seed">seed ${item.seed}</span></div>
    ${panels ? `<div class="panels">${panels}</div>` : ''}
    <div class="opts">${opts}</div>
  </div>`;
}

/** The answer key row for one item: which letter is correct, and each wrong
 * letter's misconception tag. Lives on its own page so the figures can be
 * solved blind (David's audit fix #2). */
function keyRow(tier: number, index: number, item: SignoffTemplate['tiers'][number]['items'][number]): string {
  const keyLetter = OPTION_LETTERS[item.options.findIndex((o) => o.isCorrect)];
  const wrongs = item.options
    .map((o, idx) => ({ o, idx }))
    .filter(({ o }) => !o.isCorrect)
    .map(({ o, idx }) => `${OPTION_LETTERS[idx]} ${esc((o.misconceptionId ?? '?').replace(/^nvr-/, ''))}`)
    .join(' · ');
  return `<tr><td class="kn">${tier}.${String(index + 1).padStart(2, '0')}</td><td class="kk">key ${keyLetter}</td><td class="kw">${wrongs}</td></tr>`;
}

function renderTemplate(t: SignoffTemplate): string {
  const s = STATEMENTS[t.id];
  const statement = s
    ? `<div class="statement">
      <p><strong>What it does.</strong> ${esc(s.does)}</p>
      <p><strong>A right answer must be.</strong> ${esc(s.answer)}</p>
      <p><strong>Tier 1 → Tier 5.</strong> ${esc(s.tiers)}</p>
    </div>`
    : '';

  // An acknowledged, deliberate exception — stated plainly so it is not read as
  // an oversight (reviewer + David, 2026-08-05).
  const exception = t.id === 'lineup-odd'
    ? `<div class="statement"><p><strong>Acknowledged exception — one tag by design.</strong> Odd-one-out is a
      SET-LEVEL misconception: the four wrong options ARE the group members, so there is no per-option
      error to name — the set is engineered so a child fixated on a free-roaming axis is pulled to a
      member. All four therefore carry <code>single-axis-fixation</code>. Splitting into fixed-on-size /
      -rotation / -position was considered and declined: there are only three irrelevant axes for four
      conformers, and the corpus does not support axis-specific ids. This is intended, not a gap.</p></div>`
    : t.id === 'lineup-like'
    ? `<div class="statement"><p><strong>Acknowledged exception — a repeated tag at T1–T3 only.</strong>
      At tiers 1–3 the group is defined by kind + shading, which gives three honest failure modes
      (<code>partial-rule-match</code>, <code>single-axis-fixation</code>, <code>surface-similarity</code>).
      With four distractors and three modes, the fourth has nowhere to go and repeats
      <code>surface-similarity</code> — now on a DIFFERENT wrong shape-family (drawn without replacement),
      so the two look-alikes are distinct pictures. It resolves at T4, where the relational clause adds a
      genuine fourth mode (<code>relational-rule-miss</code>). Confined to T1–T3, intended, not a gap.</p></div>`
    : '';

  const tiers = t.tiers
    .map((tierSheet) => {
      const thin = tierSheet.distinctCount < tierSheet.items.length;
      return `<div class="tier">
      <h3>Tier ${tierSheet.tier} <span class="muted">— ${tierSheet.items.length} samples · <span class="${thin ? 'thin' : ''}">${tierSheet.distinctCount} distinct</span>${tierSheet.checkFailures ? ` · ${tierSheet.checkFailures} flagged by checks` : ''}</span></h3>
      <div class="grid">${tierSheet.items.map((it, i) => renderItemBlind(tierSheet.tier, i, it)).join('')}</div>
    </div>`;
    })
    .join('');

  const keyBody = t.tiers
    .map(
      (tierSheet) => `<tbody><tr class="ksub"><td colspan="3">Tier ${tierSheet.tier}</td></tr>${tierSheet.items
        .map((it, i) => keyRow(tierSheet.tier, i, it))
        .join('')}</tbody>`,
    )
    .join('');
  const answerKey = `<div class="answerkey">
    <h3>Answer key — ${esc(t.id)} <span class="muted">(kept off the figures so they can be solved blind)</span></h3>
    <table class="ktable"><thead><tr><th>Item</th><th>Key</th><th>Distractors → misconception</th></tr></thead>${keyBody}</table>
  </div>`;

  return `<section class="template">
    <div class="thead">
      <h2>${esc(t.id)} <span class="ver">v${t.version}</span></h2>
      <p class="meta"><span class="tag">${esc(t.engineFamily)}</span> <span class="tag">${esc(t.sectionType)}</span> ${t.glPool ? '<span class="tag">GL pool</span>' : '<span class="tag">bank only</span>'}</p>
      <p class="fp">fingerprint <code>${esc(t.fingerprint)}</code></p>
    </div>
    ${statement}
    ${exception}
    ${tiers}
    ${answerKey}
    <div class="signoff">
      <p class="signline"><strong>Sign-off — ${esc(t.id)} v${t.version}</strong></p>
      <p class="confirm">“I confirm the ${esc(t.id)} template at fingerprint <code>${esc(t.fingerprint)}</code> is approved for live use.”</p>
      ${writingSpace(1, 'reviewer signature')}${writingSpace(1, 'date')}
      <p class="muted">To reject or amend instead, strike the sentence through and note why below.</p>${writingSpace(2, 'notes, only if amending')}
    </div>
  </section>`;
}

function renderMisconceptions(misconceptions: SignoffMisconception[]): string {
  const proposed = misconceptions.filter((m) => m.status === 'PROPOSED');
  const notProposed = misconceptions.filter((m) => m.status !== 'PROPOSED');
  const rows = misconceptions
    .map((m, i) => {
      // The approval door re-runs this exact gate; a hint that fails it here
      // CANNOT be approved as-is, so flag it rather than invite a dead tick.
      const hintFaults = m.missing ? [] : checkChildFacingText({ role: 'hint', label: m.id, text: m.childHint });
      const hintFlag = hintFaults.length
        ? `<p class="flag">HINT NEEDS REWORDING before it can be approved — ${esc(hintFaults[0]!.detail)}</p>`
        : '';
      return `<div class="block${m.status === 'PROPOSED' ? '' : ' settled'}">
      <div class="block-head"><span class="num">${i + 1}</span> <code>${esc(m.id)}</code> <span class="tag">${esc(m.status)}</span>${hintFaults.length ? '<span class="tag warn">copy fix</span>' : ''}</div>
      ${m.missing ? '<p class="flag">NOT IN DATABASE — this id is referenced by a constructor but has no row. Flag for import.</p>' : `<p class="desc">${esc(m.description)}</p>
      <p class="hint"><strong>child hint:</strong> ${esc(m.childHint)}</p>${hintFlag}`}
      ${m.status === 'PROPOSED' ? `<div class="boxes"><span class="box">☐ approve</span><span class="box">☐ reject</span><span class="box">☐ amend</span></div>${writingSpace(2, 'notes')}` : '<p class="muted">Already settled — shown for completeness, no decision needed.</p>'}
    </div>`;
    })
    .join('\n');
  const needReword = misconceptions.filter((m) => !m.missing && checkChildFacingText({ role: 'hint', label: m.id, text: m.childHint }).length).length;
  return `<section class="misconceptions">
  <h2>Misconceptions awaiting approval (${proposed.length} PROPOSED${notProposed.length ? `, ${notProposed.length} already settled` : ''})</h2>
  <p class="muted">These distractor tags are shared across all four NVR engine families. Each is a wrong-answer pattern a distractor is built to model; approving it activates the tag so items using it — in any family — can serve.</p>
  ${needReword ? `<p class="flag">${needReword} child hint(s) exceed the 16-word cap and are marked “copy fix”. The approval door runs the same gate, so those must be reworded before they can go ACTIVE.</p>` : ''}
  ${rows}
</section>`;
}

interface FamilyConfig {
  key: string;
  title: string;
  blurb: string;
  family: string;
  kind: string;
  misconceptions: boolean;
}

function renderFamilyFile(fam: FamilyConfig, pack: NvrSignoff, generatedAt: string): string {
  const templates = pack.templates.filter((t) => t.engineFamily === fam.key);
  const totalItems = templates.reduce((s, t) => s + t.tiers.reduce((a, x) => a + x.items.length, 0), 0);
  const proposed = pack.misconceptions.filter((m) => m.status === 'PROPOSED');

  const fpTable = templates
    .map((t) => `<tr><td><code>${esc(t.id)}</code></td><td>v${t.version}</td><td><code>${esc(t.fingerprint)}</code></td></tr>`)
    .join('');

  const misconceptionDecision = fam.misconceptions
    ? `<div class="decision">
    <p class="desc"><strong>3 · The misconceptions must be approved too</strong></p>
    <p>${proposed.length} PROPOSED distractor tags are listed after the templates. They are shared across all four NVR families, so you approve them here, once. Until each is ACTIVE, any generated item carrying it — in any family — is held back.</p>
  </div>`
    : `<div class="decision">
    <p class="desc"><strong>3 · Distractor tags are in THE MACHINE file</strong></p>
    <p>The ${pack.misconceptions.length} shared distractor tags these templates use are listed for approval in <strong>THE MACHINE</strong> file, so you decide them once rather than four times. This file's items cannot serve until both these template versions are signed and those tags are ACTIVE.</p>
  </div>`;

  const templateSections = templates.map(renderTemplate).join('\n');
  const misconceptionSection = fam.misconceptions ? renderMisconceptions(pack.misconceptions) : '';

  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>NVR sign-off — ${esc(fam.title)}</title>
<style>${PACK_CSS}</style></head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">${svgDefs()}</svg>

<div class="cover">
  <p class="kicker">Non-Verbal Reasoning · engine family</p>
  <h1>${esc(fam.title)}</h1>
  <p class="blurb">${esc(fam.blurb)}</p>
  <p>Generated ${generatedAt.slice(0, 10)}. ${templates.length} template${templates.length === 1 ? '' : 's'} · ${pack.samplesPerTier} samples per tier across tiers ${pack.tiers.join(', ')} · ${totalItems} sample items, shown blind with the answer key on a separate page${fam.misconceptions ? ` · ${proposed.length} shared misconceptions awaiting your approval` : ''}.</p>
  <dl>
    <dt>What you are signing</dt><dd>A template <strong>version</strong>, not a list of items. NVR items are generated on the spot from a template and never stored, so there is no fixed set of items to tick. You judge each version by the 30-per-tier sample of its output printed here.</dd>
    <dt>What a signature covers</dt><dd>Every item that signed version will ever generate — at any seed, in any sitting — inherits your approval. That is the whole point of signing the version rather than items.</dd>
    <dt>What voids it</dt><dd>Any change to the template. Each version carries a <em>fingerprint</em> computed from its full sampled output; if the template changes, the fingerprint changes and the signature no longer matches, so a changed template cannot serve on an old signature. This is enforced in code, not by anyone remembering.</dd>
    ${fam.misconceptions ? `<dt>The misconceptions</dt><dd>This file also carries the ${pack.misconceptions.length} shared distractor tags for the whole NVR district. A generated item cannot serve while any of its wrong-answer tags is unapproved, so approving these here is what lets every family’s signed templates actually run.</dd>` : '<dt>The misconceptions</dt><dd>The distractor tags these templates use are approved once, in <strong>THE MACHINE</strong> file — not repeated here.</dd>'}
  </dl>
  <p class="muted">Nothing here is LIVE. No NVR item can reach a child until both the template version is signed and its distractor tags are ACTIVE.</p>
</div>

<section class="decisions">
  <h2>What your signature does — ${esc(fam.title)}</h2>
  <div class="decision">
    <p class="desc"><strong>1 · You are signing a version, and it inherits</strong></p>
    <p>Each template below generates items deterministically from its version. Signing <code>template-id vN</code> approves <em>every</em> item that version produces, not the 30 samples alone — the samples are your evidence that the version is sound across the tier, nothing more.</p>
  </div>
  <div class="decision">
    <p class="desc"><strong>2 · Any change voids the signature</strong></p>
    <p>The fingerprint is a hash of the version's full sampled output across all five tiers. Change the template — a new shape, a different rule, a tier tweak — and the fingerprint moves, the version number should bump, and the old signature stops matching. The serving door refuses an item whose live template fingerprint does not match a signed one, so a silent edit cannot ride an old approval.</p>
    <table class="fptable"><thead><tr><th>Template</th><th>Version</th><th>Fingerprint (what you are signing)</th></tr></thead><tbody>${fpTable}</tbody></table>
  </div>
  ${misconceptionDecision}
  <div class="decision">
    <p class="desc"><strong>4 · Overall sign-off — ${esc(fam.title)}</strong></p>
    <p>Sign each template's own line as you go; this space is for any blanket note or condition on this family.</p>
    ${writingSpace(1, 'reviewer name')}${writingSpace(1, 'date')}${writingSpace(3, 'confirmation, in your own words — quoted verbatim in the record')}
  </div>
</section>

${templateSections}
${misconceptionSection}

</body></html>`;
}

async function main(): Promise<void> {
  const pack = await buildNvrSignoff(prisma);
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(DOWNLOADS_DIR, { recursive: true });

  for (const fam of NVR_FAMILIES) {
    const templates = pack.templates.filter((t) => t.engineFamily === fam.key);
    const stamp = freshnessStamp(familySource(pack, fam.key), TODAY);
    const base = stampedName(fam.family, stamp.sourceHash, '').replace(/\.$/, '');
    const totalItems = templates.reduce((s, t) => s + t.tiers.reduce((a, x) => a + x.items.length, 0), 0);
    const proposed = fam.misconceptions ? pack.misconceptions.filter((m) => m.status === 'PROPOSED') : [];

    const html = renderFamilyFile(fam, pack, stamp.generatedAt);
    const htmlPath = join(OUT_DIR, `${base}.html`);
    writeFileSync(htmlPath, html);

    const manifestPath = join(OUT_DIR, `${base}.json`);
    writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          kind: fam.kind,
          ...stamp,
          family: fam.key,
          title: fam.title,
          templates: templates.map((t) => ({ id: t.id, version: t.version, fingerprint: t.fingerprint })),
          proposedMisconceptions: proposed.map((m) => m.id),
          missingMisconceptions: fam.misconceptions ? pack.misconceptions.filter((m) => m.missing).map((m) => m.id) : [],
          totalFigures: totalItems,
          artifacts: [`${base}.html`],
        },
        null,
        2,
      ),
    );

    const bytes = Buffer.byteLength(html);
    console.log(
      `${fam.title.padEnd(16)} ${templates.length} template(s) · ${String(totalItems).padStart(4)} figures${fam.misconceptions ? ` · ${proposed.length} PROPOSED` : ''} · ${(bytes / 1e6).toFixed(1)} MB · ${stamp.sourceHash}`,
    );

    const delivered = [htmlPath, manifestPath].map((p) => deliver(p, fam.family));
    // Mirror deliver's supersede logic in the Downloads copy: drop any earlier
    // hash of this family so the send folder holds exactly the current version.
    for (const existing of readdirSync(DOWNLOADS_DIR)) {
      if (existing.startsWith(`${fam.family}-`) && !existing.includes(stamp.sourceHash)) {
        rmSync(join(DOWNLOADS_DIR, existing));
      }
    }
    for (const p of delivered) copyFileSync(p, join(DOWNLOADS_DIR, p.split('/').pop()!));
  }

  const missing = pack.misconceptions.filter((m) => m.missing);
  if (missing.length) console.log(`\n⚠ ${missing.length} misconception id(s) referenced but not in DB: ${missing.map((m) => m.id).join(', ')}`);
  console.log(`\nFour files → ${DOWNLOADS_DIR}`);
  await prisma.$disconnect();
}

const PACK_CSS = `
  @page { size: A4; margin: 14mm 12mm 16mm; }
  html { font-size: 10.5pt; }
  body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff; line-height: 1.4; margin: 0; }
  h1 { font-size: 26pt; margin: 0 0 2mm; letter-spacing: 0.5pt; }
  h2 { font-size: 15pt; border-bottom: 1.5pt solid #000; padding-bottom: 2mm; margin: 0 0 4mm; page-break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 4mm 0 2mm; page-break-after: avoid; }
  code { font-family: "SF Mono", Menlo, monospace; font-size: 8.5pt; }
  .muted { color: #555; font-size: 9.5pt; }
  .tag { font-family: Helvetica, Arial, sans-serif; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.3pt; border: 0.4pt solid #000; padding: 0.2mm 1.2mm; border-radius: 1mm; }
  .cover { page-break-after: always; }
  .cover .kicker { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; text-transform: uppercase; letter-spacing: 1.2pt; color: #555; margin: 0 0 1mm; }
  .cover .blurb { font-size: 13pt; color: #333; margin: 0 0 4mm; }
  .cover dl { margin-top: 6mm; } .cover dt { font-weight: bold; margin-top: 3mm; } .cover dd { margin: 0; }
  section { page-break-before: always; }
  .decisions .decision { page-break-inside: avoid; margin-bottom: 6mm; }
  .desc { font-size: 11.5pt; margin: 0 0 2mm; }
  .fptable { border-collapse: collapse; width: 100%; margin: 3mm 0; font-size: 9.5pt; }
  .fptable th, .fptable td { border: 0.4pt solid #999; padding: 1.2mm 2mm; text-align: left; }
  .template .thead { page-break-after: avoid; }
  .template h2 .ver { font-family: Helvetica, Arial, sans-serif; font-size: 11pt; color: #444; }
  .template .meta { margin: 0 0 1mm; } .template .fp { margin: 0 0 3mm; font-size: 9pt; color: #333; }
  .tier { margin-bottom: 3mm; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
  .item { border: 0.5pt solid #000; border-radius: 1.5mm; padding: 2mm; page-break-inside: avoid; }
  .itemhead { font-family: Helvetica, Arial, sans-serif; font-size: 7.5pt; color: #444; display: flex; justify-content: space-between; margin-bottom: 1mm; }
  .inum { font-weight: bold; color: #000; }
  .panels { display: flex; gap: 1mm; flex-wrap: wrap; margin-bottom: 1.5mm; padding-bottom: 1.5mm; border-bottom: 0.3pt dotted #bbb; }
  .opts { display: flex; gap: 1.5mm; flex-wrap: wrap; }
  .fig { width: 13mm; height: 13mm; display: inline-block; }
  .panels .fig { width: 14mm; height: 14mm; }
  .optcell { display: flex; flex-direction: column; align-items: center; }
  .olabel { font-family: Helvetica, Arial, sans-serif; font-weight: bold; font-size: 7.5pt; color: #000; margin-bottom: 0.3mm; }
  /* A code option: the letters ARE the figure. Boxed to read as an option. */
  .code { font-family: Helvetica, Arial, sans-serif; font-weight: bold; font-size: 12pt; letter-spacing: 1pt;
          border: 0.6pt solid #000; border-radius: 1mm; padding: 3mm 2mm; min-width: 12mm; text-align: center; }
  /* What it does / answer / tier stretch — the statement every audit wanted. */
  .statement { page-break-inside: avoid; border-left: 2.5pt solid #000; padding: 0 0 0.5mm 3mm; margin: 0 0 4mm; }
  .statement p { margin: 0 0 1.5mm; font-size: 10.5pt; }
  .thin { color: #b00; font-weight: bold; }
  .tag.warn { border-width: 1.2pt; }
  /* Answer key — its own page, so the figures above are solved blind. */
  .answerkey { page-break-before: always; }
  .ktable { border-collapse: collapse; width: 100%; font-size: 9pt; }
  .ktable th { text-align: left; border-bottom: 1pt solid #000; padding: 1.5mm 2mm; }
  .ktable td { padding: 1mm 2mm; border-bottom: 0.3pt dotted #bbb; vertical-align: top; }
  .ktable .ksub td { font-weight: bold; background: #f0f0f0; border-bottom: 0.5pt solid #000; }
  .ktable .kn { font-family: Helvetica, Arial, sans-serif; font-weight: bold; white-space: nowrap; }
  .ktable .kk { white-space: nowrap; font-weight: bold; }
  .ktable .kw { font-family: Helvetica, Arial, sans-serif; font-size: 8pt; color: #333; }
  .signoff { page-break-inside: avoid; border-top: 1pt solid #000; margin-top: 4mm; padding-top: 2mm; }
  .signline { margin: 0 0 1mm; } .signline code { font-size: 8pt; }
  .confirm { font-size: 11.5pt; margin: 0 0 2mm; } .confirm code { font-size: 9pt; }
  .boxes { display: flex; gap: 6mm; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; margin: 1.5mm 0; }
  .box { white-space: nowrap; }
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
