/**
 * "Gap N." LEAVES THE PROSE; gapIndex IS THE SINGLE SOURCE OF TRUTH (Annie's sixth return).
 *
 * Every cloze stem opened `"Gap N. Choose the words that fit best."` — a bookkeeping number in
 * child-facing prose, locating a gap in the VEHICLE while the child sees one gap on her card
 * (R212). Stems become **"Choose the words that fit best."** across all sixteen.
 *
 * **THE REMOVAL AND THE ASSERT WERE NEVER ALTERNATIVES** (her words). Taking the number out of the
 * prose leaves FOUR internal copies — `stem.gapIndex`, `stem.quotes[].gapIndex`,
 * `stem.passageRef`, `stem.quotes[].passageRef` — measured, not assumed, and present on 16 of 16.
 * Removing the fifth copy without asserting the other four agree would trade a visible duplicate
 * for four invisible ones. So this writes AND asserts, and **fails loudly on a stem carrying no
 * number at all**: after this change `gapIndex` is the only place the number lives for a reader,
 * so its absence is not a missing field, it is an unanswerable item.
 */
import { prisma } from '../packages/db/src/index';

const WRITE = process.argv.includes('--write');
const OPENER = /^Gap (\d+)\.\s*/;

interface Fault { id: string; detail: string }

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { questionTypeId: 'en-spag-cloze' },
    select: { id: true, stem: true },
    orderBy: { id: 'asc' },
  });

  const faults: Fault[] = [];
  let rewritten = 0;

  for (const item of items) {
    const stem = { ...(item.stem as Record<string, unknown>) };
    const text = String(stem.text ?? '');
    const gapIndex = stem.gapIndex;

    // FAIL LOUDLY ON A STEM CARRYING NO NUMBER — before anything is written.
    if (typeof gapIndex !== 'number') {
      faults.push({ id: item.id, detail: 'stem.gapIndex absent or not a number — after this change '
        + 'that is the ONLY place the number lives, so this item cannot say which gap it asks about' });
      continue;
    }

    // THE FOUR REMAINING COPIES MUST AGREE, asserted per item.
    const quotes = Array.isArray(stem.quotes) ? (stem.quotes as Array<Record<string, unknown>>) : [];
    for (const q of quotes) {
      if (typeof q.gapIndex === 'number' && q.gapIndex !== gapIndex) {
        faults.push({ id: item.id, detail: `stem.quotes[].gapIndex ${q.gapIndex} disagrees with stem.gapIndex ${gapIndex}` });
      }
      if (typeof q.passageRef === 'string' && q.passageRef !== stem.passageRef) {
        faults.push({ id: item.id, detail: `stem.quotes[].passageRef "${q.passageRef}" disagrees with stem.passageRef "${stem.passageRef}"` });
      }
    }
    // The prose copy, while it is still there, must agree too — otherwise removing it would be
    // deleting a disagreement rather than a duplicate.
    const m = text.match(OPENER);
    if (m && Number(m[1]) !== gapIndex) {
      faults.push({ id: item.id, detail: `prose says "Gap ${m[1]}" and stem.gapIndex is ${gapIndex} — the copy being removed DISAGREES` });
      continue;
    }
    if (!m) continue; // already removed

    stem.text = text.replace(OPENER, '');
    if (WRITE) await prisma.item.update({ where: { id: item.id }, data: { stem: stem as object } });
    rewritten += 1;
  }

  console.log(`${WRITE ? 'APPLIED' : 'dry run'}: "Gap N." removed from ${rewritten} of ${items.length} stems.`);
  console.log('\nTHE ASSERT — the four remaining internal copies, per item:');
  console.log(`  stem.gapIndex present and numeric: ${items.length - faults.filter((f) => f.detail.startsWith('stem.gapIndex absent')).length} of ${items.length}`);
  console.log(`  disagreements found: ${faults.length}`);
  for (const f of faults) console.log(`    x ${f.id}: ${f.detail}`);
  if (!faults.length) {
    console.log('  all four copies agree on every item, and every item carries a number.');
  }
  await prisma.$disconnect();
  process.exit(faults.length ? 1 : 0);
}

void main();
