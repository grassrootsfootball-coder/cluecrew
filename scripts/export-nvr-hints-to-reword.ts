/**
 * NVR hints held on the gates — `pnpm export:nvr-hints-to-reword`.
 *
 * The NVR misconceptions the reviewer approved on pedagogy but whose child hint
 * trips the child-facing gates (sentence over 16 words). Reported, never
 * imported, and NOT amended — she rewords her own copy, exactly as with the
 * maths and English held-hint sets. HTML to read/print and JSON to fill in and
 * return. The set is read live from the DB, so it is always the ones actually
 * blocked, no more and no less.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { NVR_MISCONCEPTION_IDS, checkChildFacingText, isBlocking } from '@cluecrew/core';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { PRINT_CSS, esc } from './lib/review-pack-format';
import { prisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'nvr-hints-to-reword';

export interface NvrHeldHint { id: string; description: string; childHint: string; faults: string[] }

/** The held NVR hints — PROPOSED (not yet ACTIVE) with a hint that fails the
 * child-facing gates. Shared by the exporter and the freshness checker. */
export async function buildNvrHintsToRewordSource(prisma: import('@prisma/client').PrismaClient): Promise<NvrHeldHint[]> {
  const rows = await prisma.misconception.findMany({
    where: { id: { in: [...NVR_MISCONCEPTION_IDS] }, status: 'PROPOSED' },
    select: { id: true, description: true, childHint: true },
    orderBy: { id: 'asc' },
  });
  return rows
    .map((r) => ({ ...r, faults: checkChildFacingText({ role: 'hint', label: r.id, text: r.childHint }).filter(isBlocking).map((f) => f.detail) }))
    .filter((r) => r.faults.length > 0);
}

async function main(): Promise<void> {
  const held = await buildNvrHintsToRewordSource(prisma);
  const stamp = freshnessStamp(held.map((h) => ({ id: h.id, hint: h.childHint, faults: h.faults })), new Date().toISOString());

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>NVR hints to reword — ${held.length}</title><style>
${PRINT_CSS}
</style></head><body>
<div class="cover">
  <h1>NVR hints to reword (${held.length})</h1>
  <p>You approved these misconceptions on the pedagogy, and they are held only on
  wording — each has a sentence over 16 words, the child-facing ceiling. Nothing
  here has been amended: your copy, your call. The other 17 passed and are already
  approved and ACTIVE. Until these are reworded they stay PROPOSED, and any template
  whose distractors use one of them cannot go live — so this is the last thing
  between the signed templates and serving.</p>
</div>
${held.map(({ id, description, childHint, faults }, i) => `<div class="block">
  <div class="block-head"><span class="num">${i + 1} of ${held.length}</span> <code>${esc(id)}</code></div>
  <p class="lab">The misconception</p><p>${esc(description)}</p>
  <p class="lab">Hint as it stands</p><p>“${esc(childHint)}”</p>
  ${faults.map((f) => `<p class="fault">${esc(f)}</p>`).join('')}
  <p class="lab">Reworded hint (≤16 words a sentence)</p><div class="rule"></div><div class="rule"></div>
</div>`).join('\n')}
</body></html>`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY, stamp.sourceHash, '');
  const htmlPath = join(OUT_DIR, `${base}html`);
  const jsonPath = join(OUT_DIR, `${base}json`);
  writeFileSync(htmlPath, html);
  writeFileSync(jsonPath, JSON.stringify({
    kind: FAMILY, ...stamp, note: 'NVR hints failing the child-facing gates. NOT amended — the reviewer rewords her own copy.',
    heldCount: held.length,
    hints: held.map(({ id, description, childHint, faults }) => ({ id, description, currentHint: childHint, faults, rewordedHint: '' })),
  }, null, 2));

  console.log(`${held.length} held hint(s) → ${htmlPath}`);
  for (const { id, faults } of held) console.log(`  ${id}: ${faults[0]}`);
  deliver(htmlPath, FAMILY);
  deliver(jsonPath, FAMILY);
  await prisma.$disconnect();
}

if (process.argv[1]?.endsWith('export-nvr-hints-to-reword.ts')) void main();
