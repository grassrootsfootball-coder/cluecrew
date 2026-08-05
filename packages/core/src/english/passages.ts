/**
 * Passage-cluster delivery (BUILD-DISTRICT-ENGLISH §6, SCP-E-2 as
 * strengthened by the v2 pass).
 *
 * The one finding that generalises across every family in the corpus: English
 * comprehension arrives as ONE passage carrying a deep cluster of items, not
 * as many short passages. One exception matters enough to be built for —
 * a Bancroft's-style paper runs TWO clusters over contrasting texts (prose
 * plus a complete poem) in a single reading booklet — so a paper holds a LIST
 * of stimuli, and a single-stimulus paper is just the common case of that.
 *
 * Line numbering is not decoration: real papers reference lines in their
 * stems ("in lines 12–14…"), so lines are numbered at authoring time and the
 * numbers are stable content, never recomputed at render from a viewport.
 *
 * THE FAIRNESS LAW (SCP-E-8, adopted verbatim in §6): passage hard, stems
 * plain. The passage may read at age 10–14 by track; every stem, option and
 * instruction reads at ≤9. We test comprehension, not decoding of our own
 * questions — and `checkPassageStemSplit` is the automated publish gate that
 * holds it.
 */
import { z } from 'zod';

/** §6: the three streams the passage bank needs (SCP-E-12). */
export const passageStreamSchema = z.enum([
  /** Public-domain pre-1950 extracts — the 77% majority. */
  'A_PUBLIC_DOMAIN_PRE1950',
  /** Commissioned contemporary prose. */
  'B_COMMISSIONED_CONTEMPORARY',
  /** Commissioned complete poem — Bancroft's runs a real poetry cluster. */
  'C_COMMISSIONED_POEM',
]);
export type PassageStream = z.infer<typeof passageStreamSchema>;

export const passageSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    stream: passageStreamSchema,
    title: z.string().min(1).max(120),
    /**
     * Provenance is mandatory and is a licensing control, not a nicety:
     * Stream A must name a public-domain source, and B and C must name the
     * commission. An extract with no provenance cannot publish (L4).
     */
    provenance: z.string().min(1).max(300),
    /** Authored scene-setting preamble, child-facing, plain (≤9). */
    preamble: z.string().min(1).max(400),
    /**
     * Numbered lines, authored. The index in this array IS the line number
     * minus one; stems reference these numbers, so re-flowing text at render
     * would silently break every line reference in the cluster.
     */
    lines: z.array(z.string()).min(1),
    /** Authored reading-age band of the PASSAGE (10–14 by track, §6). */
    readingAge: z.number().min(8).max(16),
    /** Poetry needs its own render path; prose must not be centred, etc. */
    form: z.enum(['prose', 'poem']),
  })
  .superRefine((passage, ctx) => {
    if (passage.stream === 'C_COMMISSIONED_POEM' && passage.form !== 'poem') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'the poem stream must carry form: poem' });
    }
  });

export type Passage = z.infer<typeof passageSchema>;

/**
 * One cluster: a stimulus plus the items that interrogate it. A paper's
 * clusters are ordered; a dual-cluster paper (prose + poem) is two entries.
 */
export const clusterSchema = z.object({
  passageId: z.string().regex(/^[a-z0-9-]+$/),
  /** Item ids in presentation order — composition is authored, not inferred. */
  itemIds: z.array(z.string()).min(1),
  /** Shown once above the cluster; child-facing, plain (≤9). */
  instructions: z.string().min(10).max(400),
});

export const clusterSetSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    /** ≥1 stimulus: a dual-cluster paper is the reason this is a list. */
    clusters: z.array(clusterSchema).min(1),
  })
  .superRefine((set, ctx) => {
    const seen = new Set<string>();
    for (const cluster of set.clusters) {
      for (const itemId of cluster.itemIds) {
        if (seen.has(itemId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `item ${itemId} appears in two clusters of the same set`,
          });
        }
        seen.add(itemId);
      }
    }
  });

export type Cluster = z.infer<typeof clusterSchema>;
export type ClusterSet = z.infer<typeof clusterSetSchema>;

export const passageFileSchema = z.object({
  kind: z.literal('english-passage'),
  passage: passageSchema,
});

// ---------------------------------------------------------------------------
// The passage-quote carve-out (manifesto v1.5, David's ratified correction)
// ---------------------------------------------------------------------------

/**
 * A span of text QUOTED from a curated passage.
 *
 * The banned-vocabulary scan exists to police OUR voice — stems, options,
 * hints, Walk scripts, UI, emails. A pre-1950 literary extract is not our
 * voice: it will contain "wrong", "failed", "poor" and worse, and rewriting
 * it would be both a falsification of the source and a fairness problem,
 * because the real papers quote it unaltered.
 *
 * So a quoted span is exempt — but ONLY a genuinely quoted one. The exemption
 * is deliberately expensive to claim: the span must name a `passageRef` that
 * resolves to a real passage in the bank, which means an author cannot use
 * `passageQuote` to smuggle their own sentence past the scan without also
 * putting that sentence in a curated, reviewed passage first.
 *
 * The exemption covers the QUOTED SPAN and nothing else. A stem that discusses
 * the quote is our wording and stays fully in scope.
 */
export const passageQuoteSchema = z.object({
  /** The quoted words, verbatim from the passage. */
  text: z.string().min(1).max(1000),
  /** Literal true — the field is the claim, so it must be stated. */
  passageQuote: z.literal(true),
  /** Must resolve to a real passage (checked by validatePassageQuote). */
  passageRef: z.string().min(1).max(120),
  /** Canonical shape: integer line numbers, never a {from,to} range. */
  lineRefs: z.array(z.number().int().positive()).default([]),
});

export type PassageQuote = z.infer<typeof passageQuoteSchema>;

export interface QuoteFailure {
  where: string;
  detail: string;
}

/**
 * Validates a claimed exemption. `knownPassageIds` is the passage bank; an
 * empty bank means nothing can claim the exemption yet, which is the correct
 * behaviour rather than an inconvenience — the carve-out is only safe once
 * there is something real to quote from.
 */
export function validatePassageQuote(
  quote: PassageQuote,
  knownPassageIds: ReadonlySet<string>,
  where = 'quote',
): QuoteFailure[] {
  const failures: QuoteFailure[] = [];
  if (!knownPassageIds.has(quote.passageRef)) {
    failures.push({
      where,
      detail: `passageQuote names passageRef "${quote.passageRef}", which is not a passage in the bank — the exemption needs a real source`,
    });
  }
  return failures;
}

/**
 * Does the quoted span actually appear in the passage it cites? A quote that
 * does not is either a mis-citation or an author's own sentence wearing the
 * exemption; either way the scan should keep looking at it.
 */
export function quoteMatchesPassage(quote: PassageQuote, passage: Passage): boolean {
  const normalise = (text: string): string =>
    text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const haystack = normalise(passage.lines.join(' '));
  return haystack.includes(normalise(quote.text));
}

/** A stem's line reference, resolved against the passage it belongs to. */
export function resolveLineRefs(passage: Passage, lineRefs: number[]): string[] {
  return lineRefs
    .filter((line) => line >= 1 && line <= passage.lines.length)
    .map((line) => passage.lines[line - 1]!);
}

/** Every line reference must exist — a stem pointing past the passage is a
 *  question no child can answer, and it must never reach one. */
export function invalidLineRefs(passage: Passage, lineRefs: number[]): number[] {
  return lineRefs.filter((line) => line < 1 || line > passage.lines.length);
}

// ---------------------------------------------------------------------------
// The passage-hard / stems-plain publish gate (§6, gate #8)
// ---------------------------------------------------------------------------

/** Matches the repo's reading-age lint: short sentences, few long words. */
const MAX_STEM_SENTENCE_WORDS = 16;
const MAX_STEM_LONG_WORDS = 1;

function syllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length <= 3) return 1;
  const matches = cleaned.replace(/e$/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 1);
}

export interface ReadabilityFailure {
  where: string;
  detail: string;
}

/**
 * The plain-side check, applied to every stem, option and instruction. This
 * is deliberately the SAME rule the repo's reading-age lint uses, so a stem
 * cannot pass here and fail there.
 */
export function checkPlainText(label: string, text: string): ReadabilityFailure[] {
  const failures: ReadabilityFailure[] = [];
  for (const sentence of text.split(/[.!?]/).map((part) => part.trim()).filter(Boolean)) {
    const words = sentence.split(/\s+/).filter(Boolean);
    if (words.length > MAX_STEM_SENTENCE_WORDS) {
      failures.push({
        where: label,
        detail: `sentence runs to ${words.length} words (max ${MAX_STEM_SENTENCE_WORDS})`,
      });
    }
  }
  const longWords = text
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => syllables(word) >= 4);
  if (longWords.length > MAX_STEM_LONG_WORDS) {
    failures.push({
      where: label,
      detail: `${longWords.length} long words (max ${MAX_STEM_LONG_WORDS}): ${longWords.join(', ')}`,
    });
  }
  return failures;
}

/**
 * The publish gate (gate #8): the passage sits in its track's band, and every
 * piece of OUR wording around it reads plain. Returns every failure rather
 * than the first, so an author fixes a cluster in one pass.
 */
export function checkPassageStemSplit(input: {
  passage: Passage;
  /** Track band for the passage itself: GL 10–12, Selective up to 14 (§6). */
  passageBand: { min: number; max: number };
  instructions: string[];
  stems: Array<{ id: string; text: string; optionTexts?: string[] }>;
}): ReadabilityFailure[] {
  const { passage, passageBand, instructions, stems } = input;
  const failures: ReadabilityFailure[] = [];

  if (passage.readingAge < passageBand.min || passage.readingAge > passageBand.max) {
    failures.push({
      where: `passage:${passage.id}`,
      detail: `reading age ${passage.readingAge} is outside this track's band ${passageBand.min}–${passageBand.max}`,
    });
  }
  // The preamble is OUR wording, so it obeys the plain side, not the passage's.
  failures.push(...checkPlainText(`passage:${passage.id} preamble`, passage.preamble));
  instructions.forEach((text, index) => {
    failures.push(...checkPlainText(`instructions[${index}]`, text));
  });
  for (const stem of stems) {
    failures.push(...checkPlainText(`stem:${stem.id}`, stem.text));
    (stem.optionTexts ?? []).forEach((option, index) => {
      failures.push(...checkPlainText(`stem:${stem.id} option[${index}]`, option));
    });
  }
  return failures;
}

/** §6 bands by track — Selective (CSSE) carries the corpus's hardest passages. */
export const PASSAGE_BANDS = {
  GL: { min: 10, max: 12 },
  SELECTIVE: { min: 10, max: 14 },
} as const;

// ---------------------------------------------------------------------------
// GL comprehension cluster shape (David's ratified corrections, 2026-08-02)
// ---------------------------------------------------------------------------

/**
 * A GL comprehension cluster runs 23–25 items. Ratified 2026-08-02, narrowing
 * the spec's 23–28.
 */
export const GL_CLUSTER_MIN_ITEMS = 23;
export const GL_CLUSTER_MAX_ITEMS = 25;

/**
 * Every GL comprehension cluster carries 2–4 word-class items embedded
 * mid-run — a corpus finding: real papers put grammar questions INSIDE the
 * comprehension block rather than only in the cloze section, so a child who
 * has only met word-class work in a grammar section meets it somewhere
 * unfamiliar on the day.
 */
export const GL_CLUSTER_MIN_WORD_CLASS = 2;
export const GL_CLUSTER_MAX_WORD_CLASS = 4;

/**
 * "Mid-run" is load-bearing, not decorative: a word-class item first or last
 * in the cluster reads as its own little section, which is precisely the
 * separation the finding says real papers avoid. So neither end counts.
 */
export function isMidRun(index: number, total: number): boolean {
  return index > 0 && index < total - 1;
}

export interface ClusterItemRef {
  id: string;
  /** True when this item tests word class by the job a word does. */
  wordClass?: boolean;
}

/**
 * Publish validation for a GL comprehension cluster. Returns every failure
 * rather than the first, so an author fixes a cluster in one pass.
 */
export function checkGlComprehensionCluster(input: {
  clusterId: string;
  items: ClusterItemRef[];
}): ReadabilityFailure[] {
  const { clusterId, items } = input;
  const failures: ReadabilityFailure[] = [];
  const total = items.length;

  if (total < GL_CLUSTER_MIN_ITEMS || total > GL_CLUSTER_MAX_ITEMS) {
    failures.push({
      where: `cluster:${clusterId}`,
      detail: `holds ${total} items; a GL comprehension cluster runs ${GL_CLUSTER_MIN_ITEMS}–${GL_CLUSTER_MAX_ITEMS}`,
    });
  }

  const wordClassPositions = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.wordClass === true);

  if (
    wordClassPositions.length < GL_CLUSTER_MIN_WORD_CLASS ||
    wordClassPositions.length > GL_CLUSTER_MAX_WORD_CLASS
  ) {
    failures.push({
      where: `cluster:${clusterId}`,
      detail: `carries ${wordClassPositions.length} word-class items; every GL comprehension cluster needs ${GL_CLUSTER_MIN_WORD_CLASS}–${GL_CLUSTER_MAX_WORD_CLASS} embedded in it`,
    });
  }

  for (const { item, index } of wordClassPositions) {
    if (!isMidRun(index, total)) {
      failures.push({
        where: `cluster:${clusterId}`,
        detail: `word-class item ${item.id} sits at position ${index + 1} of ${total}; these are embedded mid-run, never at either end`,
      });
    }
  }

  return failures;
}
