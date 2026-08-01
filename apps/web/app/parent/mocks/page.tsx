import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { MocksPanel } from '@/components/parent/mocks-panel';

/**
 * Practice papers (ADDENDUM-B): parents schedule from here within the cadence
 * cap; results appear here at reporting Stage 1 — and nowhere is a prediction.
 */
export default async function ParentMocksPage() {
  const parent = await currentParent();
  if (!parent) return null; // parent layout owns the signed-out view

  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id, deletedAt: null },
    select: { id: true, crewName: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <main className="cc-container">
      <h1>Practice papers</h1>
      <p>
        A full paper under real conditions: timed sections, plain formatting, no tools, no mascot.
        Your child sits it from Crew HQ; you book it here and the results come back to this page.
      </p>
      {children.length === 0 ? (
        <div className="cc-card">
          <h2 style={{ marginTop: 0 }}>First things first</h2>
          <p style={{ marginBottom: 0 }}>
            Papers belong to a detective, and you haven&apos;t set one up yet. Two minutes in{' '}
            <a href="/onboarding">onboarding</a> and this page will be ready when they are — no
            paper is worth sitting before the practice feels easy.
          </p>
        </div>
      ) : (
        children.map((child) => (
          <MocksPanel key={child.id} childId={child.id} crewName={child.crewName} />
        ))
      )}
    </main>
  );
}
