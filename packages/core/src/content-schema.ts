import { z } from 'zod';
import { regionFileSchema } from './regions';

/**
 * Schemas for authored content in /content (validated in CI, BUILD-PHASE-1 §2).
 * Structural law enforcement:
 *  - P1: every Case ships all five Modes
 *  - D5: narrative intro is ≤30 seconds of reading and skippable
 */

/** ~30 seconds at a comfortable child reading pace. */
export const NARRATIVE_MAX_CHARS = 700;

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
    /**
     * The per-case story skin (STORY BIBLE §4, Law 1): wraps the case, never
     * the items. Open/close lines are authored and scanned; clue-skin labels
     * rename the FRAME's words in Case mode only ("the postmarks"), stems
     * untouched. Absent until S1 authoring lands; ignored while the story
     * flag is off.
     */
    storyWrapper: z
      .object({
        open: z.string().min(1).max(NARRATIVE_MAX_CHARS),
        close: z.string().min(1).max(240),
        clueSkinLabels: z.record(z.string().max(40)).optional(),
        season: z.string().min(1),
        threadTags: z.array(z.string()).default([]),
      })
      .optional(),
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
      season: z.string().min(1),
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
          engineFamily: z.string().min(1),
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
