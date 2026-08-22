/**
 * WHERE A VAULT WORD SITS IN A PASSAGE LINE (R638). Pure so it can be tested without a component
 * harness: the comprehension surface's WordTap wiring calls this and renders whatever it returns.
 *
 * First whole-word occurrence, first matching word wins, case kept from the passage bytes — the
 * line's own text is what renders, never the headword's casing. Word boundaries are letter-based,
 * so "tolerable" never fires inside "intolerable" and a phrase headword ("gave a disgust") matches
 * whole.
 */
export interface VaultWordHit {
  index: number;
  matched: string;
  word: { id: string; headword: string; definitionChild: string };
}

export function firstVaultWordMatch(
  text: string,
  words: ReadonlyArray<{ id: string; headword: string; definitionChild: string }>,
): VaultWordHit | null {
  for (const w of words) {
    const escaped = w.headword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, 'i');
    const m = re.exec(text);
    if (m) return { index: m.index, matched: m[0], word: w };
  }
  return null;
}
