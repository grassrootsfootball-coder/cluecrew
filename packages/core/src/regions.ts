import { z } from 'zod';

/**
 * Region Registry (BUILD-PHASE-2 §3.3). Source of truth is
 * /content/regions.json — sourced-and-dated, edited via the admin CMS.
 * Exam-board names appear factually only (manifesto L3).
 */

/** Verbatim requirement — renders on EVERY region result. */
export const REGION_CAVEAT =
  'Schools change providers — always confirm with the school for your entry year.';

export const regionSchema = z.object({
  code: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(80),
  /** Factual descriptor, e.g. "GL-style format" — never implies affiliation (L3). */
  examFormat: z.enum(['gl-style', 'csse', 'set', 'school-specific', 'mixed', 'unknown']),
  formatSummary: z.string().min(1).max(300),
  typicalTestMonth: z.string().min(1).max(40),
  subjects: z.array(z.enum(['VR', 'NVR', 'MATHS', 'ENGLISH'])).min(1),
  exampleSchools: z.array(z.string().min(1).max(120)).max(20).default([]),
  notes: z.string().max(500).optional(),
  sourceUrl: z.string().url(),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type Region = z.infer<typeof regionSchema>;

export const regionFileSchema = z.object({
  kind: z.literal('regions'),
  regions: z.array(regionSchema).min(1),
});

/**
 * "Unknown / undecided" is a first-class onboarding answer and defaults to
 * GL-style full coverage across all four districts.
 */
export const UNKNOWN_REGION: Region = {
  code: 'unknown',
  name: 'Not sure yet / other area',
  examFormat: 'unknown',
  formatSummary:
    'No problem — most areas use a GL-style format, so we cover all four subjects fully until you know more.',
  typicalTestMonth: 'Usually September of Year 6',
  subjects: ['VR', 'NVR', 'MATHS', 'ENGLISH'],
  exampleSchools: [],
  sourceUrl: 'https://www.gov.uk/schools-admissions',
  lastVerified: '2026-07-27',
};
