/**
 * The open-response answer-matching engine (BUILD-DISTRICT-ENGLISH §3–§4).
 *
 * PURE. DETERMINISTIC. NO MODEL CALLS. Same item + same answer ⇒ same verdict,
 * on any machine, forever. There is no free text generation anywhere in this
 * file, and there cannot be: every child-facing string the engine returns is
 * an `AuthoredText`, which only `asAuthored` can mint and only from strings
 * the author already put on the item.
 *
 * The behaviour that matters most is the one at the bottom of the file:
 * **an answer the engine does not recognise is never marked wrong.** It comes
 * back as `kind: 'compare'`, carrying the authored model answer and the band
 * descriptors, flagged for reviewer sampling so the acceptable set gets
 * better over time (§3, gate #2). "Wrong" is not a verdict this engine can
 * express — there is no code path that produces it and no vocabulary to say
 * it with.
 */
import {
  asAuthored,
  authoredStrings,
  LADDER_RUNGS,
  rungIndex,
  validateForPublish,
  type AcceptableAnswer,
  type AuthoredText,
  type CreditModel,
  type LadderRung,
  type OpenResponseItem,
  type SpagCheckKind,
  type Tolerance,
} from './open-response';
import { allStems, contentStems, longestCommonRun, normalise, overlap, phrasePresent, tokens } from './text';

/* ------------------------------------------------------------------ *
 * Thresholds — the whole of the engine's judgement, in one place
 * ------------------------------------------------------------------ */

export const MATCHING_THRESHOLDS = {
  /**
   * CLOSE_PARAPHRASE: how much of the AUTHORED answer's content the child
   * must cover. 0.6 means a five-idea model answer needs three of its ideas
   * present. Below that it is not the same answer said differently, it is a
   * different answer.
   */
  paraphraseCoverage: 0.6,
  /**
   * CLOSE_PARAPHRASE: a symmetric floor, so coverage cannot be bought with
   * length. At full coverage a Dice of 0.4 allows the child's answer to be
   * up to four times the authored one — generous for a child who writes
   * around the point, closed to an answer that copies the whole paragraph.
   */
  paraphraseDice: 0.4,
  /**
   * Own-words items: a run of this many consecutive passage words is
   * lifting, not phrasing. Six is past coincidence — a child rephrasing
   * cannot accidentally reproduce six words in order — while leaving short
   * unavoidable overlaps ("the old man at the door") alone.
   */
  liftRunTokens: 6,
  /**
   * Evidence items: a run of this many consecutive passage words is a
   * deliberate quotation. Three is short enough that a child who quotes
   * properly is credited, long enough that two shared words are not mistaken
   * for evidence. Paired with the six above: 3–5 words is quoting, 6+ on an
   * own-words item is lifting.
   */
  evidenceRunTokens: 3,
  /** The shortest answer that can be lifted in its entirety. */
  minimumLiftableAnswerTokens: 3,
} as const;

/** Reviewer-log payloads are capped; nobody needs a child's essay to fix a key. */
export const MAX_LOGGED_ANSWER_CHARS = 300;

/* ------------------------------------------------------------------ *
 * Tier matching
 * ------------------------------------------------------------------ */

export interface AnswerMatch {
  matched: boolean;
  tolerance: Tolerance;
  /** How much of the authored answer the child covered — diagnostics only. */
  coverage: number;
  dice: number;
  /** Authored traps this answer tripped. Any hit blocks the match outright. */
  barredHits: string[];
}

/**
 * Matches one acceptable answer at its authored tolerance.
 *
 *  - **EXACT** — normalised string equality. Case, punctuation, whitespace
 *    and contractions are all normalised away first, so "Don't panic." and
 *    "do not panic" are one answer. Nothing else is tolerated.
 *  - **CLOSE_PARAPHRASE** — order-insensitive stem overlap above both
 *    thresholds above, with stopwords removed. Explainable by hand: strike
 *    the little words, stem the rest, count how many of the author's ideas
 *    are there.
 *  - **CONCEPT** — every authored concept set must be satisfied by one of
 *    its authored members. The AUTHOR supplies the vocabulary; the engine
 *    never invents a synonym, never reaches for a thesaurus, and cannot
 *    match a concept the author did not write down.
 *
 * `barredNearMisses` are checked FIRST and win regardless of similarity —
 * they are the authored traps, and a trap that similarity could override
 * would not be a trap.
 */
export function matchAcceptableAnswer(answer: AcceptableAnswer, childAnswer: string): AnswerMatch {
  const childAll = new Set(allStems(childAnswer));
  const authoredContent = contentStems(answer.text);
  const childContent = contentStems(childAnswer);
  const score = overlap(authoredContent, childContent);

  const barredHits = answer.barredNearMisses.filter((barred) => phrasePresent(barred, childAll));
  const base = { tolerance: answer.tolerance, coverage: score.coverage, dice: score.dice, barredHits };
  if (barredHits.length > 0) return { ...base, matched: false };

  switch (answer.tolerance) {
    case 'EXACT':
      return { ...base, matched: normalise(childAnswer) === normalise(answer.text) };
    case 'CLOSE_PARAPHRASE':
      return {
        ...base,
        matched:
          authoredContent.length > 0 &&
          score.coverage >= MATCHING_THRESHOLDS.paraphraseCoverage &&
          score.dice >= MATCHING_THRESHOLDS.paraphraseDice,
      };
    case 'CONCEPT':
      return {
        ...base,
        matched:
          answer.conceptSets.length > 0 &&
          answer.conceptSets.every((set) => set.some((term) => phrasePresent(term, childAll))),
      };
  }
}

/* ------------------------------------------------------------------ *
 * The verdict
 * ------------------------------------------------------------------ */

/**
 * Why an answer earned no credit — structured data, never a sentence. The
 * caller picks the authored voice-pack line for the reason; the engine has
 * no opinion it could phrase.
 */
export type CompareReason =
  | 'blank'
  | 'no-match'
  | 'barred-near-miss'
  | 'lifted-from-passage'
  | 'unsupported-by-evidence';

export interface MatchedPoint {
  pointId: string;
  acceptableAnswerIndex: number;
  tolerance: Tolerance;
  rung: LadderRung | null;
  coverage: number;
  /** Authored feedback for this pattern (§3), verbatim or nothing. */
  feedback: AuthoredText | null;
  misconceptionId: string | null;
}

export interface BandView {
  level: LadderRung;
  descriptor: AuthoredText;
  exampleAnswer: AuthoredText;
}

/**
 * The SPaG rider (gate #9). Scored SEPARATELY and returned as its own field,
 * as structured data with an authored neutral label — never a criticism
 * string. A caller can therefore record the mark and show the child nothing
 * about spelling in the middle of a comprehension, which is precisely what
 * the gate asks for. `checksNotMet` is an enum list for the reviewer and the
 * parent record; it is not copy, and there is no authored string on the item
 * that would let it become copy.
 */
export interface SpagOutcome {
  label: AuthoredText;
  marksAvailable: number;
  marksAwarded: number;
  checksNotMet: SpagCheckKind[];
}

export interface MatchDiagnostics {
  reasons: CompareReason[];
  barredHits: string[];
  lifted: boolean;
  longestPassageRun: number;
  evidencePresent: boolean;
  evidenceCapApplied: boolean;
  bestCoverage: number;
  answerTokenCount: number;
}

export interface OpenResponseVerdict {
  /**
   * `credit` — something authored matched.
   * `compare` — nothing did, so the child gets the model answer and the
   * bands to compare against. There is no third kind, and in particular
   * there is no kind that means the child was wrong.
   */
  kind: 'credit' | 'compare';
  itemId: string;
  creditModel: CreditModel;
  tariff: number;
  /** RECORD ONLY — the mark for the parent report and readiness. Never child-facing. */
  marks: number | null;
  matchedPoints: MatchedPoint[];
  /** Named, never numbered (§4, D-laws). */
  rungReached: LadderRung | null;
  rungBand: BandView | null;
  /** What the next rung adds (§4). */
  nextRung: BandView | null;
  modelAnswer: AuthoredText | null;
  bands: BandView[];
  spag: SpagOutcome | null;
  diagnostics: MatchDiagnostics;
  /** gate #2: unmatched answers are sampled so the acceptable set improves. */
  logForReview: boolean;
}

export interface MarkInputs {
  item: OpenResponseItem;
  /** What the child typed, raw. */
  answer: string;
  /**
   * The passage text, needed when the item carries `ownWordsRequired` or
   * `evidenceCapRule` — both rules are about the child's words against the
   * passage's, so neither can be honoured without it.
   */
  passageText?: string;
}

/**
 * Marks one open-response answer.
 *
 * Throws — loudly, never silently — if the item could not publish, or if a
 * rule the item declares cannot be checked. A gate that degrades quietly is
 * not a gate.
 */
export function markOpenResponse({ item, answer, passageText }: MarkInputs): OpenResponseVerdict {
  const check = validateForPublish(item);
  if (!check.ok) {
    const detail = check.failures.map((failure) => `${failure.field}: ${failure.reason}`).join('; ');
    throw new Error(`item ${item.id} cannot be marked because it cannot publish — ${detail}`);
  }
  const needsPassage = item.ownWordsRequired || item.evidenceCapRule;
  if (needsPassage && (passageText === undefined || passageText.trim() === '')) {
    throw new Error(
      `item ${item.id} declares ownWordsRequired/evidenceCapRule, so the passage text is required to mark it`,
    );
  }

  const pool = authoredStrings(item);
  const answerTokens = tokens(answer);
  const passageTokens = passageText === undefined ? [] : tokens(passageText);
  const longestPassageRun = longestCommonRun(answerTokens, passageTokens);

  // Evidence: a quotation the child chose to make. Either a marked quotation
  // in the raw answer, or a verbatim run of the passage long enough to be
  // deliberate. Computed even when the item does not cap, because the parent
  // record and the reviewer both benefit from knowing.
  const evidencePresent =
    /["“][^"“”]{2,}["”]/.test(answer) || longestPassageRun >= MATCHING_THRESHOLDS.evidenceRunTokens;

  const lifted =
    item.ownWordsRequired &&
    (longestPassageRun >= MATCHING_THRESHOLDS.liftRunTokens ||
      (answerTokens.length >= MATCHING_THRESHOLDS.minimumLiftableAnswerTokens &&
        longestPassageRun === answerTokens.length));

  const bands = item.bands.map((band) => ({
    level: band.level,
    descriptor: asAuthored(pool, band.descriptor),
    exampleAnswer: asAuthored(pool, band.exampleAnswer),
  }));
  const modelAnswer = authoredModelAnswer(item, pool);
  const spag = scoreSpagRider(item, answer, pool);

  const shell = {
    itemId: item.id,
    creditModel: item.creditModel,
    tariff: item.tariff,
    modelAnswer,
    bands,
    spag,
  };

  const compare = (
    reasons: CompareReason[],
    diagnostics: Omit<MatchDiagnostics, 'reasons'>,
    matchedPoints: MatchedPoint[] = [],
  ): OpenResponseVerdict =>
    finish({
      ...shell,
      kind: 'compare',
      marks: item.creditModel === 'POINT' ? 0 : null,
      matchedPoints,
      rungReached: null,
      rungBand: null,
      nextRung: null,
      diagnostics: { ...diagnostics, reasons },
      // Only a genuine failure to recognise the answer teaches us anything.
      // Blank, barred and lifted answers are authored behaviours working as
      // designed — sampling them would be collecting child text for nothing,
      // which S1 does not allow.
      logForReview: reasons.includes('no-match'),
    }, item);

  const baseDiagnostics = {
    barredHits: [] as string[],
    lifted,
    longestPassageRun,
    evidencePresent,
    evidenceCapApplied: false,
    bestCoverage: 0,
    answerTokenCount: answerTokens.length,
  };

  if (answerTokens.length === 0) return compare(['blank'], baseDiagnostics);
  if (lifted) return compare(['lifted-from-passage'], baseDiagnostics);

  const matches = item.acceptableAnswers.map((acceptable) => matchAcceptableAnswer(acceptable, answer));
  const barredHits = [...new Set(matches.flatMap((match) => match.barredHits))];
  const bestCoverage = matches.reduce((best, match) => Math.max(best, match.coverage), 0);
  const diagnostics = { ...baseDiagnostics, barredHits, bestCoverage };

  const matchedPoints: MatchedPoint[] = [];
  item.acceptableAnswers.forEach((acceptable, index) => {
    const match = matches[index];
    if (!match || !match.matched) return;
    matchedPoints.push({
      pointId: acceptable.pointId ?? `#${index}`,
      acceptableAnswerIndex: index,
      tolerance: acceptable.tolerance,
      rung: acceptable.rung ?? null,
      coverage: match.coverage,
      feedback: acceptable.feedback === undefined ? null : asAuthored(pool, acceptable.feedback),
      misconceptionId: acceptable.misconceptionId ?? null,
    });
  });

  if (matchedPoints.length === 0) {
    return compare(barredHits.length > 0 ? ['barred-near-miss'] : ['no-match'], diagnostics);
  }

  const capApplies = item.evidenceCapRule && !evidencePresent;

  if (item.creditModel === 'GRADUATED') {
    return gradedVerdict({ item, shell, matchedPoints, bands, diagnostics, capApplies, compare });
  }
  return pointVerdict({ item, shell, matchedPoints, diagnostics, capApplies, compare });
}

/* ------------------------------------------------------------------ *
 * Credit models
 * ------------------------------------------------------------------ */

type Shell = Pick<OpenResponseVerdict, 'itemId' | 'creditModel' | 'tariff' | 'modelAnswer' | 'bands' | 'spag'>;
type CompareFn = (
  reasons: CompareReason[],
  diagnostics: Omit<MatchDiagnostics, 'reasons'>,
  matchedPoints?: MatchedPoint[],
) => OpenResponseVerdict;

/**
 * POINT credit: one authored point, one credit. Alternative phrasings share a
 * `pointId`, so saying the same thing twice earns it once. The count is
 * capped at `requiredPoints` (the paper's "give two reasons") and the marks
 * are capped at the tariff — a child cannot out-earn the question.
 */
function pointVerdict(args: {
  item: OpenResponseItem;
  shell: Shell;
  matchedPoints: MatchedPoint[];
  diagnostics: Omit<MatchDiagnostics, 'reasons'>;
  capApplies: boolean;
  compare: CompareFn;
}): OpenResponseVerdict {
  const { item, shell, matchedPoints, capApplies, compare } = args;
  const distinct = new Set(matchedPoints.map((point) => point.pointId));
  const pointCap = item.requiredPoints ?? item.tariff;
  const credited = Math.min(distinct.size, pointCap);
  const marksPerPoint = item.requiredPoints
    ? Math.max(1, Math.floor(item.tariff / item.requiredPoints))
    : 1;

  let marks = Math.min(item.tariff, credited * marksPerPoint);
  // The evidence ceiling: a general answer with nothing from the passage
  // behind it cannot take the last mark, however many points it names.
  const evidenceCapApplied = capApplies && marks >= item.tariff;
  if (capApplies) marks = Math.min(marks, item.tariff - 1);

  const diagnostics = { ...args.diagnostics, evidenceCapApplied };
  if (marks <= 0) return compare(['unsupported-by-evidence'], diagnostics, matchedPoints);

  return finish(
    {
      ...shell,
      kind: 'credit',
      marks,
      matchedPoints,
      rungReached: null,
      rungBand: null,
      nextRung: null,
      diagnostics: { ...diagnostics, reasons: [] },
      logForReview: false,
    },
    item,
  );
}

/**
 * GRADUATED credit: the ladder (§4). The child reached the highest rung any
 * matched answer evidences, and the verdict carries that rung's NAME with
 * the authored descriptor for it and for the one above — "which rung they
 * reached and what the next one adds". No number goes near the child.
 *
 * The evidence ceiling here is the top rung itself: you cannot notice a
 * complication in a text you have not pointed at.
 */
function gradedVerdict(args: {
  item: OpenResponseItem;
  shell: Shell;
  matchedPoints: MatchedPoint[];
  bands: BandView[];
  diagnostics: Omit<MatchDiagnostics, 'reasons'>;
  capApplies: boolean;
  compare: CompareFn;
}): OpenResponseVerdict {
  const { item, shell, matchedPoints, bands, capApplies, compare } = args;
  const reached = matchedPoints.reduce<LadderRung | null>((highest, point) => {
    if (point.rung === null) return highest;
    if (highest === null || rungIndex(point.rung) > rungIndex(highest)) return point.rung;
    return highest;
  }, null);

  if (reached === null) return compare(['no-match'], args.diagnostics, matchedPoints);

  const topRung = LADDER_RUNGS[LADDER_RUNGS.length - 1];
  const ceiling = LADDER_RUNGS[LADDER_RUNGS.length - 2];
  const evidenceCapApplied = capApplies && reached === topRung;
  const rungReached = evidenceCapApplied && ceiling !== undefined ? ceiling : reached;

  const rungBand = bands.find((band) => band.level === rungReached) ?? null;
  const nextLevel = LADDER_RUNGS[rungIndex(rungReached) + 1];
  const nextRung = nextLevel === undefined ? null : (bands.find((band) => band.level === nextLevel) ?? null);
  const marks = item.bands.find((band) => band.level === rungReached)?.marks ?? null;

  return finish(
    {
      ...shell,
      kind: 'credit',
      marks,
      matchedPoints,
      rungReached,
      rungBand,
      nextRung,
      diagnostics: { ...args.diagnostics, evidenceCapApplied, reasons: [] },
      logForReview: false,
    },
    item,
  );
}

/* ------------------------------------------------------------------ *
 * The SPaG rider (gate #9)
 * ------------------------------------------------------------------ */

const DEFAULT_SPAG_CHECKS: readonly SpagCheckKind[] = ['CAPITAL_START', 'TERMINAL_PUNCTUATION'];

/**
 * Deterministic and authored, like everything else here. There is no
 * spellchecker: the only spelling rule is the author's own list of spellings
 * they have watched go astray on THIS item, matched exactly. Inventing a
 * dictionary would be inventing a judgement.
 */
function scoreSpagRider(
  item: OpenResponseItem,
  answer: string,
  pool: ReadonlySet<string>,
): SpagOutcome | null {
  if (item.spagRider === undefined || item.spagRiderLabel === undefined) return null;

  const configured = item.spagRiderChecks.length > 0 ? item.spagRiderChecks : [];
  const kinds: SpagCheckKind[] =
    configured.length > 0 ? configured.map((check) => check.kind) : [...DEFAULT_SPAG_CHECKS];
  const trimmed = answer.trim();
  const answerTokens = new Set(tokens(answer));
  const checksNotMet: SpagCheckKind[] = [];

  for (const kind of kinds) {
    if (kind === 'CAPITAL_START' && !/^["“']?[A-Z]/.test(trimmed)) checksNotMet.push('CAPITAL_START');
    if (kind === 'TERMINAL_PUNCTUATION' && !/[.!?]["”']?$/.test(trimmed)) {
      checksNotMet.push('TERMINAL_PUNCTUATION');
    }
    if (kind === 'BARRED_SPELLINGS') {
      const barred = configured
        .filter((check) => check.kind === 'BARRED_SPELLINGS')
        .flatMap((check) => check.barredSpellings);
      if (barred.some((spelling) => answerTokens.has(normalise(spelling)))) {
        checksNotMet.push('BARRED_SPELLINGS');
      }
    }
  }

  return {
    label: asAuthored(pool, item.spagRiderLabel),
    marksAvailable: item.spagRider,
    marksAwarded: checksNotMet.length === 0 ? item.spagRider : 0,
    checksNotMet,
  };
}

/* ------------------------------------------------------------------ *
 * The authored-string guarantee (S3)
 * ------------------------------------------------------------------ */

/** The model answer a `compare` verdict hands back: the top band's example
 *  on a ladder item, the first authored answer otherwise. Always authored,
 *  never assembled. */
function authoredModelAnswer(item: OpenResponseItem, pool: ReadonlySet<string>): AuthoredText | null {
  if (item.creditModel === 'GRADUATED') {
    const top = item.bands.find((band) => band.level === LADDER_RUNGS[LADDER_RUNGS.length - 1]);
    if (top) return asAuthored(pool, top.exampleAnswer);
  }
  const first = item.acceptableAnswers[0];
  return first ? asAuthored(pool, first.text) : null;
}

/** Every child-facing string on a verdict, for the runtime guarantee. */
function childFacingStrings(verdict: OpenResponseVerdict): string[] {
  const strings: string[] = [];
  if (verdict.modelAnswer !== null) strings.push(verdict.modelAnswer);
  for (const point of verdict.matchedPoints) if (point.feedback !== null) strings.push(point.feedback);
  for (const band of [...verdict.bands, verdict.rungBand, verdict.nextRung]) {
    if (band === null) continue;
    strings.push(band.descriptor, band.exampleAnswer);
  }
  if (verdict.spag !== null) strings.push(verdict.spag.label);
  return strings;
}

/**
 * The S3 guarantee, checked rather than asserted. `AuthoredText` already
 * stops the compiler letting a composed string into a child-facing field;
 * this catches the runtime route — a hand-built verdict, a cast, a future
 * refactor that "helpfully" formats something.
 */
export function assertAuthoredVerdict(verdict: OpenResponseVerdict, item: OpenResponseItem): void {
  const pool = authoredStrings(item);
  for (const text of childFacingStrings(verdict)) {
    if (!pool.has(text)) {
      throw new Error(
        `S3 breach on item ${item.id}: the verdict carries text that is not authored on the item — "${text.slice(0, 60)}"`,
      );
    }
  }
}

/** Every exit from `markOpenResponse` passes through here. */
function finish(verdict: OpenResponseVerdict, item: OpenResponseItem): OpenResponseVerdict {
  assertAuthoredVerdict(verdict, item);
  return verdict;
}

/* ------------------------------------------------------------------ *
 * Reviewer sampling (gate #2) — and what we refuse to keep
 * ------------------------------------------------------------------ */

/**
 * What a sampled unmatched answer is allowed to become on disk.
 *
 * There is no `childId`, no `sessionId` and no `attemptId` here, deliberately.
 * The purpose of the log is to improve an item's acceptable-answer set, and
 * that purpose needs the WORDS, never the author of them (S1 minimisation).
 * With no link back to a child, a row is a note about an item.
 *
 * The text stored is NORMALISED and REDACTED, never the raw keystrokes:
 * normalisation drops case and punctuation, and `redactPersonalDetail`
 * removes the shapes of personal detail a child might type into a
 * comprehension box (S5). Residual risk, stated plainly: a first name typed
 * mid-sentence is not detectable by any deterministic rule, which is exactly
 * why the row carries no child link, why it is capped in length, and why it
 * carries a purge date.
 */
export interface UnmatchedAnswerLogEntry {
  itemId: string;
  normalisedAnswer: string;
  tokenCount: number;
  /** Best coverage of any authored answer — how near a miss it was. */
  bestCoverage: number;
  reasons: CompareReason[];
}

/** Digits, emails and postcode shapes go before anything is stored (S5). */
export function redactPersonalDetail(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, ' ')
    .replace(/\b[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}\b/g, ' ')
    .replace(/\d/g, ' ');
}

/**
 * Builds the reviewer-sampling row, or NOTHING. Returning null when the
 * verdict did not ask to be logged is the point: the caller cannot decide to
 * keep a child's words on its own initiative.
 */
export function buildUnmatchedAnswerLog(
  item: OpenResponseItem,
  answer: string,
  verdict: OpenResponseVerdict,
): UnmatchedAnswerLogEntry | null {
  if (!verdict.logForReview) return null;
  return {
    itemId: item.id,
    normalisedAnswer: normalise(redactPersonalDetail(answer)).slice(0, MAX_LOGGED_ANSWER_CHARS),
    tokenCount: verdict.diagnostics.answerTokenCount,
    bestCoverage: Math.round(verdict.diagnostics.bestCoverage * 100) / 100,
    reasons: verdict.diagnostics.reasons,
  };
}
