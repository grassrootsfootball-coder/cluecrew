/**
 * SHARED VR PACK RENDERING — blind items + a back-of-pack answer key, used by
 * both the audit sample and the pattern-check sample so the two packs a reviewer
 * receives look and behave identically. Rendering only; the sampling and the
 * freshness stamp live in each pack's own source.
 */
import { esc } from './review-pack-format';
import type { AuditCase, AuditItem } from './vr-audit-source';

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const asText = (value: unknown): string => (Array.isArray(value) ? value.join(', ') : String(value ?? ''));

/** A VR stem's meaningful fields — the prompt, then whatever structured parts
 * the mechanic carries (a card word, a series, a pair, clues, a gap). */
export function renderStem(stem: Record<string, unknown>): string {
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

/** One item, shown BLIND: options A–E, no key marked, no tags. */
export function renderItemBlind(displayNumber: number, item: AuditItem): string {
  const opts = item.options
    .map((o, idx) => `<li><span class="olabel">${OPTION_LETTERS[idx]}</span> ${esc(asText(o.value))}</li>`)
    .join('');
  return `<div class="item">
    <div class="itemhead"><span class="inum">${displayNumber}</span> <code>${esc(item.itemId)}</code>${item.tier != null ? ` <span class="tag">tier ${item.tier}</span>` : ''}</div>
    <div class="stem">${renderStem(item.stem)}</div>
    <ol class="opts">${opts}</ol>
  </div>`;
}

/** The answer key, grouped by case, on its own pages at the back. `n` starts
 * from the given offset so numbering matches the blind items. */
export function renderAnswerKey(cases: AuditCase[], startFrom = 1): string {
  let n = startFrom - 1;
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
    <p class="muted">The key letter and value, then each distractor's misconception.</p>
    <table class="ktable"><thead><tr><th>#</th><th>Item</th><th>Key</th><th>Distractors → misconception</th></tr></thead>${blocks}</table>
  </section>`;
}

export const VR_PACK_CSS = `
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
  .ktable { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
  .ktable th { text-align: left; border-bottom: 1pt solid #000; padding: 1.5mm 2mm; }
  .ktable td { padding: 1.2mm 2mm; border-bottom: 0.3pt dotted #bbb; vertical-align: top; }
  .ktable .ksub td { font-weight: bold; background: #f0f0f0; border-bottom: 0.5pt solid #000; padding-top: 2.5mm; }
  .ktable .kn { font-family: Helvetica, Arial, sans-serif; font-weight: bold; }
  .ktable .kk { font-weight: bold; white-space: nowrap; }
  .ktable .kw { font-family: Helvetica, Arial, sans-serif; font-size: 8.5pt; color: #333; }
  @media screen { body { max-width: 190mm; margin: 0 auto; padding: 10mm; } }`;
