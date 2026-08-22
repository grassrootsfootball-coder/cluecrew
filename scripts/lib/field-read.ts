/**
 * PRINT THE KEYS THAT ARE THERE BEFORE READING THE ONES YOU WANT (Annie, 2026-08-22 — R568).
 *
 * **A null from a renamed field and a null from an empty field are the same value.** `hintCore` was
 * renamed to `itsOwnHint` in a delivery to the person whose every ruling uses the original name. She
 * read all thirty-six rows — not the head, every row — found `hintCore` undefined on each, and
 * correctly concluded the population was thirty-six items with NO hint. It was thirty-six items
 * whose hint was under a different name, in the same object, one line away.
 *
 * **The care was real and it was spent on the wrong axis.** Checking every row tests whether the
 * value is missing SOMEWHERE. It cannot test whether the NAME is right, because the answer is the
 * same on every row — a rename is uniform, so no amount of row-wise thoroughness distinguishes it
 * from an empty field. **The keys present are a different measurement, and it is one line.**
 *
 * This is the R173 family arriving in a delivery rather than a check: the reading was correct, the
 * conclusion followed from it, and the whole thing was wrong one level up. It is also R80's
 * question — *is the thing I am comparing to keeping the same convention as the thing I am
 * measuring?* — asked of a field name instead of a clock.
 *
 * **The refusal is the point.** A name present on ZERO rows is a FAULT, not an empty population:
 * `requirePopulation` guards how many rows there are and cannot see that they are the wrong rows.
 */

export interface FieldReadReport {
  /** Every key that appears on at least one row, with how many rows carry it. */
  keysPresent: Array<{ key: string; onRows: number }>;
  /** Per requested name: rows carrying the key, and of those, how many hold a usable value. */
  requested: Array<{ name: string; onRows: number; nonEmpty: number }>;
}

const isEmpty = (v: unknown) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
  || (Array.isArray(v) && v.length === 0);

/**
 * State the keys, then read the values. Throws when a requested name is on no row at all.
 *
 * `label` names the caller so a failure says which delivery is reading the wrong name.
 * `rows` are the objects about to be read — the ACTUAL objects, never a projection of them, or this
 * measures the projection's keys and reports them as the source's (R57's finding in a reader).
 */
export function readFieldsByName(
  label: string,
  rows: ReadonlyArray<Record<string, unknown> | null | undefined>,
  names: readonly string[],
): FieldReadReport {
  const present = new Map<string, number>();
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    for (const k of Object.keys(r)) present.set(k, (present.get(k) ?? 0) + 1);
  }
  const keysPresent = [...present]
    .map(([key, onRows]) => ({ key, onRows }))
    .sort((a, b) => b.onRows - a.onRows || a.key.localeCompare(b.key));

  const requested = names.map((name) => {
    let onRows = 0;
    let nonEmpty = 0;
    for (const r of rows) {
      if (!r || typeof r !== 'object' || !(name in r)) continue;
      onRows++;
      if (!isEmpty(r[name])) nonEmpty++;
    }
    return { name, onRows, nonEmpty };
  });

  console.log(`\n  KEYS PRESENT across ${rows.length} row(s) — ${label}:`);
  console.log(`      ${keysPresent.map((k) => `${k.key}(${k.onRows})`).join('  ') || '(no keys at all)'}`);
  console.log('  READING BY NAME:');
  for (const r of requested) {
    const verdict = r.onRows === 0
      ? 'NOT A KEY ON ANY ROW'
      : r.nonEmpty === 0
        ? `present on ${r.onRows}, EMPTY on all of them`
        : `present on ${r.onRows}, non-empty on ${r.nonEmpty}`;
    console.log(`      ${r.name}: ${verdict}`);
  }

  const missing = requested.filter((r) => r.onRows === 0).map((r) => r.name);
  if (missing.length > 0) {
    const near = (n: string) => keysPresent
      .filter((k) => k.key.toLowerCase().includes(n.toLowerCase().slice(0, 4)) || n.toLowerCase().includes(k.key.toLowerCase().slice(0, 4)))
      .map((k) => k.key);
    throw new Error(
      `${label} ABORTED — ${missing.length} requested field name(s) appear on NO row: ${missing.join(', ')}.\n`
      + missing.map((m) => `    ${m}: nearest keys present — ${near(m).join(', ') || 'none resemble it'}`).join('\n')
      + '\n  A name on zero rows is not an empty population. It is the WRONG NAME, and reading every\n'
      + '  row of it returns the same null a genuinely empty field returns — which is how thirty-six\n'
      + '  items carrying a hint were reported, after a full row-by-row read, as carrying none.',
    );
  }
  return { keysPresent, requested };
}
