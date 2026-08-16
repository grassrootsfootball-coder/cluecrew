/**
 * THE MOVE DECLARATION, FILLED — `pnpm apply:move-declarations`
 *
 * The library half of Cowork's proposal. One triple per English entry where the error IS a
 * displacement; `not-displacement` with a stated reason where it is not. Authored by reading each
 * entry's own description, one at a time — the reading the field exists to make mechanical, done
 * once by hand because there is no other way to seed it. (Cowork's note is right that deriving these
 * from execution notes by script would prove nothing: a machine-guessed triple that matches its tag
 * hides exactly the cases the field is for.)
 *
 * WRITES REVIEWED CONTENT UNGUARDED — a human ruling authorises the field (R63), and the values are
 * a reading rather than a derivation, so nothing here classifies before writing.
 */
import {
  MOVE_VOCABULARY_ADDITIONS, checkMoveDeclaration, moveKey, type MoveDeclaration,
} from '../packages/core/src/index';
import { Prisma, prisma } from '../packages/db/src/index';

const d = (what: string, from: string, to: string): MoveDeclaration =>
  ({ kind: 'displacement', what, from, to } as MoveDeclaration);
const no = (reason: string): MoveDeclaration => ({ kind: 'not-displacement', reason });

/**
 * THE 68. Read from each entry's own description, not from its id.
 *
 * The mechanical/orthographic families (spelling, punctuation, agreement, tags) are almost all
 * not-displacement: nothing MOVES, a form is chosen wrongly. That is Cowork's expectation about the
 * technique family arriving in a different family than predicted, and it is reported as a finding
 * rather than absorbed here.
 */
const DECLARATIONS: Record<string, MoveDeclaration> = {
  // ---- displacement: something is taken from one place and put in another ----
  'en-attribute-transfer': d('quality', 'character', 'character'),
  'en-comparison-vehicle-misread': d('quality', 'vehicle', 'subject'),
  'en-agent-patient-reversal': d('event', 'character', 'character'),
  'en-cause-agent-swap': d('event', 'character', 'character'),
  'en-wrong-scope-retrieval': d('referent', 'whole-text', 'window'),
  'en-within-span-wrong-element': d('referent', 'window', 'question'),
  'en-technique-effect-mislocated': d('referent', 'window', 'window'),
  'en-narrator-voice-as-fact': d('voice', 'speaker', 'narrator'),
  'en-technique-intent-as-character': d('purpose', 'writer', 'character'),
  'en-coordination-wrong-conjunct': d('referent', 'conjunct', 'conjunct'),
  'en-chronology-collapse': d('time', 'window', 'window'),
  'en-parallel-read-as-sequence': d('time', 'window', 'window'),
  'en-vocab-dominant-sense': d('sense', 'whole-text', 'window'),
  'en-vocab-neighbouring-sense': d('sense', 'whole-text', 'window'),
  'en-vocab-form-lookalike': d('sense', 'whole-text', 'window'),
  'en-vocab-not-this-word': d('sense', 'whole-text', 'window'),
  'en-relation-word-flipped': d('relation', 'window', 'window'),
  'en-physical-vs-emotional-cue': d('motive', 'character', 'reader'),
  'en-motive-invention': d('motive', 'reader', 'character'),
  'en-plausible-not-stated': d('event', 'reader', 'whole-text'),
  'en-whole-text-absence-asserted': d('event', 'reader', 'whole-text'),
  'en-technique-label-not-effect': d('purpose', 'writer', 'question'),
  'en-technique-generic-effect': d('purpose', 'writer', 'question'),
  'en-technique-structure-effect-blind': d('purpose', 'writer', 'window'),
  'en-technique-device-confusion': d('referent', 'writer', 'writer'),
  'en-repetition-purpose': d('purpose', 'writer', 'reader'),

  // ---- not a displacement: a form, a judgement of degree, or a behaviour ----
  'en-negation-dropped': no('A negation is DROPPED, not moved. Nothing is relocated — a word that reverses the proposition is not read, and the option states the affirmative.'),
  'en-figurative-taken-literally': no('A register error, not a displacement. The figure stays where it is; the child reads it in the wrong mode.'),
  'en-inference-literal-lookalike': no('A selection heuristic: the option reusing passage wording is chosen. Nothing moves between roles.'),
  'en-evidence-vividness-bias': no('A selection heuristic — the most vivid quotation wins over the probative one. No displacement.'),
  'en-extreme-option-pull': no('A judgement of DEGREE. The option overstates what the text measures; nothing changes place.'),
  'en-emotion-label-approximation': no('A judgement of PRECISION — an adjacent emotion word for the evidenced one. Cowork: no triple settles degree.'),
  'en-minimal-pair-skim': no('A reading behaviour: two options differing by one word matched on gist.'),
  'en-middle-option-avoidance': no('An answering behaviour — the moderate option refused on principle.'),
  'en-surface-word-match-multiselect': no('A selection heuristic across options, not a movement within the text.'),
  'en-n-option-avoidance': no('An answering behaviour: the no-mistake option never chosen.'),
  'en-over-tick-when-unsure': no('An answering behaviour under uncertainty. Nothing to do with the text.'),
  'en-multimark-single-answer': no('A procedural error about marks, not about meaning.'),
  'en-error-spot-guessed-a-part': no('A part with nothing wrong is chosen — a guess, not a displacement.'),
  'en-error-spot-rule-over-applied': no('A rule applied where it does not bite. Over-application, not movement.'),
  'en-error-spot-false-positive': no('RETIRED. A false positive on a correct part; no displacement in any case.'),
  'en-technique-device-confusion_PLACEHOLDER': no('unused'),

  // orthographic / grammatical form
  'en-a-an-by-spelling': no('A form chosen by the wrong cue (letter not sound). Nothing moves.'),
  'en-article-definiteness': no('A determiner chosen by habit rather than by prior mention. A form choice.'),
  'en-determiner-omitted': no('A required form is OMITTED. Absence, not displacement.'),
  'en-apostrophe-possession': no('A punctuation form missed or confused.'),
  'en-apostrophe-attributive': no('A noun-before-noun read as ownership: a form judgement about a construction, not a movement.'),
  'en-apostrophe-not-a-site': no('A part with no possible apostrophe site is chosen. A guess about form.'),
  'en-comma-not-a-comma-site': no('A part with no possible comma site is chosen. A guess about form.'),
  'en-comma-over-applied': no('A permissible comma site chosen over the required one. Over-application.'),
  'en-comma-subject-verb-split': no('A prohibited comma accepted. A form judgement.'),
  'en-paired-punctuation': no('An unclosed pair missed. Absence of a mark.'),
  'en-speech-punctuation-inside': no('A mark placed on the wrong side of speech marks — position within a convention, not a role-to-role move.'),
  'en-terminal-punctuation-blind': no('A boundary mark missed or mismatched.'),
  'en-capitalisation-overreach': no('A capital applied where the convention does not call for one.'),
  'en-homophone-by-sound': no('The wrong member of a homophone pair spelled. A form error.'),
  'en-silent-letter-dropped': no('A letter omitted in spelling.'),
  'en-double-consonant-boundary': no('A doubling rule guessed at a morpheme boundary.'),
  'en-unstressed-suffix-vowel': no('A suffix vowel guessed where the sound does not distinguish it.'),
  'en-word-class-by-ending': no('A word classified by suffix rather than sentence job. A classification error.'),
  'en-subject-verb-agreement-by-proximity': no('Agreement taken from the nearest noun rather than the subject — a form governed by the wrong controller, but the controller is not RELOCATED; it is never identified.'),
  'en-comparative-superlative-form': no('A comparative or superlative built or chosen wrongly. Form.'),
  'en-tense-sequence': no('A tense form chosen without marking anteriority. Form, and time is not moved between roles.'),
  'en-modal-conditional-form': no('A modal mismatched to its if-clause, or an impossible form built.'),
  'en-question-tag-polarity': no('Polarity repeated instead of flipped. Form.'),
  'en-conjunction-logic': no('A conjunction with the wrong logical relation chosen. The relation is MIS-SELECTED, not displaced between roles.'),
  'en-preposition-collocation': no('A preposition close in meaning but not collocating. Form.'),
  'en-relative-pronoun-choice': no('A relative pronoun chosen by habit rather than by referent — a form choice; the referent itself does not move.'),
  'en-vocab-secondary-sense': no('RETIRED 2026-08-15, superseded by three successors. Not declared.'),
};

async function main(): Promise<void> {
  delete DECLARATIONS['en-technique-device-confusion_PLACEHOLDER'];
  const rows = await prisma.misconception.findMany({ where: { district: 'ENGLISH' }, select: { id: true, description: true } });

  const missing = rows.filter((r) => !DECLARATIONS[r.id]).map((r) => r.id);
  const unknown = Object.keys(DECLARATIONS).filter((id) => !rows.some((r) => r.id === id));
  if (missing.length || unknown.length) {
    console.error(`REFUSED — every entry must be declared, and only real entries may be.`);
    if (missing.length) console.error(`  ${missing.length} undeclared: ${missing.join(', ')}`);
    if (unknown.length) console.error(`  ${unknown.length} declared but not in the library: ${unknown.join(', ')}`);
    process.exit(1);
  }

  const faults = rows.flatMap((r) => checkMoveDeclaration(r.id, DECLARATIONS[r.id]));
  if (faults.length) { console.error('REFUSED — malformed declarations:'); for (const f of faults) console.error(`  ${f}`); process.exit(1); }

  for (const r of rows) {
    await prisma.misconception.update({
      where: { id: r.id }, data: { move: DECLARATIONS[r.id] as unknown as Prisma.InputJsonValue },
    });
  }

  const after = await prisma.misconception.findMany({ where: { district: 'ENGLISH' }, select: { id: true, move: true, description: true } });
  const unwritten = after.filter((r) => !r.move);
  if (unwritten.length) throw new Error(`did not land on ${unwritten.length} row(s)`);

  const disp = after.filter((r) => (r.move as { kind?: string }).kind === 'displacement');
  const notDisp = after.length - disp.length;
  console.log(`${after.length} English entries declared · ${disp.length} displacement · ${notDisp} not-displacement (${Math.round(notDisp / after.length * 100)}%)\n`);

  const byKey = new Map<string, string[]>();
  for (const r of disp) {
    const k = moveKey(r.move as MoveDeclaration)!;
    byKey.set(k, [...(byKey.get(k) ?? []), r.id]);
  }
  const collisions = [...byKey].filter(([, ids]) => ids.length > 1);
  console.log(`${byKey.size} distinct triples across ${disp.length} displacement entries`);
  console.log(`${collisions.length} triple(s) shared by more than one entry:`);
  for (const [k, ids] of collisions.sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${k.padEnd(34)} ${ids.length}  ${ids.join(', ')}`);
  }
  console.log(`\nvocabulary additions forced while filling: ${MOVE_VOCABULARY_ADDITIONS.length}`);
  console.log(`\nthe two the field exists to separate:`);
  for (const id of ['en-attribute-transfer', 'en-comparison-vehicle-misread']) {
    console.log(`  ${id.padEnd(32)} ${moveKey(after.find((r) => r.id === id)!.move as MoveDeclaration)}`);
  }
  await prisma.$disconnect();
}

void main();
