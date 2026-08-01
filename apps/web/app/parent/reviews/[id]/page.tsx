import { notFound } from 'next/navigation';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';

/**
 * One released teacher review (AMENDMENT-1 §3) — the parent's page, never the
 * child's. The video reference resolves against private media storage; until
 * that storage is wired, the reference itself is shown.
 */
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const parent = await currentParent();
  if (!parent) return null;
  const { id } = await params;
  const review = await prisma.reviewRecording.findUnique({
    where: { id },
    include: { child: { select: { parentId: true, crewName: true } } },
  });
  if (!review || review.child.parentId !== parent.id || review.status !== 'RELEASED') notFound();

  return (
    <main className="cc-container">
      <h1>
        {review.child.crewName} — {review.month}
      </h1>
      <p className="cc-muted">
        Recorded by a qualified teacher from the same dashboard you see: what&apos;s going well,
        one focus for the month, one thing to try at home. You may enjoy watching it together —
        that&apos;s your call, not ours.
      </p>
      <div className="cc-card">
        {/* Private media playback lands with storage wiring; the reference is
            the placeholder until then. */}
        <p>Recording: {review.videoRef}</p>
      </div>
    </main>
  );
}
