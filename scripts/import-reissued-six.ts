/**
 * THE SIX, REWORDED AND REISSUED — through the same door that refused them.
 *
 * **THE DOOR IS THE POINT.** These six were gate-held by `checkItemChildFacing` at first import
 * (R304) — four US spellings and two banned words — and reworded on Cowork's side. **They come back
 * through the identical gate, not around it**: if a rewording missed something, the item is held
 * again and named again, which is the behaviour that produced a correct outcome the first time.
 *
 * **EACH ITEM'S DIGEST IS RECOMPUTED HERE, NEVER TRUSTED.** Cowork ships a per-item sha256; this
 * recomputes it over the item as received and refuses on a mismatch. A digest quoted from prose
 * records only that someone believed what the prose said (R285).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const SOURCE = '/Users/davidb/Downloads/REISSUESIXITEMS.json';

/** Cowork's declared canonical form: sorted keys, compact separators, UTF-8. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}`;
}

async function main() {
  const raw = readFileSync(SOURCE, 'utf8');
  const fileDigest = createHash('sha256').update(raw).digest('hex');
  const parsed = JSON.parse(raw) as { items?: { itemId: string; sha256: string; item: Record<string, unknown> }[] };
  const rows = parsed.items ?? [];
  if (rows.length !== 6) throw new Error(`REFUSED: expected 6 items, found ${rows.length}.`);

  const held: string[] = [];
  const writable: { id: string; it: Record<string, unknown> }[] = [];
  for (const row of rows) {
    const it = row.item;
    /*
     * **RECOMPUTED UNDER COWORK'S DECLARED SPEC, NOT MINE.** Its `digestSpec` says: each ITEM
     * object, `sort_keys=True separators=(",",":")`, UTF-8. My first version hashed
     * `JSON.stringify(it)` and reported all six as mismatched — **six false alarms from my
     * instrument, about a file that was intact.** The spec was in the file; I did not read it.
     * R295 again: a file that declares a property should be asked, not measured.
     */
    const recomputed = createHash('sha256').update(canonical(it), 'utf8').digest('hex');
    if (recomputed !== row.sha256) {
      throw new Error(`REFUSED at ${row.itemId}: digest mismatch under Cowork's declared spec.\n  shipped ${row.sha256}\n  here    ${recomputed}`);
    }
    const qt = await prisma.questionType.findUnique({ where: { id: String(it.questionTypeId) }, select: { mechanic: true } });
    if (!qt) { held.push(`${row.itemId}: questionType ${it.questionTypeId} does not exist`); continue; }
    const options = (it.options as { label?: string; value?: string; isCorrect?: boolean; misconceptionId?: string }[]) ?? [];
    const faults = checkItemChildFacing({
      id: row.itemId, stem: it.stem, explanation: it.explanation ?? {},
      mechanic: qt.mechanic,
      options: options.map((o) => ({ content: { label: o.label, value: o.value }, misconceptionId: o.misconceptionId ?? null })),
    }).filter(isBlocking);
    if (faults.length) { held.push(`${row.itemId}: ${faults.map((f) => `[${f.rule}] ${f.detail}`).join('; ')}`); continue; }
    if (await prisma.item.findUnique({ where: { id: row.itemId } })) { held.push(`${row.itemId}: already present`); continue; }
    writable.push({ id: row.itemId, it });
  }

  console.log(`\nfile sha256: ${fileDigest}`);
  console.log(`reissued ${rows.length} · WRITABLE ${writable.length} · held ${held.length}`);
  for (const h of held) console.log(`  ✗ ${h}`);

  /**
   * **THE WRITE PATH IS CUT (R491).** This reads a SNAPSHOT, and a snapshot is EVIDENCE (R484): it
   * may report what the file names against what the store holds, never write from it, because a
   * file cannot say which of its rows a later ruling has settled.
   *
   * **THIS ADDRESSES A SMALLER RISK THAN THE ONE THAT ALREADY FIRED.** The file that overwrote her
   * `chilly` wording had no standing reader — it was read by hand in a script written and deleted
   * in one minute. Cutting declared readers does not reach that, and **a repair that fixes the
   * neighbouring case while reading as fixing THE case is worse than no repair.**
   */
  console.log('\n  WRITE PATH CUT — this reports only. A snapshot is evidence, not a source (R484).');
  await prisma.$disconnect();
  return;
  // eslint-disable-next-line no-unreachable
  await prisma.$transaction(writable.map(({ id, it }) => prisma.item.create({
    data: {
      id, questionTypeId: String(it.questionTypeId), difficultyTier: Number(it.difficultyTier ?? 3),
      stem: it.stem as object, explanation: (it.explanation ?? {}) as object,
      lineRefs: (it.lineRefs ?? undefined) as never,
      authoredBy: String(it.authoredBy ?? 'ai-draft:cowork-okafor-v1'),
      status: 'DRAFT', pool: 'PRACTICE',
      options: { create: ((it.options as { label?: string; value?: string; isCorrect?: boolean; misconceptionId?: string }[]) ?? [])
        .map((o) => ({ content: { label: o.label, value: o.value }, isCorrect: Boolean(o.isCorrect), misconceptionId: o.misconceptionId ?? null })) },
    },
  })));

  const back = await prisma.item.findMany({ where: { id: { in: writable.map((w) => w.id) } }, select: { id: true, status: true } });
  console.log(`\nread back: ${back.length} of ${writable.length}`);
  for (const b of back) console.log(`  ${b.id} [${b.status}]`);
  await prisma.$disconnect();
}

main();
