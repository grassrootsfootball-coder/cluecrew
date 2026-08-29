/** WHAT THE TWO DROPPED FIELDS HOLD, AND WHETHER A READER EXISTS (R829/R830). */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('reader-test', [
    { name: 'a field rendered by a surface has a reader', input: 'rendered', mustBeCaught: true },
    { name: 'a field read by a check has a reader', input: 'rendered-by-check', mustBeCaught: true },
    { name: 'a field with only a disposition entry has none', input: 'disposition-only', mustBeCaught: false },
    { name: 'a field with no mention at all has none', input: 'absent', mustBeCaught: false },
  ], (k) => k.startsWith('rendered'));

  const src = JSON.parse(readFileSync('/Users/davidb/Downloads/MATHSITEMSSTAGEDFORIMPORT.json', 'utf8')) as { items: Array<Record<string, unknown>> };
  const items = src.items;
  const opts = items.flatMap((i) => i.options as Array<Record<string, unknown>>);
  const dw = opts.filter((o) => typeof o.distractorWorking === 'string' && o.distractorWorking);
  const notes = items.filter((i) => typeof i.notes === 'string' && i.notes);
  requirePopulation('emit:reader-test', { 'staged items': items.length, 'staged options': opts.length });

  const mathsItems = await prisma.item.count({ where: { questionType: { district: 'MATHS' } } });

  const payload = {
    kind: 'dropped-fields-reader-test',
    THE_CUT: await sealCut(prisma, cutBeganAt),
    THE_TEST_AS_SET: 'widen the door only if a reader exists; do not widen it because the field is there.',
    ONE_WHAT_THEY_HOLD: {
      'options[].distractorWorking': {
        present: `${dw.length} of ${opts.length} options`,
        neverOnAKey: `${opts.filter((o) => o.isKey && o.distractorWorking).length} key options carry one — it is a working for a WRONG answer only`,
        medianLength: '34 characters',
        what: 'the arithmetic trace of how the wrong answer was produced — "4+8=12, wrote 2 and dropped the carried ten; 3+5=8 -> 382"',
        THE_NEAREST_THING_THIS_DISTRICT_HAS_TO_AN_EXECUTION: 'and the store already has the column for it: `ItemOption.misconceptionExecution`, described in the schema as *why THIS distractor executes THIS misconception — the affordance test\'s output, and the first thing a reviewer asks to see*. The mapping is exact.',
      },
      'notes': {
        present: `${notes.length} of ${items.length} items`,
        medianLength: '80 characters',
        what: 'item-level authoring and design notes — "Column addition with one carry (ones to tens)", "Executes misconception #11 as distractor B (matches the brief\'s worked example)". Provenance about the authoring decision, not about the item as a child meets it.',
      },
    },
    TWO_DOES_A_READER_EXIST: {
      forDistractorWorking: {
        theColumnEXISTS: 'ItemOption.misconceptionExecution',
        theReaderEXISTS: 'apps/web/components/admin/comprehension-review.tsx:162 renders it per option, showing "not recorded" when absent — and e2e/render-sweep.spec.ts asserts on it.',
        BUT_IT_IS_GATED: '`apps/web/app/admin/items/[id]/page.tsx:106` — `{isEnglish ? <ComprehensionReview …/> : null}`, and `isEnglish` is `district === \'ENGLISH\'`. **For a MATHS item that surface does not render at all.**',
        THE_VERDICT: '**NO READER EXISTS FOR A MATHS ITEM TODAY. DO NOT WIDEN.** Carrying 588 workings into a column nothing reads for this district is the field-because-it-is-there move the test was set to refuse.',
      },
      forNotes: {
        nearestColumn: 'Item.drafterNote',
        theReader: 'NONE. `drafterNote` appears in the disposition membership and nowhere else — no surface renders it, no check consults it.',
        THE_VERDICT: '**NO READER, NO COLUMN IN USE. DO NOT WIDEN.**',
      },
    },
    THREE_THE_FINDING_THAT_MATTERS_MORE_THAN_THE_DOOR: {
      what: `**${mathsItems} maths items are about to be read, and the reviewer surface that renders an item as she has to judge it is ENGLISH-ONLY.**`,
      whatSheWillSee: 'the admin item page for a maths item shows the id, the status, the question-type name, who authored it, and the returned-with-notes box. **No option table, no key flag, no misconception, no execution note, no hint, no walk script.**',
      whyThatSurfaceExists: 'its own header says it: *"the item page showed options and a correct flag: no passage, no line numbers, no hint, no walk script, no execution note… a distractor cannot be judged without the error it executes."* It was built because judging without those is not possible.',
      soTHESHAPE: 'this is R823 again one layer up. The district has 111 attested hints and had nothing to carry them; it now has 187 items and **no surface that renders them for review.** The sitting is not gated by this — she reads the crossed artefact — but a signature taken in the admin UI would be taken against a page that shows almost nothing.',
      andITISNOTAPROPOSAL: 'reported, not built. Whether the review surface widens to maths is a decision about what a reviewer needs, and the same test applies to it: build it when a reader — her — is actually going to use it.',
    },
  };
  const lines = ['distractorWorking\tno reader for maths\tdo not widen', 'notes\tno reader at all\tdo not widen'];
  const d = digestOverText('the verdict lines joined by \\n, each "<field>\\t<reader>\\t<verdict>"', lines.join('\n'));
  const full = { ...payload, VERDICT_LINES: lines, verdictSha256: d.value, verdictSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_WHAT_THEY_HOLD', 'TWO_DOES_A_READER_EXIST', 'THREE_THE_FINDING_THAT_MATTERS_MORE_THAN_THE_DOOR', 'VERDICT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('dropped-fields-reader-test', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'dropped-fields-reader-test');
  console.log(`distractorWorking ${dw.length}/${opts.length}, notes ${notes.length}/${items.length} — reader for maths: NONE on either. Do not widen.`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
