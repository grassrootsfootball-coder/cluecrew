import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * WHAT A REVIEWER NEEDS TO SIGN AN ENGLISH COMPREHENSION ITEM.
 *
 * Annie has signed VR, NVR, maths and SpaG. She has never seen a comprehension item, and there are
 * zero SIGNED events on ENG. The verdict machinery already worked — `markReviewedAction`,
 * `returnWithNotesAction`, `recordSignature`. **What did not exist was anything that renders the
 * item as she has to judge it.** The item page showed options and a correct flag: no passage, no
 * line numbers, no hint, no walk script, no execution note. A retrieval item cannot be judged
 * without the lines it cites, and a distractor cannot be judged without the error it executes.
 *
 * So this renders, for one item: the PASSAGE with numbered lines and the cited window marked, the
 * stem with its declared quotations, every option with its key flag, its misconception and the
 * note saying how that option executes it, the child-facing hint, and the walk script.
 *
 * IT READS, IT NEVER WRITES. The verdict is taken by the existing actions on the page.
 */

const PASSAGE_DIR = resolve(process.cwd(), '../../content/passages');

interface Line { n: number; text: string }

function loadLines(passageRef: string): Line[] | null {
  try {
    const raw = readFileSync(join(PASSAGE_DIR, `${passageRef}.json`), 'utf8');
    const d = JSON.parse(raw) as { numberedLines?: Line[] };
    return Array.isArray(d.numberedLines) ? d.numberedLines : null;
  } catch {
    return null;
  }
}

export interface ReviewItem {
  id: string;
  stem: unknown;
  explanation: unknown;
  lineRefs: unknown;
  clusterPosition: number | null;
  options: Array<{
    id: string;
    content: unknown;
    isCorrect: boolean;
    misconceptionId: string | null;
    misconceptionExecution: string | null;
    senseTarget: string | null;
    tagStatus: string | null;
  }>;
}

const asText = (c: unknown): string =>
  typeof c === 'string' ? c
    : c && typeof c === 'object' && 'value' in c ? String((c as { value: unknown }).value) : '';

export function ComprehensionReview({
  item, hints,
}: {
  item: ReviewItem;
  /** misconceptionId → childHint, so the reviewer sees what the child would be told. */
  hints: Record<string, { childHint: string; description: string; status: string }>;
}) {
  const stem = (item.stem ?? {}) as Record<string, unknown>;
  const explanation = (item.explanation ?? {}) as Record<string, unknown>;
  const passageRef = typeof stem.passageRef === 'string' ? stem.passageRef : null;
  const refs = Array.isArray(item.lineRefs) ? (item.lineRefs as number[]) : [];
  const cited = new Set(refs);
  const lines = passageRef ? loadLines(passageRef) : null;
  const quotes = Array.isArray(stem.quotes) ? (stem.quotes as unknown[]) : [];
  const walk = explanation.walkScript;

  return (
    <section className="cc-card" data-testid="comprehension-review">
      <h2>Review surface</h2>

      {/* THE PASSAGE. A citation cannot be checked without the lines it names. */}
      <h3>Passage {passageRef ? <code>{passageRef}</code> : <em>— none declared</em>}</h3>
      {passageRef && !lines ? (
        <p role="alert">
          Passage <code>{passageRef}</code> is declared but could not be read. The citations below
          cannot be checked against anything.
        </p>
      ) : null}
      {lines ? (
        <ol data-testid="passage-lines" style={{ listStyle: 'none', paddingLeft: 0 }}>
          {lines.map((l) => (
            <li
              key={l.n}
              data-cited={cited.has(l.n) ? 'yes' : 'no'}
              style={{
                background: cited.has(l.n) ? 'rgba(255,214,102,0.35)' : undefined,
                padding: '0.1rem 0.3rem',
              }}
            >
              <code style={{ opacity: 0.6 }}>{String(l.n).padStart(3, ' ')}</code> {l.text}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="cc-muted">
        Item cites {refs.length ? `line(s) ${refs.join(', ')}` : 'no lines'} · serve position{' '}
        {item.clusterPosition ?? '—'}
      </p>

      {/* THE STEM, and any quotation it declares exempt from a child-facing ceiling. */}
      <h3>Stem</h3>
      <p data-testid="stem-text">{String(stem.text ?? stem.prompt ?? '')}</p>
      {quotes.length ? (
        <ul data-testid="stem-quotes">
          {quotes.map((q, i) => {
            const o = (typeof q === 'object' && q !== null ? q : {}) as Record<string, unknown>;
            const text = typeof q === 'string' ? q : String(o.text ?? '');
            const exempt = Array.isArray(o.exemptFrom) ? (o.exemptFrom as string[]) : [];
            const at = Array.isArray(o.lineRefs) ? (o.lineRefs as number[]) : [];
            return (
              <li key={i}>
                “{text}”
                {at.length ? <> · at line(s) {at.join(', ')}</> : <> · <em>declares no place</em></>}
                {exempt.length ? <> · exempt from {exempt.join(', ')}</> : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* THE OPTIONS, each with the error it executes and how. */}
      <h3>Options</h3>
      <table data-testid="review-options">
        <thead>
          <tr><th>Key</th><th>Text</th><th>Misconception</th><th>How this option executes it</th></tr>
        </thead>
        <tbody>
          {item.options.map((o) => {
            const h = o.misconceptionId ? hints[o.misconceptionId] : undefined;
            return (
              <tr key={o.id} data-correct={o.isCorrect ? 'yes' : 'no'}>
                <td>{o.isCorrect ? <strong>KEY</strong> : ''}</td>
                <td>{asText(o.content)}</td>
                <td>
                  {o.misconceptionId ? (
                    <>
                      <code>{o.misconceptionId}</code>
                      {h ? <> · {h.status}</> : <> · <strong>NOT IN THE LIBRARY</strong></>}
                      {o.tagStatus ? <> · tag {o.tagStatus}</> : null}
                      {o.senseTarget ? <> · sense “{o.senseTarget}”</> : null}
                      {h ? <div className="cc-muted">{h.description}</div> : null}
                      {h ? <div>Child sees: “{h.childHint}”</div> : null}
                    </>
                  ) : o.isCorrect ? '—' : <strong>UNTAGGED</strong>}
                </td>
                <td>{o.misconceptionExecution ?? <em>not recorded</em>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* THE WALK SCRIPT, which is what the child is taken through after answering. */}
      <h3>Walk script</h3>
      {Array.isArray(walk) && walk.length ? (
        <ol data-testid="walk-script">
          {(walk as unknown[]).map((s, i) => (
            <li key={i}>{typeof s === 'string' ? s : String((s as { text?: unknown })?.text ?? JSON.stringify(s))}</li>
          ))}
        </ol>
      ) : (
        <p><em>none recorded</em></p>
      )}
      {typeof explanation.hintCore === 'string' ? (
        <p><strong>Hint core:</strong> {explanation.hintCore}</p>
      ) : null}
    </section>
  );
}
