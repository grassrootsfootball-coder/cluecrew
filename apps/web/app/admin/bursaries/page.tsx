import { bursaryCapacity } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import {
  approveBursaryAction,
  declineBursaryAction,
  waitlistBursaryAction,
} from '@/lib/actions/admin-bursary';
import { currentStaff } from '@/lib/staff';

export default async function BursaryQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const staff = (await currentStaff())!;
  const { error } = await searchParams;
  const [applications, paidSubs, approvedCount] = await Promise.all([
    prisma.bursaryApplication.findMany({
      include: { parent: { select: { email: true, displayName: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.subscription.count({ where: { status: 'active', isBursary: false } }),
    prisma.bursaryApplication.count({ where: { status: 'APPROVED' } }),
  ]);
  const capacity = bursaryCapacity(paidSubs);
  const isAdmin = staff.effectiveRole === 'ADMIN';

  return (
    <main className="cc-container">
      <h1>Bursary queue</h1>
      <p>
        Capacity: <strong>{approvedCount} of {capacity}</strong> places used ({paidSubs} paid
        subscriptions → 1 place per 10).
      </p>
      {error === 'capacity' ? (
        <p role="alert">All places are currently taken — waitlist the application instead.</p>
      ) : null}
      {!isAdmin ? <p className="cc-muted">Decisions require the ADMIN role.</p> : null}

      {applications.map((application) => (
        <div className="cc-card" key={application.id}>
          <h2 style={{ marginTop: 0 }}>
            {application.parent.displayName}{' '}
            <span className="cc-muted">({application.parent.email})</span>
          </h2>
          <p>
            Status: <strong>{application.status}</strong> · Basis:{' '}
            {application.confirmation === 'fsm' ? 'Free school meals' : 'Pupil premium'} · Applied{' '}
            {application.createdAt.toLocaleDateString('en-GB')}
            {application.decidedAt ? ` · Decided ${application.decidedAt.toLocaleDateString('en-GB')}` : ''}
          </p>
          <p className="cc-muted">
            Evidence:{' '}
            {application.evidence ? (
              <a href={`/api/admin/bursary-evidence/${application.id}`}>
                {application.evidenceName ?? 'download'}
              </a>
            ) : (
              'removed (30-day retention after decision)'
            )}
          </p>
          {isAdmin && (application.status === 'RECEIVED' || application.status === 'WAITLISTED') ? (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <form action={approveBursaryAction}>
                <input type="hidden" name="applicationId" value={application.id} />
                <button className="cc-button" type="submit">
                  Approve
                </button>
              </form>
              {application.status === 'RECEIVED' ? (
                <form action={waitlistBursaryAction}>
                  <input type="hidden" name="applicationId" value={application.id} />
                  <button className="cc-button-quiet" type="submit">
                    Waitlist
                  </button>
                </form>
              ) : null}
              <form action={declineBursaryAction}>
                <input type="hidden" name="applicationId" value={application.id} />
                <button className="cc-button-quiet" type="submit">
                  Decline
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ))}
      {applications.length === 0 ? <p>No applications yet.</p> : null}
    </main>
  );
}
