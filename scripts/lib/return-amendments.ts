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
  /** The entry the amendment targets, when the shape carries one. */
  targetId: string | null;
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
    read: (m: RegExpMatchArray) => ({ targetId: m[1], replacing: m[2], authored: m[3] }),
  },
  {
    name: 'LABELLED',
    describe: '- authored: **new text**   (no target carried)',
    re: /^\s*[-*]?\s*(?:authored|Authored|replacement)\s*:\s*\*\*(.+?)\*\*/gm,
    read: (m: RegExpMatchArray) => ({ targetId: null, replacing: null, authored: m[1] }),
  },
] as const;

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
        const authored = tidy(r.authored).replace(/\.$/, '');
        const key = `${f}|${authored}`;
        const existing = byKey.get(key);
        // A record WITH a target supersedes the same wording read without one.
        if (existing && (existing.targetId !== null || r.targetId === null)) continue;
        byKey.set(key, {
          targetId: r.targetId,
          replacing: r.replacing ? tidy(r.replacing) : null,
          authored, file: f, when,
        });
      }
    }
  }
  return { amendments: [...byKey.values()], files };
}

export function describeShapes(): string {
  return SHAPES.map((s) => `    ${s.name}: ${s.describe}`).join('\n');
}
