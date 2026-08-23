/**
 * DOES ANY OTHER CONTENT-BEARING SURFACE READ SILENCE AS CLEAN? (David, 2026-08-23 — R660.)
 *
 * The passage fault: a migration derived SERVABLE from an absent judgement record — silence read as
 * clean, found by a human noticing a count. **One report, populations and methods stated, so the
 * class is closed by an instrument.** Per surface: what serves, what the absence of a record does,
 * FAILS-CLOSED or SILENCE-AS-CLEAN, read from schema defaults and gate code, not recollection.
 */
import { prisma } from '../packages/db/src/index';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const rows: Array<{ surface: string; verdict: 'FAILS-CLOSED' | 'SILENCE-AS-CLEAN' | 'CLOSED-THIS-TURN'; method: string; population: string }> = [];

  rows.push({ surface: 'Items (Item.status)', verdict: 'FAILS-CLOSED',
    method: 'schema: @default(DRAFT), comment "a row written without an explicit status cannot be served"; serving queries filter status LIVE',
    population: `${await prisma.item.count()} rows, ${await prisma.item.count({ where: { status: 'LIVE' } })} LIVE` });

  rows.push({ surface: 'Word cards (Word.status)', verdict: 'FAILS-CLOSED',
    method: 'schema: @default(DRAFT) "fails closed"; DB constraint word_live_needs_reviewer refuses LIVE without a reviewer name; the WordTap join takes LIVE only',
    population: `${await prisma.word.count()} rows, ${await prisma.word.count({ where: { status: 'LIVE' } })} LIVE` });

  rows.push({ surface: 'Passages (passageStatus)', verdict: 'CLOSED-THIS-TURN',
    method: 'serve path admits explicit SERVABLE alone (fails closed); impliedServingStatus derives UNRECORDED from an absent judgement record; check:passage-status-divergence fails loudly on drift',
    population: '29 passages: 27 SERVABLE · 2 UNRECORDED' });

  rows.push({ surface: 'Item hints (hintCore serving)', verdict: 'FAILS-CLOSED',
    method: 'chooseHint: no hintAuthoredBy/hintAuthority -> library hint serves, never the unattested text; hintServes ruling outranks (R601)',
    population: '43 LIVE hint carriers at last derivation; unattested ones serve the library fallback' });

  rows.push({ surface: 'Walk scripts', verdict: 'FAILS-CLOSED',
    method: 'WALK_APPROVED_ITEM_IDS allowlist: absence from the list means Walk offers nothing — silence reads as refuse',
    population: 'allowlist-gated; unapproved scripts reach nobody' });

  const activeM = await prisma.misconception.count({ where: { status: 'ACTIVE' } });
  rows.push({ surface: 'Misconception library (childHint serving)', verdict: 'SILENCE-AS-CLEAN',
    method: 'schema: status MisconceptionStatus @default(ACTIVE) — A ROW WRITTEN WITHOUT AN EXPLICIT STATUS SERVES. The resolver filters non-ACTIVE (R-status-filter), so RETIRED/REJECTED are stopped — but the DEFAULT is the serving state, so silence at write time reads as clean. The inverse of Item and Word.',
    population: `${await prisma.misconception.count()} rows, ${activeM} ACTIVE (how many were explicit vs defaulted is not recoverable from the rows — which is itself the finding)` });

  rows.push({ surface: 'Accessible names / auditory surface', verdict: 'SILENCE-AS-CLEAN',
    method: 'check:channel-has-reviewer: channels declare a reviewer with // COPY-REVIEW: markers; check:first-person scans stance. But a string with NO declaration serves regardless — the checks report, nothing gates the render. Her 109th named it: repairs reach children through the build, so the auditory surface has no gate.',
    population: '41 channels, 0 declared reviewers at last census; ~70 source strings outside copy review (a floor)' });

  console.log('\n  SILENCE-AS-CLEAN, by surface [unit: serving surfaces]:');
  for (const r of rows) console.log(`    ${r.verdict.padEnd(17)} ${r.surface}\n      method: ${r.method.slice(0, 110)}\n      population: ${r.population}`);
  const open = rows.filter((r) => r.verdict === 'SILENCE-AS-CLEAN');
  console.log(`\n  ${open.length} surface(s) still read silence as clean: ${open.map((r) => r.surface).join(' · ')}`);
  console.log('  Repairs are rulings, not writes: the misconception default is a schema migration; the render gate is a build.');

  const payload = { what: 'The silence-as-clean class, walked across every content-bearing surface. Populations and methods stated; repairs are rulings.', rows };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content', 'the silence-as-clean class report', ['what', 'rows']);
  const out = join(REPO, 'content/exports', stampedName('silence-as-clean-class', stamp.sourceHash, 'json'));
  writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(out, 'silence-as-clean-class');
  await prisma.$disconnect();
}

void main();
