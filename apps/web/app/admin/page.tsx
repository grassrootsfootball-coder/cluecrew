import { bursaryCapacity } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';

export default async function AdminOverview() {
  const [draft, reviewed, live, misconceptions, words, regions, pendingBursaries, approvedBursaries, paidSubs] =
    await Promise.all([
      prisma.item.count({ where: { status: 'DRAFT' } }),
      prisma.item.count({ where: { status: 'REVIEWED' } }),
      prisma.item.count({ where: { status: 'LIVE' } }),
      prisma.misconception.count(),
      prisma.word.count(),
      prisma.region.count(),
      prisma.bursaryApplication.count({ where: { status: { in: ['RECEIVED', 'WAITLISTED'] } } }),
      prisma.bursaryApplication.count({ where: { status: 'APPROVED' } }),
      prisma.subscription.count({ where: { status: 'active', isBursary: false } }),
    ]);

  const capacity = bursaryCapacity(paidSubs);

  return (
    <main className="cc-container">
      <h1>Overview</h1>
      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Item bank</h2>
        <p>
          Draft: {draft} · Reviewed (ready to publish): {reviewed} · Live: {live}
        </p>
      </div>
      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Libraries</h2>
        <p>
          Misconceptions: {misconceptions} · Words: {words} · Regions: {regions}
        </p>
      </div>
      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Bursary capacity</h2>
        <p>
          Paid subscriptions: {paidSubs} → places unlocked: {capacity} · Approved: {approvedBursaries} ·
          Awaiting review: {pendingBursaries}
        </p>
      </div>
    </main>
  );
}
