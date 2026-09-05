/**
 * A GATE REPORTS ON EVERY RUN INCLUDING ZERO, AND A RUN PRODUCING NO LINE IS ITSELF THE REPORTABLE
 * EVENT (Annie's silence rule; David's ruling, 2026-09-05 — R1007).
 *
 * **THE FIGURE THAT FELL THIS ARC WAS NEVER PRINTED AT ALL.** The subject-matter screen was inert
 * for three turns; the gate found no faults under it, so no line was emitted, and there was nothing
 * to distrust. Every other silence rule in this register is about an empty POPULATION — R60's zero,
 * R61's absent population, R87's silent no-op. **This one is about an empty OUTPUT: the population
 * was there, the instrument ran, and it had nothing to say because it was looking at nothing.**
 *
 * So the report is over the RULES, not over the faults. Every rule the gate can emit gets a line
 * every run, including the zeros — and a rule at zero across the whole corpus is flagged as SILENT,
 * because a rule that has never fired is either enforcing nothing or looking at nothing, and the
 * output cannot tell you which. A silent rule must be DECLARED, with the reason (R61's mechanism,
 * pointed at rules rather than populations).
 */

export interface RuleTally { rule: string; count: number; rows: number; silent: boolean; declared: string | null }

export interface GateSweep {
  rules: RuleTally[];
  screened: number;
  silent: RuleTally[];
  undeclaredSilent: RuleTally[];
}

/**
 * Tally every rule the gate CAN emit against what it DID emit. `allRules` is the closed set from
 * the `ContentFailure` union — passed in, never re-listed here (R57).
 */
export function sweepGate(
  allRules: readonly string[],
  faults: ReadonlyArray<{ rule: string; itemId: string }>,
  screened: number,
  declaredSilent: Record<string, string>,
): GateSweep {
  const byRule = new Map<string, Set<string>>();
  for (const f of faults) byRule.set(f.rule, (byRule.get(f.rule) ?? new Set()).add(f.itemId));
  const rules: RuleTally[] = allRules.map((rule) => {
    const rows = byRule.get(rule)?.size ?? 0;
    const count = faults.filter((f) => f.rule === rule).length;
    return { rule, count, rows, silent: count === 0, declared: declaredSilent[rule] ?? null };
  }).sort((a, b) => b.count - a.count || a.rule.localeCompare(b.rule));
  const silent = rules.filter((r) => r.silent);
  return { rules, screened, silent, undeclaredSilent: silent.filter((r) => !r.declared) };
}

/** Emitted rules the closed set does not know — a rule reaching a reader that nothing declares. */
export function undeclaredRules(allRules: readonly string[], faults: ReadonlyArray<{ rule: string }>): string[] {
  const known = new Set(allRules);
  return [...new Set(faults.map((f) => f.rule))].filter((r) => !known.has(r));
}
