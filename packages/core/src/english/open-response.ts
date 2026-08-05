/**
 * The English district's open-response item model (BUILD-DISTRICT-ENGLISH §3
 * — the district's engineering core). This is the Selective track's item
 * type: the child types a short answer and the engine matches it against an
 * AUTHORED acceptable-answer set. It is the English analogue of
 * `solution.ts`: a pure engine with a publish gate, no generation anywhere.
 *
 * Two laws shape every line of this file.
 *
 *  - **S3.** Child-facing text is authored or template-bound, never
 *    free-generated. So the engine has no vocabulary of its own: every string
 *    it can hand back is a string the author put on the item or the band.
 *    That is enforced twice — at the type level by `AuthoredText` (a branded
 *    string only `asAuthored` can mint, and only from the item's own strings)
 *    and at runtime by `assertAuthoredVerdict`.
 *  - **D1 / Addendum A §1.3.** An answer is never marked wrong, and the words
 *    that would say so cannot even reach the bank: `validateForPublish`
 *    refuses an item whose descriptors, examples or feedback carry banned
 *    vocabulary (gate #11 — "banned-vocab green including all band
 *    descriptors and model answers").
 *
 * Storage note: this is the CONTENT shape. Review state (DRAFT → REVIEWED →
 * LIVE), provenance (`authoredBy`/`reviewedBy`) and the similarity gate live
 * on the existing `Item` row, which this model hangs off — the reviewer door
 * is reused, never duplicated.
 */
import { z } from 'zod';
import { contentStems } from './text';

/* ------------------------------------------------------------------ *
 * The ladder (§4)
 * ------------------------------------------------------------------ */

/**
 * The four rungs a Selective-track answer climbs, in order:
 * locate/quote → name the device or state the point → explain the effect →
 * develop toward a tension or complication.
 *
 * Rungs are NAMED, never numbered, to the child (§4, D-laws). The engine
 * returns the rung identifier and the AUTHORED descriptor for it; nothing
 * here is a score and nothing here is phrased by the engine.
 */
export const LADDER_RUNGS = ['LOCATE', 'NAME', 'EXPLAIN_EFFECT', 'DEVELOP'] as const;
export type LadderRung = (typeof LADDER_RUNGS)[number];

/** Position on the ladder — internal ordering only, never shown to a child. */
export function rungIndex(rung: LadderRung): number {
  return LADDER_RUNGS.indexOf(rung);
}

/* ------------------------------------------------------------------ *
 * Authored-text guarantee (S3)
 * ------------------------------------------------------------------ */

declare const authoredBrand: unique symbol;

/**
 * A string that provably came off the item. The brand is unforgeable from
 * outside this module, so a child-facing verdict field CANNOT be filled with
 * a literal the engine composed — the compiler refuses it.
 */
export type AuthoredText = string & { readonly [authoredBrand]: true };

/**
 * Every string an item legitimately owns. `asAuthored` checks membership, so
 * a typo'd or recomposed string fails as loudly as an invented one.
 */
export function authoredStrings(item: OpenResponseItem): ReadonlySet<string> {
  const pool = new Set<string>();
  pool.add(item.stem);
  for (const answer of item.acceptableAnswers) {
    pool.add(answer.text);
    if (answer.feedback) pool.add(answer.feedback);
    for (const barred of answer.barredNearMisses) pool.add(barred);
    for (const set of answer.conceptSets) for (const term of set) pool.add(term);
  }
  for (const band of item.bands) {
    pool.add(band.descriptor);
    pool.add(band.exampleAnswer);
  }
  if (item.spagRiderLabel) pool.add(item.spagRiderLabel);
  return pool;
}

/** Mints an `AuthoredText`. Throws if the text is not the item's own. */
export function asAuthored(pool: ReadonlySet<string>, text: string): AuthoredText {
  if (!pool.has(text)) {
    throw new Error(`S3 breach: "${text.slice(0, 60)}" is not an authored string on this item`);
  }
  return text as AuthoredText;
}

/* ------------------------------------------------------------------ *
 * Banned vocabulary (D1 + Addendum A §1.3)
 * ------------------------------------------------------------------ */

/**
 * The child-facing subset of `scripts/scan-vocab.mjs`, applied at the publish
 * gate so banned words cannot enter the bank in the first place. The scanner
 * covers /content and the app; an open-response item's descriptors live in
 * the database, so the gate has to carry the rule itself.
 */
export const BANNED_CHILD_FACING: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: '"fail/failure" (D1)', pattern: /\bfail(s|ed|ure|ures|ing)?\b/i },
  { name: '"wrong" (D1)', pattern: /\bwrong(ly)?\b/i },
  { name: '"incorrect" (§1.3)', pattern: /\bincorrect(ly)?\b/i },
  { name: '"error" in child copy (§1.3)', pattern: /\berrors?\b/i },
  { name: '"behind" (D1)', pattern: /\bbehind\b/i },
  { name: '"weak" (voice)', pattern: /\bweak(er|est|ness)?\b/i },
  { name: '"poor" (voice)', pattern: /\bpoor(ly)?\b/i },
  { name: '"careless" (voice)', pattern: /\bcareless(ly|ness)?\b/i },
  { name: '"should have" (voice)', pattern: /\bshould have\b/i },
  { name: '"you must" (§1.3)', pattern: /\byou must\b/i },
  { name: '"unfortunately" (§1.3)', pattern: /\bunfortunately\b/i },
  { name: 'praise of the child, not the work (§1.3)', pattern: /\b(clever|smart|gifted|genius)\b/i },
];

/** Returns the names of every banned rule a string trips. */
export function bannedVocabularyIn(text: string): string[] {
  return BANNED_CHILD_FACING.filter((rule) => rule.pattern.test(text)).map((rule) => rule.name);
}

/**
 * Extra guard for the SPaG rider label (gate #9). The rider must be scorable
 * WITHOUT a spelling criticism reaching a child mid-comprehension, so its
 * label may not read as a judgement of the writing at all.
 */
const CRITICISM_WORDS = /\b(mistake|mistakes|slip|slips|bad|sloppy|messy|untidy|problem|problems)\b/i;

/* ------------------------------------------------------------------ *
 * The schema (§3)
 * ------------------------------------------------------------------ */

export const toleranceSchema = z.enum(['EXACT', 'CLOSE_PARAPHRASE', 'CONCEPT']);
export type Tolerance = z.infer<typeof toleranceSchema>;

export const creditModelSchema = z.enum(['POINT', 'GRADUATED']);
export type CreditModel = z.infer<typeof creditModelSchema>;

export const ladderRungSchema = z.enum(LADDER_RUNGS);

/**
 * CANONICAL FIELD SHAPE (David's ratified correction, 2026-08-02):
 * `passageRef` (string) and `lineRefs` (INTEGER ARRAY) are the same two
 * fields in both item models — the MC/GL model and this one.
 *
 * This replaces a `{from, to}` range object. Two modules of one district
 * disagreed about what `lineRefs` meant, which is the kind of drift that
 * only shows up when an item and a renderer meet in production. An integer
 * array also matches how a paper actually references lines — "lines 12, 14"
 * is as common as "lines 12–18", and a range cannot express the first.
 * Callers that want a range author it as its members.
 */
export const lineRefSchema = z.number().int().positive();

export const acceptableAnswerSchema = z.object({
  /** The authored model phrasing of this creditworthy answer. */
  text: z.string().min(1).max(400),
  tolerance: toleranceSchema,
  /**
   * The authored traps. A near miss ALWAYS blocks this answer's credit, no
   * matter how high the similarity — that is the whole point of authoring it.
   */
  barredNearMisses: z.array(z.string().min(1).max(200)).default([]),
  /**
   * CONCEPT tolerance only: the author's concept vocabulary. One inner array
   * per idea that must be present; any member of that array satisfies it.
   * The engine NEVER invents a synonym — if it is not in this list, it is not
   * a synonym as far as the engine is concerned.
   */
  conceptSets: z.array(z.array(z.string().min(1).max(80)).min(1)).default([]),
  /**
   * Which required point this answer credits. Answers sharing a pointId are
   * alternative phrasings of the same point and credit it once.
   */
  pointId: z.string().min(1).max(60).optional(),
  /** GRADUATED only: the rung this answer evidences (§4). */
  rung: ladderRungSchema.optional(),
  /** §3: "returns credit plus the authored feedback for the matched pattern". */
  feedback: z.string().min(1).max(300).optional(),
  /** §3: misconceptions tag ANSWER PATTERNS. Must be listed on the item. */
  misconceptionId: z.string().min(1).max(80).optional(),
});
export type AcceptableAnswer = z.infer<typeof acceptableAnswerSchema>;

export const bandSchema = z.object({
  level: ladderRungSchema,
  /** Authored, child-facing: what this rung is. Never a score. */
  descriptor: z.string().min(1).max(300),
  /** Authored, child-facing: an answer that reaches this rung. */
  exampleAnswer: z.string().min(1).max(600),
  /** Optional mark value for the record. Never surfaced to the child. */
  marks: z.number().int().min(0).optional(),
});
export type Band = z.infer<typeof bandSchema>;

export const spagCheckKindSchema = z.enum(['CAPITAL_START', 'TERMINAL_PUNCTUATION', 'BARRED_SPELLINGS']);
export type SpagCheckKind = z.infer<typeof spagCheckKindSchema>;

export const spagCheckSchema = z.object({
  kind: spagCheckKindSchema,
  /** BARRED_SPELLINGS only: the exact spellings the author has seen go astray. */
  barredSpellings: z.array(z.string().min(1).max(60)).default([]),
});
export type SpagCheck = z.infer<typeof spagCheckSchema>;

/**
 * Tariffs run 1–12 (§3). The range is enforced at the PUBLISH GATE, not in
 * the parser, so a half-drafted item can sit in DRAFT with a nonsense tariff
 * and simply never reach a child — one door, not two.
 */
export const TARIFF_MIN = 1;
export const TARIFF_MAX = 12;

export const openResponseItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'item id must be a kebab-case slug'),
  /** Reading age ≤9 (the fairness law, §6: passage hard, stems plain). */
  stem: z.string().min(1).max(400),
  /** The curated extract this question reads. */
  passageRef: z.string().min(1).max(120),
  lineRefs: z.array(lineRefSchema).default([]),
  tariff: z.number().int(),
  /** Papers routinely state "give two reasons". */
  requiredPoints: z.number().int().positive().optional(),
  acceptableAnswers: z.array(acceptableAnswerSchema).default([]),
  creditModel: creditModelSchema,
  /** GRADUATED only — one band per rung (§4). */
  bands: z.array(bandSchema).default([]),
  /** An unsupported general answer hits a ceiling. */
  evidenceCapRule: z.boolean().default(false),
  /** Lifting from the passage scores zero on these. */
  ownWordsRequired: z.boolean().default(false),
  /** CSSE-style embedded accuracy mark, scored and reported separately. */
  spagRider: z.number().int().min(1).max(3).optional(),
  /** Authored, neutral, never a criticism (gate #9). Required with a rider. */
  spagRiderLabel: z.string().min(1).max(60).optional(),
  spagRiderChecks: z.array(spagCheckSchema).default([]),
  /** Tagged to answer patterns, not options (§3). */
  misconceptions: z.array(z.string().min(1).max(80)).default([]),
});
export type OpenResponseItem = z.infer<typeof openResponseItemSchema>;

/* ------------------------------------------------------------------ *
 * The publish gate (gate #1)
 * ------------------------------------------------------------------ */

export interface PublishFailure {
  /** The field that is missing or out of range, named so a reviewer can act. */
  field: string;
  reason: string;
}

export interface PublishCheck {
  ok: boolean;
  failures: PublishFailure[];
}

/**
 * Gate #1: "an item cannot publish without acceptable-answer set, tariff, and
 * (if GRADUATED) full band descriptors with example answers."
 *
 * Everything else here exists because the ENGINE cannot honour a rule the
 * author left unfinished — a CONCEPT answer with no concept vocabulary would
 * silently never match, an own-words item with no passage reference could
 * never detect lifting, a rider with no label could only be reported as a
 * bare number. Those are publish refusals, not runtime surprises.
 */
export function validateForPublish(item: OpenResponseItem): PublishCheck {
  const failures: PublishFailure[] = [];
  const fail = (field: string, reason: string) => failures.push({ field, reason });

  if (item.acceptableAnswers.length === 0) {
    fail('acceptableAnswers', 'an item cannot publish with an empty acceptable-answer set');
  }

  if (!Number.isInteger(item.tariff) || item.tariff < TARIFF_MIN || item.tariff > TARIFF_MAX) {
    fail('tariff', `tariff must be a whole number from ${TARIFF_MIN} to ${TARIFF_MAX}`);
  }

  if (item.requiredPoints !== undefined) {
    if (item.requiredPoints > item.tariff) {
      fail('requiredPoints', 'an item cannot ask for more points than its tariff can credit');
    }
    const distinctPoints = new Set(
      item.acceptableAnswers.map((answer, index) => answer.pointId ?? `#${index}`),
    );
    if (distinctPoints.size < item.requiredPoints) {
      fail(
        'acceptableAnswers',
        `requiredPoints is ${item.requiredPoints} but only ${distinctPoints.size} distinct point(s) are authored`,
      );
    }
  }

  item.acceptableAnswers.forEach((answer, index) => {
    if (answer.tolerance === 'CONCEPT' && answer.conceptSets.length === 0) {
      fail(
        `acceptableAnswers[${index}].conceptSets`,
        'CONCEPT tolerance needs authored concept vocabulary — the engine never invents synonyms',
      );
    }
    if (answer.tolerance === 'CLOSE_PARAPHRASE' && contentTokenCount(answer.text) === 0) {
      fail(
        `acceptableAnswers[${index}].text`,
        'a paraphrase answer needs at least one content word to match against',
      );
    }
    if (item.creditModel === 'GRADUATED' && answer.rung === undefined) {
      fail(
        `acceptableAnswers[${index}].rung`,
        'on a GRADUATED item every acceptable answer must say which rung it evidences',
      );
    }
    if (answer.misconceptionId && !item.misconceptions.includes(answer.misconceptionId)) {
      fail(
        `acceptableAnswers[${index}].misconceptionId`,
        `"${answer.misconceptionId}" is not listed in the item's misconceptions`,
      );
    }
  });

  if (item.creditModel === 'GRADUATED') {
    for (const rung of LADDER_RUNGS) {
      const matches = item.bands.filter((band) => band.level === rung);
      if (matches.length === 0) {
        fail('bands', `GRADUATED credit needs a band for every rung — "${rung}" is missing`);
        continue;
      }
      if (matches.length > 1) {
        fail('bands', `the ladder has one band per rung — "${rung}" is authored ${matches.length} times`);
      }
      matches.forEach((band) => {
        if (band.descriptor.trim() === '') fail(`bands.${rung}.descriptor`, 'band descriptor is empty');
        if (band.exampleAnswer.trim() === '') {
          fail(`bands.${rung}.exampleAnswer`, 'every band needs an example answer the child can compare with');
        }
      });
    }
  }

  if (item.ownWordsRequired && item.passageRef.trim() === '') {
    fail('passageRef', 'own-words items need a passage reference — lifting cannot be detected without one');
  }

  if (item.spagRider !== undefined) {
    if (!item.spagRiderLabel || item.spagRiderLabel.trim() === '') {
      fail('spagRiderLabel', 'a SPaG rider needs an authored, neutral label (gate #9)');
    } else if (CRITICISM_WORDS.test(item.spagRiderLabel)) {
      fail('spagRiderLabel', 'the rider label reads as a judgement of the writing; it must stay neutral (gate #9)');
    }
    if (item.spagRider > item.tariff) {
      fail('spagRider', 'the rider cannot be worth more than the question');
    }
  }

  // Gate #11: banned vocabulary can never reach the bank, so it can never
  // reach a verdict. Every string in this list is one the engine may hand
  // back verbatim.
  const childFacing: Array<[string, string]> = [
    ['stem', item.stem],
    ...item.acceptableAnswers.flatMap((answer, index): Array<[string, string]> =>
      answer.feedback ? [[`acceptableAnswers[${index}].feedback`, answer.feedback]] : [],
    ),
    ...item.bands.flatMap((band): Array<[string, string]> => [
      [`bands.${band.level}.descriptor`, band.descriptor],
      [`bands.${band.level}.exampleAnswer`, band.exampleAnswer],
    ]),
    ...(item.spagRiderLabel ? ([['spagRiderLabel', item.spagRiderLabel]] as Array<[string, string]>) : []),
  ];
  for (const [field, text] of childFacing) {
    for (const rule of bannedVocabularyIn(text)) {
      fail(field, `banned child-facing vocabulary: ${rule}`);
    }
  }

  return { ok: failures.length === 0, failures };
}

/**
 * The gate uses the same tokeniser the matcher does, so "this answer has no
 * content words to match against" means exactly what it will mean at
 * marking time.
 */
function contentTokenCount(text: string): number {
  return contentStems(text).length;
}
