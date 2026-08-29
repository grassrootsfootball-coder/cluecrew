/**
 * WHAT A REVIEWER NEEDS TO SIGN A MATHS ITEM (R856).
 *
 * The refusal was the first half and it was correct: **the surface renders the item or refuses the
 * action.** This is the other half. Until now the admin page showed a maths item's id, status, type
 * name and author — **no options, no key flag, no misconception, no execution, no hint, no walk
 * script** — and a signature taken against that page would have recorded that somebody did not look.
 *
 * A maths item cannot be judged from a stem alone. The reviewer needs, per option: its VALUE, which
 * one is keyed, the misconception it executes and the hint a child is told. The walk script is the
 * explanation she is signing off as much as the stem is.
 *
 * IT READS, IT NEVER WRITES. The verdict is taken by the existing actions on the page.
 */
export interface MathsReviewItem {
  id: string;
  stem: unknown;
  explanation: unknown;
  options: Array<{
    id: string;
    content: unknown;
    isCorrect: boolean;
    misconceptionId: string | null;
    misconceptionExecution: string | null;
  }>;
}

const asText = (c: unknown): string =>
  typeof c === 'string' ? c
    : c && typeof c === 'object' && 'value' in c ? String((c as { value: unknown }).value) : '';
const label = (c: unknown): string =>
  c && typeof c === 'object' && 'label' in c ? String((c as { label: unknown }).label ?? '') : '';
const field = (o: unknown, k: string): string | null => {
  if (!o || typeof o !== 'object') return null;
  const v = (o as Record<string, unknown>)[k];
  return typeof v === 'string' && v.trim() ? v : null;
};

export function MathsReview({
  item, hints,
}: {
  item: MathsReviewItem;
  /** misconceptionId → childHint, so the reviewer sees what the child would actually be told. */
  hints: Record<string, { childHint: string | null; description: string | null; status: string }>;
}) {
  const stemText = field(item.stem, 'text') ?? field(item.stem, 'prompt') ?? '';
  const walk = field(item.explanation, 'walkScript');
  const hintCore = field(item.explanation, 'hintCore');
  const collision = item.explanation && typeof item.explanation === 'object'
    ? (item.explanation as Record<string, unknown>)._stemCollisionResolved as Record<string, unknown> | undefined
    : undefined;

  return (
    <section className="cc-card" data-testid="maths-review">
      <h2>The item as she has to judge it</h2>

      <p style={{ fontSize: '1.1rem' }}>{stemText || <em>no stem text</em>}</p>

      <table className="cc-table">
        <caption>Options — the key is marked, and every distractor shows the error it executes</caption>
        <thead>
          <tr><th scope="col">Label</th><th scope="col">Value</th><th scope="col">Key</th><th scope="col">Misconception</th><th scope="col">How this option executes it</th><th scope="col">What the child is told</th></tr>
        </thead>
        <tbody>
          {item.options.map((o) => {
            const tag = o.misconceptionId;
            const hint = tag ? hints[tag] : undefined;
            return (
              <tr key={o.id}>
                <td>{label(o.content) || '—'}</td>
                <td>{asText(o.content)}</td>
                <td>{o.isCorrect ? <strong>KEY</strong> : ''}</td>
                <td>
                  {o.isCorrect ? <em>n/a — the key executes nothing</em>
                    : tag ? <>{tag}{hint?.status && hint.status !== 'ACTIVE' ? <> <strong>[{hint.status}]</strong></> : null}</>
                      : <strong>NOT TAGGED — this blocks the verdict</strong>}
                </td>
                <td>{o.misconceptionExecution ?? (o.isCorrect ? '' : <em>not recorded</em>)}</td>
                <td>{o.isCorrect ? '' : (hint?.childHint ?? <em>the library entry carries no hint</em>)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>The hint this item serves</h3>
      <p>{hintCore ?? <em>no item hint — the library hint serves</em>}</p>

      <h3>The walk script</h3>
      <p>{walk ?? <em>no walk script</em>}</p>

      {collision ? (
        <>
          <h3>This id carried more than one question</h3>
          <p>
            {String(collision.variantsUnderThisId)} variants; the one below was chosen and the rest
            are retired to the shelf, not discarded. <em>{String(collision.reason ?? '')}</em>
          </p>
        </>
      ) : null}
    </section>
  );
}
