/**
 * THE FACE AS BYTES, AND THE UNTAGGED AS IDS (R861/R862).
 *
 * Two crossings the desk has been paraphrasing: the face slot, which has never crossed as a string,
 * and the untagged population, which two stores are counting over different sets.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { caseFaceServes, publishBlockers } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const SEND = '/Users/davidb/Downloads/MATHSIMPORTOUTBOUND (2).json';

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('face-and-untagged', [
    { name: 'an empty title does not serve', input: '', mustBeCaught: true },
    { name: 'whitespace does not serve', input: '   ', mustBeCaught: true },
    { name: 'a real title serves', input: 'The Number Forge', mustBeCaught: false },
    { name: 'another does', input: 'Case One', mustBeCaught: false },
  ], (t) => !caseFaceServes({ title: t }));

  const kase = await prisma.case.findFirst({ where: { questionType: { district: 'MATHS' } }, select: { id: true, title: true, narrativeIntro: true, modes: true, storyWrapper: true, freeTier: true, orderInDistrict: true, mappedQuestionTypeIds: true } });
  const rows = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true, options: { orderBy: { id: 'asc' }, select: { isCorrect: true, misconceptionId: true, content: true } } }, orderBy: { id: 'asc' } });
  requirePopulation('emit:face-and-untagged', { 'maths rows': rows.length, 'maths cases': kase ? 1 : 0 });

  const sendIds = new Set((JSON.parse(readFileSync(SEND, 'utf8')) as { items: Array<{ itemId: string }> }).items.map((i) => i.itemId));
  const untagged = rows.filter((r) => publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt) === 'missing-misconceptions')
    .map((r) => ({
      itemId: r.id,
      inTheSent171: sendIds.has(r.id),
      untaggedOptions: r.options.filter((o) => !o.isCorrect && !o.misconceptionId).map((o) => String((o.content as { value: string }).value)),
    }));

  const faceBytes = canonicalJson({ title: kase?.title ?? null, narrativeIntro: kase?.narrativeIntro ?? null, storyWrapper: kase?.storyWrapper ?? null });

  const payload = {
    kind: 'face-bytes-and-untagged-ids',
    THE_CUT: await sealCut(prisma, cutBeganAt),
    ONE_THE_FACE_AS_BYTES: {
      why: 'it has never crossed as a string. The desk has been describing it; **a paraphrase of an empty slot and a paraphrase of a wording are indistinguishable to a reader who has seen neither.**',
      caseId: kase?.id ?? null,
      THE_EXACT_BYTES: faceBytes,
      bytesSha256: sha(faceBytes),
      andWHATTHEYSAY: {
        title: kase?.title ?? null,
        titleIsTheEmptyString: (kase?.title ?? '') === '',
        narrativeIntro: kase?.narrativeIntro ?? null,
        THE_READING: '**there is no child-facing wording here at all.** `title` is the empty string. `narrativeIntro` holds a STATE MARKER, not prose — it records that the slot is empty and how a face may land. **Nothing in this case has ever been written for a child to read**, and that is the fact the paraphrase could not carry.',
      },
      faceServes: kase ? caseFaceServes({ title: kase.title }) : false,
      whatALANDEDFACENEEDS: ['a TITLE — the child-facing name of the case', 'a NARRATIVE INTRO — the prose that opens it', 'both landed through scripts/lib/case-face.ts with her name and return digest as authority (R686)'],
      NOT_DRAFTED_HERE: 'the wording is Cowork\'s to draft and hers to approve, as case-en-06\'s was. **This crossing is the SLOT, not a proposal** — and a placeholder would make the face serve, which is the one thing failing closed prevents.',
      itIsTheLASTCHILDFACINGITEM: 'every other child-facing string in the district — stems, options, hints, walk scripts — has crossed and been read. This has not.',
    },
    TWO_THE_UNTAGGED_AS_IDS: {
      why: 'the two stores are counting different sets. **Publishing the ids is the only thing that makes the difference legible** — adopting a number would have hidden it.',
      thisStoreCounts: untagged.length,
      overWhatPopulation: `${rows.length} landed maths rows`,
      coworkCounts: 11,
      overWhatPopulationCowork: 'the sent 171',
      SCOPED_TO_THE_SENT_171_THIS_STORE_COUNTS: untagged.filter((u) => u.inTheSent171).length,
      AND_THAT_IS_STILL_NOT_11: '**scoping to the same 171 gives 8, not 11.** So the difference is not only scope — the two stores disagree about which rows carry an untagged distractor even over one population. Six of this store\'s fourteen are outside the send entirely, and they are all MC01 rows that arrived by the exemplar rather than the send.',
      ids: untagged,
      soTHEASKISNOTADOPTION: '**this store does not adopt the 11**, because adopting it would settle a disagreement by taking the other party\'s number rather than by finding which rows differ. The ids are above; the reconciliation is a subtraction anyone can now run.',
    },
    THREE_THE_CORRECTION_THAT_MUST_REACH_HER: {
      whatWasROUTEDTOHER: 'twelve rows described as having MOVED since she verified them, the movement attributed to amendments in her own returns.',
      THAT_WAS_FALSE: '**the rows never moved.** All twelve reproduce exactly under the projection their pins were taken with, and those pins came from her 182nd — AFTER the amendments blamed for moving them.',
      whatACTUALLYMOVED: 'this store\'s hash. R858 stopped counting retention in the content hash — correct in principle — and the corrected projection was applied to pins already taken under the old one. **The arithmetic consequence was reported as content movement.**',
      theRecordNowSAYS: 'the rows never moved; eleven are signed and the twelfth refuses on a real blocker (`MC01-FDP-03`, missing-misconceptions).',
      andWHYITMATTEREDTOSAYSOQUICKLY: '**a reviewer told that text she verified has changed cannot un-know it.** She would read the next artefact for drift she had been told to expect, and every ordinary difference would look like evidence.',
    },
  };
  const lines = untagged.map((u) => `${u.itemId}\t${u.inTheSent171 ? 'in-send' : 'not-in-send'}\t${u.untaggedOptions.length}`);
  const d = digestOverText('the untagged lines joined by \\n, each "<itemId>\\t<in-send>\\t<untagged option count>"', lines.join('\n'));
  const full = { ...payload, UNTAGGED_LINES: lines, untaggedSha256: d.value, untaggedSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_THE_FACE_AS_BYTES', 'TWO_THE_UNTAGGED_AS_IDS', 'THREE_THE_CORRECTION_THAT_MUST_REACH_HER', 'UNTAGGED_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('face-bytes-and-untagged-ids', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'face-bytes-and-untagged-ids');
  console.log(`face serves ${payload.ONE_THE_FACE_AS_BYTES.faceServes} | untagged ${untagged.length} of ${rows.length}, ${payload.TWO_THE_UNTAGGED_AS_IDS.SCOPED_TO_THE_SENT_171_THIS_STORE_COUNTS} within the sent 171`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
