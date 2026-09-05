/**
 * THE CLEARANCE RECORD (her 229th, as relayed): positions where a flagged token was routed and
 * ruled ordinary. **A clearance is per ROW and per TOKEN, never per word** — the ruling was that
 * THIS row's sense is the ordinary one, and a word cleared on one row says nothing about another.
 *
 * **AND A MISSING RECORD IS NOT A CLEARANCE.** A caller that cannot read this file gets no
 * clearances and every flag routes, which is the safe direction (R98).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';

const FILE = pjoin(__dirname, '..', '..', 'content', 'appropriateness-clearances.json');

export interface ClearanceRecord { itemId: string; token: string; note?: string }

export function loadClearances(): Map<string, string[]> {
  if (!existsSync(FILE)) return new Map();
  const doc = JSON.parse(readFileSync(FILE, 'utf8')) as { clearedPositions?: ClearanceRecord[] };
  const by = new Map<string, string[]>();
  for (const c of doc.clearedPositions ?? []) by.set(c.itemId, [...(by.get(c.itemId) ?? []), c.token]);
  return by;
}
