/**
 * A SUPERSEDED VALUE LIVES OUTSIDE THE FIELD IT SUPERSEDES (R358, carried out in R1042).
 *
 * `_previousText` inside `stem`, `_previousWalkScript` inside `explanation`, `_previousValue` inside
 * an option's `content`: anything that walks the container reads the old value as live. The ruled
 * shape is Cowork's — the history goes in a `_superseded` SIBLING of the field. Here that sibling is
 * the `superseded` column on `Item` and `ItemOption`.
 *
 * ONE IMPLEMENTATION for the finder, the lift and the restore, so the migration that moves values and
 * the check that fails on new ones cannot disagree about what counts as one (R429, R57).
 *
 * The rule is the one the child-facing gate already reads by (`isSuperseded` in item-content-gate.ts):
 * any key beginning `_`, AT ANY DEPTH. The first version of the check looked only at the top level of
 * `stem` and `explanation` and missed `stem.quotes[n]._previousText` and every option's
 * `content._previousValue` — 116 of the 216 rows it should have reported (R1042).
 */
import { canonicalJson } from './findings-digest';

export type Container = 'stem' | 'explanation' | 'content';
export type PathSeg = string | number;

export interface SupersededEntry {
  container: Container;
  /** JSON path inside the container to the object the key sat on. `[]` is the container itself. */
  path: PathSeg[];
  /** The `_`-prefixed name it was stored under, verbatim. */
  key: string;
  value: unknown;
}

export interface SupersededColumn {
  version: 1;
  entries: SupersededEntry[];
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Every `_`-key inside `value`, outermost only (a superseded value is lifted whole, never descended into). */
export function findInside(value: unknown, container: Container): SupersededEntry[] {
  const out: SupersededEntry[] = [];
  const walk = (v: unknown, path: PathSeg[]) => {
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, [...path, i])); return; }
    if (!isObj(v)) return;
    for (const [k, x] of Object.entries(v)) {
      if (k.startsWith('_')) out.push({ container, path, key: k, value: x });
      else walk(x, [...path, k]);
    }
  };
  walk(value, []);
  return out;
}

/** The container with every `_`-key removed at every depth. Does not mutate its input. */
export function withoutSuperseded<T>(value: T): T {
  const walk = (v: unknown): unknown => Array.isArray(v) ? v.map(walk)
    : isObj(v) ? Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, walk(x)]))
      : v;
  return walk(value) as T;
}

/**
 * Put the lifted entries back. Used ONLY to prove a move lost nothing: restore(live, entries) must
 * reproduce the pre-move container exactly (compared canonically — JSONB does not keep key order).
 * Throws when a path no longer resolves, because a restore that silently skips is the R87 no-op.
 */
export function restoreInto(live: unknown, entries: readonly SupersededEntry[]): unknown {
  const copy = JSON.parse(JSON.stringify(live ?? null));
  for (const e of entries) {
    let at: unknown = copy;
    for (const seg of e.path) at = (at as Record<string | number, unknown> | null)?.[seg as never];
    if (!isObj(at)) throw new Error(`restore: ${e.container}${e.path.map((p) => `[${JSON.stringify(p)}]`).join('')} does not resolve to an object (for ${e.key})`);
    at[e.key] = e.value;
  }
  return copy;
}

export const sameJson = (a: unknown, b: unknown) => canonicalJson(a as object) === canonicalJson(b as object);

/** Read the column, refusing a shape it cannot parse (R173) — never `?? []` over a broken value. */
export function readColumn(v: unknown): SupersededColumn {
  if (v === null || v === undefined) return { version: 1, entries: [] };
  if (isObj(v) && v.version === 1 && Array.isArray(v.entries)) return v as unknown as SupersededColumn;
  throw new Error(`superseded column: expected { version: 1, entries: [...] }, got ${JSON.stringify(v).slice(0, 120)}`);
}

export const describe = (e: Pick<SupersededEntry, 'container' | 'path' | 'key'>) =>
  `${e.container}${e.path.map((p) => (typeof p === 'number' ? `[${p}]` : `.${p}`)).join('')}.${e.key}`;
