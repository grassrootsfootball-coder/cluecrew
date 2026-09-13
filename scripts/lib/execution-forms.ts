/**
 * EXECUTION FORMS ARE DECLARED AT THE REGISTER, PER ENTRY FAMILY (Annie's 235th — R1020).
 *
 * **THE TIE-BREAK THIS REPLACES WAS PREVALENCE WEARING A RULE'S NAME.** *"The form the case already
 * speaks"* presupposed one corpus and there are two, in mirror image: on each disk the sibling
 * entries point at that disk's own form, so the same tie-break gives opposite answers depending on
 * where it runs. **Each disk was internally consistent and neither was wrong by its own lights**,
 * which is why no local check could find it — internal consistency is not agreement.
 *
 * **SO THE FORM IS A DECLARATION, NOT A COUNT**, and it is the pins-carry-their-spec rule reaching
 * wording: anything two disks can render differently needs a declared standard both can be checked
 * against, or every comparison between them measures the disks rather than the content.
 *
 * **ONLY WHAT IS RULED IS DECLARED.** `vr02-partial-group` is declared, on her ruling that the
 * authored form stands and nothing about it fails a child-facing or house test. **Every other entry
 * family here is UNDECLARED and says so** — declaring them from what this disk happens to contain
 * would be the withdrawn tie-break, re-run under a new name.
 */

export interface ExecutionForm {
  entryId: string;
  declaredOn: string;
  authority: string;
  /** Builds the declared sentence from the row's own facts. The form IS this function. */
  build: (f: { group: string[]; odd: string[]; oddInSeat: string; memberInSeat: string }) => string;
  /** A worked example, quoted from an authored instance rather than composed. */
  workedExample: { itemId: string; seat: string; text: string };
  provedBy: string;
}

export const DECLARED_FORMS: Record<string, ExecutionForm> = {
  'vr02-partial-group': {
    entryId: 'vr02-partial-group',
    declaredOn: '2026-09-13',
    authority: 'Annie\'s 235th (b612abdc85c448f9): an execution form is declared once at the register per entry family and both disks conform. The AUTHORING form is the authored one and it stands — nothing about it fails a child-facing or house test.',
    build: ({ group, odd, oddInSeat, memberInSeat }) =>
      `The three that go together are ${group.join(', ')}, so the two that do not are ${odd[0]} and ${odd[1]}. `
      + `This option pairs ${oddInSeat}, which is one of the odd ones, with ${memberInSeat}, which belongs to the group — one odd word found and the search stopped there.`,
    workedExample: {
      itemId: 'bank-vr-02-two-odd-ones-out-17', seat: 'oval,triangle',
      text: 'The three that go together are square, triangle, star, so the two that do not are circle and oval. This option pairs oval, which is one of the odd ones, with triangle, which belongs to the group — one odd word found and the search stopped there.',
    },
    provedBy: 'the template was derived from the authoring store\'s ten authored instances and REBUILDS ALL TEN BYTE-EXACT before it was declared. A form declared from a description of a form is a second form.',
  },
};

/** Entry families with executions on this disk that are NOT declared. Named, never inferred. */
export const UNDECLARED_FAMILIES = [
  'vr02-answered-the-opposite', 'vr02-surface-link', 'vr02-real-link-wrong-rule',
] as const;

export const UNDECLARED_NOTE =
  'these carry executions on this disk in forms that were never declared. They are NOT declared here by '
  + 'reading what this disk contains — that is exactly the tie-break her 235th withdrew, which answered '
  + 'differently on each disk because each disk was internally consistent. A form for these is a ruling and '
  + 'is owed; until it lands they are UNCHECKED, which is not the same as conforming.';

/** The facts the declared form is built from, taken from the row itself. */
export function factsFor(words: string[], odd: string[], seat: string) {
  const pair = seat.split(',').map((s) => s.trim());
  return {
    group: words.filter((w) => !odd.includes(w)),
    odd,
    oddInSeat: pair.filter((w) => odd.includes(w))[0] ?? '',
    memberInSeat: pair.filter((w) => !odd.includes(w))[0] ?? '',
  };
}
