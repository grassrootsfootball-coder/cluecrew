/**
 * THE contentFlags READER (Annie's signed standard DRAFT-1 + her CONTENT_AXES ruling; design
 * approved by David, 2026-08-22 — R627/R628).
 *
 * One reader, three callers: the passage import door, `check:content-flags`, and every export that
 * quotes a passage. Two parsers over one format disagree eventually (R429), and the third caller is
 * what makes `keep-conditional` enforceable at USE — a condition can be laid before it is met, and
 * the door that must hold is the one where a child-facing item cites the passage.
 *
 * A reader REFUSES a shape it cannot parse; it never returns empty (R173). It validates every key
 * it knows and passes unknown keys through (R57).
 */

/**
 * HER TABLE, TRANSCRIBED — `annie-content-axes-ruling.md`,
 * sha256 1ef5c77b13359d759295275a3d79e8f95891eddc3794bec77fb3c63e776afab5, signed under
 * passage-content-standard DRAFT-1. The forward default is REFER on every axis and there is no
 * field to express any other, which is how the table constant carries her one governing default.
 */
export const CONTENT_AXES_RULING_SHA256 =
  '1ef5c77b13359d759295275a3d79e8f95891eddc3794bec77fb3c63e776afab5';

export const CONTENT_AXES: readonly string[] = [
  'physical-peril-no-lasting-harm',
  'violence-to-animals',
  'animals-as-food',
  'violence-between-people',
  'death-and-dying',
  'fear-and-the-supernatural',
  'alcohol',
  'weapons',
  'gambling',
  'unkindness-and-mockery',
  'period-attitudes-and-prejudice',
  'religious-reference',
  'family-separation-and-absence',
  'distress-and-crying',
  'deception-by-sympathetic-characters',
  'oaths-and-swearing',
  'romance-and-affection',
  'strangers-and-children',
  'school-authority',
] as const;

/** Rows with no member anywhere, dispositions existing before their first arrival. All REFER. */
export const NO_MEMBER_ROWS: readonly string[] = [
  'on-page death',
  'racial or ethnic slurs in source',
  'prejudice as the author\'s own voice',
  'sexual content beyond formal public affection',
  'self-harm',
  'corporal punishment',
  'a weapon used against a person',
] as const;

/**
 * THE CANARY (R61): the transcription must hold exactly 19 populated axes and 7 no-member rows, or
 * every caller is blind and must FAIL rather than report a clean corpus.
 */
export function axesTableCanary(): { holds: boolean; detail: string } {
  const holds = CONTENT_AXES.length === 19 && NO_MEMBER_ROWS.length === 7;
  return {
    holds,
    detail: `axes table ${CONTENT_AXES.length}+${NO_MEMBER_ROWS.length} (expected 19+7, per her ruling ${CONTENT_AXES_RULING_SHA256.slice(0, 8)}…)`,
  };
}

/** One name, by her ruling — with her own note that a list of one is a bus factor of one, and a
 *  second name is added by ruling, not by convenience (eighty-fourth return §3). */
export const MAY_JUDGE: readonly string[] = ['Annie'] as const;

export interface StandardFlag {
  axis: string;
  element: string;
  severity: 'mild' | 'moderate' | 'strong';
  disposition: 'keep' | 'keep-conditional' | 'cut' | 'refer';
  condition: string | null;
  conditionMetBy: string | null;
  reason: string;
  judgedBy: string;
  judgedAt: string;
  loadBearing?: boolean;
  /**
   * Three states (her ninety-second, §1):
   *   { span, lines }          a presence claim, completed — byte-verbatim at the gate.
   *   'ABSENCE-CLAIM-NO-SPAN'  a load-bearing ABSENCE claim — *no approving comment*, *no violence
   *                            on the page*. The strike test cannot quote a span supporting an
   *                            absence, so it is REPORTED in every run and never refused —
   *                            section 3's honesty clause arriving in section 5: the standard says
   *                            what it cannot check rather than implying coverage.
   *   'PENDING-BYTES'          a presence claim whose passage has not crossed. Valid until the
   *                            passage is present; the verbatim gate completes it at landing;
   *                            refuses only when the passage IS present and the span still pends.
   */
  strike?: { span: string; lines: number[] } | 'ABSENCE-CLAIM-NO-SPAN' | 'PENDING-BYTES';
  /** Conversion provenance (her five rulings): the conversion is HER act, the original judgement
   *  stays UNRECORDED, and the prose travels inside the object as its only provenance. */
  convertedBy?: string;
  convertedAt?: string;
  sourceProse?: string;
  splitNote?: string;
  /** Unknown keys pass through (R57). */
  [key: string]: unknown;
}

export interface FlagRefusal {
  code: 'UNKNOWN_AXIS' | 'UNJUDGED_FLAG' | 'CONDITION_MISSING' | 'STRIKE_SPAN_DRIFTED' | 'UNPARSEABLE_FLAG';
  where: string;
  detail: string;
}

export interface FlagReport {
  /** Flags in the standard's object shape that parsed. */
  standardFlags: StandardFlag[];
  /** LEGACY: pre-standard shapes, counted by shape and NEVER refused — the standard deliberately
   *  does not decide the twenty-six, and this reader does not either. */
  legacy: { strings: number; objects: number };
  refusals: FlagRefusal[];
  /** §5's visible-not-refused class: an assertive reason carrying loadBearing: false. */
  reported: string[];
}

const DISPOSITIONS = new Set(['keep', 'keep-conditional', 'cut', 'refer']);
const SEVERITIES = new Set(['mild', 'moderate', 'strong']);
/** A reason asserting a textual fact — the §5 report trigger. A proxy, named as one. */
const ASSERTIVE = /\b(the (text|narrative|passage|poem) |immediately |makes clear|vindicat|the author)/i;

/**
 * Read one passage's contentFlags. `extract` is the passage text, for the strike gate: the span is
 * compared BYTE-FOR-BYTE after line-ending unification only — normalise where you COMPARE, never
 * where you READ (R570). `enforceUse` adds the §4 use-time refusal (a met-condition check), which
 * belongs to the authoring/export caller and not to the write door.
 */
export function readContentFlags(
  passage: { id?: unknown; contentFlags?: unknown; extract?: unknown },
  opts: { enforceUse?: boolean } = {},
): FlagReport {
  const id = typeof passage.id === 'string' ? passage.id : '(unnamed passage)';
  const raw = passage.contentFlags;
  if (raw === undefined || raw === null) {
    return { standardFlags: [], legacy: { strings: 0, objects: 0 }, refusals: [], reported: [] };
  }
  if (!Array.isArray(raw)) {
    // A reader refuses a shape it cannot parse; it never returns empty (R173).
    return {
      standardFlags: [], legacy: { strings: 0, objects: 0 },
      refusals: [{ code: 'UNPARSEABLE_FLAG', where: id, detail: `contentFlags is ${typeof raw}, not an array — refusing the shape, not returning empty` }],
      reported: [],
    };
  }

  const out: FlagReport = { standardFlags: [], legacy: { strings: 0, objects: 0 }, refusals: [], reported: [] };
  const extract = typeof passage.extract === 'string' ? passage.extract.replace(/\r\n/g, '\n') : null;

  raw.forEach((f, n) => {
    const where = `${id} contentFlags[${n}]`;
    if (typeof f === 'string') { out.legacy.strings++; return; }
    if (!f || typeof f !== 'object') {
      out.refusals.push({ code: 'UNPARSEABLE_FLAG', where, detail: `a ${typeof f} is neither a legacy string nor a flag object` });
      return;
    }
    const o = f as Record<string, unknown>;
    // Pre-standard object shapes (element/reason/recommendation, issue/severity/…) are LEGACY.
    if (typeof o.axis !== 'string') { out.legacy.objects++; return; }

    // ---- §1: the axis must be in her table. A new axis is a ruling, not a write. ----
    if (!CONTENT_AXES.includes(o.axis)) {
      out.refusals.push({
        code: 'UNKNOWN_AXIS', where,
        detail: `axis "${o.axis}" — the standard has no entry for this axis; a new axis is a ruling, not a write. The question goes to the reviewer, not to the drafter's judgement.`,
      });
      return;
    }
    // ---- §2: a name from MAY_JUDGE. A role-word is not a name. ----
    /**
     * **A CONVERTED FLAG'S ORIGINAL JUDGEMENT IS UNRECORDED, AND REFUSING THAT WOULD INVENT
     * PROVENANCE BACKWARDS** (her ninety-second §1). Her rulings: the conversion is HER act; the
     * fields it adds carry `convertedBy: Annie`; *"I am not claiming the original judge assigned
     * this axis. I am assigning it now, under my name."* So `judgedBy: "UNRECORDED"` is accepted
     * exactly when `convertedBy` is a MAY_JUDGE name — the judgement §2 requires is the
     * conversion's, and it is named. UNRECORDED with no named converter refuses as before.
     */
    const judgedOk = typeof o.judgedBy === 'string' && MAY_JUDGE.includes(o.judgedBy);
    const convertedOk = o.judgedBy === 'UNRECORDED'
      && typeof o.convertedBy === 'string' && MAY_JUDGE.includes(o.convertedBy);
    if (!judgedOk && !convertedOk) {
      out.refusals.push({
        code: 'UNJUDGED_FLAG', where,
        detail: `judgedBy is ${JSON.stringify(o.judgedBy ?? null)} — a content judgement carries a NAME from MAY_JUDGE (${MAY_JUDGE.join(', ')}); a role-word refuses identically. (A converted flag may carry judgedBy UNRECORDED only beside a convertedBy from MAY_JUDGE.)`,
      });
      return;
    }
    // ---- §4: the condition is a field. ----
    if (!DISPOSITIONS.has(String(o.disposition))) {
      out.refusals.push({ code: 'UNPARSEABLE_FLAG', where, detail: `disposition ${JSON.stringify(o.disposition)} is not keep | keep-conditional | cut | refer` });
      return;
    }
    if (!SEVERITIES.has(String(o.severity))) {
      out.refusals.push({ code: 'UNPARSEABLE_FLAG', where, detail: `severity ${JSON.stringify(o.severity)} is not mild | moderate | strong` });
      return;
    }
    if (o.disposition === 'keep-conditional' && (o.condition === null || o.condition === undefined || String(o.condition).trim() === '')) {
      out.refusals.push({ code: 'CONDITION_MISSING', where, detail: 'keep-conditional with a null condition refuses at write — a condition that lives nowhere cannot be met.' });
      return;
    }
    if (opts.enforceUse && o.condition && (o.conditionMetBy === null || o.conditionMetBy === undefined || String(o.conditionMetBy).trim() === '')) {
      out.refusals.push({
        code: 'CONDITION_MISSING', where,
        detail: 'condition laid and not met (conditionMetBy is null) — refused AT USE: a condition can be laid before it is met, and the door that holds is the one where a child-facing item cites the passage.',
      });
      return;
    }
    // ---- §5: the strike test, now three states. ----
    if (o.loadBearing === true) {
      if (o.strike === 'ABSENCE-CLAIM-NO-SPAN') {
        // Valid, visible, never refused. An absence claim is load-bearing and unstrikeable.
        out.reported.push(`${where}: ABSENCE-CLAIM-NO-SPAN — a load-bearing absence claim the strike test cannot quote a span for. Reported every run; the standard says what it cannot check.`);
      } else if (o.strike === 'PENDING-BYTES') {
        if (extract !== null) {
          out.refusals.push({
            code: 'STRIKE_SPAN_DRIFTED', where,
            detail: 'strike is PENDING-BYTES but the passage IS present — the verbatim gate completes a pending span at landing, so a span still pending beside its own bytes is a landing that skipped the gate.',
          });
          return;
        }
        out.reported.push(`${where}: PENDING-BYTES — presence claim awaiting its passage; completes at the verbatim gate on landing.`);
      } else {
        const strike = o.strike as { span?: unknown; lines?: unknown } | undefined;
        const span = typeof strike?.span === 'string' ? strike.span.replace(/\r\n/g, '\n') : null;
        if (!span || extract === null || !extract.includes(span)) {
          out.refusals.push({
            code: 'STRIKE_SPAN_DRIFTED', where,
            detail: `loadBearing flag whose strike.span is ${span === null ? 'absent' : 'not verbatim in the passage'} — the disposition rests on the claim, and the claim rests on this span.`,
          });
          return;
        }
      }
    } else if (typeof o.reason === 'string' && ASSERTIVE.test(o.reason)) {
      // Reported every run, never refused: a judgement somebody made, kept visible (§5).
      out.reported.push(`${where}: reason asserts a textual fact and carries loadBearing: false — visible, not refused.`);
    }
    out.standardFlags.push(o as StandardFlag);
  });
  return out;
}
