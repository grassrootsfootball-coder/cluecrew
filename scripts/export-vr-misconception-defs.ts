/**
 * VR MISCONCEPTION DEFINITIONS (AS WRITTEN) — `pnpm export:vr-misconception-defs`.
 *
 * The reviewer marked eight items against her reading of `vr03-reversed-relation`
 * and wants to be shown wrong rather than have us rewrite on her say-so. So this
 * exports the library definitions for the two ids she asked for, VERBATIM from
 * the database — description, child hint, status, and which bank uses each — so
 * she can check her reading against ours with no editorialising from us.
 */
import { mkdirSync, writeFileSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { VR_DEF_IDS as IDS, buildVrMisconceptionDefsSource } from './lib/vr-audit-source';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const DOWNLOADS_DIR = join(homedir(), 'Downloads', 'vr-audit');
const FAMILY = 'vr-misconception-defs';
const TODAY = new Date().toISOString();

async function main(): Promise<void> {
  const rows = await prisma.misconception.findMany({
    where: { id: { in: IDS } },
    select: { id: true, description: true, childHint: true, status: true, category: true },
  });
  // Which live bank references each id (so she can see where it is applied).
  const usage = new Map<string, Set<string>>();
  for (const id of IDS) {
    const opts = await prisma.itemOption.findMany({ where: { misconceptionId: id, item: { status: 'LIVE' } }, include: { item: true } });
    usage.set(id, new Set(opts.map((o) => o.item.questionTypeId)));
  }

  const stamp = freshnessStamp(await buildVrMisconceptionDefsSource(prisma), TODAY);
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');

  const lines: string[] = [
    '# VR misconception definitions — as written',
    '',
    `Exported ${stamp.generatedAt.slice(0, 10)} verbatim from the library, so you can check your reading against ours. Nothing here is edited.`,
    '',
  ];
  for (const id of IDS) {
    const row = rows.find((r) => r.id === id);
    const banks = [...(usage.get(id) ?? [])].sort().join(', ') || '(none live)';
    lines.push(`## \`${id}\``);
    if (!row) {
      lines.push('', '**NOT IN DATABASE** — this id has no library row.', '');
      continue;
    }
    lines.push('');
    lines.push(`- **Description (what it means):** ${row.description}`);
    lines.push(`- **Child hint (shown when a child picks it):** ${row.childHint}`);
    lines.push(`- **Status:** ${row.status}`);
    if (row.category) lines.push(`- **Category:** ${row.category}`);
    lines.push(`- **Live banks using it:** ${banks}`);
    lines.push('');
  }
  const md = lines.join('\n');

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(DOWNLOADS_DIR, { recursive: true });
  const mdPath = join(OUT_DIR, `${base}.md`);
  writeFileSync(mdPath, md);
  const manifestPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(manifestPath, JSON.stringify({ kind: FAMILY, ...stamp, ids: IDS, artifacts: [`${base}.md`] }, null, 2));

  console.log(`VR misconception defs — ${IDS.join(', ')} · ${stamp.sourceHash}`);
  const delivered = [mdPath, manifestPath].map((p) => deliver(p, FAMILY));
  for (const existing of readdirSync(DOWNLOADS_DIR)) {
    if (existing.startsWith(`${FAMILY}-`) && !existing.includes(stamp.sourceHash)) rmSync(join(DOWNLOADS_DIR, existing));
  }
  for (const p of delivered) copyFileSync(p, join(DOWNLOADS_DIR, p.split('/').pop()!));
  console.log(`Delivered → ${DOWNLOADS_DIR}`);
  await prisma.$disconnect();
}

void main();
