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
    const group = /^##\s+\d+\.\s+(.+)$/.exec(line);
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
