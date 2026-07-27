import { prisma } from '@cluecrew/db';

export default async function AuditLogPage() {
  const entries = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const actorIds = [...new Set(entries.map((entry) => entry.actorId))];
  const actors = await prisma.parentAccount.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, email: true },
  });
  const emailById = new Map(actors.map((actor) => [actor.id, actor.email]));

  return (
    <main className="cc-container">
      <h1>Audit log</h1>
      <table className="cc-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Who</th>
            <th>Action</th>
            <th>Target</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.createdAt.toLocaleString('en-GB')}</td>
              <td>{emailById.get(entry.actorId) ?? entry.actorId}</td>
              <td>{entry.action}</td>
              <td>
                {entry.targetKind} {entry.targetId.slice(0, 12)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length === 0 ? <p>No admin actions recorded yet.</p> : null}
    </main>
  );
}
