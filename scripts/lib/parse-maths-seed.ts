/**
 * Parses the reviewer's maths seed .md into structured entries. Shared by the
 * importer and the hints-to-reword export so both read her file identically.
 */
export interface MathsSeedEntry {
  n: number;
  title: string;
  description: string;
  hint: string;
  category: string;
  id: string;
}

export function kebab(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function parseMathsSeed(md: string): MathsSeedEntry[] {
  const entries: MathsSeedEntry[] = [];
  let category = '';
  let pending: Omit<MathsSeedEntry, 'hint'> | null = null;
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    // Category header: `## N. Name` (original library) or `### Name` (her
    // additions file). A `## ` line with no leading number is a section header
    // (TIER RULINGS, IMPORT NOTES) and is deliberately not a category.
    const group = /^##\s+\d+\.\s+(.+)$/.exec(line) ?? /^###\s+(.+)$/.exec(line);
    if (group) { category = group[1]!.trim(); continue; }
    const head = /^\*\*(\d+)\.\s+(.+?)\*\*\s+[—-]+\s+(.+)$/.exec(line);
    if (head) {
      const n = Number(head[1]);
      pending = { n, title: head[2]!.trim(), description: head[3]!.trim(), category, id: `maths-${String(n).padStart(2, '0')}-${kebab(head[2]!)}` };
      continue;
    }
    const hint = /^\*Hint:\*\s+(.+)$/.exec(line);
    if (hint && pending) { entries.push({ ...pending, hint: hint[1]!.trim() }); pending = null; }
  }
  return entries;
}

/**
 * The reworded file gives each held entry as `**N. Title**` then the new hint
 * on the following line — no description or *Hint:* prefix. Returns N → hint.
 */
export function parseMathsReworded(md: string): Map<number, string> {
  const out = new Map<number, string>();
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const head = /^\*\*(\d+)\.\s+.+\*\*$/.exec(lines[i]!.trim());
    if (!head) continue;
    for (let j = i + 1; j < lines.length; j += 1) {
      const t = lines[j]!.trim();
      if (!t || t.startsWith('#') || t.startsWith('**') || t === '---') continue;
      out.set(Number(head[1]), t);
      break;
    }
  }
  return out;
}
