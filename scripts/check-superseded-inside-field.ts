/**
 * IS A SUPERSEDED VALUE STORED INSIDE THE FIELD IT SUPERSEDES? (David, 2026-08-21 — R358.)
 *
 * Cowork found it first and moved its stamps to `_superseded`, OUTSIDE the field. The same fault is
 * here: `_previousText` sits inside `stem` beside `text`, `_previousWalkScript` inside `explanation`
 * beside `walkScript`. **Anything walking the container reads the superseded value as live** — and
 * the child-facing gate walks exactly those containers.
 *
 * The gate now refuses to read them (`isSuperseded` in `item-content-gate.ts`). This reports the
 * rows still carrying one, because a reader-side skip is a guard and not a repair: the next reader
 * written against `stem` will walk them again.
 *
 * REPORTS, does not fail. The values are real history and moving them is a migration with reviewed
 * content on the other side of it.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

async function main() {
  const items = await prisma.item.findMany({ select: { id: true, stem: true, explanation: true, status: true } });
  const byField = new Map<string, string[]>();
  for (const i of items) {
    for (const container of ['stem', 'explanation'] as const) {
      const o = (i[container] ?? {}) as Record<string, unknown>;
      for (const k of Object.keys(o)) {
        if (!k.startsWith('_')) continue;
        // The field it supersedes: `_previousWalkScript` -> `walkScript`, `_previousText2` -> `text`.
        const target = k.replace(/^_[a-z]+/, '').replace(/\d+$/, '');
        const live = target.charAt(0).toLowerCase() + target.slice(1);
        const inside = Object.prototype.hasOwnProperty.call(o, live);
        const key = `${container}.${k} → ${inside ? `beside LIVE ${container}.${live}` : 'no live sibling found'}`;
        byField.set(key, [...(byField.get(key) ?? []), `${i.id} (${i.status})`]);
      }
    }
  }

  requirePopulation('check:superseded-inside-field', { 'item(s) screened': items.length });

  if (byField.size === 0) {
    console.log('\ncheck:superseded-inside-field: no superseded value sits inside the field it supersedes.');
    await prisma.$disconnect();
    return;
  }

  const rows = new Set([...byField.values()].flat());
  console.log(`\nSUPERSEDED VALUES STORED INSIDE THEIR OWN CONTAINER: ${rows.size} item(s), ${byField.size} shape(s)`);
  for (const [shape, ids] of [...byField].sort()) {
    console.log(`  ${shape}\n      ${ids.length} item(s): ${ids.slice(0, 6).join(', ')}${ids.length > 6 ? ' …' : ''}`);
  }
  console.log(
    '\n  The gate no longer reads these (R358). That is a READER-SIDE SKIP, not a repair — the next\n' +
      '  reader written against `stem` or `explanation` walks them again unless they move OUTSIDE the\n' +
      '  container, which is the shape Cowork adopted. Reported, not failed: these are real history\n' +
      '  and moving them is a migration with reviewed content on the other side of it.',
  );
  await prisma.$disconnect();
}

void main();
