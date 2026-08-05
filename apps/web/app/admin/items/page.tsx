import { prisma, type ItemStatus } from '@cluecrew/db';
import { bulkMarkReviewedAction } from '@/lib/actions/admin-items';
import { SelectAll } from '@/components/admin/select-all';
import { ScrollTo } from '@/components/admin/scroll-to';
import { currentStaff } from '@/lib/staff';

const STATUSES: ItemStatus[] = ['DRAFT', 'REVIEWED', 'LIVE', 'RETIRED'];

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    imported?: string;
    flagged?: string;
    reviewed?: string;
    skipped?: string;
    error?: string;
  }>;
}) {
  const { status, imported, flagged, reviewed, skipped, error } = await searchParams;
  const filter = STATUSES.includes(status as ItemStatus) ? (status as ItemStatus) : undefined;
  const staff = await currentStaff();

  const items = await prisma.item.findMany({
    where: {
      ...(filter ? { status: filter } : {}),
      // Calibration QC queue (Phase 3 §2): drifted ≥1.5 tiers from authored.
      ...(flagged ? { calibrationFlaggedAt: { not: null } } : {}),
    },
    include: { questionType: true, options: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  // A reviewer's queue is the drafts they did not write: bulk review is
  // offered only over items they could actually pass (P3/AI-QC), so the
  // checklist never contains a row that is certain to be refused.
  const mine = `human:${staff?.email ?? ''}`;
  const reviewable = items.filter((item) => item.status === 'DRAFT' && item.authoredBy !== mine);
  const showQueue = filter === 'DRAFT' && reviewable.length > 0;

  return (
    <main className="cc-container">
      <ScrollTo targetId="queue" when={Boolean(reviewed || skipped)} />
      <h1>Items</h1>
      {imported ? <p role="status">Imported {imported} item(s) as DRAFT.</p> : null}
      {reviewed ? (
        <p role="status" className="cc-notice">
          Marked {reviewed} item(s) as reviewed.
        </p>
      ) : null}
      {skipped ? (
        <p role="alert" className="cc-notice-alert">
          Not done: {decodeURIComponent(skipped)}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="cc-notice-alert">
          {decodeURIComponent(error)}
        </p>
      ) : null}
      <p>
        <a className="cc-button" href="/admin/items/new">
          New item
        </a>
      </p>
      <p className="cc-muted">
        Filter: <a href="/admin/items">all</a>
        {STATUSES.map((value) => (
          <span key={value}>
            {' · '}
            <a href={`/admin/items?status=${value}`}>
              {value === 'DRAFT' ? 'DRAFT (waiting for review)' : value}
            </a>
          </span>
        ))}
        {' · '}
        <a href="/admin/items?flagged=1">calibration-flagged</a>
      </p>

      {showQueue ? (
        <div className="cc-card" id="queue">
          <h2 style={{ marginTop: 0 }}>Waiting for your review ({reviewable.length})</h2>
          <p>
            Tick the ones you are happy with and mark them in one go. Your name goes on each.
            Anything that cannot pass — a missing misconception tag, an uncleared similarity flag —
            is listed back to you rather than silently skipped.
          </p>
          <form
            id="bulk-review"
            className="cc-form cc-form-wide"
            action={bulkMarkReviewedAction}
            data-testid="bulk-review-form"
          >
            <SelectAll name="itemIds" formId="bulk-review" />
            <ol className="cc-checklist">
              {reviewable.map((item) => (
                <li key={item.id}>
                  <label>
                    <input type="checkbox" name="itemIds" value={item.id} />{' '}
                    <strong>{item.questionType.name}</strong>
                  </label>
                  <p className="cc-muted">
                    Tier {item.difficultyTier} · {item.options.length} options · written by{' '}
                    {item.authoredBy} · <a href={`/admin/items/${item.id}`}>open it</a>
                  </p>
                </li>
              ))}
            </ol>
            <button className="cc-button" type="submit" data-testid="bulk-review-submit">
              Mark the ones I ticked as reviewed
            </button>
          </form>
        </div>
      ) : null}

      <table className="cc-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Type</th>
            <th>Status</th>
            <th>Tier</th>
            <th>Provenance</th>
            <th>Options</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <a href={`/admin/items/${item.id}`}>{item.id.slice(0, 12)}…</a>
              </td>
              <td>{item.questionType.name}</td>
              <td>{item.status}</td>
              <td>{item.difficultyTier}</td>
              <td>{item.authoredBy}</td>
              <td>{item.options.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
