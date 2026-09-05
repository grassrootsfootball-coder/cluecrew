/**
 * THE LIMIT ON A FREQUENCY SIGNAL, RECORDED BEFORE THE SIGNAL ARRIVES (David's ruling,
 * 2026-08-19 — R281).
 *
 * **NO SOURCE IS INSTALLED AND NOTHING HERE MEASURES ANYTHING YET.** This file exists so that the
 * limit is in the codebase BEFORE the data is, because a limit written after a measurement lands is
 * a caveat nobody reads, and a limit written into the emitter is a sentence every run has to carry.
 *
 * **A FREQUENCY LIST RANKS FORMS, NOT SENSES.** `fair` is common; `fair` meaning *just* is not. On
 * a district built around the two-part sense screen (`vr/vr04.ts`), the signal will be right about
 * most pairs and **confidently wrong about exactly the ones that matter** — the two-sense headwords
 * the screen exists for.
 *
 * **SO A FREQUENCY DIFFERENCE IS A CANDIDATE, NEVER A VERDICT.** Where either word is multi-sense,
 * the pair is UNSETTLED BY FREQUENCY however large the gap. That is not a hedge: it is the same
 * ruling as the bare-card two-part screen, which already says a headword's other senses decide
 * whether an option set is fair.
 */

/** Printed by every check built on a frequency source. Not optional, not summarised. */
export const FREQUENCY_SIGNAL_LIMIT =
  'A frequency list ranks FORMS, not SENSES. A difference here NARROWS THE FIELD; a reviewer '
  + 'settles it. Any pair whose stem or key carries more than one sense is UNSETTLED BY FREQUENCY '
  + 'however large the gap, because the sense under test may be the rare reading of a common word.';

export type FrequencyVerdict =
  /** The gap is large and neither word is multi-sense — worth a reviewer's attention. */
  | 'CANDIDATE'
  /** The gap is small; nothing to look at on this signal alone. */
  | 'NO SIGNAL'
  /** Either word carries more than one sense. The number cannot decide it. */
  | 'UNSETTLED BY FREQUENCY';

export interface FrequencyComparison {
  stem: string;
  key: string;
  /** Zipf difference, key minus stem. Positive means the KEY is commoner. Null when unmeasurable. */
  zipfDelta: number | null;
  stemIsMultiSense: boolean;
  keyIsMultiSense: boolean;
  verdict: FrequencyVerdict;
  /** Always present, always this string. The limit travels with the result. */
  limit: string;
}

/**
 * Classify a pair. **The sense flags outrank the number** — deliberately, and in that order, so a
 * large gap on a two-sense word cannot be read as a strong result.
 *
 * `threshold` is the Zipf difference at which a gap is worth a look. It is not ruled: it belongs to
 * whoever rules the source, and it is a parameter rather than a constant so that it is argued about
 * rather than inherited.
 */
export function classifyFrequencyPair(input: {
  stem: string;
  key: string;
  zipfDelta: number | null;
  stemIsMultiSense: boolean;
  keyIsMultiSense: boolean;
  threshold: number;
}): FrequencyComparison {
  const { stem, key, zipfDelta, stemIsMultiSense, keyIsMultiSense, threshold } = input;
  const verdict: FrequencyVerdict =
    stemIsMultiSense || keyIsMultiSense ? 'UNSETTLED BY FREQUENCY'
    : zipfDelta === null ? 'UNSETTLED BY FREQUENCY'
    : zipfDelta <= -threshold ? 'CANDIDATE'
    : 'NO SIGNAL';
  return { stem, key, zipfDelta, stemIsMultiSense, keyIsMultiSense, verdict, limit: FREQUENCY_SIGNAL_LIMIT };
}

/** The state of the signal itself. Null source is the honest answer today. */
export const FREQUENCY_SOURCE = {
  installed: true,
  candidate: 'SUBTLEX-UK (van Heuven et al. 2014), Zipf scale, British English, 160,022 word types',
  candidateApprovedBy: 'David, 2026-08-19 — approved as the CANDIDATE; the licence is the ruling',
  /**
   * **RETRIEVED AND READ, 2026-08-19: THERE IS NO LICENCE.** Both official surfaces — the Nottingham
   * download page and the Shiny interface — carry no licence type, no copyright statement, no terms
   * of use and no redistribution grant. The single stated condition is CITATION of the 2014 paper.
   *
   * **Absence of a licence is not permission.** Rights are reserved by default, so redistribution
   * inside this repository is not REFUSED — it is UNESTABLISHED, which is a different and more
   * recoverable state, and the difference matters enough to be a field rather than a sentence.
   */
  licenceState: 'UNESTABLISHED — no licence published; citation requested; rights reserved by default',
  licenceRetrievedOn: '2026-08-19',
  corpusFirewallRuling:
    'MADE (David, 2026-08-19): aggregate statistics are not source text — a word and a number echoes nothing. Firewall depth unchanged: the list informs a CHECK on already-authored items and never reaches the generator. Pinned and cited like any artefact, with a digest, a version and a retrieval date. BOUNDARY: it may not be used to select or generate item content. It measures items that already exist.',
  whyNothingIsInstalled:
    'The firewall ruling is made, and the licence is not. Using the data locally and shipping it in a repository are different acts, and only the second needs a grant nobody has published.',
  /**
   * THE LOCAL ROUTE, SET UP AND NOT YET RUN. The file is fetched by a person into
   * `data/frequency/`, which is gitignored to everything but its own README — so the bytes never
   * enter the repository and the redistribution question never arises. The digest is pinned HERE,
   * in committed source, which is the half that can be shared without a licence.
   */
  localPath: 'data/frequency/SUBTLEX-UK.txt.zip',
  expectedDigest: 'e40d83af55eb85e9e2bc0d72e1022b10e47e31ff2086ad2edcc18292d6bd6616' as string | null,
  retrievedOn: '2026-09-05' as string | null,
  fetchedOnDavidsInstruction: '2026-09-05 — "install the source, pin its digest". The bytes stay out of git (data/frequency/.gitignore); only this digest is committed, which is the half that needs no grant.',
  rows: 160024,
  /**
   * **WHICH COLUMN IS THE CUT TAKEN ON, AND WHO CHOSE IT.** The file carries four Zipf columns:
   * the whole corpus, and three subcorpora including CBBC (children's television, roughly the age
   * band this estate teaches). Annie ruled the cut at 3.0 and did not name a column, and the
   * choice changes the answer — a word can clear 3.0 on adult subtitles and not appear in CBBC at
   * all.
   *
   * `LogFreq(Zipf)` is the primary, because "Zipf 3.0" unqualified conventionally means the whole
   * corpus and that is the likeliest reading of an unqualified 3.0. **But the CBBC figure travels
   * beside every verdict** rather than being discarded, so the choice is visible in the output and
   * can be ruled against evidence instead of inherited from this note (R604: a field is a decision
   * if it can be disobeyed; this one can, and the artefact shows what obeying differently costs).
   */
  primaryColumn: 'LogFreq(Zipf)',
  columnChoiceIsNOTRULED: 'Annie ruled the CUT (3.0), not the COLUMN. The primary here is a reading, not a ruling, and every emission carries the CBBC Zipf beside it so the reading can be checked.',
  /**
   * **A LOCAL MEASUREMENT IS NOT A GATE, AND MUST SAY SO IN ITS OWN OUTPUT.** A check that runs on
   * one machine and is absent in CI cannot fail a commit, and this project has spent a month on
   * what an unreadable check is worth. Any emission built on this source declares LOCAL, and
   * declares UNMEASURED — never "no faults" — where the file is absent.
   */
  measurementStatus: 'LOCAL — installed on this machine 2026-09-05 and still NOT A CI GATE: the bytes cannot be committed, so a check built on this is absent in CI and must declare LOCAL in its own output. The licence remains UNESTABLISHED; fetching for local use was never the act that needed a grant.',
} as const;

/** What a check must print when the file is not on the machine. Absence is not a clean result. */
export const FREQUENCY_UNMEASURED =
  'UNMEASURED — the frequency file is not present on this machine. This is NOT a pass and NOT a '
  + 'zero: nothing was compared. See data/frequency/SOURCE.md for the one command that fetches it.';
