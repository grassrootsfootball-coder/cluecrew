/**
 * WHERE CAN THE EXECUTIONS BE AUTHORED? — reported, not decided.
 *
 * **An execution is item-specific prose about ONE distractor in ONE stem.** *"Does not fit the
 * sentence, although it makes a real word (BROKE)."* It is the INSTANTIATION of a pattern, not the
 * pattern, so it cannot be authored from a pattern alone: **it requires the row.** That single fact
 * decides the shape of the whole arc, and it is why "nineteen patterns" and "650 executions" are
 * not the same kind of work.
 *
 * There is no third shape. Either the rows go to the author, or the author works beside the rows.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const PAID = ['vr-02-two-odd-ones-out', 'vr-05-hidden-word', 'vr-08-move-letter', 'vr-10-word-connections',
  'vr-13-make-a-word', 'vr-16-opposite-meaning', 'vr-17-complete-the-sum', 'vr-18-related-numbers',
  'vr-19-word-number-codes', 'vr-20-complete-the-word', 'vr-21-same-meaning'];

async function run() {
  const opts = await prisma.itemOption.findMany({ where: { item: { questionTypeId: { in: PAID } } },
    select: { isCorrect: true, misconceptionId: true, misconceptionExecution: true, item: { select: { status: true } } } });
  const distractors = opts.filter((o) => !o.isCorrect);
  const draftDistractors = distractors.filter((o) => o.item.status === 'DRAFT');
  const perDistrict = {} as Record<'VR' | 'ENGLISH' | 'MATHS', { withExecution: number; ofOptions: number }>;
  for (const d of ['VR', 'ENGLISH', 'MATHS'] as const) {
    perDistrict[d] = {
      withExecution: await prisma.itemOption.count({ where: { item: { questionType: { district: d } }, misconceptionExecution: { not: null } } }),
      ofOptions: await prisma.itemOption.count({ where: { item: { questionType: { district: d } } } }),
    };
  }
  const vrExisting = await prisma.itemOption.findMany({ where: { item: { questionType: { district: 'VR' } }, misconceptionExecution: { not: null } },
    select: { item: { select: { questionTypeId: true } } } });
  const vrByType: Record<string, number> = {};
  for (const o of vrExisting) vrByType[o.item.questionTypeId] = (vrByType[o.item.questionTypeId] ?? 0) + 1;

  requirePopulation('report:execution-siting', { 'distractor(s) in the eleven cases': distractors.length });

  const full = {
    kind: 'execution-siting-report',
    THE_QUESTION: 'what would it take for the executions to be authored where the rows are',
    NOTHING_HERE_IS_DECIDED: 'both shapes are buildable. Which is right turns on who OWNS an execution, and that is a ruling nobody has made.',

    WHAT_AN_EXECUTION_IS_AND_WHY_IT_DECIDES_THE_ARC: {
      anExample: 'Does not fit the sentence, although it makes a real word (BROKE).',
      itIs: 'item-specific prose about ONE distractor in ONE stem — the INSTANTIATION of a pattern, not the pattern.',
      soITCANNOTBEAUTHOREDFROMAPATTERN: 'it requires the row. Nineteen patterns are structure; 650 executions are 650 readings of 650 specific wrong answers. **They are not the same work at a different scale — they are different work**, and that is why holding the patterns does not shorten the executions by one row.',
    },

    WHAT_IS_ON_THIS_SIDE: {
      TWO_DENOMINATORS_AND_BOTH_ARE_RIGHT: `${draftDistractors.length} distractors and ${draftDistractors.filter((o) => o.misconceptionId).length} tagged across the 275 rows THE DOOR CUT — those are the figures named to this store. Across all 288 rows in the eleven cases the same measures are ${distractors.length} and ${distractors.filter((o) => o.misconceptionId).length}, the difference being the 13 NEVER_SHIPPABLE seed rows. Stated because a figure that differs from the one you were given is either a correction or a different population, and only naming the denominator says which.`,
      distractorsInTheCutPopulation: draftDistractors.length,
      taggedInTheCutPopulation: draftDistractors.filter((o) => o.misconceptionId).length,
      distractorsAcrossAllElevenCaseRows: distractors.length,
      taggedAcrossAllElevenCaseRows: distractors.filter((o) => o.misconceptionId).length,
      attestedEntries: 23,
      executionsPresent: distractors.filter((o) => o.misconceptionExecution).length,
      andTHEENTRIESHAVECROSSED: 'all 23 as bytes, with per-entry digests and one over the set (ff52f64d4793ac2d).',
    },

    THE_PRECEDENT_IS_NOT_HYPOTHETICAL: {
      executionsAlreadyAuthoredBesideTheRowsHere: perDistrict,
      andVRALREADYHASSOME: { byType: vrByType, note: 'all 80 are vr-06-missing-word — one case, complete, and none of them in the eleven. So the shape has been done in this district already, once.' },
      soSHAPE_B_IS_THE_ESTABLISHED_ONE: `ENGLISH carries ${perDistrict.ENGLISH.withExecution} executions of ${perDistrict.ENGLISH.ofOptions} options, authored beside the rows through the landing scripts. This is not a proposal; it is what the corpus already did 1,060 times.`,
    },

    SHAPE_A_THE_ROWS_CROSS_TO_THE_AUTHOR: {
      whatCrosses: '288 rows with stems, options, keys, tags and the 23 entries — the population artefact already cuts exactly this and is staged.',
      whatIsMISSING: 'a RETURN LEG for executions. No import door writes options[].misconceptionExecution from a crossed artefact; every one of the 1,140 executions in this store was written by a landing script from a reviewer return, never imported from the authoring store.',
      soTHECOST: 'an import door plus its gate plus its canary, and a first crossing that proves the door before 650 rows depend on it (R903 is the worked example of what that costs).',
      andTHERISK: 'R88 — the return leg is the direction that had never carried anything, and the first thing it carried dropped 16 of 22 columns.',
    },

    SHAPE_B_THE_AUTHOR_WORKS_BESIDE_THE_ROWS: {
      whatIsALREADYINPLACE: 'the rows, the tags, the attested entries, the write path, the gates, and 1,140 executions already written this way.',
      whatIsMISSING: 'nothing mechanical. What is missing is an author and a ruling that this is theirs to do here.',
      andTHECONSTRAINT: 'CLAUDE.md — content decisions go through the CMS review pipeline and nothing skips the reviewer. An execution is child-adjacent prose, so it gates like any authored string.',
    },

    THE_ONE_QUESTION_THAT_DECIDES_IT: {
      it: 'who owns an execution — the store that owns the PATTERN, or the store that owns the ROW?',
      whyItIsNotObvious: 'R23 gives authored ITEM content to Cowork and everything the gates and platform own to this store. An execution is neither cleanly: it is authored prose (Cowork\'s kind) about a specific row and tag (this store\'s holding), and the English precedent put it here 1,060 times without the question being asked.',
      andWHYITSHOULDBEASKEDNOW: 'because 650 is the number at which an unruled ownership becomes a migration. It was cheap to leave unruled at zero and it is cheap to rule now; it is not cheap to rule after the work is done in the wrong store.',
    },
  };
  const lines = [`distractors\t${distractors.length}`, `tagged\t${distractors.filter((o) => o.misconceptionId).length}`, `executions\t${distractors.filter((o) => o.misconceptionExecution).length}`];
  const d = digestOverText('the summary lines joined by \\n', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['WHAT_IS_ON_THIS_SIDE', 'SHAPE_A_THE_ROWS_CROSS_TO_THE_AUTHOR', 'SHAPE_B_THE_AUTHOR_WORKS_BESIDE_THE_ROWS', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('execution-siting-report', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'execution-siting-report');
  console.log(`\n  distractors ${distractors.length} · tagged ${distractors.filter((o) => o.misconceptionId).length} · executions ${distractors.filter((o) => o.misconceptionExecution).length}`);
  console.log(`  ENGLISH ${perDistrict.ENGLISH.withExecution}/${perDistrict.ENGLISH.ofOptions} · VR ${perDistrict.VR.withExecution}/${perDistrict.VR.ofOptions} (all vr-06) · MATHS ${perDistrict.MATHS.withExecution}/${perDistrict.MATHS.ofOptions}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
