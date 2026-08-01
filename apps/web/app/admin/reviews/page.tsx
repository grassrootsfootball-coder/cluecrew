import { prisma } from '@cluecrew/db';
import {
  ensureMonthlyQueue,
  recordReviewAction,
  releaseReviewAction,
  rerecordReviewAction,
} from '@/lib/actions/reviews';
import { currentStaff } from '@/lib/staff';

/**
 * The Crew Plus review queue (AMENDMENT-1 §3). The teacher sees the child's
 * progress SNAPSHOT only — crewName, year group, dashboards; Phase 1
 * minimisation means there is nothing else to see. Item-level child writing
 * is out of scope.
 */
export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const staff = await currentStaff();
  if (!staff) return null;
  const { error } = await searchParams;
  await ensureMonthlyQueue();

  const reviews = await prisma.reviewRecording.findMany({
    where: { status: { in: ['QUEUED', 'RECORDED'] } },
    include: { child: { select: { crewName: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <main className="cc-container">
      <h1>Teacher reviews</h1>
      <p className="cc-muted">
        Recorded for the parent, about the child, per the recording guide
        (docs/review-recording-guide.md): method-praised strengths, one focus, one at-home
        suggestion. No predictions, no comparisons, no urgency (L1). Failing the checklist means
        re-recording, not editing.
      </p>
      {error === 'own-recording' ? (
        <p role="alert">Blocked: the recorder cannot spot-check their own review.</p>
      ) : null}

      {reviews.length === 0 ? <p className="cc-muted">Queue clear.</p> : null}
      {reviews.map((review) => (
        <section className="cc-card" key={review.id} data-testid={`review-${review.status}`}>
          <strong>{review.child.crewName}</strong> · {review.month} · {review.status}
          {review.status === 'QUEUED' ? (
            <form className="cc-form" action={recordReviewAction}>
              <input type="hidden" name="id" value={review.id} />
              <label>
                Recording reference (private storage path)
                <input name="videoRef" type="text" required maxLength={300} />
              </label>
              <label className="cc-checkbox">
                <input type="checkbox" name="checklist" required /> I attest this recording follows
                the checklist: strengths method-praised, one focus, one at-home step, no
                predictions, no comparisons, no urgency.
              </label>
              <button className="cc-button-quiet" type="submit">
                Mark recorded
              </button>
            </form>
          ) : (
            <div>
              <p className="cc-muted">
                Recorded by {review.checklistAttestedBy} · ref {review.videoRef}
              </p>
              <form action={releaseReviewAction} style={{ display: 'inline' }}>
                <input type="hidden" name="id" value={review.id} />
                <button className="cc-button" type="submit">
                  Spot-check passed — release to the parent
                </button>
              </form>{' '}
              <form action={rerecordReviewAction} style={{ display: 'inline' }}>
                <input type="hidden" name="id" value={review.id} />
                <button className="cc-button-quiet" type="submit">
                  Failed checklist — re-record
                </button>
              </form>
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
