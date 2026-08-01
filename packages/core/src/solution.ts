/**
 * Machine-verifiable answer keys (BUILD-DISTRICT-MATHS §5) — a spec'd
 * integration point. Every maths item carries a `solution` expression; the
 * key is COMPUTED, never asserted, so an AI-drafted item cannot ship a wrong
 * key. The same evaluation trace feeds the worked-example replay (ratified
 * spec addition): steps derive from the expression through authored
 * templates only — deterministic arithmetic, no live generation (S3).
 *
 * The grammar is deliberately small: numbers, + - * / and parentheses.
 * No eval(), no functions, no variables — an expression is data, not code.
 */

export interface SolutionStep {
  /** e.g. "42 / 10" */
  operation: string;
  value: number;
}

interface Parsed {
  value: number;
  steps: SolutionStep[];
}

class Parser {
  private position = 0;
  constructor(private readonly text: string) {}

  parse(): Parsed {
    const steps: SolutionStep[] = [];
    const value = this.expression(steps);
    this.skipSpaces();
    if (this.position < this.text.length) {
      throw new Error(`Unexpected character at ${this.position}: "${this.text[this.position]}"`);
    }
    return { value, steps };
  }

  private expression(steps: SolutionStep[]): number {
    let left = this.term(steps);
    for (;;) {
      this.skipSpaces();
      const op = this.text[this.position];
      if (op !== '+' && op !== '-') return left;
      this.position += 1;
      const right = this.term(steps);
      const value = op === '+' ? left + right : left - right;
      steps.push({ operation: `${format(left)} ${op} ${format(right)}`, value });
      left = value;
    }
  }

  private term(steps: SolutionStep[]): number {
    let left = this.factor(steps);
    for (;;) {
      this.skipSpaces();
      const op = this.text[this.position];
      if (op !== '*' && op !== '/') return left;
      this.position += 1;
      const right = this.factor(steps);
      if (op === '/' && right === 0) throw new Error('Division by zero');
      const value = op === '*' ? left * right : left / right;
      steps.push({ operation: `${format(left)} ${op} ${format(right)}`, value });
      left = value;
    }
  }

  private factor(steps: SolutionStep[]): number {
    this.skipSpaces();
    const char = this.text[this.position];
    if (char === '(') {
      this.position += 1;
      const value = this.expression(steps);
      this.skipSpaces();
      if (this.text[this.position] !== ')') throw new Error('Missing closing bracket');
      this.position += 1;
      return value;
    }
    if (char === '-') {
      this.position += 1;
      return -this.factor(steps);
    }
    const match = /^\d+(\.\d+)?/.exec(this.text.slice(this.position));
    if (!match) throw new Error(`Expected a number at ${this.position}`);
    this.position += match[0].length;
    return Number(match[0]);
  }

  private skipSpaces(): void {
    while (this.text[this.position] === ' ') this.position += 1;
  }
}

function format(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 1e6) / 1e6);
}

/** Evaluates a solution expression. Throws on anything outside the grammar. */
export function evaluateSolution(expression: string): number {
  return new Parser(expression).parse().value;
}

/**
 * The left-to-right evaluation trace — the raw material the replay templates
 * phrase for a child. Deterministic: same expression, same steps, always.
 */
export function solutionTrace(expression: string): SolutionStep[] {
  return new Parser(expression).parse().steps;
}

/**
 * Parses the numeric value out of an option's content: bare numbers, value
 * fields, and UK-formatted quantities ("£4.20", "1,250 ml", "45 cm").
 */
export function optionNumericValue(content: unknown): number | null {
  const raw =
    typeof content === 'string' || typeof content === 'number'
      ? String(content)
      : content && typeof content === 'object' && 'value' in (content as Record<string, unknown>)
        ? String((content as Record<string, unknown>).value)
        : null;
  if (raw === null) return null;
  const cleaned = raw.replace(/[£,]/g, '').trim();
  const match = /^-?\d+(\.\d+)?/.exec(cleaned);
  return match ? Number(match[0]) : null;
}

export interface SolutionCheck {
  ok: boolean;
  computed: number | null;
  keyed: number | null;
  reason: string | null;
}

/**
 * The CI/import gate (§5): the computed value must equal the keyed correct
 * option. Items without a parseable correct option, or whose expression does
 * not evaluate, FAIL — loudly, never silently.
 */
export function checkSolution(
  solution: string,
  options: Array<{ content: unknown; isCorrect: boolean }>,
): SolutionCheck {
  let computed: number;
  try {
    computed = evaluateSolution(solution);
  } catch (error) {
    return { ok: false, computed: null, keyed: null, reason: `expression: ${String(error)}` };
  }
  const correct = options.find((option) => option.isCorrect);
  if (!correct) return { ok: false, computed, keyed: null, reason: 'no correct option' };
  const keyed = optionNumericValue(correct.content);
  if (keyed === null) return { ok: false, computed, keyed: null, reason: 'correct option is not numeric' };
  const ok = Math.abs(computed - keyed) < 1e-9;
  return { ok, computed, keyed, reason: ok ? null : 'computed value does not match the keyed option' };
}
