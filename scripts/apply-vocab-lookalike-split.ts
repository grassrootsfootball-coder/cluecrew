/**
 * THE `en-vocab-form-lookalike` SPLIT, AS SHE AUTHORED IT (Annie, seventy-first return — R592).
 *
 * **WRITES CONTENT UNGUARDED (R63).** Every value here is supplied by a HUMAN RULING, not computed
 * by a derivation function, so `classifyDerivedWrites` does not apply and provenance is the control.
 * Her return is the authority and its digest is recorded on every row this touches.
 *
 *     en-vocab-form-lookalike  KEEPS its id, its hint and SIX carriers — rogue/rough, covet/cover,
 *                              wont/won't, sullen/sullied, stitch, order. Every one is a different
 *                              word the target resembles, which is what the id says and what
 *                              "read it letter by letter" reaches.
 *     en-vocab-built-from-parts  NEW. THIRTEEN move to it. "She has not mistaken which word it is.
 *                              She has taken it apart" — reading `stranger` letter by letter gives
 *                              `stranger`, because the letters were never the problem.
 *
 * **`ENG-001-WIW-11` IS LEFT VISIBLY UNPLACED, and that is a decision rather than a gap.** *Moving a
 * boat along with oars* for *the row* is a different word with the same spelling — **a homograph,
 * which is neither a resemblance nor a misparse.** *"One row, and I would rather leave it visibly
 * unplaced than push it into whichever branch is nearest."* It keeps its existing tag and carries
 * `unplacedBySplit` so it reads as a decision and never as a field nobody looked at.
 *
 * **HER LISTS ARE THE AUTHORITY AND THE RESOLUTION IS ASSERTED.** The headwords below are hers,
 * verbatim. This resolves each to an item and **FAILS THE WHOLE RUN** if any headword matches no
 * carrier, matches more than one, or if the totals are not 13 / 6 / 1. A split that silently placed
 * twelve would look exactly like a split that placed thirteen.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const RETURN = '/Users/davidb/Downloads/annie-seventyfirst-return.md';
const OLD = 'en-vocab-form-lookalike';
const NEW_ID = 'en-vocab-built-from-parts';
const APPLY = process.argv.includes('--apply');

/** Her hint, verbatim from the amendment block of the seventy-first return. */
const NEW_HINT = 'The parts of a word do not always add up. Check the whole word in the sentence.';
/**
 * Transcribed from her §2, not authored here. The DB owns library text and her ruling is its
 * authority; these are her sentences about what the entry covers.
 */
const NEW_DESCRIPTION = 'The child takes the word apart into parts she has met in other words and '
  + 'sums them. She has not mistaken which word it is — she has taken it apart, and the parts are '
  + 'real while the sum is not the word. Scoped to the ERROR, not to vocabulary items.';

/** Hers, verbatim, from the seventy-first return. */
const MOVE = ['tolerable', 'stranger', 'misgave', 'skirted', 'inexorable', 'irresolution', 'officious',
  'mastered', 'inclined', 'shifting', 'alighted', 'scope', 'caustic'];
const STAY = ['rogue', 'covet', 'stitch', 'order', 'wont', 'sullen'];
const UNPLACED = 'ENG-001-WIW-11';

/** The headword the question asks about — the same rule the carrier delivery used (R589). */
function headwordOf(stemText: string): string | null {
  const asked = /what does\s+['‘"“]([^'’"”]{2,40})['’"”]\s*mean/i.exec(stemText);
  const all = [...stemText.matchAll(/['‘"“]([^'’"”]{2,40})['’"”]/g)]
    .map((m) => (m[1] ?? '').trim()).filter(Boolean).sort((a, b) => a.length - b.length);
  return (asked?.[1] ?? all[0] ?? null)?.replace(/^the\s+/i, '').trim() ?? null;
}

async function main() {
  const digest = createHash('sha256').update(readFileSync(RETURN)).digest('hex');
  const gate = checkChildFacingText({ role: 'hint', label: NEW_ID, text: NEW_HINT }).filter(isBlocking);
  if (gate.length) throw new Error(`ABORTED — her new hint fails the gate: ${gate.map((f) => f.detail).join('; ')}`);

  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });
  const carriers = items.filter((i) => i.options.some((o) => (o as { misconceptionId?: string | null }).misconceptionId === OLD));

  const byHeadword = new Map<string, typeof carriers>();
  for (const i of carriers) {
    const stem = i.stem as Record<string, unknown>;
    const text = [stem.text, stem.prompt, stem.sentence].find((t): t is string => typeof t === 'string') ?? '';
    const h = headwordOf(text)?.toLowerCase();
    if (!h) continue;
    byHeadword.set(h, [...(byHeadword.get(h) ?? []), i]);
  }

  const problems: string[] = [];
  const resolve = (list: string[]) => list.map((h) => {
    const found = byHeadword.get(h.toLowerCase()) ?? [];
    if (found.length === 0) problems.push(`"${h}" matches NO carrier of ${OLD}`);
    if (found.length > 1) problems.push(`"${h}" matches ${found.length} carriers: ${found.map((i) => i.id).join(', ')}`);
    return { headword: h, item: found[0] };
  });

  const moving = resolve(MOVE);
  const staying = resolve(STAY);
  const unplaced = carriers.filter((i) => i.id === UNPLACED);
  if (unplaced.length !== 1) problems.push(`${UNPLACED} is not a carrier of ${OLD} (found ${unplaced.length})`);

  const accounted = new Set([...moving, ...staying].map((r) => r.item?.id).filter(Boolean));
  accounted.add(UNPLACED);
  const unaccounted = carriers.filter((i) => !accounted.has(i.id));
  if (unaccounted.length > 0) problems.push(`${unaccounted.length} carrier(s) in neither list: ${unaccounted.map((i) => i.id).join(', ')}`);
  if (moving.length !== 13) problems.push(`expected 13 moving, her list has ${moving.length}`);
  if (staying.length !== 6) problems.push(`expected 6 staying, her list has ${staying.length}`);

  console.log(
    `${carriers.length} carrier(s) of ${OLD}\n`
    + `  MOVE to ${NEW_ID} : ${moving.length}\n  STAY on ${OLD} : ${staying.length}\n  UNPLACED         : ${unplaced.length}\n`,
  );
  for (const r of moving) console.log(`  MOVE      ${(r.item?.id ?? 'UNRESOLVED').padEnd(16)} "${r.headword}"`);
  for (const r of staying) console.log(`  STAY      ${(r.item?.id ?? 'UNRESOLVED').padEnd(16)} "${r.headword}"`);
  console.log(`  UNPLACED  ${UNPLACED.padEnd(16)} "row" — a homograph, neither branch. HER DECISION, not a gap.`);

  if (problems.length > 0) {
    console.error(`\nABORTED — ${problems.length} resolution problem(s). Nothing written:`);
    for (const p of problems) console.error(`    ${p}`);
    console.error('  A split that silently placed twelve would look exactly like one that placed thirteen.');
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  if (!APPLY) {
    console.log('\nREPORT ONLY. Every headword resolved, totals match her ruling. Re-run with --apply.');
    await prisma.$disconnect();
    return;
  }

  await prisma.misconception.upsert({
    where: { id: NEW_ID },
    create: {
      id: NEW_ID, district: 'ENGLISH', childHint: NEW_HINT, description: NEW_DESCRIPTION, status: 'ACTIVE',
      textProvenance: {
        state: 'RECORDED', approvedByPerson: 'Annie',
        hintAuthoredByWasClaimedAs: 'Annie, verbatim from the amendment block',
        authority: `annie-seventyfirst-return.md, sha256 ${digest}`,
        method: 'authored in her block; description transcribed from her section 2',
        appliedOn: new Date().toISOString().slice(0, 10),
      },
    },
    update: { childHint: NEW_HINT, description: NEW_DESCRIPTION },
  });

  let moved = 0;
  for (const r of moving) {
    const res = await prisma.itemOption.updateMany({
      where: { itemId: r.item!.id, misconceptionId: OLD },
      data: { misconceptionId: NEW_ID },
    });
    moved += res.count;
  }

  // The unplaced row carries its state so it reads as a decision, never as a field nobody read.
  const wiw11 = unplaced[0]!;
  await prisma.item.update({
    where: { id: UNPLACED },
    data: {
      explanation: {
        ...((wiw11.explanation ?? {}) as Record<string, unknown>),
        unplacedBySplit: {
          split: `${OLD} -> ${NEW_ID}`,
          why: 'A homograph: "row" as in moving a boat is a different word with the same spelling — '
            + 'neither a resemblance nor a misparse, so neither branch fits.',
          ruledBy: 'Annie, seventy-first return',
          authority: `annie-seventyfirst-return.md, sha256 ${digest}`,
          state: 'DELIBERATELY UNPLACED — not an unread field.',
        },
      },
    },
  });

  const after = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });
  const nowOld = after.filter((i) => i.options.some((o) => (o as { misconceptionId?: string | null }).misconceptionId === OLD)).length;
  const nowNew = after.filter((i) => i.options.some((o) => (o as { misconceptionId?: string | null }).misconceptionId === NEW_ID)).length;
  console.log(`\n  ${moved} option(s) retagged.\n  READ BACK: ${OLD} now has ${nowOld} carrier(s), ${NEW_ID} has ${nowNew}.`);
  if (nowOld !== 7 || nowNew !== 13) {
    console.error('  UNEXPECTED — her ruling leaves 6 placed + 1 unplaced on the old id, and 13 on the new.');
    process.exitCode = 1;
  }
  await prisma.$disconnect();
}

void main();
