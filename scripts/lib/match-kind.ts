/**
 * A MATCH CARRIES ITS KIND (Annie, 2026-08-21 — R495).
 *
 * **The scan already knows and does not say.** Every filename matcher in this repo returns a
 * boolean, and a boolean cannot distinguish *this file is imported by a script* from *this file is
 * cited in a register footnote* — **which is the difference between an input and a mention.**
 *
 * **It would have made the seven a ONE on the first run.** R479 reported seven still-read snapshots;
 * R489 cut it to three when I read what read them; R491 cut it to one when I noticed two were our
 * own outbound artefacts. **Three narrowings, all recoverable at match time**, and each was reported
 * as a measurement before it was corrected.
 *
 * **APPLIES TO EVERY MATCHER, NOT JUST THE READER SCAN** — her list of five is five different
 * instruments (an approval, a number, an assert, a match, and now a kind), and the match is the one
 * that is cheap to fix because the information is present at the moment it is discarded.
 */

export type MatchKind =
  | 'IMPORT'          // an import/require statement — the file is a code dependency
  | 'PATH_CONSTANT'   // assigned to a const/variable that a reader will open
  | 'PROSE'           // named in a comment, docstring, or markdown paragraph
  | 'REGISTER'        // cited in docs/authoring-calibration-log.md — a footnote, never a read
  | 'FILENAME_ONLY';  // the string appears with no surrounding code or prose context

export interface ClassifiedMatch {
  kind: MatchKind;
  /** OUTBOUND artefacts are ours; INBOUND arrived from the other store. A direction, not a guess. */
  direction: 'INBOUND' | 'OUTBOUND' | 'LOCAL';
  line: string;
  /** True only for kinds that can cause a read. PROSE and REGISTER never can. */
  isInput: boolean;
}

const OUTBOUND = '/Users/davidb/Downloads/11+/from-cluecrew';
const INBOUND = '/Users/davidb/Downloads';

/** Where the matched path lives — direction is a property of the path, never inferred from the name. */
export function directionOf(matchedPath: string): ClassifiedMatch['direction'] {
  if (matchedPath.includes(OUTBOUND) || matchedPath.includes('content/exports')) return 'OUTBOUND';
  if (matchedPath.includes(INBOUND)) return 'INBOUND';
  return 'LOCAL';
}

/**
 * Classify one match by the LINE it was found on and the FILE it was found in.
 * **A register citation is never an input**, which is the case that produced the seven.
 */
export function classifyMatch(inFile: string, line: string, matchedPath = ''): ClassifiedMatch {
  const direction = directionOf(matchedPath || line);
  const base = { direction, line: line.trim().slice(0, 160) };
  if (/authoring-calibration-log\.md$|corpus-decisions\.md$/.test(inFile)) {
    return { ...base, kind: 'REGISTER', isInput: false };
  }
  if (/\.md$/.test(inFile)) return { ...base, kind: 'PROSE', isInput: false };
  if (/^\s*(?:\/\/|\*|\/\*)/.test(line)) return { ...base, kind: 'PROSE', isInput: false };
  if (/^\s*import\s|require\(/.test(line)) return { ...base, kind: 'IMPORT', isInput: true };
  if (/^\s*(?:const|let|var)\s+\w+\s*(?::[^=]+)?=|:\s*['"`]/.test(line)) {
    return { ...base, kind: 'PATH_CONSTANT', isInput: true };
  }
  return { ...base, kind: 'FILENAME_ONLY', isInput: false };
}

/** Summary line every matcher prints, so a count never ships without its kinds. */
export function describeMatches(matches: readonly ClassifiedMatch[]): string {
  const by = new Map<MatchKind, number>();
  for (const m of matches) by.set(m.kind, (by.get(m.kind) ?? 0) + 1);
  const inputs = matches.filter((m) => m.isInput).length;
  return `${matches.length} match(es) — ${inputs} that can cause a read`
    + ` · ${[...by].map(([k, n]) => `${k} ${n}`).join(' · ')}`;
}
