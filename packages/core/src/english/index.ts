/**
 * The English district's open-response engine (BUILD-DISTRICT-ENGLISH §3–§4):
 * the item model, the publish gate, and the pure answer matcher. Everything
 * here is deterministic and authored — the database and the app wrap it, and
 * neither may add a string of its own to what a child reads.
 *
 * The GL track keeps the existing multiple-choice model unchanged (§1); this
 * is the Selective track's half of the district.
 */
export * from './text';
export * from './open-response';
export * from './matching';
/** Track assignment (§1) and passage-cluster delivery (§6) — the district's
 *  delivery half: which subject a child is actually sitting, and how the
 *  stimulus and its cluster of items reach them. */
export * from './tracks';
export * from './passages';
/** SPaG generator — English on the maths-family model (David, 2026-08-08): the eleven
 *  rule-driven error franchises as generator families on the shared ladder/range engine. */
export * from './spag-generator';
export * from './spag-families';
/** Vocabulary-in-context — semi-generable from the two-sense vault via the vr04 screen. */
export * from './vocab-in-context';
export * from './vocab-context';
