/**
 * Child hints that are LIVE but fail the child-facing gates —
 * `pnpm export:hints-to-reword`.
 *
 * These are hints a reviewer approved on pedagogy before the approval door
 * checked copy. They serve, so they are a real problem; but the wording is
 * the reviewer's, so this lists them rather than fixing them. Nothing here
 * amends anyone's copy.
 *
 * Regenerated rather than kept, because the gates move: a hint's fault list
 * is only true against the rules as they stand today.
 *
 * `--district=ENGLISH` (default) scopes it.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText } from '@cluecrew/core';
import { deliver } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';

const DISTRICT = (process.argv.find((arg) => arg.startsWith('--district='))?.split('=')[1] ??
  'ENGLISH') as 'VR' | 'NVR' | 'MATHS' | 'ENGLISH';
const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const TODAY = new Date().toISOString().slice(0, 10);

const esc = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function main(): Promise<void> {
  const active = await prisma.misconception.findMany({
    where: { district: DISTRICT, status: 'ACTIVE' },
    orderBy: { id: 'asc' },
  });

  const rows = active
    .map((entry) => ({
      entry,
      faults: checkChildFacingText({
        role: 'hint',
        label: entry.id,
        text: entry.childHint,
      }),
    }))
    .filter((row) => row.faults.length > 0);

  // How many items would show each hint — a hint on twenty items matters
  // more than one on none, and the reviewer should know which is which.
  const usage = new Map<string, number>();
  for (const row of rows) {
    usage.set(row.entry.id, await prisma.itemOption.count({ where: { misconceptionId: row.entry.id } }));
  }

  const faultCount = rows.reduce((sum, row) => sum + row.faults.length, 0);

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>Hints to reword — ${rows.length}</title><style>
@page { size: A4; margin: 18mm 16mm; }
html { font-size: 11pt; }
body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff; line-height: 1.45; }
h1 { font-size: 18pt; margin: 0 0 3mm; }
.muted { color: #555; font-size: 10pt; }
.block { page-break-inside: avoid; border: 0.6pt solid #000; border-radius: 2mm; padding: 4mm; margin-bottom: 5mm; }
code { font-family: "SF Mono", Menlo, monospace; font-size: 9pt; }
.fault { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; border-left: 2pt solid #000; padding-left: 3mm; margin: 2mm 0; }
.rule { border-bottom: 0.4pt solid #999; height: 8mm; }
.lab { font-family: Helvetica, Arial, sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: .4pt; color: #555; margin-bottom: 0.5mm; }
.reach { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; }
@media screen { body { max-width: 190mm; margin: 0 auto; padding: 10mm; } }
</style></head><body>
<h1>Child hints to reword (${rows.length})</h1>
<p>${faultCount} fault${faultCount === 1 ? '' : 's'} across ${rows.length} hint${rows.length === 1 ? '' : 's'}. These are hints you approved on the written review. They pass on pedagogy; they fail the child-facing copy rules, which nothing checked at the time of approval — that gap is now closed at the approval door, so this cannot recur silently.</p>
<p class="muted"><strong>Your copy, your call.</strong> Nothing here has been amended. A child sees this text when they pick that answer, so it wants to sound like the rest of the voice: short, warm, and pointing at what to do next rather than at what went awry.</p>
${rows
  .map(
    ({ entry, faults }, index) => `<div class="block">
  <p><strong>${index + 1} of ${rows.length}</strong> &nbsp; <code>${esc(entry.id)}</code>
     &nbsp; <span class="reach">shown on ${usage.get(entry.id) ?? 0} option${(usage.get(entry.id) ?? 0) === 1 ? '' : 's'}</span></p>
  <p class="lab">The misconception</p><p>${esc(entry.description)}</p>
  <p class="lab">Hint as it stands</p><p>“${esc(entry.childHint)}”</p>
  ${faults.map((fault) => `<p class="fault">${esc(fault.detail)}</p>`).join('')}
  <p class="lab">Reworded hint</p>
  <div class="rule"></div><div class="rule"></div>
</div>`,
  )
  .join('\n')}
</body></html>`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = `hints-to-reword-${DISTRICT.toLowerCase()}-${TODAY}`;
  writeFileSync(join(OUT_DIR, `${base}.html`), html);
  writeFileSync(
    join(OUT_DIR, `${base}.json`),
    JSON.stringify(
      {
        kind: 'hints-to-reword',
        district: DISTRICT,
        generated: TODAY,
        note: 'Approved on pedagogy; failing the child-facing copy rules. NOT amended — the reviewer rewords their own copy.',
        hintCount: rows.length,
        faultCount,
        hints: rows.map(({ entry, faults }) => ({
          id: entry.id,
          description: entry.description,
          currentHint: entry.childHint,
          shownOnOptions: usage.get(entry.id) ?? 0,
          faults: faults.map((fault) => fault.detail),
          rewordedHint: '',
        })),
      },
      null,
      2,
    ),
  );

  console.log(`${rows.length} hint(s), ${faultCount} fault(s) → ${join(OUT_DIR, `${base}.html`)}`);
  deliver(join(OUT_DIR, `${base}.html`));
  deliver(join(OUT_DIR, `${base}.json`));
  for (const { entry, faults } of rows) {
    console.log(`  ${entry.id} (${usage.get(entry.id) ?? 0} options): ${faults.length} fault(s)`);
  }
  await prisma.$disconnect();
}

void main();
