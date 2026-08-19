/**
 * RECORD TWO FLAG FAULTS ON THE ROWS. DO NOT REPAIR THEM. (David, 2026-08-20 — R346.)
 *
 * Both were found the way flag faults can only be found: **by reading the flag against the text it
 * describes.** Neither is reachable by any check here — one is an inference presented as an
 * observation, the other is a claim contradicted by a line of dialogue, and no scanner reads a
 * flag's reason against a passage's prose.
 *
 * **RECORDED, NOT REPAIRED, AND THE DISTINCTION IS THE POINT.** Rewriting the flag text would put
 * an agent's words into a field that reads as a reviewer's judgement (R94), and it would erase the
 * evidence that the flag was written this way. The flag stays exactly as written; a sibling field
 * records what reading it found. **Who repairs it, and whether the underlying verdict survives the
 * correction, is Annie's.**
 *
 * `contentFlags` is not touched. `flagRecordFaults` is a new sibling, and it carries `ruledOn: null`
 * because nobody has decided anything yet — an UNKNOWN written as UNKNOWN rather than as absence
 * (R98).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO_ROOT, 'content/passages');

interface Fault {
  file: string;
  flagIndex: number;
  /** How the flag is numbered in the artefact Annie was sent, which is how she will refer to it. */
  asDeliveredAs: string;
  fault: string;
  theFlagSays: string;
  theTextSays: string;
  why: string;
}

const FAULTS: Fault[] = [
  {
    file: 'stream-a-03-wind-in-willows.json',
    flagIndex: 0,
    asDeliveredAs: 'flag 1 of 4 in FOUR-REACHABLE-FLAGS-WITH-PASSAGES.md',
    fault: 'A FAIR INFERENCE IS WRITTEN AS AN OBSERVATION.',
    theFlagSays: 'the rabbit is unhurt',
    theTextSays:
      '"He was bowled over in an instant by the impatient and contemptuous Mole" — and the text never ' +
      'returns to him. The Mole goes on to chaff "the other rabbits as they peeped hurriedly from their ' +
      'holes"; the elderly rabbit at the gap is not mentioned again.',
    why:
      'That he is unhurt is a reasonable reading — the tone is farcical and nothing suggests injury — but ' +
      'it is a READING, and the flag states it as a fact about the page. The distinction matters because ' +
      "the flag's verdict rests on it: \"the rabbit is unhurt\" is offered as the reason the scene is " +
      'comic rather than cruel. An inference load-bearing for a verdict should be visible as an inference.',
  },
  {
    file: 'stream-b-01.json',
    flagIndex: 1,
    asDeliveredAs: 'flag 3 of 4 in FOUR-REACHABLE-FLAGS-WITH-PASSAGES.md',
    fault: 'A CLAIM CONTRADICTED BY A LINE OF DIALOGUE IN THE SAME PASSAGE.',
    theFlagSays: 'It is never named or used, only reached for',
    theTextSays: '"Don\'t," she says. "Don\'t get the spray. They\'re mine."',
    why:
      'The child names it. "Spray" is the word the passage uses, spoken by the character whose objection ' +
      'is the turn of the scene — so it is not merely named, it is named at the most prominent moment in ' +
      'the passage. The "or used" half of the claim holds; the "never named" half is wrong on the page. ' +
      'The verdict may well survive the correction, since being named is not the same as being used — but ' +
      'the verdict is currently resting on a reason that is not true.',
  },
];

for (const f of FAULTS) {
  const path = join(PASSAGES, f.file);
  const j = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const flags = j.contentFlags;
  if (!Array.isArray(flags) || flags[f.flagIndex] === undefined) {
    throw new Error(`record-flag-faults ABORTED — ${f.file} has no contentFlags[${f.flagIndex}].`);
  }

  // ASSERT THE FLAG STILL SAYS WHAT THE FAULT QUOTES. A fault recorded against text that has since
  // changed is a fault about nothing, and it would read as a fault about whatever is there now.
  const flagText = JSON.stringify(flags[f.flagIndex]);
  if (!flagText.includes(f.theFlagSays)) {
    throw new Error(
      `record-flag-faults ABORTED — ${f.file} contentFlags[${f.flagIndex}] no longer contains the quoted phrase.\n` +
        `  Expected to find: "${f.theFlagSays}"\n` +
        '  The flag has changed since the fault was found. Re-read it against the passage before recording.',
    );
  }

  const existing = Array.isArray(j.flagRecordFaults) ? (j.flagRecordFaults as unknown[]) : [];
  const already = existing.some(
    (e) => (e as { flagIndex?: number }).flagIndex === f.flagIndex,
  );
  if (already) {
    console.log(`  unchanged  ${f.file} flag ${f.flagIndex} — fault already recorded`);
    continue;
  }

  j.flagRecordFaults = [
    ...existing,
    {
      flagIndex: f.flagIndex,
      asDeliveredAs: f.asDeliveredAs,
      fault: f.fault,
      theFlagSays: f.theFlagSays,
      theTextSays: f.theTextSays,
      why: f.why,
      disposition: 'RECORDED, NOT REPAIRED — the flag text is unchanged',
      foundBy: 'David, 2026-08-20, by reading the flag against the passage it describes',
      foundHow: 'reading — no check here can reach either fault',
      ruledOn: null,
      ruledOnNote: 'Nobody has decided what to do about this. Whether the verdict survives the correction is the reviewer\'s.',
    },
  ];
  writeFileSync(path, JSON.stringify(j, null, 2) + '\n');
  console.log(`  RECORDED   ${f.file} flag ${f.flagIndex}: ${f.fault}`);
}

console.log(`\n${FAULTS.length} fault(s) recorded on the rows. contentFlags untouched on both.`);
