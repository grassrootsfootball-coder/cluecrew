/**
 * Mock paper blueprints and assembly (ADDENDUM-B §2).
 *
 * Real GL papers vary by region in length, timing and type mix, and they
 * change — so a paper's format is authored CONTENT, not code. A blueprint
 * names its sections, each section names its type mix and minutes, and the
 * assembly below composes strictly to it. Every blueprint's composition,
 * timing and instruction wording must be verified by the specialist reviewer
 * against current familiarisation materials and dated; until then it is a
 * draft, and drafts never reach a real child in production.
 *
 * Instruction pages are authored in GL-neutral wording: style-faithful, never
 * claiming affiliation, never reproducing GL text (L3/L4).
 */
import { z } from 'zod';

/** The marker a draft carries until the specialist reviewer signs it. */
export const PENDING_VERIFICATION = 'PENDING REVIEWER VERIFICATION';

/** One paper per district per 7 days — anti-cram; D-laws apply to parents too (§3). */
export const MOCK_CADENCE_DAYS = 7;

/**
 * Tier distribution centred on T3 (the GL centre of gravity), used when a
 * section does not author its own spread. Weights, not counts — largest
 * remainder turns them into whole questions per section.
 */
export const DEFAULT_TIER_SPREAD: Readonly<Record<number, number>> = {
  1: 0.1,
  2: 0.2,
  3: 0.4,
  4: 0.2,
  5: 0.1,
};

const tierSpreadSchema = z
  .record(z.enum(['1', '2', '3', '4', '5']), z.number().min(0))
  .refine((spread) => Object.values(spread).some((weight) => weight > 0), {
    message: 'a tier spread needs at least one positive weight',
  });

export const blueprintSectionSchema = z
  .object({
    /** The section's instruction page, authored, child-facing, GL-neutral (L3). */
    instructions: z.string().min(20).max(700),
    questionCount: z.number().int().positive(),
    /** questionTypeId → how many questions of that type this section carries. */
    typeMix: z.record(z.string().regex(/^[a-z0-9-]+$/), z.number().int().positive()),
    minutes: z.number().int().positive().max(90),
    /** Authored override of DEFAULT_TIER_SPREAD (§2: "authored spread"). */
    tierSpread: tierSpreadSchema.optional(),
    /**
     * BUILD-DISTRICT-ENGLISH §7: some sections are a per-CYCLE policy of the
     * exam setter, not a fixed property of the format — CSSE's writing
     * allocation is the known case, because one observed cycle carried none.
     * Composition must be TOLD whether this cycle includes the section; it
     * refuses rather than assuming either way, since a paper that quietly
     * grew or lost a section is not the paper the reviewer verified.
     */
    perCyclePolicy: z.boolean().optional(),
    /** Why this section is policy-variable — required when it is. */
    perCyclePolicyNote: z.string().min(10).max(300).optional(),
  })
  .superRefine((section, ctx) => {
    const mixTotal = Object.values(section.typeMix).reduce((sum, count) => sum + count, 0);
    if (mixTotal !== section.questionCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `typeMix sums to ${mixTotal} but questionCount is ${section.questionCount}`,
      });
    }
    if (section.perCyclePolicy && !section.perCyclePolicyNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'a per-cycle-policy section must record WHY it varies by cycle',
      });
    }
  });

export const blueprintSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'blueprint id must be a kebab-case slug'),
  district: z.enum(['VR', 'NVR', 'MATHS', 'ENGLISH']),
  /** Addendum C §1: the Half Boss Case is its OWN authored blueprint — a
   *  representative type spread at half length, never a runtime truncation. */
  variant: z.enum(['full', 'half']).default('full'),
  title: z.string().min(1).max(80),
  sections: z.array(blueprintSectionSchema).min(1),
  notes: z.string().min(1).max(500),
  /** Reviewer name, or PENDING_VERIFICATION while the blueprint is a draft. */
  verifiedBy: z.string().min(1),
  /** ISO date of verification; null exactly while verifiedBy is pending. */
  verifiedAt: z.string().nullable(),
  /** Which familiarisation edition the composition was checked against. */
  sourceRef: z.string().min(1).max(200),
});

export const blueprintFileSchema = z.object({
  kind: z.literal('blueprint'),
  blueprint: blueprintSchema,
});

export type BlueprintSection = z.infer<typeof blueprintSectionSchema>;
export type Blueprint = z.infer<typeof blueprintSchema>;

/** Drafts never reach a real child in production (§2 verification discipline). */
export function isBlueprintVerified(blueprint: Blueprint): boolean {
  return blueprint.verifiedBy !== PENDING_VERIFICATION && blueprint.verifiedAt !== null;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

/**
 * Reads `stem.techniqueKey` the same defensive way `passageNames`/`testedTokens` are read
 * elsewhere (item-content-gate.ts) — a loose JSON field, not a strict schema, matching how every
 * other R23-class declared field on `stem` is handled. One shared function so the DB query that
 * feeds `composeMockPaper` and any future audit script read the SAME field the SAME way.
 */
export function techniqueKeyOf(stem: unknown): string | undefined {
  const value = (stem as { techniqueKey?: unknown } | null | undefined)?.techniqueKey;
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/** What assembly needs to know about an item. Everything else stays behind. */
export interface MockCandidateItem {
  id: string;
  questionTypeId: string;
  tier: number;
  pool: 'PRACTICE' | 'MOCK';
  status: string;
  /**
   * R49 — a whole-text-purpose T4 comprehension item's DEVICE (`stem.techniqueKey`, declared the
   * same way `passageNames`/`testedTokens` are — an author-set string, not derived). SINGLE value,
   * not a set: the two-halved-contrast test (`T4-PURPOSE-BOUNDING-RULE.md` §3) produces exactly one
   * key stated as one contrast per item by construction, and the census names technique CLUSTERS —
   * every item the census describes belongs to exactly one. A set would model a case the corpus
   * gives no evidence for.
   *
   * Absent on every other item shape (locatable-span T4, T1–T3, every non-English district) — those
   * have no recurring device to collide on, so there is nothing to exclude against.
   */
  techniqueKey?: string;
}

export interface ComposedPaper {
  ok: true;
  /** Per blueprint section, in section order: the item ids to serve. */
  sections: Array<{ itemIds: string[] }>;
}

export interface CompositionShortfall {
  sectionIndex: number;
  questionTypeId: string;
  needed: number;
  available: number;
}

/** The clear admin alert the volume-floor monitoring wants (gate #2). */
export interface FailedComposition {
  ok: false;
  shortfalls: CompositionShortfall[];
  /** Per-cycle-policy sections composition was not told about (English §7). */
  undecidedPolicySections?: number[];
}

/** Deterministic small PRNG so a composition is reproducible from its seed. */
function mulberry32(seedString: string): () => number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seedString.length; index++) {
    hash ^= seedString.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Largest-remainder apportionment of `total` questions across tier weights. */
function tierTargets(total: number, spread: Readonly<Record<number, number>>): Map<number, number> {
  const weightSum = Object.values(spread).reduce((sum, weight) => sum + weight, 0);
  const exact = new Map<number, number>();
  for (const [tier, weight] of Object.entries(spread)) {
    exact.set(Number(tier), (total * weight) / weightSum);
  }
  const targets = new Map<number, number>();
  let assigned = 0;
  for (const [tier, value] of exact) {
    const floor = Math.floor(value);
    targets.set(tier, floor);
    assigned += floor;
  }
  const byRemainder = [...exact.entries()].sort(
    (a, b) => (b[1] - Math.floor(b[1])) - (a[1] - Math.floor(a[1])),
  );
  for (let index = 0; assigned < total; index++) {
    const [tier] = byRemainder[index % byRemainder.length]!;
    targets.set(tier, (targets.get(tier) ?? 0) + 1);
    assigned += 1;
  }
  return targets;
}

/**
 * Composes one paper strictly to blueprint: type mix and section order exactly
 * as authored, tier distribution centred on T3 (or the section's authored
 * spread), never an item the child has already seen in a mock (the burn rule,
 * §1), never a PRACTICE item (the same exposure rule, mirrored), never a
 * non-LIVE item.
 *
 * When the pool cannot honour the blueprint the whole composition fails with
 * per-type shortfalls — a paper with quietly substituted content would not be
 * the paper the reviewer verified.
 */
export function composeMockPaper(input: {
  blueprint: Blueprint;
  candidates: MockCandidateItem[];
  burnedItemIds: ReadonlySet<string>;
  /** Vary composition per child/sitting while staying reproducible. */
  seed: string;
  /**
   * Section index → does THIS cycle include it. Required for every section
   * marked perCyclePolicy; composition refuses without it (English §7).
   */
  policySections?: Readonly<Record<number, boolean>>;
}): ComposedPaper | FailedComposition {
  const { blueprint, candidates, burnedItemIds, seed, policySections } = input;
  const random = mulberry32(`${blueprint.id}:${seed}`);

  // Decide the policy sections BEFORE drawing anything: an undecided section
  // is a question about the exam, not something a default should answer.
  const undecidedPolicySections = blueprint.sections
    .map((section, index) => ({ section, index }))
    .filter(({ section, index }) => section.perCyclePolicy && policySections?.[index] === undefined)
    .map(({ index }) => index);
  if (undecidedPolicySections.length > 0) {
    return { ok: false, shortfalls: [], undecidedPolicySections };
  }

  const eligible = candidates.filter(
    (item) => item.pool === 'MOCK' && item.status === 'LIVE' && !burnedItemIds.has(item.id),
  );
  const byType = new Map<string, MockCandidateItem[]>();
  for (const item of eligible) {
    const list = byType.get(item.questionTypeId) ?? [];
    list.push(item);
    byType.set(item.questionTypeId, list);
  }
  // Stable order, then a seeded shuffle per type so two children (or two
  // sittings) draw different papers from the same pool.
  for (const list of byType.values()) {
    list.sort((a, b) => a.id.localeCompare(b.id));
    for (let index = list.length - 1; index > 0; index--) {
      const swap = Math.floor(random() * (index + 1));
      [list[index], list[swap]] = [list[swap]!, list[index]!];
    }
  }

  const shortfalls: CompositionShortfall[] = [];
  const sections: Array<{ itemIds: string[] }> = [];
  const takenThisPaper = new Set<string>();
  // R49 — whole-paper, not per-section: two items sharing a technique must never co-occur even
  // across different sections. Filtered into `available` at the same point as `takenThisPaper`, so
  // the shortfall check below still guarantees the per-tier draw loop always has enough — a
  // technique collision that would starve a slot is reported as a shortfall, the same loud failure
  // as running out of items outright, never a silent same-technique substitution.
  const techniquesThisPaper = new Set<string>();

  blueprint.sections.forEach((section, sectionIndex) => {
    const itemIds: string[] = [];
    if (section.perCyclePolicy && policySections?.[sectionIndex] === false) {
      sections.push({ itemIds });
      return; // this cycle does not carry the section; its slot stays, empty
    }
    for (const [questionTypeId, count] of Object.entries(section.typeMix)) {
      const available = (byType.get(questionTypeId) ?? []).filter(
        (item) =>
          !takenThisPaper.has(item.id) &&
          !(item.techniqueKey && techniquesThisPaper.has(item.techniqueKey)),
      );
      if (available.length < count) {
        shortfalls.push({ sectionIndex, questionTypeId, needed: count, available: available.length });
        continue;
      }
      // Tier targets for this type's share, then nearest-tier when a tier
      // runs dry — the spread is a centre of gravity, not a straitjacket,
      // but the TOTAL count is exact or the composition fails above.
      const spreadRecord = section.tierSpread
        ? Object.fromEntries(Object.entries(section.tierSpread).map(([t, w]) => [Number(t), w]))
        : DEFAULT_TIER_SPREAD;
      const targets = tierTargets(count, spreadRecord);
      const remaining = [...available];
      let addedForThisType = 0;
      for (const [tier, tierCount] of targets) {
        for (let picked = 0; picked < tierCount; picked++) {
          remaining.sort((a, b) => Math.abs(a.tier - tier) - Math.abs(b.tier - tier));
          const item = remaining.shift();
          // R49 — REACHABLE now, unlike the single-constraint version this replaced: the initial
          // `available.length < count` gate no longer guarantees enough picks on its own, because a
          // technique match found WITHIN this same type-mix slot (below) can exhaust `remaining`
          // before every targeted tier is filled. Falls through to the shortfall check after the
          // loop rather than silently serving fewer than the section asked for.
          if (!item) break;
          itemIds.push(item.id);
          takenThisPaper.add(item.id);
          addedForThisType += 1;
          if (item.techniqueKey) {
            techniquesThisPaper.add(item.techniqueKey);
            // A second pick in THIS SAME slot (a section asking for >1 of this type) must not
            // collide either — the outer `available` filter only ran once, before this loop started.
            for (let i = remaining.length - 1; i >= 0; i -= 1) {
              if (remaining[i]!.techniqueKey === item.techniqueKey) remaining.splice(i, 1);
            }
          }
        }
      }
      if (addedForThisType < count) {
        shortfalls.push({ sectionIndex, questionTypeId, needed: count, available: available.length });
      }
    }
    sections.push({ itemIds });
  });

  if (shortfalls.length > 0) return { ok: false, shortfalls };
  return { ok: true, sections };
}

// ---------------------------------------------------------------------------
// The burn rule and the cadence cap
// ---------------------------------------------------------------------------

export interface SittingForBurn {
  status: string; // COMPLETED | ABANDONED | SCHEDULED | IN_PROGRESS
  /** Per-section composition, as stored on MockSitting.servedItemIds. */
  servedSections: Array<{ itemIds: string[] }>;
  /** Per-section timings; a section with a startedAt was opened (seen). */
  sectionTimings: Array<{ startedAt?: string | null }>;
}

/**
 * Which item ids are burned for a child (§1, §3):
 *  - COMPLETED, IN_PROGRESS and SCHEDULED sittings burn every composed item —
 *    in-flight papers hold their items so a concurrent composition cannot
 *    reuse them, and a scheduled paper's items are already promised to it;
 *  - ABANDONED sittings burn only the sections the child actually OPENED.
 *    The kind exit costs the child nothing they haven't seen.
 */
export function burnedItemIds(sittings: SittingForBurn[]): Set<string> {
  const burned = new Set<string>();
  for (const sitting of sittings) {
    if (sitting.status === 'ABANDONED') {
      sitting.servedSections.forEach((section, index) => {
        if (sitting.sectionTimings[index]?.startedAt) {
          for (const id of section.itemIds) burned.add(id);
        }
      });
    } else {
      for (const section of sitting.servedSections) {
        for (const id of section.itemIds) burned.add(id);
      }
    }
  }
  return burned;
}

/**
 * The frequency cap (§3): one full paper per district per 7 days, counted
 * from the most recent sitting in that district that wasn't abandoned or
 * discarded. Returns when the next paper is allowed; a date in the past means
 * "now". Copy-explained in Parent HQ, never silently enforced.
 */
export function nextMockAllowedAt(
  districtSittingDates: Date[],
  now: Date = new Date(),
): Date {
  if (districtSittingDates.length === 0) return now;
  const latest = districtSittingDates.reduce((a, b) => (a > b ? a : b));
  return new Date(latest.getTime() + MOCK_CADENCE_DAYS * 24 * 60 * 60 * 1000);
}
