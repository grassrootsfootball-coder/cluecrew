import { bursaryCapacity } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { inviteStaffAction } from '@/lib/actions/staff-invites';
import { currentStaff } from '@/lib/staff';

export default async function AdminOverview() {
  const staff = await currentStaff();
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
      {staff?.effectiveRole === 'ADMIN' ? (
        <div className="cc-card">
          <h2 style={{ marginTop: 0 }}>Invite a staff member</h2>
          <p className="cc-muted">
            They set their own password and connect an authenticator on acceptance — no
            credentials ever travel by hand.
          </p>
          <form className="cc-form" action={inviteStaffAction}>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Role
              <select name="role" defaultValue="REVIEWER">
                <option value="REVIEWER">Reviewer</option>
                <option value="AUTHOR">Author</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <button className="cc-button" type="submit">
              Send invite
            </button>
          </form>
        </div>
      ) : null}
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
