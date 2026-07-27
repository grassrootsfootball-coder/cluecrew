import { prisma, type ItemStatus } from '@cluecrew/db';

const STATUSES: ItemStatus[] = ['DRAFT', 'REVIEWED', 'LIVE', 'RETIRED'];

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; imported?: string; flagged?: string }>;
}) {
  const { status, imported, flagged } = await searchParams;
  const filter = STATUSES.includes(status as ItemStatus) ? (status as ItemStatus) : undefined;

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

  return (
    <main className="cc-container">
      <h1>Items</h1>
      {imported ? <p role="status">Imported {imported} item(s) as DRAFT.</p> : null}
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
            <a href={`/admin/items?status=${value}`}>{value}</a>
          </span>
        ))}
        {' · '}
        <a href="/admin/items?flagged=1">calibration-flagged</a>
      </p>
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
