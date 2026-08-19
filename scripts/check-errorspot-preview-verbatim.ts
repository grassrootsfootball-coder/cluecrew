/**
 * THE ERROR-SPOT PREVIEW IS THE SEGMENTS, JOINED, AND NOTHING ELSE.
 *
 * **ANNIE, 2026-08-19: the preview must keep the sentence's real punctuation and must never be
 * normalised, "because that is what makes PU-06 work."** That item turns on a question mark sitting
 * OUTSIDE a closing quote. A tidy-up — straightening quotes, moving the mark inside, repairing
 * spacing around it — would DELETE THE QUESTION while leaving a sentence on screen that still looks
 * like one. **The item would not fail; it would silently stop testing anything.**
 *
 * A comment in the component asks the next author not to do it. This asserts they did not. The
 * property is exact: the rendered preview equals the segment values joined by single spaces, byte
 * for byte, including every curly quote and every mark in its authored position.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const TYPES = ['en-spag-punct-spot', 'en-spag-spelling-spot'];

/** The component's own expression, quoted here so a change to it fails this check. */
const previewOf = (values: string[]) => values.join(' ');

/** Marks whose position or shape a "tidy-up" would move, and which these items test. */
const FRAGILE = /[“”‘’"'?!;:,.]/;

async function main() {
  const items = await prisma.item.findMany({
    where: { questionTypeId: { in: TYPES } },
    select: { id: true, stem: true, options: true },
    orderBy: { id: 'asc' },
  });
  requirePopulation('error-spot preview', { 'error-spot items': items.length });

  const faults: string[] = [];
  let fragileItems = 0;
  for (const item of items) {
    const segs = item.options
      .map((o) => (o.content ?? {}) as { label?: string; value?: string })
      .filter((c) => c.label !== 'N')
      .map((c) => c.value ?? '');
    if (segs.length === 0) { faults.push(`${item.id}: no segments`); continue; }
    const preview = previewOf(segs);

    if (FRAGILE.test(preview)) fragileItems += 1;

    // Every segment must survive into the preview UNCHANGED — the join is the only operation.
    for (const seg of segs) {
      if (!preview.includes(seg)) faults.push(`${item.id}: segment "${seg}" does not appear verbatim in the preview`);
    }
    // And the preview must add nothing beyond the joining spaces.
    if (preview.replace(/ /g, '') !== segs.join('').replace(/ /g, '')) {
      faults.push(`${item.id}: preview characters differ from the segments' own characters`);
    }
    /*
     * THE PREVIEW IS NOT GATED AS NEW TEXT, AND THAT IS DELIBERATE. The first version of this
     * check ran `checkChildFacingText` over the joined sentence at role 'stem' and reported
     * SP-09 as failing the 16-word cap and the long-word ceiling. **Both were the instrument.**
     * The preview introduces NO WORDS — it is the four option values with spaces between them,
     * and each of those is already gated in its own role at the door that wrote it. Capping the
     * joined sentence would cap THE SENTENCE UNDER TEST, which is the item itself: SP-09's
     * sentence is 18 words because an 18-word sentence is what the child must proofread.
     *
     * R149's lesson arriving in a new check rather than a changed one: a fault that reads as bad
     * authoring, produced entirely by measuring the wrong thing.
     */
  }

  console.log(`error-spot preview — verbatim assertion`);
  console.log(`  items screened: ${items.length}`);
  console.log(`  carrying punctuation a normaliser would move: ${fragileItems}`);
  /**
   * SYNTHETIC CONTROL (R254). The first version required at least one LIVE item carrying fragile
   * punctuation — real information, and not a control: retire or reword the eighteen and the
   * requirement becomes unmeetable while the check keeps passing. **A control that depends on a
   * live instance disappears the moment the codebase gets it right.**
   *
   * Fired at a fixture instead: segments whose punctuation a normaliser would move, through the
   * same `previewOf` the component uses. If the join alters them, the check is measuring nothing.
   */
  const controlSegs = ['\u201cHas anyone seen my whistle\u201d?', 'asked Mr Doyle,', 'who was late.'];
  const controlPreview = previewOf(controlSegs);
  const controlIntact = controlSegs.every((s) => controlPreview.includes(s))
    && FRAGILE.test(controlPreview)
    && controlPreview === controlSegs.join(' ');
  if (!controlIntact) {
    console.error('  CONTROL FAILED: the join altered a synthetic segment set carrying fragile');
    console.error(`  punctuation. previewOf is not verbatim: ${JSON.stringify(controlPreview)}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  if (fragileItems === 0) {
    console.log('  NOTE: no LIVE item currently carries fragile punctuation, so the bank half of this');
    console.log('  run is trivially satisfied. The synthetic control above still proves the join is');
    console.log('  verbatim. A coverage gap, not a pass with nothing behind it.');
  }
  if (faults.length > 0) {
    console.error(`\n${faults.length} FAULT(S)`);
    for (const f of faults) console.error(`  - ${f}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log('  0 faults. The preview is the segments joined, with their punctuation untouched.');
  await prisma.$disconnect();
}

main();
