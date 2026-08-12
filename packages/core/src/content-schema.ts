import { z } from 'zod';
import { regionFileSchema } from './regions';
import { MECHANIC_FAMILIES, familyForType, FAMILY_BY_TYPE } from './families';
import { checkChildFacingText, checkNoInternalIds } from './content-gates';

/**
 * Schemas for authored content in /content (validated in CI, BUILD-PHASE-1 §2).
 * Structural law enforcement:
 *  - P1: every Case ships all five Modes
 *  - D5: narrative intro is ≤30 seconds of reading and skippable
 */

/** ~30 seconds at a comfortable child reading pace. */
export const NARRATIVE_MAX_CHARS = 700;

/**
 * THE SEASON VOCABULARY — ONE TYPE, BOTH SIDES OF THE JOIN (David, 2026-08-12).
 *
 * A chapter declares the season it belongs to; a case's `storyWrapper` declares the season its
 * skin belongs to. Those are the same fact, and until now they were two independent
 * `z.string().min(1)` fields with nothing comparing them — so a wrapper reading `s3` and a
 * chapter reading `season-3` would both validate and never meet. Sharing the type is what makes
 * the join CHECKABLE: same vocabulary on both sides, closed, so a typo is a build failure rather
 * than a chapter that silently belongs to no season.
 *
 * Four seasons because there are four districts (STORY BIBLE §3), one season each. A fifth is a
 * one-line change here and a decision by David — which is the point of an enum over a free
 * string: it cannot be added by accident.
 *
 * `fixture` is RESERVED and is not a season. It exists so a test chapter can live in
 * content/chapters and be held to the same gates as authored prose without claiming to be part
 * of the story: the reader prints the season as the page kicker, so a fixture announces itself.
 * See content/chapters/.gitkeep.
 */
export const seasonSchema = z.enum(['s1', 's2', 's3', 's4', 'fixture']);
export type Season = z.infer<typeof seasonSchema>;

/**
 * A clue-skin label KEY names a slot in the CASE-MODE FRAME — the word the frame uses for the
 * thing on screen, which the season's story renames ("the postmarks"). It is not a content id,
 * and this is the one field in the wrapper where one could have been smuggled in: the record was
 * open, so `{"case-vr-08": "the postmarks"}` would have validated.
 *
 * Two bounds, because the field is both a key space and child-facing copy:
 *  - the KEY is a short frame-slot slug, and is refused if it matches our id conventions
 *    (`checkNoInternalIds`, the canonical rule — not a second copy of it);
 *  - the VALUE is what a child reads, so it goes through the child-facing gates wherever a door
 *    handles a wrapper (see `checkStoryWrapperCopy`).
 *
 * The key space is deliberately narrower than "a slug": two hyphenated parts at most, so
 * `case-vr-08` and `vr-04-closest-meaning` cannot be spelled here even before the id rule runs.
 */
const CLUE_SKIN_KEY = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)?$/;

const assetRef = z.string().min(1).max(300);

export const wordContentSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'word id must be a kebab-case slug'),
  headword: z.string().min(1).max(40),
  /** Authored, reading age ≤9 — kept short by construction. */
  definitionChild: z.string().min(3).max(160),
  sentence: z.string().min(3).max(200),
  rootFamily: z.string().regex(/^[a-z]+-[a-z]+$/).optional(),
  imageRef: assetRef.optional(),
  tier: z.number().int().min(1).max(5),
});

export type WordContent = z.infer<typeof wordContentSchema>;

export const wordFileSchema = z.object({
  kind: z.literal('words'),
  words: z.array(wordContentSchema).min(1),
});

const modeSchema = z.object({
  kind: z.enum(['video', 'faded-example', 'visual', 'audio', 'practice']),
  assetRef: assetRef.optional(),
  /** Watch mode must be ≤90 seconds (P1). */
  maxSeconds: z.number().int().positive().optional(),
});

/**
 * THE PER-CASE STORY SKIN (STORY BIBLE §4, Law 1): wraps the case, never the items. The open
 * line sets the season's lead, the close line lands the cracked-stamp, and the clue-skin labels
 * rename the FRAME's words in Case mode only — stems untouched, item bank unedited.
 *
 * TIGHTENED 2026-08-12 (David), deliberately BEFORE the first wrapper is authored. Zero cases
 * carry one today, so every constraint below rewrites nothing; the same change after S1
 * authoring is a content migration. What was loose, and now is not:
 *
 *   · `season` was a free string on both sides of the join — see `seasonSchema`.
 *   · `clueSkinLabels` was an open record: any key, any value. It was the one place a case or
 *     item id could be smuggled in with no gate objecting.
 *   · the shape was enforced at the seed door alone. It is exported here so a second door has
 *     one thing to call, and `pnpm check:db-content` re-reads it off the DATABASE ROW, so a
 *     door that forgets is caught by a gate reading the artefact rather than a copy of it (R57,
 *     R60 question 3).
 *
 * BINDING IS BY FAMILY, NEVER BY CASE ID — AND THE ABSENCE IS A RULING, NOT AN OVERSIGHT.
 * There is deliberately no `caseId`/`caseIds` field, and one must not be added later by someone
 * reading the gap as something nobody thought about. A wrapper belongs to the case whose file it
 * sits in; the outward binding it needs is the FAMILY, because a family is permanent and a case
 * ordering is not. `orderInDistrict` is unresolved (the next-case selector sorts on it globally,
 * with no district key, so once a second district is live the walk alternates districts by
 * construction), and story chapters are permanent artefacts. Binding a chapter's world to case
 * ids means that unresolved question is settled by rewriting the chapters — which is the cost
 * this field exists to avoid.
 */
export const storyWrapperSchema = z.object({
  /** The season lead a case opens on. ≤30s of reading, same budget as a narrative intro (D5). */
  open: z.string().min(1).max(NARRATIVE_MAX_CHARS),
  /** One story line on the cracked-stamp. */
  close: z.string().min(1).max(240),
  /**
   * frame-slot → the word the season's story uses for it. The key names a slot; the value is
   * read by a child and is gated as child-facing copy (`checkStoryWrapperCopy`).
   */
  clueSkinLabels: z
    .record(
      z
        .string()
        .regex(
          CLUE_SKIN_KEY,
          'a clue-skin key names a frame slot ("envelope", "clue-board"), not a content id',
        ),
      z.string().min(1).max(40),
    )
    .optional()
    .superRefine((labels, ctx) => {
      for (const key of Object.keys(labels ?? {})) {
        // The canonical id rule, called — not a second copy of it that would drift from it.
        for (const failure of checkNoInternalIds(`clueSkinLabels key "${key}"`, key)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: failure.detail });
        }
      }
    }),
  /** Shared with the chapter's own field, so the two sides of the join are comparable. */
  season: seasonSchema,
  /**
   * The mechanic family this skin belongs to (BUILD-PHASE-4 §2). Optional because the registry
   * covers VR only today — a Maths or NVR case has an engine, not a `MechanicFamily`, and
   * inventing a value here would be a vocabulary nobody ratified. Where it IS declared,
   * `caseContentSchema` proves it agrees with the case's own question type.
   */
  family: z.enum(MECHANIC_FAMILIES).optional(),
  /** Season/thread tags (e.g. the Grey Umbrella thread). Free vocabulary, bounded in length. */
  threadTags: z.array(z.string().min(1).max(40)).default([]),
});

export type StoryWrapper = z.infer<typeof storyWrapperSchema>;

/**
 * The wrapper's CHILD-FACING COPY, for every door that handles one.
 *
 * The schema above proves the shape; this proves the words. `open` and `close` are prose a child
 * reads, and until now nothing checked them: `check-reading-age` stopped at `narrativeIntro.text`,
 * so up to 700 and 240 characters of story copy had no sentence-length or vocabulary coverage.
 * Clue-skin VALUES are the words a child sees in place of the frame's own, so they are checked
 * the same way.
 */
export function checkStoryWrapperCopy(
  caseId: string,
  wrapper: StoryWrapper,
): ReturnType<typeof checkChildFacingText> {
  return [
    ...checkChildFacingText({ role: 'narrative', label: `case:${caseId} storyWrapper.open`, text: wrapper.open }),
    ...checkChildFacingText({ role: 'narrative', label: `case:${caseId} storyWrapper.close`, text: wrapper.close }),
    ...Object.entries(wrapper.clueSkinLabels ?? {}).flatMap(([slot, label]) =>
      checkChildFacingText({
        role: 'narrative',
        label: `case:${caseId} storyWrapper.clueSkinLabels.${slot}`,
        text: label,
      }),
    ),
  ];
}

export const caseContentSchema = z
  .object({
    id: z.string().regex(/^case-[a-z0-9-]+$/, 'case id must look like "case-vr-08"'),
    questionTypeId: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1).max(80),
    narrativeIntro: z.object({
      text: z.string().max(NARRATIVE_MAX_CHARS, 'narrative intro exceeds ~30s of reading (D5)'),
      skippable: z.literal(true), // structurally always skippable (D5)
    }),
    modes: z.object({
      watch: modeSchema,
      // Walk-it is crew-taught (STORY BIBLE §4): the worked example may be
      // voiced by a district specialist. Authoring metadata only — the
      // faded-scaffold pedagogy is unchanged.
      walk: modeSchema.and(
        z.object({
          voicedBy: z.enum(['marlowe', 'ozzie', 'marta', 'silas', 'prue']).optional(),
        }),
      ),
      see: modeSchema,
      hear: modeSchema,
      try: modeSchema,
    }),
    orderInDistrict: z.number().int().positive(),
    /** The per-case story skin. Defined above so a second door has one thing to call (R57). */
    storyWrapper: storyWrapperSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const watchSeconds = value.modes.watch.maxSeconds;
    if (watchSeconds === undefined || watchSeconds > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['modes', 'watch', 'maxSeconds'],
        message: 'Watch mode must declare maxSeconds ≤ 90 (P1)',
      });
    }
    // A declared family must AGREE with the one the case's question type already implies.
    // Only VR types are in the registry today, so a Maths or NVR case is skipped rather than
    // guessed at — an unknown type means "cannot check", never "passes".
    const declared = value.storyWrapper?.family;
    if (declared && FAMILY_BY_TYPE[value.questionTypeId]) {
      const implied = familyForType(value.questionTypeId);
      if (declared !== implied) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['storyWrapper', 'family'],
          message: `storyWrapper.family is "${declared}" but ${value.questionTypeId} is in the "${implied}" family. A wrapper cannot claim a family its own case is not in.`,
        });
      }
    }
  });

export type CaseContent = z.infer<typeof caseContentSchema>;

export const caseFileSchema = z.object({
  kind: z.literal('case'),
  case: caseContentSchema,
});

/**
 * Worked-example replay templates (BUILD-DISTRICT-MATHS, ratified addition):
 * authored phrasing frames the replay fills from a solution trace. Every
 * frame must use its slots — a template that ignores {operation} or {value}
 * would read as a canned line, not a walk-through.
 */
export const replayTemplatesFileSchema = z.object({
  kind: z.literal('replay-templates'),
  templates: z.record(
    z.object({
      intro: z.string().min(1),
      step: z.string().includes('{operation}').includes('{value}'),
      outro: z.string().includes('{value}'),
    }),
  ),
});

/** The Maths district's 36-slot engineering plan (§4) — shells, not content. */
export const mathsPlanFileSchema = z.object({
  kind: z.literal('maths-district-plan'),
  note: z.string(),
  quarterName: z.string(),
  slots: z
    .array(
      z.object({
        id: z.string().regex(/^mq-\d{2}$/),
        strand: z.enum([
          'number',
          'operations',
          'fractions-decimals-percentages',
          'ratio-proportion',
          'algebra',
          'measures',
          'geometry',
          'statistics',
          // SCP-M-3 (corpus decisions entry 1): the Puzzle strand, rendered
          // through the cross-district DEDUCTION DEN engine.
          'puzzle',
        ]),
        mechanic: z.enum([
          'number-forge',
          'workshop',
          'mark-homework',
          'data-desk',
          'shape-shop',
          'deduction-den',
        ]),
        orderInDistrict: z.number().int().min(1),
        cluster: z.string().min(1),
        // D7 clarification (manifesto v1.4): bare currency is permitted in
        // this slot's ITEM CONTENT only when the reviewer tags it.
        allowsCurrency: z.boolean().optional(),
      }),
    )
    .length(36),
});

/**
 * Story infrastructure (STORY BIBLE v1.2 §9, phase 1, feature-flagged).
 * A Chapter is prose the child is IN: second person, one optional dialogue
 * choice (cosmetic only), seeded Vault words tappable in the reader, one
 * optional clue-tap (a real LIVE item in a no-stakes frame — the taste in
 * the story, the meal in the cases). Law 3: opt-in, skippable, replayable.
 * Law 4: audio is a RELEASE CONDITION — the schema refuses a released
 * chapter without an audioRef.
 */
export const chapterTriggerSchema = z.union([
  z.object({
    kind: z.literal('rank'),
    rank: z.enum(['TRAINEE', 'JUNIOR_DETECTIVE', 'DETECTIVE', 'SENIOR_DETECTIVE', 'CHIEF_INSPECTOR']),
  }),
  z.object({ kind: z.literal('cases_cracked'), count: z.number().int().min(1) }),
  z.object({ kind: z.literal('season_complete'), season: z.string() }),
  z.object({ kind: z.literal('board'), beat: z.enum(['invitation', 'completion']) }),
]);

export const chapterFileSchema = z.object({
  kind: z.literal('chapter'),
  chapter: z
    .object({
      id: z.string().regex(/^s\d+-ch\d+$/),
      title: z.string().min(1).max(80),
      /** The other side of the join. Shared with `storyWrapper.season` — see `seasonSchema`. */
      season: seasonSchema,
      trigger: chapterTriggerSchema,
      /** Prose body; seeded Vault words are marked [[like this]]. */
      body: z.string().min(200),
      seededWordIds: z.array(z.string()).max(8),
      /** Law 4: pre-generated narration; null only while drafting. */
      audioRef: z.string().nullable(),
      /** Spot illustration at the chapter head; placeholder until art. */
      spotImage: z.string().nullable(),
      /** The reading-age ladder (map rule 3): Ch1 ≈ 8.5 rising to ≈10. */
      readingAgeTarget: z.number().min(7).max(11).default(9),
      status: z.enum(['draft', 'review', 'released']).default('draft'),
      choice: z
        .object({
          id: z.string().min(1),
          prompt: z.string().min(1).max(200),
          options: z.array(z.string().min(1).max(120)).min(2).max(3),
        })
        .optional(),
      /** One optional in-reader interactive beat (map rule 5). */
      clueTap: z
        .object({
          itemId: z.string().min(1),
          /**
           * THE SAME SHAPE AS `storyWrapper`, ONE LEVEL DOWN (David, 2026-08-12) — declared,
           * authored, and read by nothing. It was `z.string().min(1)`, so `wordweb`,
           * `vr-04-closest-meaning` and `banana` were equally legal, and the first chapter to
           * carry one wrote a question-type id into a field named for a family.
           *
           * Constrained rather than dropped, on the same reasoning as `storyWrapper.family`: the
           * value is a real fact about the clue a chapter points at, and a writer choosing a
           * clue by family is the interface the story actually wants. OPTIONAL because only VR
           * has this vocabulary — a Maths or NVR clue-tap has an engine, not a `MechanicFamily`.
           *
           * It is also REDUNDANT: the item's own question type already implies the family. So it
           * is not trusted, it is CHECKED — `pnpm verify:chapters` fetches the item anyway and
           * proves the declaration agrees with `familyForType(item.questionTypeId)`. A field that
           * nothing reads and nothing checks is a field that quietly goes wrong; this one is now
           * checked, and whether it should exist at all is a ruling recorded in
           * docs/pedagogy-decisions.md.
           */
          engineFamily: z.enum(MECHANIC_FAMILIES).optional(),
          prompt: z.string().min(1).max(200),
        })
        .optional(),
      /** Advisory style flags a human dismissed, with the reason logged. */
      styleDismissals: z
        .array(z.object({ flag: z.string().min(1), note: z.string().min(3) }))
        .default([]),
    })
    .refine((chapter) => chapter.status !== 'released' || chapter.audioRef !== null, {
      message: 'Law 4: a chapter cannot be released without audio',
    }),
});
export type ChapterFile = z.infer<typeof chapterFileSchema>;


/**
 * Authoring batch composition (corpus decisions entry 1, extended by the
 * VR-pass ratifications of 2026-08-01): spec default vs PROPOSED vs RATIFIED.
 *
 * `ratified` is the only field Okafor may consume as a decision; `proposed`
 * is a queue entry with a named holder in its status line. A pool may carry
 * neither — the English pool deliberately carries only a status, because the
 * district's spec is unwritten and a number there would be invention.
 */
const tierMixSchema = z
  .object({
    specDefault: z.array(z.number()).length(5),
    proposed: z.array(z.number()).length(5).optional(),
    /** SCP-VR-5: David's ruling; consumable without further approval. */
    ratified: z.array(z.number()).length(5).optional(),
    status: z.string(),
  })
  .refine(
    (mix) => [mix.specDefault, mix.proposed, mix.ratified].every(
      (values) => !values || values.reduce((sum, value) => sum + value, 0) === 100,
    ),
    { message: 'tier mixes must sum to 100' },
  );

/** SCP-VR-6: a type's tier range, constrained to what real papers show. */
const tierEnvelopeSchema = z.object({
  min: z.number().int().min(1).max(5),
  max: z.number().int().min(1).max(5),
  /** The weighted question count behind the row — thin evidence stays visible. */
  weightedQuestions: z.number().int().positive(),
  corpusType: z.string().min(1),
  caveat: z.string().optional(),
}).refine((envelope) => envelope.min <= envelope.max, {
  message: 'an envelope cannot close below where it opens',
});

export const batchMixFileSchema = z.object({
  kind: z.literal('batch-mix'),
  note: z.string(),
  pools: z.record(
    z.object({
      tierMixPct: tierMixSchema.optional(),
      /** Paper-shape findings that are not a tier distribution (e.g. NVR). */
      composition: z.string().optional(),
      status: z.string().optional(),
      singleVsMultiStepPct: z
        .object({ single: z.number(), multi: z.number(), status: z.string() })
        .refine((split) => split.single + split.multi === 100)
        .optional(),
    }),
  ),
  typeTierEnvelopes: z
    .object({
      status: z.string(),
      district: z.enum(['VR', 'NVR', 'MATHS', 'ENGLISH']),
      envelopes: z.record(z.string().regex(/^[a-z0-9-]+$/), tierEnvelopeSchema),
      /** Observed envelopes with no unambiguous registry home — never applied. */
      pendingRegistryMapping: z
        .object({
          note: z.string(),
          rows: z.array(
            z.object({
              corpusType: z.string(),
              observedMin: z.number().int().min(1).max(5),
              observedMax: z.number().int().min(1).max(5),
              weightedQuestions: z.number().int().positive(),
              candidates: z.array(z.string()),
              reason: z.string().optional(),
            }),
          ),
        })
        .optional(),
      discrepancyFlagged: z.string().optional(),
    })
    .optional(),
  unobservedRegistryTypes: z
    .object({ status: z.string(), types: z.array(z.string()) })
    .optional(),
});

export type BatchMixFile = z.infer<typeof batchMixFileSchema>;

/**
 * The envelope a generator or batch must stay inside for a question type.
 * Returns null when the type has no ratified envelope — the caller keeps its
 * existing range rather than inventing a constraint.
 */
export function tierEnvelopeFor(
  file: BatchMixFile,
  questionTypeId: string,
): { min: number; max: number } | null {
  const envelope = file.typeTierEnvelopes?.envelopes[questionTypeId];
  return envelope ? { min: envelope.min, max: envelope.max } : null;
}

/**
 * NVR case shells (BUILD-DISTRICT-NVR §5): 16 slots across the four engines,
 * sequenced simple→compound. Titles, narratives and Mode assets stay in the
 * reviewer pipeline — this file is the engineering plan, exactly as the Maths
 * 36-slot plan is.
 */
export const nvrPlanFileSchema = z.object({
  kind: z.literal('nvr-district-plan'),
  note: z.string(),
  districtName: z.string(),
  slots: z
    .array(
      z.object({
        id: z.string().regex(/^nq-\d{2}$/),
        engine: z.enum(['machine', 'lineup', 'turntable', 'foldingroom']),
        /** Must name a real template id — checked against core by pnpm check:nvr. */
        template: z.string().regex(/^[a-z-]+$/),
        sectionType: z.string().min(1),
        /** SCP-NVR-1/3: may this slot's section type appear in a GL blueprint? */
        glPool: z.boolean(),
        orderInDistrict: z.number().int().min(1),
        cluster: z.string().min(1),
        tierBand: z.tuple([z.number().int().min(1).max(5), z.number().int().min(1).max(5)]),
        scaffoldNote: z.string().optional(),
        trackNote: z.string().optional(),
      }),
    )
    .length(16),
});

/**
 * English case shells (BUILD-DISTRICT-ENGLISH §2): 30 slots across the two
 * tracks. `itemModel` is load-bearing rather than descriptive — the GL track
 * is multiple choice with tagged distractors and the Selective track is the
 * open-response model (SCP-E-9), and a slot belongs to exactly one track
 * because they are, in the spec's words, two subjects wearing one name.
 */
export const englishPlanFileSchema = z.object({
  kind: z.literal('english-district-plan'),
  note: z.string(),
  districtName: z.string(),
  slots: z
    .array(
      z.object({
        id: z.string().regex(/^eq-\d{2}$/),
        track: z.enum(['GL', 'SELECTIVE']),
        strand: z.string().min(1),
        itemModel: z.enum(['MC', 'OPEN']),
        orderInDistrict: z.number().int().min(1),
        cluster: z.string().min(1),
        note: z.string().optional(),
      }),
    )
    .min(28)
    .max(32)
    .superRefine((slots, ctx) => {
      for (const slot of slots) {
        // SCP-E-9/E-10: the item model follows the track, never the author's
        // preference — an MC item on the Selective track would be a question
        // type that track's papers do not contain.
        const expected = slot.track === 'GL' ? 'MC' : 'OPEN';
        if (slot.itemModel !== expected) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${slot.id}: the ${slot.track} track uses the ${expected} item model`,
          });
        }
      }
    }),
});

/**
 * The cross-district exam-technique tree: the things that cost marks
 * regardless of subject knowledge. Nodes are SLOTS — `content: null` means
 * "not authored yet", and the engine treats that as unschedulable, so an
 * unfinished node is invisible to a child rather than half-taught.
 */
export const examTechniqueTreeFileSchema = z.object({
  kind: z.literal('exam-technique-tree'),
  note: z.string(),
  nodes: z
    .array(
      z.object({
        id: z.string().regex(/^tech-[a-z-]+$/),
        title: z.string().min(1).max(60),
        foundational: z.boolean(),
        districts: z.array(z.enum(['VR', 'NVR', 'MATHS', 'ENGLISH'])).min(1),
        teaches: z.string().min(1),
        /** Where the finding came from — citation ids only, never source text. */
        evidence: z.string().min(1),
        relatedMisconceptions: z.array(z.string()),
        content: z.unknown().nullable(),
      }),
    )
    .min(1),
});

/** A technique node may only be scheduled once its content is authored. */
export function isTechniqueNodeBuilt(node: { content: unknown }): boolean {
  return node.content !== null && node.content !== undefined;
}

/** NVR generator tuning (BUILD-DISTRICT-NVR §3 parameters, corpus-calibrated). */
export const nvrGeneratorConfigFileSchema = z.object({
  kind: z.literal('nvr-generator-config'),
  note: z.string(),
  optionCount: z.object({ value: z.number().int(), specDefault: z.number().int(), status: z.string() }),
  densityCaps: z.object({
    status: z.string(),
    maxElementsByTier: z.record(z.number().int().positive()),
    typicalElementsByTier: z.record(z.array(z.number()).length(2)),
    designRule: z.string(),
  }),
  codesScaffold: z.object({
    status: z.string(),
    teachLetterCount: z.number().int(),
    scoreLetterCounts: z.array(z.number().int()),
  }),
  reflectionRole: z.object({ status: z.string(), glStyle: z.string(), cemStyle: z.string() }),
  glSectionPool: z.object({
    status: z.string(),
    sections: z.array(z.string()).length(6),
    codesMandatory: z.literal(true),
    neverInGlBlueprints: z.array(z.string()),
  }),
});

export const contentFileSchema = z.discriminatedUnion('kind', [
  wordFileSchema,
  caseFileSchema,
  regionFileSchema,
  replayTemplatesFileSchema,
  mathsPlanFileSchema,
  chapterFileSchema,
  batchMixFileSchema,
  nvrGeneratorConfigFileSchema,
  nvrPlanFileSchema,
  englishPlanFileSchema,
  examTechniqueTreeFileSchema,
]);
export type ContentFile = z.infer<typeof contentFileSchema>;
