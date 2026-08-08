/**
 * IMPORT annie's six writer's-technique misconceptions + the error-spot false-positive tag.
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-english-technique-misconceptions.ts`
 *
 * annie authored the six technique entries (Means/Desc/Hint, 2026-08-08) — writer's technique
 * had NO native distractor tag, so the eight technique items were borrowing inference/vocab
 * tags. Landed ACTIVE, reviewer-authored. Her #1/#2 tagging rule is carried on the entries:
 * if a device is named, tag label-not-effect; generic-effect is for answers naming no device.
 *
 * PLUS `en-error-spot-false-positive` — the misconception she named while reading the SPaG
 * homophones sheet: a child who picks a CORRECT part of a spot-the-mistake item is not making
 * the spelling error the borrowed tag claims, she is making a false-positive error (thinking
 * something is wrong when it isn't). It had no tag; the borrowed franchise tags misdescribed
 * her. PROPOSED — the description/hint here are provisional for annie to finalise.
 */
import { prisma } from '../packages/db/src/index';

const REVIEWER = 'current-reviewer';
const DAVID = 'human:david@cluecrew.test';

interface Entry { id: string; description: string; childHint: string; status: 'ACTIVE' | 'PROPOSED'; note?: string }

const TECHNIQUE: Entry[] = [
  { id: 'en-technique-label-not-effect', description: 'Child gives "it is a simile" where the answer is that the comparison makes the wind sound alive, naming the device rather than its work.', childHint: 'Naming it is the first step. Now say what it does to the reader.', status: 'ACTIVE', note: 'annie tagging rule: if a device is named, tag THIS; generic-effect is for answers naming no device.' },
  { id: 'en-technique-generic-effect', description: 'Child gives "it makes it more interesting" where the answer names what the specific image shows, offering a description that would fit any quotation.', childHint: 'Point at the actual words. Say what those words make you picture.', status: 'ACTIVE', note: 'annie tagging rule: use THIS only when no device is named; if a device is named, tag label-not-effect.' },
  { id: 'en-technique-device-confusion', description: 'Child gives "metaphor" for a comparison using "like" where the answer is simile, naming a device of the right family and the wrong kind.', childHint: "Look for 'like' or 'as' in the line. That word tells you which one it is.", status: 'ACTIVE' },
  { id: 'en-technique-effect-mislocated', description: 'Child gives the effect of the sentence before where the answer is the effect of the quoted phrase, reading past the words under test.', childHint: 'Find the exact words the question quotes. Answer about those words only.', status: 'ACTIVE' },
  { id: 'en-technique-intent-as-character', description: 'Child gives "the boy feels tense" where the answer is that the writer builds tension, treating the writer\'s choice as the character\'s state.', childHint: 'Ask who is doing this, the writer or the character. The writer chose the words.', status: 'ACTIVE', note: 'annie: the single most consequential comprehension misunderstanding — invest here.' },
  { id: 'en-technique-structure-effect-blind', description: 'Child gives a paraphrase of the short sentence where the answer is that its shortness makes the moment land suddenly, reading content where the question asks about shape.', childHint: 'Look at how long it is, not just what it says. Short lines land hard.', status: 'ACTIVE', note: 'annie: structure had NO tag — one-word paragraphs and lists of three were untaggable. Invest here.' },
];

const FALSE_POSITIVE: Entry = {
  id: 'en-error-spot-false-positive',
  description: 'Child flags a part of a spot-the-mistake sentence that contains no error, thinking something is wrong when it is correct — a false positive, not the spelling or punctuation error a borrowed tag would claim.',
  childHint: 'Check the part actually breaks a rule before you choose it. A correct part is not the answer.',
  status: 'PROPOSED',
  note: 'annie named this reading the homophones sheet (2026-08-08); description/hint provisional for her to finalise. The nameable error the borrowed franchise tags were misdescribing.',
};

async function main(): Promise<void> {
  for (const e of [...TECHNIQUE, FALSE_POSITIVE]) {
    const active = e.status === 'ACTIVE';
    const approval = active
      ? { approvedBy: REVIEWER, approvalMethod: 'written review — annie authoring sitting 2026-08-08', approvalNote: e.note ?? null }
      : { approvedBy: null, approvalMethod: null, approvalNote: e.note ?? null };
    await prisma.misconception.upsert({
      where: { id: e.id },
      create: { id: e.id, district: 'ENGLISH', description: e.description, childHint: e.childHint, status: e.status, proposedBy: REVIEWER, recordedBy: active ? DAVID : null, category: e.id.startsWith('en-technique') ? 'writers-technique' : 'error-spot', ...approval },
      update: { description: e.description, childHint: e.childHint, status: e.status, recordedBy: active ? DAVID : null, ...approval },
    });
    await prisma.attributionEvent.upsert({
      where: { id: `authored-${e.id}` },
      create: { id: `authored-${e.id}`, recordType: 'misconception', recordId: e.id, action: 'AUTHORED', actor: REVIEWER, recordedBy: DAVID, note: e.note ?? null, method: 'written review — annie authoring sitting 2026-08-08' },
      update: {},
    });
    console.log(`${e.status === 'ACTIVE' ? 'ACTIVE ' : 'PROPOSED'} ${e.id}`);
  }
  const n = await prisma.misconception.count({ where: { district: 'ENGLISH' } });
  console.log(`\nENGLISH misconceptions now: ${n} (was 45 → +6 technique +1 false-positive).`);
  await prisma.$disconnect();
}

void main();
