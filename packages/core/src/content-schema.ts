import { z } from 'zod';

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
      walk: modeSchema,
      see: modeSchema,
      hear: modeSchema,
      try: modeSchema,
    }),
    orderInDistrict: z.number().int().positive(),
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

export const contentFileSchema = z.discriminatedUnion('kind', [wordFileSchema, caseFileSchema]);
export type ContentFile = z.infer<typeof contentFileSchema>;
