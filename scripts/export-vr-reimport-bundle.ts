/**
 * VR RE-IMPORT BUNDLE — `pnpm export:vr-reimport-bundle`.
 *
 * The distractor-derivation fix changed the distractors (and, for vr-07/vr-11,
 * the stems) of LIVE items the reviewer signed. Her walk-scripts name each
 * distractor by letter, so those go stale. This bundle is what she needs to
 * re-review before the fix can be re-imported to LIVE: per changed LIVE item,
 * the OLD options and tags beside the NEW ones, whether the stem changed, and
 * her current walk-script verbatim with space to rewrite it. Nothing here is
 * applied — it is the re-review packet, delivered the usual way.
 */
import { mkdirSync, writeFileSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { prisma as defaultPrisma } from '../packages/db/src/index';
import { GENERATORS, M } from '../packages/db/prisma/generate-content';
import { numberSeriesItems, letterSeriesItems } from '../packages/db/prisma/seed';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { esc, writingSpace } from './lib/review-pack-format';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const DOWNLOADS_DIR = join(homedir(), 'Downloads', 'vr-audit');
const FAMILY = 'vr-reimport-bundle';
const TODAY = new Date().toISOString();

interface NewItem { id: string; stem: Record<string, unknown>; options: Array<{ value: unknown; isCorrect: boolean; tag: string | null }> }

/** Build the NEW items (post-fix) keyed by id, for the changed banks. */
function newItemsById(): Map<string, NewItem> {
  const out = new Map<string, NewItem>();
  const GEN_BANKS = ['vr-01-insert-letter', 'vr-03-related-words', 'vr-07-letters-for-numbers', 'vr-09-letter-series', 'vr-11-number-series', 'vr-14-letter-connections'];
  for (const bank of GEN_BANKS) {
    const list = M[bank]!;
    for (const it of GENERATORS[bank]!()) {
      const id = `gen-${bank}-${String(it.n).padStart(2, '0')}`;
      out.set(id, {
        id,
        stem: it.stem as Record<string, unknown>,
        options: it.options.map((o) => ({ value: (o.content as { value?: unknown }).value, isCorrect: o.isCorrect, tag: o.isCorrect ? null : (o.mid ?? list[o.m ?? 0]!.id) })),
      });
    }
  }
  for (const it of [...numberSeriesItems(), ...letterSeriesItems()]) {
    out.set(it.id, {
      id: it.id,
      stem: it.stem as Record<string, unknown>,
      options: it.options.map((o) => ({ value: (o.content as { value?: unknown }).value, isCorrect: o.isCorrect, tag: o.misconceptionId })),
    });
  }
  return out;
}

const shortTag = (t: string | null): string => (t ?? 'key').replace(/^vr\d*-?/, '').replace(/^(letter-)?series-/, '');
const optLine = (o: { value: unknown; tag: string | null }): string => `${esc(String(o.value))} <span class="t">${o.tag ? esc(shortTag(o.tag)) : '✓ key'}</span>`;

/** The child-facing stem fields (excludes operands, which old items lack). */
function stemText(stem: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const k of ['prompt', 'sum', 'sentence', 'stemWord', 'question'] as const) if (stem[k]) parts.push(String(stem[k]));
  for (const k of ['series', 'pairA', 'clues'] as const) if (Array.isArray(stem[k])) parts.push((stem[k] as unknown[]).join(' '));
  if (stem.code) parts.push(JSON.stringify(stem.code));
  if (stem.word1 || stem.word2) parts.push(`${stem.word1 ?? ''}/${stem.word2 ?? ''}`);
  return parts.join(' | ');
}

/**
 * The bundle's source, shared with `check-export-freshness`.
 *
 * STATUS: "which LIVE items the re-import would change" is a work list, and it moves whenever the
 * generators move OR the live items do. Publishing a single reworked item invalidates the file
 * while leaving it reading as an accurate re-import plan.
 */
export async function buildReimportBundleSource(prisma: typeof defaultPrisma): Promise<unknown> {
  const nu = newItemsById();
  const live = await prisma.item.findMany({
    where: { status: 'LIVE', id: { in: [...nu.keys()] } },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  return live.map(({ id }) => {
    const next = nu.get(id)!;
    return { id, stem: next.stem, options: next.options };
  });
}

async function main(): Promise<void> {
  const prisma = defaultPrisma;
  const nu = newItemsById();
  const live = await prisma.item.findMany({
    where: { status: 'LIVE', id: { in: [...nu.keys()] } },
    include: { options: { orderBy: { id: 'asc' } }, questionType: true },
    orderBy: { id: 'asc' },
  });

  interface Change { id: string; bank: string; oldStem: string; oldOpts: Array<{ value: unknown; isCorrect: boolean; tag: string | null }>; newItem: NewItem; stemChanged: boolean; walkScript: string; scriptStale: boolean }
  const changes: Change[] = [];
  for (const item of live) {
    const next = nu.get(item.id)!;
    const oldOpts = item.options.map((o) => ({ value: (o.content as { value?: unknown }).value, isCorrect: o.isCorrect, tag: o.misconceptionId }));
    const oldSig = oldOpts.map((o) => `${o.value}:${o.tag}`).sort().join('|');
    const newSig = next.options.map((o) => `${o.value}:${o.tag}`).sort().join('|');
    if (oldSig === newSig) continue; // unchanged item (e.g. vr-14) — no re-review needed
    const oldStem = stemText(item.stem as Record<string, unknown>);
    const stemChanged = oldStem !== stemText(next.stem);
    const walkScript = String((item.explanation as { walkScript?: unknown } | null)?.walkScript ?? '');
    const newValues = new Set(next.options.map((o) => String(o.value).toLowerCase()));
    // A script naming a distractor value no longer present is provably stale.
    const scriptStale = walkScript.length > 0 && oldOpts.some((o) => !o.isCorrect && !newValues.has(String(o.value).toLowerCase()) && new RegExp(`\\b${String(o.value)}\\b`, 'i').test(walkScript));
    changes.push({ id: item.id, bank: item.questionTypeId, oldStem, oldOpts, newItem: next, stemChanged, walkScript, scriptStale });
  }

  const stamp = artefactStamp(await buildReimportBundleSource(prisma), TODAY, 'status', 'which LIVE VR items the re-import would change, and which walk scripts it strands');
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');

  const byBank = new Map<string, Change[]>();
  for (const c of changes) (byBank.get(c.bank) ?? byBank.set(c.bank, []).get(c.bank)!).push(c);
  const staleScripts = changes.filter((c) => c.scriptStale).length;
  const withScripts = changes.filter((c) => c.walkScript).length;

  const sections = [...byBank.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([bank, list]) => {
    const rows = list.map((c) => `<div class="item${c.scriptStale ? ' stale' : ''}">
      <div class="ihead"><code>${esc(c.id)}</code>${c.stemChanged ? '<span class="flag">STEM CHANGED</span>' : ''}${c.scriptStale ? '<span class="flag">WALK-SCRIPT STALE</span>' : ''}</div>
      ${c.stemChanged ? `<p class="muted">old stem: ${esc(c.oldStem)}<br>new stem: ${esc(stemText(c.newItem.stem))}</p>` : ''}
      <table class="diff"><thead><tr><th>was</th><th>now</th></tr></thead><tbody>
        <tr><td>${c.oldOpts.map(optLine).join('<br>')}</td><td>${c.newItem.options.map(optLine).join('<br>')}</td></tr>
      </tbody></table>
      ${c.walkScript ? `<div class="ws"><span class="flabel">current walk-script${c.scriptStale ? ' — names an option no longer present, rewrite to match the NEW options' : ''}</span><p class="wsold">${esc(c.walkScript)}</p>${writingSpace(3, 'rewritten walk-script')}</div>` : '<p class="muted">No walk-script on this item.</p>'}
    </div>`).join('');
    return `<section><h2>${esc(bank)} <span class="muted">${list.length} changed</span></h2>${rows}</section>`;
  }).join('\n');

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>VR re-import bundle — ${changes.length} items</title><style>${CSS}</style></head><body>
<div class="cover">
  <p class="kicker">Verbal Reasoning · re-import re-review</p>
  <h1>VR re-import bundle</h1>
  <p class="blurb">${changes.length} LIVE items changed by the distractor-derivation fix · ${staleScripts} walk-scripts provably stale.</p>
  <dl>
    <dt>Why you have this</dt><dd>The audit fix made every distractor the value its misconception actually produces. That changed the distractors — and for vr-07 and vr-11 the stems too — of items you had signed. Your walk-scripts name distractors by letter, so where a value changed the script no longer matches. <strong>Nothing is live yet from the fix</strong>; the corrected items wait on this re-review.</dd>
    <dt>What to do per item</dt><dd>Check the NEW options are sound (each distractor is now a real, single named error), then rewrite the walk-script to name the new options. Where the stem changed (flagged), read it fresh. ${withScripts} of ${changes.length} carry a walk-script.</dd>
    <dt>What happens after</dt><dd>You re-sign, we re-import the corrected items with your new walk-scripts, and the VR derivability gate keeps this class of bug from coming back.</dd>
  </dl>
  <p class="muted">Generated ${stamp.generatedAt.slice(0, 10)}. The old keys were always correct for the old stems — no child was ever mismarked; the bug was in the distractor diagnostics. Where a stem changed (vr-07, vr-11), the new key simply follows the new numbers.</p>
</div>
${sections}
</body></html>`;

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(DOWNLOADS_DIR, { recursive: true });
  const htmlPath = join(OUT_DIR, `${base}.html`);
  writeFileSync(htmlPath, html);
  const manifestPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(manifestPath, JSON.stringify({ kind: FAMILY, ...stamp, changedItems: changes.length, staleScripts, banks: [...byBank.keys()], ids: changes.map((c) => c.id), artifacts: [`${base}.html`] }, null, 2));

  console.log(`VR re-import bundle — ${changes.length} changed LIVE items · ${staleScripts} stale walk-scripts · ${stamp.sourceHash}`);
  for (const [bank, list] of byBank) console.log(`  ${bank.padEnd(28)} ${list.length} changed (${list.filter((c) => c.scriptStale).length} stale scripts)`);
  const delivered = [htmlPath, manifestPath].map((p) => deliver(p, FAMILY));
  for (const existing of readdirSync(DOWNLOADS_DIR)) if (existing.startsWith(`${FAMILY}-`) && !existing.includes(stamp.sourceHash)) rmSync(join(DOWNLOADS_DIR, existing));
  for (const p of delivered) copyFileSync(p, join(DOWNLOADS_DIR, p.split('/').pop()!));
  console.log(`\nDelivered → ${DOWNLOADS_DIR}`);
  await prisma.$disconnect();
}

const CSS = `
  @page { size: A4; margin: 15mm; } html { font-size: 10.5pt; }
  body { font-family: Georgia, serif; color: #000; line-height: 1.4; margin: 0; }
  h1 { font-size: 24pt; margin: 0 0 2mm; } h2 { font-size: 14pt; border-bottom: 1.5pt solid #000; padding-bottom: 1.5mm; margin: 0 0 4mm; }
  code { font-family: "SF Mono", Menlo, monospace; font-size: 8.5pt; } .muted { color: #555; font-size: 9pt; }
  .cover { page-break-after: always; } .cover .kicker { font-family: Helvetica, sans-serif; font-size: 9pt; letter-spacing: 1.2pt; text-transform: uppercase; color: #555; }
  .cover .blurb { font-size: 12.5pt; color: #333; margin: 0 0 4mm; } .cover dt { font-weight: bold; margin-top: 3mm; }
  section { page-break-before: always; }
  .item { page-break-inside: avoid; border: 0.6pt solid #000; border-radius: 2mm; padding: 3mm; margin: 0 0 4mm; }
  .item.stale { border-width: 1.4pt; }
  .ihead { display: flex; gap: 3mm; align-items: baseline; margin-bottom: 2mm; }
  .flag { font-family: Helvetica, sans-serif; font-weight: bold; font-size: 8pt; border: 1.2pt solid #000; padding: 0.4mm 1.6mm; }
  .diff { border-collapse: collapse; width: 100%; margin-bottom: 2mm; }
  .diff th { text-align: left; font-family: Helvetica, sans-serif; font-size: 8pt; text-transform: uppercase; color: #666; border-bottom: 0.5pt solid #000; padding: 1mm 2mm; width: 50%; }
  .diff td { vertical-align: top; padding: 1.5mm 2mm; border-right: 0.4pt dotted #bbb; font-size: 11pt; }
  .t { font-family: Helvetica, sans-serif; font-size: 7.5pt; color: #444; text-transform: uppercase; letter-spacing: 0.3pt; }
  .ws { margin-top: 2mm; } .flabel { font-family: Helvetica, sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.3pt; color: #666; }
  .wsold { font-style: italic; color: #333; margin: 1mm 0; }
  .write { margin: 1mm 0; } .write-label { font-family: Helvetica, sans-serif; font-size: 7.5pt; text-transform: uppercase; color: #555; }
  .rule { border-bottom: 0.4pt solid #999; height: 7mm; }
  @media screen { body { max-width: 195mm; margin: 0 auto; padding: 10mm; } }`;

// Only when run directly — importing this for its source builder must not run the export.
if (process.argv[1]?.endsWith('export-vr-reimport-bundle.ts')) void main();
