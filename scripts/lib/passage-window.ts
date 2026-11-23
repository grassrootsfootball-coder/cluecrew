/**
 * WHERE A QUOTE SITS IN ITS PASSAGE — one definition, shared by check:source-quotes and the
 * agent-review option-lines lander (R1041), so the door that writes a quote and the gate that checks
 * it cannot disagree about what "in the window" means (R42, R41).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface NumberedLine { n: number; text: string }
export interface PassageText { text: string; numbered: NumberedLine[] | null }

const PASSAGES = resolve(__dirname, '../../content/passages');

/** Every passage by id. Refuses a shape it cannot read rather than returning an empty text (R173). */
export function loadPassages(): Map<string, PassageText> {
  const out = new Map<string, PassageText>();
  for (const name of readdirSync(PASSAGES).filter((n) => n.endsWith('.json'))) {
    const parsed = JSON.parse(readFileSync(join(PASSAGES, name), 'utf8')) as
      { id?: string; extract?: unknown; body?: unknown; text?: unknown; numberedLines?: unknown };
    if (typeof parsed.id !== 'string') {
      throw new Error(`${name}: no string id — refusing to report from a failed read (R173)`);
    }
    // THREE NAMES FOR ONE FIELD. Reading only `extract` once screened 819 quotes against an empty
    // string and reported every one as NOT IN THE SOURCE.
    const text = typeof parsed.extract === 'string' ? parsed.extract
      : typeof parsed.body === 'string' ? parsed.body
      : typeof parsed.text === 'string' ? parsed.text
      : null;
    if (text === null) {
      throw new Error(`${name}: none of 'extract', 'body' or 'text' is a string — an unknown passage shape, reported rather than skipped`);
    }
    const numbered = Array.isArray(parsed.numberedLines)
      ? (parsed.numberedLines as NumberedLine[]).filter((l) => typeof l?.n === 'number' && typeof l?.text === 'string')
      : null;
    out.set(parsed.id, { text, numbered });
  }
  if (out.size === 0) throw new Error('no passages parsed — refusing to report "all quotes match" from an empty read');
  return out;
}

/** The text of the lines an item declares, joined, or null when there is no usable window. */
export function windowText(numbered: NumberedLine[] | null, lineRefs: unknown): string | null {
  if (!numbered || !Array.isArray(lineRefs) || lineRefs.length === 0) return null;
  const wanted = new Set(lineRefs.filter((n): n is number => typeof n === 'number'));
  if (wanted.size === 0) return null;
  const picked = numbered.filter((l) => wanted.has(l.n)).map((l) => l.text);
  return picked.length > 0 ? picked.join('\n') : null;
}

export const flat = (s: string): string => s.replace(/\s+/g, ' ').trim();
