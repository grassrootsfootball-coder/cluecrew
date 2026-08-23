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

/** The AMENDED ruling (her 112th, units declared at the source) — the table coverage reads against. */
export const CONTENT_AXES_AMENDED_SHA256 =
  'ab8704949d13a5d5f934bfd8a70545d8c877e223b37d71799e76e2b267974a79';

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
  /**
   * **ROW TWENTY, GROWN BY RULING ON THE DOOR'S FIRST UNTABLED ARRIVAL** (her ninety-fourth §2,
   * sha256 35aa8fb5dd66cae53f381bf8dc35982a96da8d0b8634d0b7a122c3660caece33): robbery, theft and
   * pursuit mentioned as premise or setting. Keeps when background only, no violence described,
   * no admiration; refers when depicted, dwelt on or admired; unseen material REFERS like every
   * row. *"An arrival the table could not place became a ruling rather than a drafter's guess,
   * and the table grew by exactly one row with a name and a date on it."* The landing script
   * parses this axis name out of her return's own bytes and asserts it equals this cell — the
   * never-typed discipline at the only moment typing could have crept in.
   */
  'crime-as-background',
  /**
   * **ROW TWENTY-ONE, HER HUNDRED-AND-TWELFTH'S AMENDMENT AT THE SOURCE** (amended ruling document,
   * sha256 ab8704949d13a5d5f934bfd8a70545d8c877e223b37d71799e76e2b267974a79): self-harm, the
   * standalone no-member AXIS — *"nothing keeps; the axis exists so its disposition exists before
   * its first arrival"*; any member refers. Previously it lived only in a prose paragraph under
   * the table — *"a rule in prose under a table is a rule in nobody's parser"* (her finding) — and
   * this store's parse HAD read that paragraph as rows, which is why its seven diverged from the
   * packet's four: three parses of one document that never declared its units.
   */
  'self-harm',
] as const;

/**
 * **NO-MEMBER CASES INSIDE POPULATED ROWS — six, each with its home row** (her hundred-and-twelfth:
 * units declared at the source; the table is the parse source and the paragraph is DERIVED).
 * Self-harm left this list by becoming a row. All REFER; dispositions exist before first arrival.
 */
export const NO_MEMBER_CASES: ReadonlyArray<{ caseName: string; homeRow: string }> = [
  { caseName: 'on-page death', homeRow: 'death-and-dying' },
  { caseName: 'prejudice as the author\'s own voice', homeRow: 'period-attitudes-and-prejudice' },
  { caseName: 'racial or ethnic slurs in source', homeRow: 'period-attitudes-and-prejudice' },
  { caseName: 'sexual content beyond formal public affection', homeRow: 'romance-and-affection' },
  { caseName: 'corporal punishment', homeRow: 'school-authority' },
  { caseName: 'a weapon used against a person', homeRow: 'weapons' },
] as const;

/** @deprecated her hundred-and-twelfth restructured this into a row (self-harm) plus NO_MEMBER_CASES. */
export const NO_MEMBER_ROWS: readonly string[] = NO_MEMBER_CASES.map((c) => c.caseName);

/**
 * THE CANARY (R61): the transcription must hold exactly 19 populated axes and 7 no-member rows, or
 * every caller is blind and must FAIL rather than report a clean corpus.
 */
export function axesTableCanary(): { holds: boolean; detail: string } {
  const holds = CONTENT_AXES.length === 21 && NO_MEMBER_CASES.length === 6;
  return {
    holds,
    detail: `axes table ${CONTENT_AXES.length} rows + ${NO_MEMBER_CASES.length} in-row no-member cases (expected 21+6: her AMENDED ruling ab870494…, units declared at the source — 20 populated + self-harm; six cases each named with its home row)`,
  };
}

/** One name, by her ruling — with her own note that a list of one is a bus factor of one, and a
 *  second name is added by ruling, not by convenience (eighty-fourth return §3). */
export const MAY_JUDGE: readonly string[] = ['Annie'] as const;

/**
 * **THE SCOPE FIELD (her confirmation, landed with the 109th; David's arming ruling, 2026-08-23 —
 * R661).** Each judging seat names WHAT it may judge. The auditory build gate reads this list:
 * enforcement turns on MECHANICALLY the day a seat with scope 'accessibility' lands — machinery
 * that records rather than a hand that hurries, her own safeguard shape. Seats are added BY
 * RULING, with the ruling cited, exactly as names are.
 */
export const MAY_JUDGE_SEATS: ReadonlyArray<{ name: string; scope: string; ruledBy: string }> = [
  { name: 'Annie', scope: 'passage-content', ruledBy: 'passage-content-standard DRAFT-1 §2, signed' },
] as const;

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
  /**
   * **TWO COMPLETION STATES, NOT FOUR (her ninety-sixth §1, replacing her own accretion).** A strike
   * COMPLETES as a SPAN — `{ span, lines }`, minimal per R635 — or DECLARES as `DECLARED(<kind>)`
   * with its kind on the row: absence, item-set, whole-passage-tone. *"The declaration carries its
   * kind for the same reason a match does"* — and the next undeclarable claim adds a KIND, not a
   * state. `PENDING-BYTES`/`SPAN PENDING-BYTES: …` remains the awaiting-passage state, and the
   * retired `ABSENCE-CLAIM-NO-SPAN` is accepted as an alias of DECLARED(absence), reported as
   * awaiting migration, so her ninety-third block form is never refused retroactively.
   */
  strike?: { span: string; lines: number[] } | string;
  /** Conversion provenance (her five rulings): the conversion is HER act, the original judgement
   *  stays UNRECORDED, and the prose travels inside the object as its only provenance. */
  convertedBy?: string;
  convertedAt?: string;
  sourceProse?: string;
  splitNote?: string;
  /**
   * A NOTE IS NOT AN OBLIGATION (her ninety-third §2): prose a legacy flag carried that was RULED a
   * note rather than a condition converts here, with its `movedFrom` recorded inside it — *"a note
   * in an obligation field is an obligation nobody will discharge."*
   */
  note?: string;
  /** Unknown keys pass through (R57). */
  [key: string]: unknown;
}

export interface FlagRefusal {
  code: 'UNKNOWN_AXIS' | 'UNJUDGED_FLAG' | 'CONDITION_MISSING' | 'STRIKE_SPAN_DRIFTED' | 'UNPARSEABLE_FLAG';
  where: string;
  detail: string;
}

/** The declaration kinds her rulings hold. The next undeclarable claim adds a kind BY RULING. */
export const DECLARED_KINDS: readonly string[] = ['absence', 'item-set', 'whole-passage-tone'] as const;

/**
 * A SCREENING RECORD (form ruling eleven, her hundred-and-third §2): **a clean declaration is a
 * screening record, never a flag — a flag needs an element, and this line's whole point is that
 * there is none.** A recorded zero carries what a zero carries: its axes, its scope, its judge.
 * Until this kind existed the corpus could not tell screened-clean from never-screened apart.
 */
export interface ScreeningRecord {
  kind: string;
  axes: string[];
  scope: string;
  declaration: string;
  judgedBy: string;
  [key: string]: unknown;
}

/**
 * **THE COVERAGE STATEMENT — the fourth record kind (Annie's 113th; David's build, 2026-08-23 —
 * R663).** A reading against ALL twenty-one axes at the amended table, by a named judge, dated:
 * it converts every unflagged axis from UNMENTIONED into SCREENED CLEAN BY A NAMED READER. It
 * lands beside contentFlags, contentScreenings and readingSupport — a record kind of its own,
 * never a prose field — and the census counts it apart, the 65-count's boundary discipline.
 *
 * Born attributed: a coverage statement carries a MAY_JUDGE name and a date FROM BIRTH — there is
 * no UNRECORDED coverage, because "read against every axis" is a claim about an act only the
 * actor can make.
 */
export interface CoverageStatement {
  kind: 'coverage-statement';
  /** The digest of the axes table the reading was made against. A stale table is not coverage. */
  axesTableSha256: string;
  axesCount: number;
  judgedBy: string;
  judgedAt: string;
  [key: string]: unknown;
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
  /** Every DECLARED strike, with its kind — the standing run reports declarations BY KIND. */
  declared: Array<{ where: string; kind: string }>;
  /** Screening records (ruling eleven). Validated: kind known, axes tabled, judge named or converted. */
  screenings: ScreeningRecord[];
  /** Coverage statements (the fourth record kind, R663). Born attributed; table digest verified. */
  coverage: CoverageStatement[];
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
  passage: { id?: unknown; contentFlags?: unknown; contentScreenings?: unknown; extract?: unknown; text?: unknown; preamble?: unknown },
  opts: { enforceUse?: boolean } = {},
): FlagReport {
  const id = typeof passage.id === 'string' ? passage.id : '(unnamed passage)';
  const raw = passage.contentFlags;
  const out: FlagReport = { standardFlags: [], legacy: { strings: 0, objects: 0 }, refusals: [], reported: [], declared: [], screenings: [], coverage: [] };
  // ---- Ruling eleven: screening records, validated apart from flags. ----
  const rawScreenings = passage.contentScreenings;
  if (rawScreenings !== undefined && rawScreenings !== null) {
    if (!Array.isArray(rawScreenings)) {
      out.refusals.push({ code: 'UNPARSEABLE_FLAG', where: `${id} contentScreenings`, detail: `contentScreenings is ${typeof rawScreenings}, not an array — refusing the shape, not returning empty` });
    } else {
      rawScreenings.forEach((s, n) => {
        const where = `${id} contentScreenings[${n}]`;
        const o = (s ?? {}) as Record<string, unknown>;
        if (o.kind !== 'screened-clean') {
          out.refusals.push({ code: 'UNPARSEABLE_FLAG', where, detail: `screening kind ${JSON.stringify(o.kind)} — 'screened-clean' is the only ruled kind; a new kind is her ruling, not a write.` });
          return;
        }
        const axes = Array.isArray(o.axes) ? o.axes.filter((a): a is string => typeof a === 'string') : [];
        const untabled = axes.filter((a) => !CONTENT_AXES.includes(a));
        if (axes.length === 0 || untabled.length > 0) {
          out.refusals.push({ code: 'UNKNOWN_AXIS', where, detail: `a recorded zero carries its axes, and ${untabled.length > 0 ? `${untabled.join(', ')} is not in the table` : 'none are named'}.` });
          return;
        }
        const judgedOk = typeof o.judgedBy === 'string' && (MAY_JUDGE.includes(o.judgedBy)
          || (o.judgedBy === 'UNRECORDED' && typeof o.convertedBy === 'string' && MAY_JUDGE.includes(o.convertedBy)));
        if (!judgedOk) {
          out.refusals.push({ code: 'UNJUDGED_FLAG', where, detail: 'a recorded zero carries its judge — a name, or UNRECORDED beside a converting name.' });
          return;
        }
        out.screenings.push(o as unknown as ScreeningRecord);
      });
    }
  }

  // ---- The coverage statement: the fourth record kind (R663). ----
  const rawCoverage = (passage as { contentCoverage?: unknown }).contentCoverage;
  if (rawCoverage !== undefined && rawCoverage !== null) {
    if (!Array.isArray(rawCoverage)) {
      out.refusals.push({ code: 'UNPARSEABLE_FLAG', where: `${id} contentCoverage`, detail: `contentCoverage is ${typeof rawCoverage}, not an array — refusing the shape, not returning empty` });
    } else {
      rawCoverage.forEach((c, n) => {
        const where = `${id} contentCoverage[${n}]`;
        const o = (c ?? {}) as Record<string, unknown>;
        if (o.kind !== 'coverage-statement') {
          out.refusals.push({ code: 'UNPARSEABLE_FLAG', where, detail: `coverage kind ${JSON.stringify(o.kind)} — 'coverage-statement' is the only ruled kind; a new kind is her ruling, not a write.` });
          return;
        }
        if (o.axesTableSha256 !== CONTENT_AXES_AMENDED_SHA256 || o.axesCount !== CONTENT_AXES.length) {
          out.refusals.push({ code: 'UNPARSEABLE_FLAG', where, detail: `coverage reads against table ${JSON.stringify(o.axesTableSha256).slice(0, 20)}…/${String(o.axesCount)} axes — this store's table is ${CONTENT_AXES_AMENDED_SHA256.slice(0, 8)}…/${CONTENT_AXES.length}. A reading against a stale or foreign table is not coverage of THIS table.` });
          return;
        }
        // BORN ATTRIBUTED: no UNRECORDED coverage — "read against every axis" is a claim about an
        // act only the actor can make. A name from MAY_JUDGE and a date, from birth.
        if (typeof o.judgedBy !== 'string' || !MAY_JUDGE.includes(o.judgedBy)) {
          out.refusals.push({ code: 'UNJUDGED_FLAG', where, detail: 'a coverage statement is born attributed: judgedBy carries a MAY_JUDGE name, never UNRECORDED.' });
          return;
        }
        if (typeof o.judgedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.judgedAt)) {
          out.refusals.push({ code: 'UNJUDGED_FLAG', where, detail: 'a coverage statement carries its date (YYYY-MM-DD) from birth.' });
          return;
        }
        out.coverage.push(o as unknown as CoverageStatement);
      });
    }
  }
  if (raw === undefined || raw === null) return out;
  if (!Array.isArray(raw)) {
    // A reader refuses a shape it cannot parse; it never returns empty (R173).
    out.refusals.push({ code: 'UNPARSEABLE_FLAG', where: id, detail: `contentFlags is ${typeof raw}, not an array — refusing the shape, not returning empty` });
    return out;
  }
  /**
   * **THE PASSAGE'S BYTES LIVE UNDER TWO NAMES** — `extract` on the adapted a-stream, `text` on the
   * commissioned b/c-streams — and a reader drinking only from one called every b-stream span
   * drifted while each caller quietly plumbed its own fallback. One reader, one rule: extract,
   * else text. (R598's two-syntaxes lesson, on the byte field itself.)
   */
  const extractRaw = typeof passage.extract === 'string' ? passage.extract
    : typeof passage.text === 'string' ? passage.text : null;
  const extract = extractRaw === null ? null : extractRaw.replace(/\r\n/g, '\n');
  /**
   * **THE PREAMBLE IS PASSAGE BYTES A CHILD SEES**, and Heidi's twelfth conditional is the case: its
   * met-claim ("the preamble names her as Heidi") completes as a span against the PREAMBLE, which is
   * unnumbered — so such a strike carries `field: 'preamble'` as its address where numbered spans
   * carry lines. The verbatim gate accepts either home; a span in neither refuses as before.
   */
  const preamble = typeof passage.preamble === 'string' ? passage.preamble.replace(/\r\n/g, '\n') : null;

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
    /**
     * **A WAIVER IS A WAY A CONDITION WAS DISCHARGED, AND THE FIELD FOR DISCHARGED CONDITIONS IS
     * WHERE IT BELONGS** (her ninety-third §2). `conditionMetBy` opening `WAIVED` discharges the
     * condition at write AND at use — valid only with a date, a MAY_JUDGE name and a reason, and
     * REPORTED in every run so waivers stay visible rather than passing as ordinary discharges.
     */
    const metBy = typeof o.conditionMetBy === 'string' ? o.conditionMetBy : '';
    if (/^WAIVED\b/.test(metBy)) {
      /**
       * Two waiver forms, both hers: the dated form (`WAIVED <date> by <name>: <reason>`, ninety-
       * third) and the CLASS-WAIVER citation (`WAIVED per the <class> ruling, <name>, <ordinal>
       * return: <reason>`, hundred-and-fourth) — the date lives in the cited ruling. Both carry a
       * MAY_JUDGE name and a reason; a waiver with neither refuses as before.
       */
      const dated = /^WAIVED\s+(\d{4}-\d{2}-\d{2})\s+by\s+([A-Za-z][\w-]*)\s*:\s*(\S.*)$/.exec(metBy);
      const classCited = /^WAIVED per the .+ ruling,\s*([A-Za-z][\w-]*),\s*[\w-]+ return\s*:\s*(\S.*)$/.exec(metBy);
      const m = dated ?? (classCited ? [classCited[0], '(cited ruling)', classCited[1], classCited[2]] as unknown as RegExpExecArray : null);
      if (!m || !MAY_JUDGE.includes(m[2] as string)) {
        out.refusals.push({
          code: 'CONDITION_MISSING', where,
          detail: `conditionMetBy opens WAIVED but does not carry a date, a MAY_JUDGE name and a reason ("WAIVED <date> by <name>: <reason>") — a waiver without those is a silent keep with extra steps.`,
        });
        return;
      }
      out.reported.push(`${where}: WAIVED condition — "${String(o.condition ?? '').slice(0, 60)}…" discharged by waiver (${m[1]}, ${m[2]}). Visible every run.`);
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
      // Her hundred-and-third form carries a trailing clause — `DECLARED(absence): the narrator
      // never says. The whole-subject clause is DECLARED(whole-passage-tone)` — the FIRST kind is
      // the strike's state and the rest travels as its note; an anchored $ would have refused the
      // very rows the state was unified for.
      const declared = typeof o.strike === 'string' ? /^DECLARED\(([a-z-]+)\)(?::\s|$)/.exec(o.strike) : null;
      if (declared) {
        const kind = declared[1] as string;
        if (!DECLARED_KINDS.includes(kind)) {
          out.refusals.push({
            code: 'UNPARSEABLE_FLAG', where,
            detail: `DECLARED(${kind}) — "${kind}" is not a declaration kind this standard holds (${DECLARED_KINDS.join(', ')}). A new KIND is her ruling, not a write.`,
          });
          return;
        }
        out.declared.push({ where, kind });
        out.reported.push(`${where}: DECLARED(${kind}) — a load-bearing claim with no minimal span; its kind travels on the row. Reported every run.`);
      } else if (o.strike === 'ABSENCE-CLAIM-NO-SPAN') {
        // Retired alias of DECLARED(absence): honoured, counted with the declarations, and marked.
        out.declared.push({ where, kind: 'absence' });
        out.reported.push(`${where}: ABSENCE-CLAIM-NO-SPAN (retired alias of DECLARED(absence)) — awaiting migration on the row.`);
      } else if (typeof o.strike === 'string' && o.strike.startsWith('ITEM-SET-CLAIM')) {
        /**
         * Pre-unification form from her ninety-fourth (which CROSSED after the ninety-sixth that
         * unified the states): an item-set claim, checked against the passage's ITEMS rather than
         * its bytes. Honoured as DECLARED(item-set) — the kind her unification gave it — and the
         * check-against-items note is the report, because no passage-bytes gate can complete it.
         */
        out.declared.push({ where, kind: 'item-set' });
        out.reported.push(`${where}: ITEM-SET-CLAIM (pre-unification form of DECLARED(item-set)) — checked against the items for the passage, not the passage bytes. Falls due again on any new item.`);
      } else if (typeof o.strike === 'string' && (o.strike.startsWith('PENDING-BYTES') || o.strike.startsWith('SPAN PENDING-BYTES'))) {
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
        const inBytes = span !== null && ((extract !== null && extract.includes(span)) || (preamble !== null && preamble.includes(span)));
        if (!span || !inBytes) {
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

/**
 * **THE SIGNED DEFAULT, CALLABLE (David, 2026-08-23 — R659).** What a passage's judgement record
 * implies for serving, under the standard's own rule that its default for unseen material is
 * REFER: **absence of any judgement record reads as REFER.**
 *
 *   'SERVABLE'    judged (flags, screenings, or legacy rows awaiting conversion), no REFER, no
 *                 unmet condition, no refusal.
 *   'WITHHELD'    judged, and a REFER disposition or an unmet condition stops it.
 *   'UNRECORDED'  NO judgement record at all — never judged is not clean, it is unseen, and the
 *                 standard's forward default applies. Distinct from WITHHELD: withheld means
 *                 judged and stopped; unrecorded means never judged. Neither serves.
 */
export function impliedServingStatus(
  passage: { id?: unknown; contentFlags?: unknown; contentScreenings?: unknown; extract?: unknown; text?: unknown; preamble?: unknown },
): { implied: 'SERVABLE' | 'WITHHELD' | 'UNRECORDED'; reasons: string[] } {
  const r = readContentFlags(passage, { enforceUse: true });
  const reasons: string[] = [];
  for (const f of r.standardFlags) if (f.disposition === 'refer') reasons.push(`flag ${f.axis} carries REFER`);
  for (const x of r.refusals) reasons.push(`${x.code}: ${x.detail.slice(0, 80)}`);
  if (r.standardFlags.length === 0 && r.screenings.length === 0 && r.coverage.length === 0
    && r.legacy.strings + r.legacy.objects === 0) {
    return { implied: 'UNRECORDED', reasons: ['no judgement record under the signed standard — absence reads as REFER'] };
  }
  return { implied: reasons.length === 0 ? 'SERVABLE' : 'WITHHELD', reasons };
}
