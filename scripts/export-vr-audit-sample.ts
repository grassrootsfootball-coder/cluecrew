/**
 * VR AUDIT SAMPLE PACK — `pnpm export:vr-audit-sample`.
 *
 * An independent re-check for the incoming reviewer of the VR free-ten, which is
 * already LIVE and signed off. 50 items across all ten live cases, weighted
 * toward the four meaning-based types no automated gate can verify (see
 * vr-audit-source.ts). Same shape as the corrected NVR packs: items shown BLIND
 * (options A–E, no key marked, no tags), the answer key on its own pages at the
 * back, hash-named and freshness-checked, delivered to the outbound tree and a
 * ~/Downloads folder.
 */
import { mkdirSync, writeFileSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { esc } from './lib/review-pack-format';
import { buildVrAuditSample, buildVrAuditSource, type AuditCase, type AuditItem } from './lib/vr-audit-source';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const DOWNLOADS_DIR = join(homedir(), 'Downloads', 'vr-audit');
const FAMILY = 'vr-audit-sample';
const KIND = 'vr-audit-sample';
const TODAY = new Date().toISOString();
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

const asText = (value: unknown): string => (Array.isArray(value) ? value.join(', ') : String(value ?? ''));

/** Render a VR stem's meaningful fields — the prompt, then whatever structured
 * parts the mechanic carries (a card word, a series, a pair, clues, a gap). */
function renderStem(stem: Record<string, unknown>): string {
  const rows: string[] = [];
  const prompt = stem.prompt ? `<p class="prompt">${esc(String(stem.prompt))}</p>` : '';
  const add = (labelText: string, value: string): void => {
    if (value.trim()) rows.push(`<p class="field"><span class="flabel">${esc(labelText)}</span> ${value}</p>`);
  };

  if (stem.words) add('word', `<strong>${esc(asText(stem.words).toUpperCase())}</strong>`);
  if (stem.sentence) add('sentence', esc(String(stem.sentence)));
  if (Array.isArray(stem.series)) add('series', `${(stem.series as unknown[]).map((s) => esc(String(s))).join(' &nbsp; ')} &nbsp; <strong>?</strong>`);
  if (Array.isArray(stem.pairA)) {
    const a = stem.pairA as unknown[];
    add('like this', `${esc(String(a[0]))} &rarr; ${esc(String(a[1]))}`);
    if (stem.stemWord) add('complete', `${esc(String(stem.stemWord))} &rarr; <strong>?</strong>`);
  }
  if (stem.word1 || stem.word2) add('words', `${esc(String(stem.word1 ?? ''))} &nbsp;/&nbsp; ${esc(String(stem.word2 ?? ''))}`);
  if (stem.code && typeof stem.code === 'object') {
    add('code', Object.entries(stem.code as Record<string, unknown>).map(([k, v]) => `${esc(k)} = ${esc(String(v))}`).join(' &nbsp; '));
    if (stem.sum) add('work out', `<strong>${esc(String(stem.sum))}</strong>`);
  }
  if (Array.isArray(stem.clues)) {
    rows.push(`<div class="field"><span class="flabel">clues</span><ul class="clues">${(stem.clues as unknown[]).map((c) => `<li>${esc(String(c))}</li>`).join('')}</ul></div>`);
  }
  if (stem.question) add('question', `<strong>${esc(String(stem.question))}</strong>`);

  return `${prompt}${rows.join('')}`;
}

function renderItemBlind(displayNumber: number, item: AuditItem): string {
  const opts = item.options
    .map((o, idx) => `<li><span class="olabel">${OPTION_LETTERS[idx]}</span> ${esc(asText(o.value))}</li>`)
    .join('');
  return `<div class="item">
    <div class="itemhead"><span class="inum">${displayNumber}</span> <code>${esc(item.itemId)}</code>${item.tier != null ? ` <span class="tag">tier ${item.tier}</span>` : ''}</div>
    <div class="stem">${renderStem(item.stem)}</div>
    <ol class="opts">${opts}</ol>
  </div>`;
}

function renderCaseSection(kase: AuditCase, startNumber: number): string {
  const items = kase.sampled
    .map((item, i) => renderItemBlind(startNumber + i, item))
    .join('');
  return `<section class="case">
    <h2>${esc(kase.title)} <span class="ver">${esc(kase.caseId)}</span></h2>
    <p class="meta"><span class="tag${kase.semantic ? ' sem' : ''}">${kase.semantic ? 'meaning-based — no gate verifies this' : 'formal — computed key'}</span> <span class="tag">${esc(kase.mechanic ?? '')}</span> <span class="muted">${kase.sampled.length} of ${kase.liveTotal} live items sampled</span></p>
    ${items}
  </section>`;
}

function renderAnswerKey(cases: AuditCase[]): string {
  let n = 0;
  const blocks = cases
    .map((kase) => {
      const rows = kase.sampled
        .map((item) => {
          n += 1;
          const keyIdx = item.options.findIndex((o) => o.isKey);
          const keyOpt = item.options[keyIdx];
          const wrongs = item.options
            .map((o, idx) => ({ o, idx }))
            .filter(({ o }) => !o.isKey)
            .map(({ o, idx }) => `${OPTION_LETTERS[idx]} ${esc((o.misconceptionId ?? '—').replace(/^vr\d*-?/, ''))}`)
            .join(' · ');
          return `<tr><td class="kn">${n}</td><td class="kc"><code>${esc(item.itemId)}</code></td><td class="kk">${OPTION_LETTERS[keyIdx]} — ${esc(asText(keyOpt?.value))}</td><td class="kw">${wrongs}</td></tr>`;
        })
        .join('');
      return `<tbody><tr class="ksub"><td colspan="4">${esc(kase.title)} <span class="muted">(${esc(kase.caseId)})</span></td></tr>${rows}</tbody>`;
    })
    .join('');
  return `<section class="answerkey">
    <h2>Answer key <span class="muted">(kept off the items so you can work them blind first)</span></h2>
    <p class="muted">The key letter and value, then each distractor's misconception. On the meaning-based types, the question is whether you agree the key is right and each wrong option is honestly wrong.</p>
    <table class="ktable"><thead><tr><th>#</th><th>Item</th><th>Key</th><th>Distractors → misconception</th></tr></thead>${blocks}</table>
  </section>`;
}

async function main(): Promise<void> {
  const sample = await buildVrAuditSample(prisma);
  const stamp = freshnessStamp(await buildVrAuditSource(prisma), TODAY);
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');

  const semanticCases = sample.cases.filter((c) => c.semantic);
  let running = 1;
  const caseSections = sample.cases
    .map((kase) => {
      const html = renderCaseSection(kase, running);
      running += kase.sampled.length;
      return html;
    })
    .join('\n');

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>VR audit sample — ${sample.total} items</title>
<style>${PACK_CSS}</style></head>
<body>
<div class="cover">
  <p class="kicker">Verbal Reasoning · independent audit sample</p>
  <h1>VR audit sample</h1>
  <p class="blurb">${sample.total} items across all ${sample.cases.length} live cases · ${sample.semanticTotal} from the four meaning-based types.</p>
  <dl>
    <dt>This content is already live</dt><dd>Every item here is <strong>LIVE and signed off</strong> — children can meet it now, and a specialist reviewer already passed it on written review. This pack is not a sign-off; it is an <strong>independent check</strong>, a fresh pair of eyes on content already in service.</dd>
    <dt>Why these items</dt><dd>The sample is weighted toward the four VR types whose correctness <strong>no automated gate can verify</strong> — closest meaning, related words, missing word, and reading information. A letter series or a code sum has a computed key our gates already prove; “which word is closest in meaning” has no such check. ${sample.semanticTotal} of ${sample.total} items come from those four (${semanticCases.map((c) => c.caseId.replace('case-', '')).join(', ')}); the other six formal types are here for completeness.</dd>
    <dt>What to look for</dt><dd>On each item: is the marked key genuinely the best answer, and is every other option honestly wrong (not a second defensible answer)? The items are shown <strong>blind</strong>; the key and each distractor's intended misconception are in the answer key at the back, so you can form your own view first.</dd>
    <dt>Option order</dt><dd>Options are printed in the <strong>shuffled order a child is served</strong> (seeded and stable), not the stored authoring order — so the key is not in a fixed position. Children never receive stored order; the serving path shuffles every item per child.</dd>
  </dl>
  <p class="muted">Generated ${stamp.generatedAt.slice(0, 10)}. Nothing changes in service from this pack — it is a check, and anything you flag goes back through the review pipeline like any other change.</p>
</div>

${caseSections}

${renderAnswerKey(sample.cases)}
</body></html>`;

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(DOWNLOADS_DIR, { recursive: true });
  const htmlPath = join(OUT_DIR, `${base}.html`);
  writeFileSync(htmlPath, html);
  const manifestPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        kind: KIND,
        ...stamp,
        total: sample.total,
        semanticTotal: sample.semanticTotal,
        cases: sample.cases.map((c) => ({ caseId: c.caseId, semantic: c.semantic, sampled: c.sampled.length, liveTotal: c.liveTotal })),
        artifacts: [`${base}.html`],
      },
      null,
      2,
    ),
  );

  console.log(`VR audit sample — ${sample.total} items (${sample.semanticTotal} meaning-based) across ${sample.cases.length} cases · ${(Buffer.byteLength(html) / 1e6).toFixed(2)} MB · ${stamp.sourceHash}`);
  for (const c of sample.cases) console.log(`  ${c.caseId.padEnd(11)} ${c.semantic ? 'SEMANTIC' : 'formal  '} ${String(c.sampled.length).padStart(2)}/${c.liveTotal}`);

  const delivered = [htmlPath, manifestPath].map((p) => deliver(p, FAMILY));
  for (const existing of readdirSync(DOWNLOADS_DIR)) {
    if (existing.startsWith(`${FAMILY}-`) && !existing.includes(stamp.sourceHash)) rmSync(join(DOWNLOADS_DIR, existing));
  }
  for (const p of delivered) copyFileSync(p, join(DOWNLOADS_DIR, p.split('/').pop()!));
  console.log(`\nDelivered → ${DOWNLOADS_DIR}`);
  await prisma.$disconnect();
}

const PACK_CSS = `
  @page { size: A4; margin: 16mm 16mm 18mm; }
  html { font-size: 11pt; }
  body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff; line-height: 1.45; margin: 0; }
  h1 { font-size: 26pt; margin: 0 0 2mm; letter-spacing: 0.4pt; }
  h2 { font-size: 15pt; border-bottom: 1.5pt solid #000; padding-bottom: 2mm; margin: 0 0 4mm; page-break-after: avoid; }
  code { font-family: "SF Mono", Menlo, monospace; font-size: 8.5pt; }
  .muted { color: #555; font-size: 9.5pt; }
  .tag { font-family: Helvetica, Arial, sans-serif; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.3pt; border: 0.4pt solid #000; padding: 0.3mm 1.4mm; border-radius: 1mm; }
  .tag.sem { border-width: 1.2pt; font-weight: bold; }
  .cover { page-break-after: always; }
  .cover .kicker { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; text-transform: uppercase; letter-spacing: 1.2pt; color: #555; margin: 0 0 1mm; }
  .cover .blurb { font-size: 13pt; color: #333; margin: 0 0 4mm; }
  .cover dl { margin-top: 6mm; } .cover dt { font-weight: bold; margin-top: 3.5mm; } .cover dd { margin: 0.5mm 0 0; }
  section { page-break-before: always; }
  .case .ver { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #666; }
  .case .meta { margin: -2mm 0 4mm; }
  .item { page-break-inside: avoid; border: 0.6pt solid #000; border-radius: 2mm; padding: 3mm 3.5mm; margin: 0 0 4mm; }
  .itemhead { font-family: Helvetica, Arial, sans-serif; font-size: 8.5pt; color: #444; display: flex; gap: 3mm; align-items: baseline; border-bottom: 0.3pt dotted #bbb; padding-bottom: 1.5mm; margin-bottom: 2.5mm; }
  .inum { font-weight: bold; color: #000; font-size: 11pt; }
  .stem { margin-bottom: 2.5mm; }
  .prompt { font-size: 12pt; margin: 0 0 2mm; }
  .field { margin: 1mm 0; }
  .flabel { font-family: Helvetica, Arial, sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.4pt; color: #666; margin-right: 2mm; }
  .clues { margin: 1mm 0 1mm 6mm; padding: 0; }
  .opts { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 6mm; }
  .opts li { padding: 1mm 0; border-bottom: 0.3pt dotted #ccc; }
  .olabel { font-family: Helvetica, Arial, sans-serif; font-weight: bold; margin-right: 2mm; }
  .answerkey { }
  .ktable { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
  .ktable th { text-align: left; border-bottom: 1pt solid #000; padding: 1.5mm 2mm; }
  .ktable td { padding: 1.2mm 2mm; border-bottom: 0.3pt dotted #bbb; vertical-align: top; }
  .ktable .ksub td { font-weight: bold; background: #f0f0f0; border-bottom: 0.5pt solid #000; padding-top: 2.5mm; }
  .ktable .kn { font-family: Helvetica, Arial, sans-serif; font-weight: bold; }
  .ktable .kk { font-weight: bold; white-space: nowrap; }
  .ktable .kw { font-family: Helvetica, Arial, sans-serif; font-size: 8.5pt; color: #333; }
  @media screen { body { max-width: 190mm; margin: 0 auto; padding: 10mm; } }`;

void main();
