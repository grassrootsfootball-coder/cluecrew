import { notFound } from 'next/navigation';
import { prisma } from '@cluecrew/db';
import {
  markReviewedAction,
  publishItemAction,
  retireItemAction,
  returnWithNotesAction,
  updateItemAction,
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
