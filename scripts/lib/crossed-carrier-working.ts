/**
 * THE CARRIER'S OWN WORKING LIVES AT THE AUTHORING STORE, AND THE JOIN READS IT THERE (David's
 * ruling, 2026-08-29 — R881).
 *
 * `distractorWorking` never crossed this door. The reader test correctly refused to widen for it —
 * nothing here renders it, and a field no reader consumes is a field this store should not hold
 * (R601). **But "we do not hold it" was then used as "it does not exist", and the join demanded the
 * carrier's evidence in a column that had been ruled not to render.** Requiring evidence in the
 * wrong place is indistinguishable, from inside, from the evidence being absent.
 *
 * So the working is read from Cowork's CROSSED BYTES. Three properties make that safe:
 *
 *  1. THE SOURCE IS DERIVED, NEVER HAND-PICKED (R57). Every crossed maths artefact holding
 *     `distractorWorking` is scanned. Naming one file would make the answer depend on which copy
 *     somebody reached for.
 *  2. UNANIMITY IS REQUIRED, DISAGREEMENT IS REFUSED. If two crossed copies state different
 *     workings for one carrier, this returns DISAGREE with every reading and its files — it does
 *     not pick. A silent pick among disagreeing copies is the drift the whole exchange exists to
 *     prevent.
 *  3. THE KEYS ARE PRINTED BEFORE THE VALUES (R568). The first scan of these files looked for `id`
 *     where the shape says `itemId`, found nothing on 196 items, and reported 0 carriers — a failed
 *     read wearing the exact shape of the true absence it was sent to check.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CROSSED = join(homedir(), 'Downloads');

export interface CarrierWorking {
  state: 'PRESENT' | 'ABSENT' | 'DISAGREE';
  /** The working verbatim, only when every crossed copy holding this carrier agrees. */
  verbatim?: string;
  /** Every distinct reading found, with the files and digests stating it. */
  readings: Array<{ working: string | null; valueInThatCopy: string | null; files: string[]; digests: string[] }>;
  copiesHoldingTheCarrier: number;
}

interface Row { itemId: string; options?: Array<Record<string, unknown>> }

function* rowsIn(o: unknown): Generator<Row> {
  if (Array.isArray(o)) { for (const v of o) yield* rowsIn(v); return; }
  if (o && typeof o === 'object') {
    const r = o as Record<string, unknown>;
    if (typeof r.itemId === 'string' && Array.isArray(r.options)) yield r as unknown as Row;
    for (const v of Object.values(r)) yield* rowsIn(v);
  }
}

let CACHE: Array<{ file: string; digest: string; rows: Map<string, Row> }> | null = null;

/** Every crossed artefact that states a `distractorWorking` at all. Derived, never listed. */
function sources() {
  if (CACHE) return CACHE;
  CACHE = [];
  for (const name of readdirSync(CROSSED).filter((n) => n.endsWith('.json')).sort()) {
    let text: string;
    try { text = readFileSync(join(CROSSED, name), 'utf8'); } catch { continue }
    if (!text.includes('distractorWorking')) continue;
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { continue }
    const rows = new Map<string, Row>();
    for (const r of rowsIn(parsed)) if (!rows.has(r.itemId)) rows.set(r.itemId, r);
    if (rows.size === 0) continue;
    CACHE.push({ file: name, digest: createHash('sha256').update(text, 'utf8').digest('hex'), rows });
  }
  if (CACHE.length === 0) {
    throw new Error('no crossed artefact states a distractorWorking — refusing a blind read (R173). The evidence lives at the authoring store; if nothing has crossed, that is a GAP to report, not an absence to conclude.');
  }
  return CACHE;
}

/** What the crossed bytes say about one carrier's own working. Never picks between copies. */
export function carrierWorking(itemId: string, label: string): CarrierWorking {
  const byReading = new Map<string, { working: string | null; valueInThatCopy: string | null; files: string[]; digests: string[] }>();
  let held = 0;
  for (const s of sources()) {
    const row = s.rows.get(itemId);
    if (!row) continue;
    const opt = (row.options ?? []).find((o) => o.label === label);
    if (!opt) continue;
    held += 1;
    const working = typeof opt.distractorWorking === 'string' ? opt.distractorWorking : null;
    const value = opt.value === undefined ? null : String(opt.value);
    const k = JSON.stringify([working, value]);
    const e = byReading.get(k) ?? { working, valueInThatCopy: value, files: [], digests: [] };
    e.files.push(s.file); e.digests.push(s.digest.slice(0, 16));
    byReading.set(k, e);
  }
  const readings = [...byReading.values()];
  if (held === 0) return { state: 'ABSENT', readings, copiesHoldingTheCarrier: 0 };
  const workings = new Set(readings.map((r) => r.working));
  if (workings.size > 1) return { state: 'DISAGREE', readings, copiesHoldingTheCarrier: held };
  const only = [...workings][0];
  if (only === null) return { state: 'ABSENT', readings, copiesHoldingTheCarrier: held };
  return { state: 'PRESENT', verbatim: only, readings, copiesHoldingTheCarrier: held };
}

/** The keys a crossed option actually carries — printed before any value is read (R568). */
export function crossedOptionKeys(): string[] {
  const keys = new Set<string>();
  for (const s of sources()) for (const row of s.rows.values()) for (const o of row.options ?? []) Object.keys(o).forEach((k) => keys.add(k));
  return [...keys].sort();
}
