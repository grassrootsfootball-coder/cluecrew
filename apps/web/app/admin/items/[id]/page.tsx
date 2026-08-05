import { notFound } from 'next/navigation';
import { prisma } from '@cluecrew/db';
import {
  markReviewedAction,
  publishItemAction,
  retireItemAction,
  returnWithNotesAction,
  updateItemAction,
  clearSimilarityAction,
} from '@/lib/actions/admin-items';
import { ItemFormFields } from '@/components/item-form';
import { currentStaff, roleAllows } from '@/lib/staff';
import { shuffleOptionsForChild } from '@/lib/crew/shuffle';
import { optionLabel } from '@/components/crew/engines/shared';

const ERROR_COPY: Record<string, string> = {
  'missing-misconceptions':
    'Blocked: every incorrect option must map to a tagged misconception before this item can go LIVE (P3).',
  'not-reviewed': 'Blocked: the item must be marked REVIEWED by a reviewer first.',
  'own-item': 'Blocked: an item cannot be reviewed by its own author — a different person must check it.',
  'no-correct-option': 'Blocked: the item has no correct option.',
  locked: 'LIVE and RETIRED items cannot be edited; retire and re-author instead.',
  'similarity-review':
    'Blocked: the similarity gate flagged this item. A reviewer must judge coincidence vs derivation and clear it with a note first (Addendum E §3).',
  // No "clear it with a note" here, unlike the similarity flag above. This is
  // not a judgement a reviewer can make — the item's own rule does not produce
  // its key, so a child cannot answer it correctly whatever anyone signs.
  unanswerable:
    'Blocked: this item has no derivable answer. Its own rule either produces nothing or produces something other than the key, so it cannot be signed off — it has to be fixed or retired. Run pnpm check:word-puzzles for the detail.',
  'unapproved-misconception':
    'Blocked: one or more misconception ids are still PROPOSED. Approve them in the misconception queue first (Addendum E §2).',
};

export default async function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const staff = await currentStaff();
  // The layout renders the sign-in form when there is no staff session,
  // but a layout does not gate its page: in the App Router both render in
  // parallel, so this ran with null and threw on effectiveRole. Render
  // nothing and let the layout own the signed-out view.
  if (!staff) return null;

  const item = await prisma.item.findUnique({
    where: { id },
    include: { options: true, questionType: true },
  });
  if (!item) notFound();

  const questionTypes = await prisma.questionType.findMany({ orderBy: { id: 'asc' } });
  const canReview = roleAllows(staff.effectiveRole, ['REVIEWER']);
  const editable = item.status === 'DRAFT' || item.status === 'REVIEWED';

  return (
    <main className="cc-container">
      <h1>
        Item {item.id.slice(0, 12)}… · {item.status}
      </h1>
      <p className="cc-muted">
        {item.questionType.name} · authored by {item.authoredBy}
        {item.reviewedBy ? ` · reviewed by ${item.reviewedBy}` : ''}
      </p>
      {error ? <p role="alert">{ERROR_COPY[error] ?? 'That action was blocked.'}</p> : null}
      {item.reviewNotes ? (
        <div className="cc-card">
          <strong>Returned with notes:</strong> {item.reviewNotes}
        </div>
      ) : null}

      {item.similarityFlaggedAt ? (
        <div className="cc-card" data-testid="similarity-flag">
          <strong>SIMILARITY_REVIEW</strong> — the gate scored this item{' '}
          {item.similarityScore?.toFixed(3)} against the source index. No matched text is shown
          anywhere, by design (Addendum E §3): judge whether this is coincidence (only so many ways
          to ask this type) or derivation, and clear with a note — or return it to the author.
          {item.similarityClearedBy ? (
            <p style={{ marginBottom: 0 }}>
              Cleared by {item.similarityClearedBy}: {item.similarityClearNote}
            </p>
          ) : canReview ? (
            <form action={clearSimilarityAction} className="cc-form" style={{ marginTop: '0.5rem' }}>
              <input type="hidden" name="itemId" value={item.id} />
              <label>
                Why this is coincidence, not derivation
                <input name="note" type="text" required minLength={5} maxLength={1000} />
              </label>
              <button className="cc-button-quiet" type="submit">
                Clear the flag (logged)
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {editable ? (
        <form className="cc-form" action={updateItemAction} style={{ maxWidth: 640 }}>
          <input type="hidden" name="itemId" value={item.id} />
          <ItemFormFields
            questionTypes={questionTypes}
            defaults={{
              questionTypeId: item.questionTypeId,
              difficultyTier: item.difficultyTier,
              stem: item.stem,
              explanation: item.explanation,
              options: item.options,
            }}
          />
          <button className="cc-button-quiet" type="submit">
            Save changes (returns to DRAFT)
          </button>
        </form>
      ) : (
        <pre className="cc-card" style={{ overflowX: 'auto' }}>
          {JSON.stringify({ stem: item.stem, options: item.options.map((option) => ({ content: option.content, isCorrect: option.isCorrect, misconceptionId: option.misconceptionId })) }, null, 2)}
        </pre>
      )}

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Child view (review what children see)</h2>
        <p className="cc-muted">
          Options are served in a seeded shuffle per child — never in authored order. This preview
          uses your reviewer seed; each child sees their own stable order.
        </p>
        <ol style={{ listStyle: 'none', paddingLeft: 0 }}>
          {shuffleOptionsForChild(item.options, staff.id, item.id).map((option, index) => (
            <li key={option.id} style={{ margin: '0.3rem 0' }}>
              <span className="cc-muted">{String.fromCharCode(65 + index)}.</span>{' '}
              {optionLabel(option.content)}
              {option.isCorrect ? ' ✓' : ''}
            </li>
          ))}
        </ol>
      </div>

      {canReview ? (
        <div className="cc-card">
          <h2 style={{ marginTop: 0 }}>Review actions</h2>
          {item.status === 'DRAFT' ? (
            <>
              <form action={markReviewedAction} style={{ display: 'inline-block', marginRight: '0.75rem' }}>
                <input type="hidden" name="itemId" value={item.id} />
                <button className="cc-button" type="submit">
                  Mark REVIEWED
                </button>
              </form>
              <form className="cc-form" action={returnWithNotesAction} style={{ marginTop: '0.75rem' }}>
                <input type="hidden" name="itemId" value={item.id} />
                <label>
                  Return with notes
                  <textarea name="notes" rows={2} required />
                </label>
                <button className="cc-button-quiet" type="submit">
                  Return to author
                </button>
              </form>
            </>
          ) : null}
          {item.status === 'REVIEWED' ? (
            <form action={publishItemAction} style={{ display: 'inline-block', marginRight: '0.75rem' }}>
              <input type="hidden" name="itemId" value={item.id} />
              <button className="cc-button" type="submit">
                Publish LIVE
              </button>
            </form>
          ) : null}
          {item.status === 'LIVE' ? (
            <form action={retireItemAction} style={{ display: 'inline-block' }}>
              <input type="hidden" name="itemId" value={item.id} />
              <button className="cc-button-quiet" type="submit">
                Retire
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
