/**
 * WHAT A GATE'S POPULATION IS, AND WHAT AN EMPTY ONE MEANS (annie, 2026-08-12 — R61's guard).
 *
 * Every gate screens some population. The three questions (R60) catch a gate that goes blind by
 * accident — a stale proxy, a wrong scope, an unreported denominator. They do NOT catch a gate
 * named for a population the pipeline never produces, because for that gate an empty run is
 * GENUINELY CORRECT: nothing is wrong, there is simply nothing there, and no canary or printed
 * count can distinguish it from a considered pass. `verify:solutions` and `check:maths-distractors`
 * are the instance — both correctly written, both screening a MATHS item bank that no code path
 * has ever created.
 *
 * So the guard is a DECLARATION, made once and in writing, not a runtime inference:
 *
 *   requirePopulation()  — the DEFAULT. An empty population is a pipeline failure, not a pass.
 *                          Use it unless there is a stated reason the population may be empty.
 *   declareMayBeEmpty()  — the EXCEPTION. The gate says, in writing and with a reason, that an
 *                          empty population is legitimate. The reason is printed on every empty
 *                          run, so a temporary gap cannot quietly become permanent.
 *
 * A gate calling neither has not thought about it, which is the state this closes.
 */

/**
 * Assert that every named population has something in it. Exits 1 naming the empty ones.
 *
 * @param gate        the gate's name, as a reader would recognise it (e.g. "check:line-refs")
 * @param populations what it screened, by name — `{ 'English items': 412, banks: 7 }`
 */
export function requirePopulation(gate: string, populations: Record<string, number>): void {
  const empty = Object.entries(populations).filter(([, size]) => size === 0);
  const described = Object.entries(populations)
    .map(([name, size]) => `${size} ${name}`)
    .join(' · ');
  if (empty.length === 0) {
    console.log(`${gate}: screened ${described}.`);
    return;
  }
  console.error(`${gate} ABORTED — screened ${described}.`);
  console.error(
    `  EMPTY: ${empty.map(([name]) => name).join(', ')}.\n` +
      '  This gate has no declared reason to see an empty population, so an empty one means the\n' +
      '  query, the scope or the pipeline feeding it is broken — not that the content is clean.\n' +
      '  Nothing was screened, so nothing was asserted. If this emptiness is legitimate, say so\n' +
      '  in writing with declareMayBeEmpty() and a reason; do not delete the check.',
  );
  process.exit(1);
}

/**
 * Declare, once and in writing, that this gate's population may legitimately be empty.
 *
 * Prints the reason on every empty run. That is the point: a declared gap stays visible, so
 * "the maths district has no persistence path yet" cannot decay into a green tick nobody reads.
 *
 * @param reason why an empty population is legitimate HERE — not a description of the gate.
 */
export function declareMayBeEmpty(gate: string, population: string, size: number, reason: string): void {
  if (size > 0) {
    console.log(`${gate}: screened ${size} ${population}.`);
    return;
  }
  console.log(
    `${gate}: ${population} is EMPTY, and that is DECLARED LEGITIMATE — not a pass.\n` +
      `  Reason: ${reason}\n` +
      '  This gate asserted nothing on this run. It is reporting the gap, not clearing the content.',
  );
}
