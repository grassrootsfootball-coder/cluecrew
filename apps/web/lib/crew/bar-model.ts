/**
 * Bar Model Builder state + the authored model check (BUILD-DISTRICT-MATHS
 * §3). Pure logic, no DOM: the component renders this; tests exercise it.
 *
 * The "does my model match the story?" check is AUTHORED per item — the
 * reference lives on the item's stem, never inferred. Matching is
 * structural: the same bars, the same equal-part splits, the unknown marked
 * where the story leaves a gap. Labels compare by value when the reference
 * fixes one, and order does not matter (two bars telling the same story in
 * a different order still match it).
 */

export interface Bar {
  id: number;
  /** How many equal parts the bar is split into (1 = a whole bar). */
  parts: number;
  /** The labelled value of ONE part, when the child has labelled it. */
  partValue: number | null;
  /** The child marked this bar (or its missing part) as the unknown. */
  unknown: boolean;
}

export interface ReferenceBar {
  parts: number;
  /** When set, the child's part label must equal this value. */
  partValue?: number;
  unknown?: boolean;
}

export interface BarModelState {
  bars: Bar[];
  nextId: number;
}

export function emptyModel(): BarModelState {
  return { bars: [], nextId: 1 };
}

export function addBar(state: BarModelState): BarModelState {
  return {
    bars: [...state.bars, { id: state.nextId, parts: 1, partValue: null, unknown: false }],
    nextId: state.nextId + 1,
  };
}

export function removeBar(state: BarModelState, id: number): BarModelState {
  return { ...state, bars: state.bars.filter((bar) => bar.id !== id) };
}

export function splitBar(state: BarModelState, id: number, delta: 1 | -1): BarModelState {
  return {
    ...state,
    bars: state.bars.map((bar) =>
      bar.id === id ? { ...bar, parts: Math.min(12, Math.max(1, bar.parts + delta)) } : bar,
    ),
  };
}

export function labelBar(state: BarModelState, id: number, partValue: number | null): BarModelState {
  return {
    ...state,
    bars: state.bars.map((bar) => (bar.id === id ? { ...bar, partValue } : bar)),
  };
}

export function toggleUnknown(state: BarModelState, id: number): BarModelState {
  return {
    ...state,
    bars: state.bars.map((bar) => (bar.id === id ? { ...bar, unknown: !bar.unknown } : bar)),
  };
}

export interface ModelVerdict {
  ok: boolean;
  /** In-world, kind, and never the word a scanner would catch. */
  note: string;
}

export function matchesReference(state: BarModelState, reference: ReferenceBar[]): ModelVerdict {
  if (state.bars.length !== reference.length) {
    return {
      ok: false,
      note:
        state.bars.length < reference.length
          ? 'The story has more quantities than your model — what else does it mention?'
          : 'Your model has more bars than the story needs. Which one is doing no work?',
    };
  }
  // Order-insensitive structural match: greedily pair each reference bar
  // with an unused child bar that fits it.
  const used = new Set<number>();
  for (const ref of reference) {
    const match = state.bars.find(
      (bar) =>
        !used.has(bar.id) &&
        bar.parts === ref.parts &&
        (ref.unknown ?? false) === bar.unknown &&
        (ref.partValue === undefined || bar.partValue === ref.partValue),
    );
    if (!match) {
      return {
        ok: false,
        note: 'Close — check the splits and where the mystery part sits, then try the check again.',
      };
    }
    used.add(match.id);
  }
  return { ok: true, note: 'Your model tells the same story as the question. Now use it.' };
}
