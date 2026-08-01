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
        ]),
        mechanic: z.enum(['number-forge', 'workshop', 'mark-homework', 'data-desk', 'shape-shop']),
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

export const contentFileSchema = z.discriminatedUnion('kind', [
  wordFileSchema,
  caseFileSchema,
  regionFileSchema,
  replayTemplatesFileSchema,
  mathsPlanFileSchema,
  chapterFileSchema,
]);
export type ContentFile = z.infer<typeof contentFileSchema>;
