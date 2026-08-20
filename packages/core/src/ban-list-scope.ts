/**
 * WHAT THE BAN LIST AND THE READING-AGE RULES RUN ON (Annie's ruling, 2026-08-21 — R379).
 *
 * The door screened 35 distinct paths; a child reads 24 of them. Her ruling: **the ban list runs on
 * the 24 SERVED paths and on class 3 — authored-for-a-child-but-unserved — and nothing else.**
 *
 * **PROVENANCE AND WORKFLOW ARE OUT, with `correctionOf` as the decisive case.** *"A field whose job
 * is to record a fault will contain the fault, so a gate banning the word from the field that records
 * it makes the record impossible."* That is not a tolerance, it is a contradiction: the field cannot
 * do its job and pass.
 *
 * **MACHINE DECLARATIONS ARE OUT — with a rider that OUTRANKS the ruling: removing a check must not
 * leave a field with none.** *"A field nobody checks is how the word cap ran for a month."* So the
 * narrowing ships with `check:declaration-schema` in the same act, never after it: is the shape valid,
 * does the declared span exist, does the exemption name a rule that exists.
 *
 * **`hintCore` IS CLASS 3 WHATEVER THE SERVING TRACE SAYS.** It is authored for a child and gated as
 * child-facing, and it stays in scope **because the day something serves it, the gate is what stands
 * between the authoring and the child.** That is `walkScript`'s case exactly, one field over, and it
 * was invisible because the gate has been treating it as served all along.
 */

/** Read on a child-facing path today. In scope beyond argument. */
export const SERVED_PATHS: readonly string[] = [
  'option.value', 'option.label', 'explanation.walkScript', 'stem.prompt', 'stem.text',
  'stem.passageRef', 'stem.operands.kind', 'stem.sentence', 'explanation.note',
  'stem.techniqueKey', 'stem.wordWithGap', 'stem.code.A', 'stem.code.I', 'stem.code.T',
  'stem.question', 'explanation.quotes[].rule', 'explanation.quotes[].text',
  'explanation.quotes[].passageRef', 'explanation.quotes[].why',
  'stem.quotes[].rule', 'stem.quotes[].text', 'stem.quotes[].passageRef', 'stem.quotes[].why',
];

/**
 * CLASS 3 — authored for a child, not served today. In scope because the gate is what will stand
 * between the authoring and the child on the day something serves it.
 */
export const AUTHORED_UNSERVED_PATHS: readonly string[] = ['explanation.hintCore', 'stem.quotes[]'];

/** CLASS 1 — provenance and workflow. A child will never read them under any design. */
export const PROVENANCE_PATHS: readonly string[] = [
  'explanation.hintAuthority', 'explanation.hintAuthoredBy',
  'explanation.walkScriptBatch', 'explanation.walkScriptStatus', 'stem.correctionOf[]',
];

/** CLASS 2 — machine-readable declarations. Out of ban-list scope; `check:declaration-schema` owns them. */
export const MACHINE_DECLARATION_PATHS: readonly string[] = [
  'stem.answerShape', 'stem.operands.expr',
  'stem.quotes[].exemptFrom[]', 'explanation.quotes[].exemptFrom[]',
];

const IN_SCOPE = new Set([...SERVED_PATHS, ...AUTHORED_UNSERVED_PATHS]);
const OUT_OF_SCOPE = new Set([...PROVENANCE_PATHS, ...MACHINE_DECLARATION_PATHS]);

/** `stem.quotes[3].text` -> `stem.quotes[].text`, so a path matches its declared form. */
export const normalisePath = (path: string): string => path.replace(/\[\d+\]/g, '[]');

export type ScopeVerdict = 'IN SCOPE' | 'OUT — provenance or workflow' | 'OUT — machine declaration' | 'UNDECLARED — refuse';

/**
 * **UNDECLARED REFUSES** (R299). A path nobody has classified is not quietly exempted and not quietly
 * screened — both defaults are wrong, so it is named and the ruling is asked for.
 */
export function banListScope(path: string): ScopeVerdict {
  const p = normalisePath(path);
  if (IN_SCOPE.has(p)) return 'IN SCOPE';
  if (OUT_OF_SCOPE.has(p)) {
    return MACHINE_DECLARATION_PATHS.includes(p) ? 'OUT — machine declaration' : 'OUT — provenance or workflow';
  }
  return 'UNDECLARED — refuse';
}

/** Does the ban list, the US-spelling check and the reading-age cap run on this path? */
export const banListApplies = (path: string): boolean => banListScope(path) === 'IN SCOPE';
