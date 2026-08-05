/**
 * VR PATTERN-CHECK SAMPLE — `pnpm export:vr-pattern-sample`.
 *
 * The reviewer asked for genuinely RANDOM samples (not the audit pack's stride)
 * of 20 items each from vr-04 (closest meaning) and vr-07 (letters for numbers),
 * to check whether two structural patterns hold across the whole bank:
 *   · vr-04: the option skeleton — key + an obvious antonym + two nouns;
 *   · vr-07: the P + Q shape.
 * Same format as the audit pack: items shown blind with the served shuffle, the
 * answer key on its own pages at the back. Hash-named, freshness-checked.
 */
import { mkdirSync, writeFileSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { esc } from './lib/review-pack-format';
import { buildVrPatternSample, buildVrPatternSource } from './lib/vr-audit-source';
import { VR_PACK_CSS, renderAnswerKey, renderItemBlind } from './lib/vr-pack-render';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const DOWNLOADS_DIR = join(homedir(), 'Downloads', 'vr-audit');
const FAMILY = 'vr-pattern-sample';
const KIND = 'vr-pattern-sample';
const TODAY = new Date().toISOString();

const SPECS = [
  { questionTypeId: 'vr-04-closest-meaning', sampleSize: 20, seed: 'vr04-pattern-2026-08' },
  { questionTypeId: 'vr-07-letters-for-numbers', sampleSize: 20, seed: 'vr07-pattern-2026-08' },
];
const PATTERN_NOTE: Record<string, string> = {
  'vr-04-closest-meaning': 'Checking the option skeleton holds across the bank: key + an obvious antonym + two nouns.',
  'vr-07-letters-for-numbers': 'Checking the P + Q shape holds across the bank.',
};

async function main(): Promise<void> {
  const sample = await buildVrPatternSample(prisma, SPECS);
  const stamp = freshnessStamp(await buildVrPatternSource(prisma, SPECS), TODAY);
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');

  let running = 1;
  const sections = sample.cases
    .map((kase) => {
      const items = kase.sampled.map((item, i) => renderItemBlind(running + i, item)).join('');
      running += kase.sampled.length;
      return `<section class="case">
        <h2>${esc(kase.title)} <span class="ver">${esc(kase.caseId)}</span></h2>
        <p class="meta"><span class="tag">${esc(kase.mechanic ?? '')}</span> <span class="muted">${kase.sampled.length} of ${kase.liveTotal} live items, randomly drawn</span></p>
        <p class="prompt">${esc(PATTERN_NOTE[kase.questionTypeId] ?? '')}</p>
        ${items}
      </section>`;
    })
    .join('\n');

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>VR pattern-check sample — ${sample.total} items</title>
<style>${VR_PACK_CSS}</style></head>
<body>
<div class="cover">
  <p class="kicker">Verbal Reasoning · pattern-check sample</p>
  <h1>VR pattern-check sample</h1>
  <p class="blurb">20 items each from vr-04 (closest meaning) and vr-07 (letters for numbers), randomly drawn.</p>
  <dl>
    <dt>What this is for</dt><dd>A genuinely <strong>random</strong> sample of each bank — not a systematic stride — so you can judge whether a structural pattern holds across the whole bank, not just where a stride happened to land.</dd>
    <dt>The patterns you flagged</dt><dd><strong>vr-04:</strong> does every item's option set follow key + an obvious antonym + two nouns? <strong>vr-07:</strong> does every item follow the P + Q shape?</dd>
    <dt>Order and blindness</dt><dd>Items are shown <strong>blind</strong> (options A–E), in the <strong>shuffled order a child is served</strong> — the key is not in a fixed position. The key and each distractor's misconception are in the answer key at the back.</dd>
  </dl>
  <p class="muted">Generated ${stamp.generatedAt.slice(0, 10)}. This content is LIVE and signed off; the sample is a pattern check.</p>
</div>

${sections}

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
      { kind: KIND, ...stamp, total: sample.total, banks: sample.cases.map((c) => ({ caseId: c.caseId, sampled: c.sampled.length, liveTotal: c.liveTotal })), artifacts: [`${base}.html`] },
      null,
      2,
    ),
  );

  console.log(`VR pattern-check sample — ${sample.total} items · ${(Buffer.byteLength(html) / 1e6).toFixed(2)} MB · ${stamp.sourceHash}`);
  for (const c of sample.cases) console.log(`  ${c.caseId.padEnd(11)} ${String(c.sampled.length).padStart(2)}/${c.liveTotal}`);

  const delivered = [htmlPath, manifestPath].map((p) => deliver(p, FAMILY));
  for (const existing of readdirSync(DOWNLOADS_DIR)) {
    if (existing.startsWith(`${FAMILY}-`) && !existing.includes(stamp.sourceHash)) rmSync(join(DOWNLOADS_DIR, existing));
  }
  for (const p of delivered) copyFileSync(p, join(DOWNLOADS_DIR, p.split('/').pop()!));
  console.log(`\nDelivered → ${DOWNLOADS_DIR}`);
  await prisma.$disconnect();
}

void main();
