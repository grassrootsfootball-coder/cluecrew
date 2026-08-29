/**
 * **THE SURFACE RENDERS THE ITEM, OR THE ACTION REFUSES AND SAYS WHY** (Annie, 181st — R832).
 *
 * Her reasoning, which is the part that makes this urgent rather than tidy: *"A page that can record
 * a judgement it cannot inform is worse than a page with no control at all. A missing control is
 * visible and gets fixed; a working control over an unrendered item produces signatures
 * indistinguishable from real ones, and nothing downstream can tell them apart afterwards."*
 *
 * **That is the manufacture of attested-but-unread rows, at whatever rate someone clicks** — and it
 * cannot be retrofitted, because once such signatures exist nobody can separate them from the
 * others by inspection. This project has spent weeks removing exactly that state.
 *
 * The admin item page renders `ComprehensionReview` only when the district is ENGLISH. For every
 * other district it shows an id, a status, a type name and a notes box — **so a signature made
 * there would be a signature on nothing.**
 */
export const DISTRICTS_THE_REVIEW_SURFACE_RENDERS = ['ENGLISH'] as const;

export interface SurfaceVerdict { renders: boolean; why: string }

export function reviewSurfaceRenders(district: string | null | undefined): SurfaceVerdict {
  if (district && (DISTRICTS_THE_REVIEW_SURFACE_RENDERS as readonly string[]).includes(district)) {
    return { renders: true, why: `the review surface renders ${district} items in full — passage, stem, options with their keys and tags, execution notes, hint and walk script.` };
  }
  return {
    renders: false,
    why: `the review surface does not render ${district ?? 'this'} items. The page would show an id, a status, a type name and a notes box, so a verdict recorded here would be a verdict on nothing. Her 181st: the surface renders the item, or it refuses the action and says why. Verdicts for this district land in returns against the row hashes of the artefact actually read.`,
  };
}
