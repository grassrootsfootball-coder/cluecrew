/**
 * English track assignment (BUILD-DISTRICT-ENGLISH §1).
 *
 * English is two subjects wearing one name: GL English is 56% SPaG
 * error-spotting, all multiple-choice, ceiling T4; non-GL English is
 * write-in dominant, technique-led, reaches T5, and carries compulsory
 * writing. A child prepared on the wrong one is prepared for the wrong exam,
 * so the track is assigned from the child's Region Registry format tag rather
 * than left to a parent to guess.
 *
 * Two rules hold the honesty line:
 *  - an unknown target defaults to GL WITH Selective available, never to a
 *    silent guess (§1);
 *  - the assignment is always shown to the parent with its reason and the
 *    standing verify-with-the-school caveat, because the registry records
 *    what a region did last year, not what a school will do this year.
 */
import { REGION_CAVEAT, type Region } from '../regions';

export type EnglishTrack = 'GL' | 'SELECTIVE';

export interface TrackAssignment {
  /** The track the programme runs by default. */
  track: EnglishTrack;
  /** Whether the other track's Cases stay reachable (never hidden, §1). */
  alternateAvailable: boolean;
  /** Plain-language reason, parent-facing. No eduspeak, no fear (§6 voice). */
  reason: string;
  /** Verbatim, on every assignment — the registry's standing discipline. */
  caveat: string;
  /** True when we are defaulting rather than reading a known format. */
  isDefault: boolean;
}

/**
 * Format tag → track. `csse` and `school-specific` are the selective family;
 * `set` is the Sutton consortium's own format, which is closer to GL-style
 * multiple choice than to a mark-scheme paper, so it stays on the GL track
 * with Selective available. `mixed` and `unknown` default to GL with the
 * alternate open, per §1.
 */
export function assignEnglishTrack(region: Region | null): TrackAssignment {
  const format = region?.examFormat ?? 'unknown';
  switch (format) {
    case 'csse':
      return {
        track: 'SELECTIVE',
        alternateAvailable: true,
        reason: `${region!.name} uses a CSSE-style paper. Those papers ask your child to write their own answers and mark them against a scheme, so we teach the written-answer track.`,
        caveat: REGION_CAVEAT,
        isDefault: false,
      };
    case 'school-specific':
      return {
        track: 'SELECTIVE',
        alternateAvailable: true,
        reason: `Schools in ${region!.name} set their own English papers. These are usually written-answer papers with a writing task, so we teach the written-answer track.`,
        caveat: REGION_CAVEAT,
        isDefault: false,
      };
    case 'gl-style':
      return {
        track: 'GL',
        alternateAvailable: true,
        reason: `${region!.name} uses a GL-style paper. Those are multiple choice, with a large spelling, punctuation and grammar section, so we teach the multiple-choice track.`,
        caveat: REGION_CAVEAT,
        isDefault: false,
      };
    case 'set':
      return {
        track: 'GL',
        alternateAvailable: true,
        reason: `${region!.name} uses its own multiple-choice format. It is closer to the GL-style paper than to a written-answer paper, so we start there.`,
        caveat: REGION_CAVEAT,
        isDefault: false,
      };
    case 'mixed':
      return {
        track: 'GL',
        alternateAvailable: true,
        reason: `Schools in ${region!.name} use more than one format. We start with the multiple-choice track and keep the written-answer track open, so you can switch once you know the school.`,
        caveat: REGION_CAVEAT,
        isDefault: true,
      };
    default:
      return {
        track: 'GL',
        alternateAvailable: true,
        reason:
          'You have not told us the target school yet. Most areas use a GL-style paper, so we start there and keep the written-answer track open.',
        caveat: REGION_CAVEAT,
        isDefault: true,
      };
  }
}

/** Track ceilings (§1, SCP-E-11): GL formats cannot express a T5 item. */
export const TRACK_TIER_CEILING: Record<EnglishTrack, number> = {
  GL: 4,
  SELECTIVE: 5,
};

/**
 * SCP-E-10: standalone error-spotting is a GL-track format and appears
 * nowhere else. Scoping it here means a Selective-track child is never
 * served a question type their paper does not contain.
 */
export function allowsErrorSpotting(track: EnglishTrack): boolean {
  return track === 'GL';
}

/** SCP-E-9/§1: the open-response model is the Selective track's item model. */
export function allowsOpenResponse(track: EnglishTrack): boolean {
  return track === 'SELECTIVE';
}
