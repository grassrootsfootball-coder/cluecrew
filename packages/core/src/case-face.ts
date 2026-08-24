/**
 * A CASE'S FACE FAILS CLOSED (David's case-en-06 build instruction, 2026-08-24 — R686).
 *
 * A Case row may exist — items mapped, order assigned, tier set — while its CHILD-FACING FACE
 * (title and narrative intro) is still an empty slot. Such a case DOES NOT APPEAR to any child,
 * regardless of item states: the face renders nothing until an Annie-approved wording lands
 * through the standing path (`scripts/lib/case-face.ts`) with her name and return digest as
 * authority — the NVR-notice pattern (R666), applied to cases.
 *
 * ONE definition of "the face is landed", called by the serve path — never re-derived per site
 * (R57's lesson in predicate form).
 */
export function caseFaceServes(c: { title: string }): boolean {
  return c.title.trim() !== '';
}
