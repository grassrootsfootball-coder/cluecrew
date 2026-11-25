/**
 * WALK QUOTE CHECK (R1067): a walk-through that quotes the passage must quote it — every quoted span
 * in the script is on the screen word for word, and where the same sentence names a line ("line 14",
 * "lines 40 and 41", "lines 36–37") — or the last sentence before it named — the span is on THOSE lines. Until this existed, only a reviewer's
 * reading checked a quotation; the drafter of the en-01 rewrite round found that gap.
 *
 * It reads the passage the row cites (`content/passages/<passageRef>.json`), the stem text and the
 * option values — the artefacts themselves, never a copy (R60 Q3). Normalisation happens where it
 * COMPARES, never where it reads (R570): case, curly/straight quotes and apostrophes, dashes and
 * whitespace are folded on both sides. An ellipsis in a quotation splits it into fragments, each of
 * which must be present.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';

const PASSAGES = pjoin(__dirname, '..', '..', 'content', 'passages');
type Line = { n: number; text: string };
const passageCache = new Map<string, Line[]>();

function passageLines(ref: string): Line[] {
  if (!passageCache.has(ref)) {
    const f = pjoin(PASSAGES, `${ref}.json`);
    if (!existsSync(f)) throw new Error(`${ref}: passage file missing — cannot check quotations against a passage that is not here`);
    const j = JSON.parse(readFileSync(f, 'utf8')) as { numberedLines?: Line[] };
    if (!Array.isArray(j.numberedLines)) throw new Error(`${ref}: expected numberedLines[] on the passage file`);
    passageCache.set(ref, j.numberedLines);
  }
  return passageCache.get(ref)!;
}

const fold = (s: string) => s.toLowerCase().replace(/[‘’ʼ`]/g, "'").replace(/[“”]/g, '"').replace(/[—–-]/g, ' ')
  .replace(/[.,;:!?"()]/g, ' ').replace(/\s+/g, ' ').trim();

/** Quoted spans: '…' (opening quote at a word boundary, so apostrophes are not read as quotes), ‘…’, "…", “…". */
export function quotedSpans(sentence: string): string[] {
  const out: string[] = [];
  for (const re of [/(?:^|[\s(])'([^']+?)'(?=[\s.,;:!?)]|$)/g, /‘([^’]+?)’(?=[\s.,;:!?)]|$)/g, /"([^"]+?)"/g, /“([^”]+?)”/g])
    for (const m of sentence.matchAll(re)) out.push(m[1]!);
  return out;
}

/** Line numbers a sentence names: "line 14", "lines 40 and 41", "lines 36-37", "lines 8 to 10". */
export function namedLines(sentence: string): number[] {
  const ns = new Set<number>();
  for (const m of sentence.matchAll(/\blines?\s+(\d+)(?:\s*(?:and|,|-|–|to)\s*(\d+))?(?:\s*(?:and|,)\s*(\d+))?/gi)) {
    const a = Number(m[1]); const b = m[2] ? Number(m[2]) : undefined; const c = m[3] ? Number(m[3]) : undefined;
    const ranged = /-|–|to/.test(m[0]);
    if (b !== undefined && ranged) for (let i = Math.min(a, b); i <= Math.max(a, b); i++) ns.add(i); else { ns.add(a); if (b !== undefined) ns.add(b); }
    if (c !== undefined) ns.add(c);
  }
  return [...ns].sort((x, y) => x - y);
}

export type QuoteFault = { sentence: string; quote: string; why: string };

export function checkWalkQuotes(script: string, stem: unknown, options: string[]): { quotes: number; faults: QuoteFault[] } {
  const st = (stem ?? {}) as { text?: string; passageRef?: string };
  const lines = st.passageRef ? passageLines(st.passageRef) : [];
  const screen = fold([st.text ?? '', ...options, ...lines.map((l) => l.text)].join(' \n '));
  const sentences = script.split(/(?<=[.!?])\s+/);
  let quotes = 0; const faults: QuoteFault[] = [];
  // A line a sentence names stays named for the sentences after it until another is named: "Turn to line 18.
  // The carol hits his 'dulled hearing'." sends the child to line 18 for both (R1067, the en-01 round).
  let named: number[] = [];
  for (const s of sentences) {
    const here = namedLines(s); if (here.length) named = here;
    for (const q of quotedSpans(s)) {
      quotes++;
      for (const frag of q.split(/…|\.\.\./).map(fold).filter(Boolean)) {
        if (!screen.includes(frag)) { faults.push({ sentence: s, quote: q, why: 'not on the screen word for word' }); break; }
        if (named.length && lines.length) {
          const span = fold(lines.filter((l) => named.includes(l.n)).map((l) => l.text).join(' '));
          const inStemOrOption = fold([st.text ?? '', ...options].join(' \n ')).includes(frag);
          if (!span.includes(frag) && !inStemOrOption) { faults.push({ sentence: s, quote: q, why: `not on line(s) ${named.join(', ')}` }); break; }
        }
      }
    }
  }
  return { quotes, faults };
}
