/**
 * SPaG generator-family SIGN-OFF (annie's SPaG signing sitting).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/apply-spag-signatures.ts`
 *
 * Records a reviewer SIGNATURE per SPaG family via the written-review path (append-only
 * AttributionEvent, action SIGNED, actor current-reviewer). The M-place pattern: the
 * qualification sits WITH the signature, not in a side note — annie signs that every item the
 * family emits is fair at its tier and the ladder is honest, NOT that a child can practise it
 * without repetition (the bank is 24 sentences, 6 per rung, so a tier emits six distinct items).
 */
import { prisma } from '../packages/db/src/index';

const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — SPaG signing sitting 2026-08-08';

// [familyId, signed scope, note]
const SIGNATURES: Array<[string, string, string]> = [
  ['spag-spell-homophone-by-sound', 'T1–T4', 'Homophones. TRAP DEFINITION: a part is a near-miss iff a word in it is a standard KS2 homophone (a reviewed list — "is a homophone" has no generative rule); weak-forms/near-homophones/low-frequency (were/we\'re, shore/sure, thyme) excluded. SIGNED AS: every item the family emits is a fair item at its tier and the near-miss ladder (0/1/2/3, derived-and-verified) is honest — NOT that a child can practise without repetition. DEPTH: 24 verified sentences (6/rung) → six distinct items per tier, so two sittings exhaust a tier; a SERVING concern to size before volume (M-place shape). T5 out of scope (SPaG ceiling T4).'],
  ['spag-spell-unstressed-suffix-vowel', 'T1–T4', 'Unstressed suffix vowel. TRAP DEFINITION: a near-miss iff a word (≥6 letters) ends -ent/-ant, -ence/-ance, -able/-ible or -ary/-ery/-ory — an unstressed suffix vowel with no sound to guide it (necessary, category, memory). SIGNED AS: every item fair at its tier; ladder = near-miss 0/1/2/3, derived-and-verified; N-keyed at rung-1. DEPTH: 24 sentences (6/rung). T5 out of scope.'],
  ['spag-spell-silent-letter-dropped', 'T1–T4', 'Silent letters. TRAP DEFINITION: membership in the reviewed 36-word KS2 silent-letter list — no generative rule exists ("do children omit it" is empirical); right/light/walk/would EXCLUDED, knight/island/knock/autumn IN. SIGNED AS: every item fair at its tier; ladder 0/1/2/3; rung-3 traps cross-group so items read as sentences not kn-drills. DEPTH: 24 sentences (6/rung). T5 out of scope.'],
  ['spag-spell-double-consonant-boundary', 'T1–T4', 'Double letters. TRAP DEFINITION: membership in the reviewed ~30-word pool of prefix/suffix-boundary and INERT doubles (removing the double would not change the sound — necessary, embarrass, accommodate); AUDIBLE short-vowel doubles (summer, little, happens) excluded. KEYS restricted to child-used words; the wider pool serves only as traps. SIGNED AS: every item fair at its tier; ladder 0/1/2/3; N-keyed at rung-1. DEPTH: 16 sentences (4/rung) → FOUR items per tier, so a child exhausts the family in one sitting; SIZE BEFORE SERVING (the tightest depth of the four, M-place shape).'],
  ['spag-punct-apostrophe-contraction', 'T1–T3', 'Apostrophe (contraction), SPOT-THE-MISTAKE. its/it\'s, they\'re/their/there, you\'re/your, we\'re/were, who\'s/whose — UNARGUABLE (one form right, one wrong). TRAP: a part with a contraction-set word (either form), a reviewed word LIST (fourth no-rule case), apostrophes stripped in the lookup. PAIR-CORRECTNESS: every set-member in a CLEAN part must be the correct form for that sentence (a contraction trap word can be genuinely wrong — they\'re with no plural referent), reviewed per sentence as nmVerified and CI-checked to equal the lookup\'s clean-part flags. SIGNED AS: every item fair; ladder 0/1/2 → T1–T3; N-keyed at rung-1 shows all-correct forms. DEPTH: 11 keys, 3–4/tier — the SMALLEST family (the confusion set is only eleven words; its/it\'s is the value not the volume), exhausted in one sitting; SIZE BEFORE SERVING.'],
  ['spag-punct-comma-needs', 'T1–T3', 'Commas — the REFRAME "which part NEEDS a comma" (spot-the-mistake rests on "no comma acceptable here", nearly empty at phrase boundaries). THREE parts + N; site typing REVIEWED per sentence (the third no-rule case): R = fronted subordinate clause or list-internal comma (beyond argument); O = optional (trailing PP/adverb, serial slot, TRAILING subordinate clause, coordinator joining clauses); F = tight bond. Key = the R part or N. SIGNED AS: every item fair; ladder = optional-count 0/1/2 → T1–T3 (three parts cannot hold three O plus a main verb, so no T4 — an honest ceiling). MIRRORED PAIRS sanctioned (fronted/trailing, rungs 0/1) — never same child same session. DEPTH: 21 sentences (~7/tier), exhaustible in two sittings; SIZE BEFORE SERVING. A is modal (fronted clauses key A by the rule) — inherent, not a bug.'],
];

async function main(): Promise<void> {
  for (const [familyId, scope, note] of SIGNATURES) {
    const id = `sig-${familyId}-2026-08-08`;
    await prisma.attributionEvent.upsert({
      where: { id },
      create: { id, recordType: 'spag-template-family', recordId: familyId, action: 'SIGNED', actor: 'current-reviewer', recordedBy: DAVID, field: `generator@${scope}`, note, method: METHOD },
      update: { field: `generator@${scope}`, note, method: METHOD },
    });
    console.log(`SIGNED ${familyId} @ ${scope}`);
  }
  const n = await prisma.attributionEvent.count({ where: { recordType: 'spag-template-family', action: 'SIGNED' } });
  console.log(`\n${n} SPaG family signature(s) on record.`);
  await prisma.$disconnect();
}

void main();
