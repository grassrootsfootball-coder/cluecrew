import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { billingNow } from '@/lib/billing';

export default async function ParentDashboard() {
  const parent = (await currentParent())!;
  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  const subscription = await prisma.subscription.findUnique({ where: { parentId: parent.id } });

  const now = billingNow();
  const trialDaysLeft =
    subscription?.status === 'trialing' && subscription.trialEndsAt
      ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / 86_400_000))
      : null;

  const checklist: Array<{ label: string; done: boolean }> = [
    { label: 'Verify your email', done: Boolean(parent.emailVerified) },
    { label: 'Create a child profile', done: children.length > 0 },
    { label: 'Tell us your area or target schools', done: Boolean(parent.regionCode) },
    { label: 'Start your free trial', done: Boolean(subscription) },
    { label: 'Explore the Parents’ Casebook (arriving soon)', done: false },
  ];

  return (
    <main className="cc-container">
      <h1>Hello, {parent.displayName}</h1>

      {trialDaysLeft !== null ? (
        <div className="cc-card">
          <strong>
            Trial: {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} remaining.
          </strong>{' '}
          <span className="cc-muted">
            Add payment details any time in <a href="/parent/billing">Billing</a> — if you do
            nothing, the trial simply ends and nothing is charged. Your child sees none of this.
          </span>
        </div>
      ) : null}

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Your crew</h2>
        {children.length === 0 ? (
          <p>
            No profiles yet — <a href="/onboarding">set one up</a>.
          </p>
        ) : (
          <ul>
            {children.map((child) => (
              <li key={child.id}>
                {child.crewName} — Year {child.yearGroup}
                {child.examYear ? `, aiming for September ${child.examYear}` : ''}
              </li>
            ))}
          </ul>
        )}
        <p className="cc-muted">
          The learning app for children arrives with the next build phase — progress will appear
          here.
        </p>
      </div>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>What happens next</h2>
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {checklist.map((item) => (
            <li key={item.label}>
              {item.done ? '✅' : '⬜️'} {item.label}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
