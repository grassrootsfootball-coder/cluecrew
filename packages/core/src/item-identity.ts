/**
 * SUBSTANCE — WHAT MAKES A QUESTION THE SAME QUESTION (Cowork's spec, crossed 2026-08-30).
 *
 * A withdrawal keys on SUBSTANCE and never on ID, in their words: *MC04-FDP-04 appears below and
 * ALSO exists in a variant this notice does not touch. A door keying on the id would refuse the
 * repair along with the fault.*
 *
 * **THE SERIALISATION IS PYTHON'S `json.dumps` DEFAULT AND IT IS THE ODD ONE OUT IN THIS DISTRICT.**
 * Separators `", "` and `": "` — WITH SPACES — where every other digest here uses R729's compact
 * form. That is why sixteen reasonable encodings all missed: the one that works is the one nobody
 * would guess in a codebase whose every other hash is compact. `sort_keys=True`,
 * `ensure_ascii=False` (so `£` is one character, not an escape), then sha256 over UTF-8.
 *
 * Two things their implementation settles that the prose spec did not:
 *   - `key` is a SORTED LIST of every option value where `isKey` is truthy, not a single value;
 *   - `solutionValue` is STRINGIFIED (`str()`), so `20` and `"20"` agree — while `solution` and
 *     `solutionKind` are left as they are.
 *
 * Their source, `item_identity.py::substance`, sha256
 * 19598c4817b1ad64e72eedda2bda1be8baa5301248c4f34d35917714ca1a0dec.
 */

export interface SubstanceItem {
  stem?: unknown;
  solution?: unknown;
  solutionValue?: unknown;
  solutionKind?: unknown;
  options?: ReadonlyArray<{ content?: unknown; value?: unknown; isCorrect?: boolean; isKey?: boolean }>;
}

/** Python's `json.dumps(x, sort_keys=True, ensure_ascii=False)` — defaults, so separators carry spaces. */
export function pythonJsonDumps(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(pythonJsonDumps).join(', ')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}: ${pythonJsonDumps(v)}`).join(', ')}}`;
}

/** Python's `str()` for the values this spec meets. `None` stringifies to the literal "None". */
function pyStr(v: unknown): string {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
  return String(v);
}

const stemOf = (stem: unknown): unknown =>
  stem !== null && typeof stem === 'object' && 'text' in (stem as object) ? (stem as { text: unknown }).text : stem;
const valueOf = (o: { content?: unknown; value?: unknown }): string =>
  String((o.content as { value?: unknown } | undefined)?.value ?? o.value ?? '');
const isKeyOf = (o: { isCorrect?: boolean; isKey?: boolean }) => Boolean(o.isKey ?? o.isCorrect);

/** The six fields, in their implementation's shape. Order, labels and enrichment are deducted. */
export function substance(item: SubstanceItem): Record<string, unknown> {
  const opts = item.options ?? [];
  return {
    stem: stemOf(item.stem) ?? null,
    optionValues: opts.map(valueOf).sort(),
    key: opts.filter(isKeyOf).map(valueOf).sort(),
    solution: item.solution ?? null,
    solutionValue: pyStr(item.solutionValue),
    solutionKind: item.solutionKind ?? null,
  };
}

/** The exact string their digest is taken over. */
export function canonicalSubstance(item: SubstanceItem): string {
  return pythonJsonDumps(substance(item));
}

/**
 * EVERY STRING THIS ITEM COULD HAVE HASHED AS — because `JSON.parse` destroys a distinction Python
 * keeps (R904).
 *
 * `str()` of a Python float retains its point: `20.0` stringifies to `"20.0"`, while JavaScript's
 * `String(20.0)` is `"20"`. Once a JSON file has been parsed here, `20.0` and `20` are the same
 * number and the float-ness is UNRECOVERABLE — three of their worked examples differ from this
 * implementation on exactly that (`"20.0"`, `"1.0"`, `"300.0"`).
 *
 * **This is a two-valued ambiguity with a known cause, not an unknown serialisation**, so it is
 * ENUMERATED rather than guessed: where `solutionValue` is a whole number, both spellings are
 * returned. Guessing one would make the door silently blind to any row whose answer is a round
 * number — a false NEGATIVE, which on a withdrawal door is the dangerous direction.
 */
export function canonicalSubstanceCandidates(item: SubstanceItem): string[] {
  const base = substance(item);
  const sv = item.solutionValue;
  const whole = typeof sv === 'number' && Number.isInteger(sv);
  if (!whole) return [pythonJsonDumps(base)];
  return [
    pythonJsonDumps({ ...base, solutionValue: String(sv) }),
    pythonJsonDumps({ ...base, solutionValue: `${sv}.0` }),
  ];
}
