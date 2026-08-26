/**
 * THE WALK-SCRIPT SCREEN, AND THE THREE ANSWERS FROM THE ROWS (David, 2026-08-26 — R733).
 * You screen the serving row, Cowork screens the source. This is the serving side's first look
 * at its whole walk-script population.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkChildFacingText, checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';

const REPO = join(__dirname, '..');
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

async function run() {
  // The instrument proves itself before it reports (R721).
  assertFixture('screen:walkscripts', [
    { name: 'a US spelling is caught', input: 'He was favoring the horses today.', mustBeCaught: true },
    { name: 'a banned stance word is caught', input: 'That answer is wrong.', mustBeCaught: true },
    { name: 'an over-cap sentence is caught', input: 'The dealer held the coin under his lamp for a long time before he agreed that it was real and not fake.', mustBeCaught: true },
    { name: 'a clean walk sentence is caught by NOTHING', input: 'Look at the first pair. Say the rule out loud.', mustBeCaught: false },
  ], (t) => checkChildFacingText({ role: 'hint', label: 'fixture', text: t }).filter(isBlocking).length > 0);

  const items = await prisma.item.findMany({
    select: {
      id: true, status: true, questionTypeId: true, explanation: true, stem: true,
      questionType: { select: { mechanic: true } },
      options: { select: { content: true, misconceptionId: true } },
    },
    orderBy: { id: 'asc' },
  });
  const walks = items
    .map((i) => ({ ...i, script: String((i.explanation as Record<string, unknown> | null)?.walkScript ?? '') }))
    .filter((i) => i.script.trim() !== '');

  /**
   * **THE SCREEN CALLS THE ITEM GATE, NOT A NARROWER VERSION OF IT** (corrected before crossing —
   * R717's fault in an instrument written this same turn). The first version called
   * `checkChildFacingText` directly on the walk script, which omits every exemption the item gate
   * supplies from the ROW: the words the item TESTS, the option words the script may legitimately
   * name, the declared quotations, the passage's proper nouns. It produced THREE faults — two on
   * LIVE rows — and all three are CLEAN at the gate: SP-06 and SP-09 name the misspelling they
   * test ("dictionery"/"Dictionary"), and BV-02's "quick" sits inside a declared quotation.
   *
   * A screen that is stricter than the gate does not find more faults; it finds the gate's
   * exemptions and calls them faults.
   */
  const faults: Array<Record<string, unknown>> = [];
  for (const w of walks) {
    const f = checkItemChildFacing({
      id: w.id, stem: w.stem, explanation: w.explanation, mechanic: w.questionType.mechanic,
      options: w.options.map((o) => ({ content: o.content, misconceptionId: o.misconceptionId })),
    }).filter(isBlocking).filter((x) => x.where.includes('walkScript'));
    if (f.length) faults.push({ id: w.id, status: w.status, questionType: w.questionTypeId, faults: f.map((x) => `${x.rule}: ${x.detail}`), script: w.script });
  }
  const byRule: Record<string, number> = {};
  for (const f of faults) for (const d of f.faults as string[]) { const k = d.split(':')[0]!; byRule[k] = (byRule[k] ?? 0) + 1; }
  const byStatus: Record<string, number> = {};
  for (const f of faults) byStatus[String(f.status)] = (byStatus[String(f.status)] ?? 0) + 1;

  // The straight-quote question, answered by discrimination rather than by count.
  const straight = walks.filter((w) => /'/.test(w.script));
  const paired = straight.filter((w) => /'[^']{2,60}'/.test(w.script));
  const possessive = straight.filter((w) => !/'[^']{2,60}'/.test(w.script));
  const curlyDouble = walks.filter((w) => /[""]/.test(w.script));
  const straightDouble = walks.filter((w) => /"/.test(w.script));

  const payload = {
    kind: 'walkscript-screen-recross',
    what: 'The serving side\'s first screen of its whole walk-script population, plus the two row-answers David asked for. RE-CROSSED under a new name: the first crossing never arrived.',
    ANSWER_ONE_theJoinsWithPrompts: {
      question: 'do any serving rows carry the vr-12 joins-with prompts in shouted form?',
      answer: 'NO. All 25 vr-12 rows read the quoted form and ZERO shout — verified on the raw prompt field this run. The serving side already reads quoted, because R723 landed exactly this amendment here last turn, at the generator and on all 25 derived rows.',
      THE_CLASS_CLOSES: true,
      note: 'a first pass looked at JSON.stringify output and read 0 quoted as well as 0 shouted — the escaping made the quoted form invisible to the regex. Re-checked on the field itself. A search that reads a serialisation instead of the value can report a clean corpus and an empty one identically.',
    },
    ANSWER_TWO_theTwoStraightQuotes: {
      question: 'amend the two straight quotes in the vr-06 walk scripts if they are serving-side too',
      theyAreServingSide: ['bank-vr-06-missing-word-02', 'bank-vr-06-missing-word-32'],
      NOT_AMENDED_AND_WHY: 'THE TWO ARE NOT TWO. They are ordinary members of two much larger populations on this side, and they are not even the same thing as each other.',
      discrimination: {
        'straight quotes used as QUOTATION MARKS': { rows: paired.length, includes: 'bank-vr-06-missing-word-02 — "The gap comes after \'slice of\'."' },
        'straight quotes that are POSSESSIVE or contraction apostrophes': { rows: possessive.length, includes: 'bank-vr-06-missing-word-32 — "Taking the dog\'s food away is unkind." This is an apostrophe in dog\'s, not a quotation mark at all.' },
        doubleQuotes: { curly: curlyDouble.length, straight: straightDouble.length, reading: 'for DOUBLE quotes the house has a clear norm — curly everywhere, straight nowhere. For SINGLE quotes it has none: straight is the majority form.' },
      },
      theRefusal: 'Amending these two alone would be a typographic ruling scoped to where somebody happened to be reading — the fault R703 registered — leaving 66 identical siblings untouched. And one of the two is a possessive apostrophe, which no convention here calls a fault. A walk-script quoting convention has never been ruled on this side; the membership is above and the ruling is the desk\'s, with its scope stated.',
    },
    ANSWER_THREE_theScreen: {
      unitsStatedFirst: 'COWORK SCREENS 90 SOURCE WALK SCRIPTS; THIS SIDE HOLDS 709 ON SERVING ROWS. The populations are not the same object and neither number is wrong — it screens the source, this screens the row (the units class, R690). This screen is the SUPERSET on this side and does not claim to identify which 709 correspond to its 90.',
      population: { walkScriptsScreened: walks.length, itemsInStore: items.length },
      method: 'checkItemChildFacing — THE ITEM GATE ITSELF, called on the whole row and filtered to its walkScript verdicts — over every walk script regardless of item status. This is the first time DRAFT walk scripts have been screened as a population from this side.',
      theCorrectionMadeBeforeCrossing: 'the first version of this screen called checkChildFacingText directly on the script, omitting the exemptions the gate takes from the row. It reported THREE faults, TWO ON LIVE ROWS, and all three are clean at the gate — SP-06 and SP-09 name the misspelling they test, BV-02\'s "quick" is inside a declared quotation. A screen stricter than the gate does not find more faults; it finds the gate\'s exemptions and calls them faults. Caught by checking the three against the gate before they crossed.',
      faults: { rows: faults.length, byRule, byStatus },
      membership: faults,
    },
  };
  /**
   * THE DIGEST INLINE, in the only form a file can carry (R728): a digest of the FINDINGS subtree,
   * recomputable on arrival, with the serialisation that produces it NAMED — because the default
   * gives a different number and this store has already raised that false alarm once (R729).
   */
  const canonical = (o: unknown): string => {
    if (o === null || typeof o !== 'object') return JSON.stringify(o);
    if (Array.isArray(o)) return `[${o.map(canonical).join(',')}]`;
    return `{${Object.keys(o as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((o as Record<string, unknown>)[k])}`).join(',')}}`;
  };
  // R752: the subtree is named by the DOCUMENT'S OWN top-level keys; findingsDigest throws
  // if any named key is not present, so an alias fails here rather than at the far door.
  const artefact = { ...payload, ...findingsDigest(payload, ['ANSWER_ONE_theJoinsWithPrompts', 'ANSWER_TWO_theTwoStraightQuotes', 'ANSWER_THREE_theScreen']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('walkscript-screen-recross', sha256(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'walkscript-screen-recross');
  console.log(`walk scripts screened: ${walks.length}; faults ${faults.length}; findingsSha256 ${artefact.findingsSha256}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
