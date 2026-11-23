/**
 * THE WORKED-EXAMPLE REPLAY, RENDERED FOR A CHILD (R1064, David: "turn on the Maths worked examples
 * properly").
 *
 * The first renderer printed the raw evaluation trace — "18 * 145 makes 2610.", fractions as
 * 0.333333, no £ and no commas — and none of it passed a gate, so replays were held off (R1040).
 * This one renders the SAME arithmetic in house notation:
 *   - × ÷ − + for the operators, a true minus sign for a negative;
 *   - whole numbers with thousands commas (3,458), decimals to at most two places;
 *   - on a money item (its key is shown in £), every amount that IS money in £ with pence, tracked
 *     through the working: £ + £ is money, £ × a count is money, £ ÷ £ is a count;
 *   - the last line gives the answer EXACTLY as the key shows it ("£4.30", "48 cm²").
 *
 * IT REFUSES RATHER THAN APPROXIMATES. A replay is returned only when every value can be shown
 * exactly, the expression has at least one step to walk, its value matches `evaluateSolution` (one
 * definition of the arithmetic, R41) AND the key. Anything else returns a refusal with a reason, and
 * the item simply has no replay — the same choice a reviewer would make.
 */
import { evaluateSolution, optionNumericValue } from '../solution';

export interface ReplayTemplate { intro: string; step: string; outro: string }
export type ReplayRender = { ok: true; lines: string[] } | { ok: false; reason: string };

interface Val { v: number; money: boolean }
const OP = { '+': '+', '-': '−', '*': '×', '/': '÷' } as const;

function plain(n: number): string | null {
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r - n) > 1e-9) return null; // not exact at two places — refuse, never approximate
  const neg = r < 0;
  const s = Math.abs(r).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return neg ? `−${s}` : s;
}
function money(n: number, pence: boolean): string | null {
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r - n) > 1e-9 || r < 0) return null;
  // Whole pounds read as the question writes them ("£80"); pence appear when the item uses them.
  const digits = pence || !Number.isInteger(r) ? 2 : 0;
  return `£${r.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function renderReplay(
  solution: string,
  template: ReplayTemplate,
  item: { stemText: string; keyDisplay: string },
): ReplayRender {
  // Money is tracked whenever the question or its key shows £: "How many £2.50 tickets can £10 buy?"
  // has a count for an answer and money in its working.
  const moneyItem = /^£/.test(item.keyDisplay.trim()) || /£/.test(item.stemText);
  // Two shapes a step-by-step number walk cannot teach, refused outright:
  //   a FRACTION answer ("which is the bigger fraction?") walks to a decimal, which says nothing about fractions;
  //   an item priced in PENCE ("30p each") walks through bare pence and a ÷ 100 with no units on either side.
  if (/^\s*-?\d+(\s+\d+)?\s*\/\s*\d+\s*$/.test(item.keyDisplay)) return { ok: false, reason: 'a fraction answer: a decimal walk does not teach it' };
  if (/\d\s?p\b/.test(item.stemText) || /\dp$/.test(item.keyDisplay.trim())) return { ok: false, reason: 'priced in pence: the walk would mix pence and pounds without units' };
  const pence = /£\s?\d[\d,]*\.\d/.test(`${item.stemText} ${item.keyDisplay}`);
  // An operand is money when the question itself shows it in £ ("£1.70", "£36").
  const stemMoney = new Set<number>();
  for (const m of item.stemText.matchAll(/£\s?(\d[\d,]*(?:\.\d+)?)/g)) stemMoney.add(Number(m[1]!.replace(/,/g, '')));

  const steps: string[] = [];
  let pos = 0;
  let failure: string | null = null;
  const fmt = (x: Val) => (x.money ? money(x.v, pence) : plain(x.v));
  const skip = () => { while (solution[pos] === ' ') pos += 1; };

  const factor = (): Val => {
    skip();
    if (solution[pos] === '(') { pos += 1; const v = expr(); skip(); pos += 1; return v; }
    if (solution[pos] === '-') { pos += 1; const v = factor(); return { v: -v.v, money: v.money }; }
    const m = /^\d+(\.\d+)?/.exec(solution.slice(pos));
    if (!m) throw new Error(`Expected a number at ${pos}`);
    pos += m[0].length;
    const v = Number(m[0]);
    return { v, money: moneyItem && stemMoney.has(v) };
  };
  const apply = (a: Val, op: '+' | '-' | '*' | '/', b: Val): Val => {
    const v = op === '+' ? a.v + b.v : op === '-' ? a.v - b.v : op === '*' ? a.v * b.v : a.v / b.v;
    const isMoney = op === '+' || op === '-' ? a.money || b.money
      : op === '*' ? a.money !== b.money
      : a.money && !b.money; // £ ÷ count is money; £ ÷ £ is a count
    const out: Val = { v, money: isMoney };
    const [fa, fb, fo] = [fmt(a), fmt(b), fmt(out)];
    if (fa === null || fb === null || fo === null) failure ??= `a value cannot be shown exactly (${a.v} ${op} ${b.v} = ${v})`;
    else steps.push(template.step.replaceAll('{operation}', `${fa} ${OP[op]} ${fb}`).replaceAll('{value}', fo));
    return out;
  };
  const term = (): Val => {
    let left = factor();
    for (;;) { skip(); const op = solution[pos]; if (op !== '*' && op !== '/') return left; pos += 1; left = apply(left, op, factor()); }
  };
  const expr = (): Val => {
    let left = term();
    for (;;) { skip(); const op = solution[pos]; if (op !== '+' && op !== '-') return left; pos += 1; left = apply(left, op, term()); }
  };

  let result: Val;
  try { result = expr(); } catch (e) { return { ok: false, reason: `expression: ${(e as Error).message}` }; }
  if (failure) return { ok: false, reason: failure };
  if (steps.length === 0) return { ok: false, reason: 'no working to walk (a bare value)' };
  const official = evaluateSolution(solution);
  if (Math.abs(official - result.v) > 1e-9) return { ok: false, reason: `renderer and evaluateSolution disagree (${result.v} vs ${official})` };
  // A key may carry a true minus sign (−3°C); the comparison reads either minus.
  const keyed = optionNumericValue(item.keyDisplay.replace(/^\s*−/, '-'));
  if (keyed === null || Math.abs(keyed - result.v) > 1e-9) return { ok: false, reason: `the walk ends at ${result.v}, the key is "${item.keyDisplay}"` };
  // The answer as the key shows it, with the working's comma style for a bare whole number ("4528" →
  // "4,528"), so the last line matches the lines above it.
  // The answer as the key shows it, in the working's style: thousands commas ("£3600" → "£3,600",
  // "6000 g" → "6,000 g") and a true minus sign ("-3°C" → "−3°C"). Only the number is restyled; the
  // unit and any text after it are the key's own.
  const key = item.keyDisplay.trim();
  const m = /^(£?)([-−]?)(\d+)(\.\d+)?(.*)$/.exec(key);
  const shown = m ? `${m[2] ? '−' : ''}${m[1]}${Number(m[3]).toLocaleString('en-GB')}${m[4] ?? ''}${m[5]}` : key;
  return { ok: true, lines: [template.intro, ...steps, template.outro.replaceAll('{value}', shown)] };
}
