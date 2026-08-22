/**
 * ONE READER OF A RETURN'S AMENDMENTS (Annie, 2026-08-21 — R429).
 *
 * **The two regexes were the finding, not the bug.** `check:amendments-landed` and
 * `apply-all-unlanded` both read her returns and **disagreed about what a record contains**: the
 * apply script captured the target id, the check discarded it by construction. **Two parsers over
 * one format will disagree eventually**, and here the disagreement made a correctly-formed amendment
 * look like author error for three counts.
 *
 * So there is one reader, and both callers import it. **The shape is declared, and a line that looks
 * like an amendment but matches no declared shape FAILS rather than yields nothing** (R415).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface Amendment {
  /**
   * **STORE** — the amendment names a row this check can search (a misconception, an item hint, a
   * word). **SURFACE** — it names a thing in the product (a group label, a status line), which this
   * check does NOT hold and must never report as absent. Reporting a surface amendment as absent
   * would be a true statement about the wrong population, indistinguishable from a store amendment
   * that failed to land.
   */
  kind: 'STORE' | 'SURFACE';
  /** The entry the amendment targets, when the shape carries one AND it is an id. */
  targetId: string | null;
  /** What the amendment names, verbatim, id or not. Never null when the shape carries a target. */
  target: string | null;
  /**
   * **THE PARENTHETICAL IS NOT DECORATION — IT NAMES THE FIELD.** She writes
   * `en-vocab-neighbouring-sense (description, not hint)`, and the first version of `resolveTarget`
   * stripped that to get a clean id. The id was then correct and the amendment was pointed at the
   * WRONG COLUMN: an adult-facing description, twenty-five words a sentence, aimed at `childHint`,
   * where it failed the child-facing gate on six counts and aborted the whole apply run.
   *
   * **The abort is the good outcome and it is luck.** Had the description happened to read like a
   * hint, it would have been written into a field a child sees. Null means she named no field and
   * the writer's own default applies.
   */
  fieldNote: string | null;
  /** The text being replaced, when the shape carries it. */
  replacing: string | null;
  authored: string;
  file: string;
  when: Date;
}

/**
 * THE DECLARED SHAPES, named so a run can print them.
 *
 * `INLINE_WITH_TARGET` is the richer record: it carries the id AND the replaced text. `LABELLED`
 * carries the wording alone. **They are different records, not renderings of one** — which is why
 * reading only the poorer one converts placeable amendments into orphans.
 */
export const SHAPES = [
  {
    name: 'INLINE_WITH_TARGET',
    describe: '- `entry-id`, replacing *old text*: **new text**',
    re: /[-*]\s*`([a-z0-9-]+)`\s*,?[^:*]*?replacing\s+\*([^*]+)\*\s*:\s*\*\*(.+?)\*\*/gms,
    read: (m: RegExpMatchArray) => ({ target: m[1], replacing: m[2], authored: m[3] }),
  },
  {
    name: 'LABELLED',
    describe: '- authored: **new text**   (bold; MAY WRAP ACROSS LINES)',
    /**
     * **`[\s\S]` and not `.`, because the WRAP was the fault.** Her returns are hard-wrapped at
     * about ninety columns, so any authored wording longer than one line closes its `**` on the
     * NEXT line. With `.` the group cannot cross that newline, the match simply fails, and the
     * amendment is never read. The seventeenth return carries THREE authored wordings; two of them
     * wrap; this shape found ONE — and the check then reported the return FULLY LANDED.
     *
     * Bounded at 400 characters so a stray `authored:` with no bold cannot swallow the rest of the
     * file hunting for a closing pair.
     */
    re: /^\s*[-*]?\s*(?:authored|Authored|replacement)\s*:\s*\*\*([\s\S]{1,400}?)\*\*/gm,
    read: (m: RegExpMatchArray) => ({ target: null, replacing: null, authored: m[1] }),
  },
  {
    name: 'HEADED_LABELLED',
    describe: '**`entry-id`, N items. Amended.**  then  - authored: **new text**   (target in the HEADING)',
    /**
     * **THE TARGET WAS ON THE LINE ABOVE THE WHOLE TIME.** `LABELLED` reads the wording and reports
     * no target, so the amendment lands in the UNPLACEABLE class — "not found anywhere in the
     * store", which is strictly weaker than "this row does not hold it" and reads as an unfixable
     * limit rather than an unread line. The id is right there, bolded, one line up, in the same
     * paragraph she wrote it in.
     */
    re: /^\*\*`([a-z0-9-]+)`[^\n]*\*\*\n(?:[^\n]*\n){0,4}?[ \t]*[-*][ \t]*(?:authored|Authored|replacement):[ \t]*\*\*([\s\S]{1,400}?)\*\*/gm,
    read: (m: RegExpMatchArray) => ({ target: m[1], replacing: null, authored: m[2] }),
  },
  {
    name: 'BLOCK',
    describe: '    target: <what> / replaced: <old> / authored: <new>   (indented block, NO bold)',
    /**
     * **THE SHAPE SHE HAS USED FOR TWENTY-EIGHT RETURNS, WHICH THIS READER HAD NEVER SEEN.** The
     * indented `AMENDMENTS` block carries the target, the replaced text and the authored text on
     * three consecutive lines with no bold markers anywhere. Both older shapes REQUIRE `**`, so
     * every amendment issued this way was invisible — including `en-repetition-purpose`, in a
     * return whose own block declares `count: 13`, of which this reader found nought.
     */
    re: /^[ \t]+target:[ \t]*(.+)\n[ \t]+replaced:[ \t]*(.+)\n[ \t]+authored:[ \t]*(.+)$/gm,
    read: (m: RegExpMatchArray) => ({ target: (m[1] ?? '').trim(), replacing: (m[2] ?? '').trim(), authored: m[3] ?? '' }),
  },
] as const;

/**
 * **THE TARGET IS RESOLVED TO A ROW ID, OR IT IS NOT A ROW.** Her targets come in three forms and
 * the first crude version of this got two of them wrong, which matters because a misclassified
 * STORE row is silently dropped from the landed/absent count entirely:
 *
 *   `en-repetition-purpose`                          a bare entry id
 *   `word-card:hostile`                              a store row, qualified by which store
 *   `en-vocab-... (description, not hint)`           an entry id with a field parenthetical
 *   `error-spot group label`                         NOT a row — a thing in the product
 *
 * Everything but the last is a STORE target. The rule is the id SHAPE after the qualifier and the
 * parenthetical come off — never the presence of a colon or a bracket, which are punctuation.
 */
function resolveTarget(raw: string): { kind: 'STORE' | 'SURFACE'; id: string | null; fieldNote: string | null } {
  const paren = /\(([^)]*)\)\s*$/.exec(raw);
  const bare = raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const afterQualifier = bare.includes(':') ? bare.slice(bare.lastIndexOf(':') + 1).trim() : bare;
  const fieldNote = paren?.[1] ? paren[1].trim() : null;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(afterQualifier) && !afterQualifier.includes(' ')
    ? { kind: 'STORE', id: afterQualifier, fieldNote }
    : { kind: 'SURFACE', id: null, fieldNote };
}

/**
 * **UNWRAP ONLY. THE READER DOES NOT EDIT HER TEXT.**
 *
 * This collapsed the hard line-wraps in her returns AND stripped a trailing full stop, and the
 * second half is not normalisation — it is a silent edit to an authored value. `checkChildFacingText`
 * requires a child-facing sentence to end on a full stop, `?` or `!`, so the stripped form is a
 * wording she never wrote and the gate would refuse.
 *
 * **It very nearly shipped.** `apply-all-unlanded` compares raw, so six rows whose stored text was
 * already correct read as different and were queued to be REWRITTEN WITHOUT THEIR FULL STOP —
 * including `en-plausible-not-stated`, 193 carriers and 11 LIVE, the most-carried hint in the
 * product. The check did not see it because its own comparison strips the stop too: **both sides
 * agreed, and they agreed because they shared the mutilation.**
 *
 * Normalise where you COMPARE. Never where you READ.
 */
const tidy = (s: string) => s.replace(/\s*\n\s*/g, ' ').trim();

/** Every amendment in every return, read once, by shape. Richer shapes win on the same wording. */
export function readAmendments(dir: string): { amendments: Amendment[]; files: string[] } {
  const files = readdirSync(dir).filter((f) => /^annie-.*return.*\.md$/.test(f)).sort();
  const byKey = new Map<string, Amendment>();
  for (const f of files) {
    const body = readFileSync(join(dir, f), 'utf8');
    const when = statSync(join(dir, f)).mtime;
    for (const shape of SHAPES) {
      shape.re.lastIndex = 0;
      for (const m of body.matchAll(shape.re)) {
        const r = shape.read(m as RegExpMatchArray);
        const authored = tidy(r.authored ?? '');
        const key = `${f}|${authored}`;
        const existing = byKey.get(key);
        // A record WITH a target supersedes the same wording read without one.
        if (existing && (existing.target !== null || r.target === null)) continue;
        const target = r.target ? tidy(r.target) : null;
        const resolved = target === null
          ? { kind: 'STORE' as const, id: null, fieldNote: null }
          : resolveTarget(target);
        byKey.set(key, {
          kind: resolved.kind,
          targetId: resolved.id,
          fieldNote: resolved.fieldNote,
          target,
          replacing: r.replacing ? tidy(r.replacing) : null,
          authored, file: f, when,
        });
      }
    }
  }
  return { amendments: [...byKey.values()], files };
}

/**
 * **WHAT THE RETURN ITSELF SAYS IT CONTAINS (David, 2026-08-22).** Her `AMENDMENTS` block opens with
 * `count: N`. That is a DENOMINATOR WRITTEN BY THE AUTHOR, and it is the one number a reader of her
 * returns cannot talk itself out of: if the block says thirteen and the reader extracts nought, the
 * reader is broken and says so, with no judgement required from anybody.
 *
 * **This is the guard the three declared shapes could not be.** `describeShapes()` printed the
 * shapes truthfully on every run — R60's discipline, operating exactly as designed — and it could
 * not help, because nothing compared the declared shapes against the shapes the SOURCE actually
 * used. A count comes from the other side of that gap.
 */
export function declaredCounts(dir: string): Array<{ file: string; declared: number }> {
  const out: Array<{ file: string; declared: number }> = [];
  for (const f of readdirSync(dir).filter((x) => /^annie-.*return.*\.md$/.test(x)).sort()) {
    for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/^[ \t]*count:[ \t]*(\d+)[ \t]*$/gm)) {
      out.push({ file: f, declared: Number(m[1]) });
    }
  }
  return out;
}

export function describeShapes(): string {
  return SHAPES.map((s) => `    ${s.name}: ${s.describe}`).join('\n');
}
