/**
 * HOUSE NOTATION for child-facing content — the symbols, not the words.
 *
 * Money on the £ symbol (£5.00, not "5.00 pounds"), temperatures with the degree
 * sign (4°C, not "4C"), areas and volumes with a real superscript (48 cm², not
 * "cm2"). Batch 01 was corrected by a MANUAL edit on its own export file
 * (MATHS-CALIBRATION-ANNIE-PASS.md, "notation applied to the batch"), so nothing
 * systemic changed and batches 04-05 regressed — 44/18/5 instances, no symbols at
 * all. At 900 items no reviewer catches this by eye, so it lives here as a gate over
 * every child-facing string and a deterministic normaliser for the unambiguous cases.
 */
export interface NotationIssue { kind: 'money-word' | 'pence-word' | 'unit-power' | 'temperature'; found: string; suggestion: string }

const SUP: Record<string, string> = { '2': '²', '3': '³' };

const MONEY = /(?<![£\w])(\d[\d,]*(?:\.\d+)?)\s*pounds?\b/gi;
const PENCE = /\b(\d[\d,]*)\s*pence\b/gi;
const UNIT_POWER = /\b(mm|cm|km|m)([23])\b/g;
// A temperature written without the degree sign: "5C", "-3 C" — but never "5°C".
const TEMP_NO_DEGREE = /\b(-?\d+)\s*C\b/g;

/**
 * Deterministic, unambiguous typography fixes: money words → £, pence words → p,
 * unit powers → superscript. A bare temperature "C" is NOT auto-edited (it could be
 * a point or grade label), only reported by the gate — so this never inserts a
 * degree sign into text that did not mean one.
 */
export function normaliseMathsNotation(text: string): string {
  return text
    .replace(MONEY, '£$1')
    .replace(PENCE, '$1p')
    .replace(UNIT_POWER, (_m, u: string, p: string) => u + SUP[p]);
}

/**
 * Every notation defect in a string. Run it on ALREADY-NORMALISED text at a door:
 * the normaliser has fixed money and units, so what remains is either a temperature
 * that needs a human's degree sign or a money form the normaliser could not touch —
 * both real defects, never stylistic niceties.
 */
export function checkMathsNotation(text: string): NotationIssue[] {
  const issues: NotationIssue[] = [];
  for (const m of text.matchAll(MONEY)) issues.push({ kind: 'money-word', found: m[0], suggestion: `£${m[1]}` });
  for (const m of text.matchAll(PENCE)) issues.push({ kind: 'pence-word', found: m[0], suggestion: `${m[1]}p` });
  for (const m of text.matchAll(UNIT_POWER)) issues.push({ kind: 'unit-power', found: m[0], suggestion: `${m[1] ?? ''}${SUP[m[2] ?? ''] ?? ''}` });
  for (const m of text.matchAll(TEMP_NO_DEGREE)) issues.push({ kind: 'temperature', found: m[0], suggestion: `${m[1]}°C` });
  return issues;
}
