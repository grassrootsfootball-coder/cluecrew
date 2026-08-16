/**
 * How the cited window is named to a child.
 *
 * Lives in `lib` rather than beside the component because it is PURE and therefore testable —
 * `vitest run lib` is the suite, and the component itself needs a browser. This is the part a
 * ruling turns on, so it is the part that gets a test.
 */

/**
 * "29 to 33" for a run, "8" for one, "8, 14, 20" for scattered lines.
 *
 * CHILD-READABLE, NOT NOTATION. Never "29-33": every hint in the bank says "read line 8" in words,
 * and the "go to lines" control is the one piece of furniture that names line numbers to a
 * nine-year-old.
 *
 * An empty list returns an empty string — `lineRefs: []` DECLARES the whole passage as the window
 * (R120), so no line is singled out and no control is offered.
 */
export function shortRange(lines: number[]): string {
  const sorted = [...lines].sort((a, b) => a - b);
  if (sorted.length === 0) return '';
  if (sorted.length === 1) return String(sorted[0]);
  const contiguous = sorted.every((n, i) => i === 0 || n === sorted[i - 1]! + 1);
  return contiguous ? `${sorted[0]} to ${sorted[sorted.length - 1]}` : sorted.join(', ');
}
