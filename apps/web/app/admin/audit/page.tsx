import { prisma } from '@cluecrew/db';

/**
 * The audit log. One rule shapes this page (David's ruling, 2026-08-02): when
 * a decision was made by one person and entered by another, BOTH appear and
 * they are never merged. The actor column is who typed — which is true, and
 * on its own would be a lie by omission, because it would read as though the
 * admin made the reviewer's call. So a recorded decision renders its own row
 * shape, naming the decider first.
 */
interface RecordedDetail {
  approvedBy?: string;
  reviewedBy?: string;
  recordedBy?: string;
  method?: string;
  note?: string;
}

function decidedBy(detail: RecordedDetail): string | null {
  return detail.approvedBy ?? detail.reviewedBy ?? null;
}

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
      <p className="cc-muted">
        Where a decision was made by one person and entered by another, both are shown. They are
        stored separately and cannot be merged.
      </p>
      <table className="cc-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Whose decision</th>
            <th>Entered by</th>
            <th>Action</th>
            <th>Target</th>
            <th>How / note</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const detail = (entry.detail ?? {}) as RecordedDetail;
            const decider = decidedBy(detail);
            const enteredBy = emailById.get(entry.actorId) ?? entry.actorId;
            return (
              <tr key={entry.id} data-testid={`audit-${entry.id}`}>
                <td>{entry.createdAt.toLocaleString('en-GB')}</td>
                <td data-testid="audit-decider">
                  {decider ? (
                    <strong>{decider}</strong>
                  ) : (
                    <span className="cc-muted">{enteredBy} (acting directly)</span>
                  )}
                </td>
                <td data-testid="audit-recorder">{enteredBy}</td>
                <td>{entry.action}</td>
                <td>
                  {entry.targetKind} {entry.targetId.slice(0, 12)}
                </td>
                <td className="cc-muted">
                  {detail.method ? <div>{detail.method}</div> : null}
                  {detail.note ? <div>“{detail.note}”</div> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {entries.length === 0 ? <p>No admin actions recorded yet.</p> : null}
    </main>
  );
}
