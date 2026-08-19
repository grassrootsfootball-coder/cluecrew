/**
 * WHERE TO LOOK, WHEN THERE IS NO "GO TO LINES" CONTROL — one component, three declared states.
 *
 * **THE ABSENT CONTROL NEEDED A DEFINED STATE** (David's ruling, 2026-08-17 — R175). Once the window
 * highlight moved onto the control (R174), the control became the thing a child taps to find out
 * where to look. On an item that cites no window there is nothing to tap, **and an absent control is
 * indistinguishable from one that failed to load.** A child who has learned the gesture will hunt
 * for it. So the space says something instead of being empty.
 *
 * **THE WORDS LIVE HERE, IN ONE PLACE, BECAUSE THEY ARE RENDERED FROM THREE ENGINES.** Comprehension
 * owns the passage surface; cloze reuses the word-web renderer; error-spot has its own. Three copies
 * of a sentence in three files is the drift this repo has spent a month closing (R42, R55, R57), and
 * a scope note that says different things in different engines would be worse than none.
 *
 * **THE THREE STATES ARE DECLARED, NEVER INFERRED FROM AN ABSENCE** (R61's discipline applied to
 * copy): each engine says which state it is in. A missing prop is a bug, not a fourth silent state.
 */

export type ScopeKind =
  /** A passage is on screen and `lineRefs []` DECLARES the whole of it as the window. */
  | 'whole-passage'
  /** The text under test is on the card itself — no passage region renders at all. */
  | 'on-the-card';

/**
 * ONE LINE SERVES BOTH SPaG FAMILIES, AND IT IS NOT THE SPLIT THE DATA SUGGESTS.
 *
 * By `passageRef` the 34 SpaG items divide 16 / 18 — cloze names a vehicle passage, the two spot
 * families name nothing. **From the child's side that difference does not exist**: a cloze stem
 * carries its own sentence inline (*"…the field had flooded on Thursday, ___ the caretaker…"*) and
 * the vehicle is never rendered. So both are "the sentence is on the card", and the line that
 * separates the copy is WHAT THE CHILD CAN SEE, not what the row declares.
 */
const WORDS: Record<ScopeKind, string> = {
  'whole-passage': 'This one is about the whole story.',
  // Annie's reword, fourth-return rider 2 (2026-08-19): the line is CHILD-FACING, so it does a
  // child's job — it introduces the sentence she is about to read, instead of describing the item.
  'on-the-card': 'Here is the whole sentence.',
};

export function ScopeNote({ kind }: { kind: ScopeKind }) {
  return (
    <span
      className="cc-muted"
      data-testid="scope-note"
      data-scope={kind}
      style={{ fontSize: '0.9rem' }}
    >
      {WORDS[kind]}
    </span>
  );
}
