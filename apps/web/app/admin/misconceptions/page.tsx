import { prisma } from '@cluecrew/db';
import {
  approveMisconceptionAction,
  importMisconceptionsAction,
  rejectMisconceptionAction,
  upsertMisconceptionAction,
} from '@/lib/actions/admin-libraries';

export default async function MisconceptionsPage() {
  const misconceptions = await prisma.misconception.findMany({ orderBy: { id: 'asc' } });
  const proposed = misconceptions.filter((entry) => entry.status === 'PROPOSED');
  const active = misconceptions.filter((entry) => entry.status === 'ACTIVE');

  return (
    <main className="cc-container">
      <h1>Misconception library</h1>
      <p className="cc-muted">
        Every incorrect option in every item maps to one of these (P3). Child hints use
        &ldquo;not yet&rdquo; language only.
      </p>
      {proposed.length > 0 ? (
        <div className="cc-card" data-testid="proposed-queue">
          <h2 style={{ marginTop: 0 }}>Review queue — corpus-proposed ({proposed.length})</h2>
          <p className="cc-muted">
            Proposed from corpus analysis (Addendum E §2). Items cannot reference these until
            approved; approval is named and logged. The source pattern is a citation id, never
            source text.
          </p>
          {proposed.map((entry) => (
            <div key={entry.id} className="cc-card" data-testid={`proposed-${entry.id}`}>
              <strong>{entry.id}</strong> · {entry.district} · proposed by {entry.proposedBy} ·
              pattern {entry.sourcePattern}
              <p style={{ margin: '0.3rem 0' }}>{entry.description}</p>
              <p className="cc-muted" style={{ margin: '0.3rem 0' }}>
                Child hint: {entry.childHint}
              </p>
              <form action={approveMisconceptionAction} style={{ display: 'inline' }}>
                <input type="hidden" name="id" value={entry.id} />
                <button className="cc-button" type="submit">
                  Approve — activates
                </button>
              </form>{' '}
              <form action={rejectMisconceptionAction} style={{ display: 'inline' }}>
                <input type="hidden" name="id" value={entry.id} />
                <button className="cc-button-quiet" type="submit">
                  Reject
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}

      <table className="cc-table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>District</th>
            <th>Description (teacher-facing)</th>
            <th>Child hint</th>
          </tr>
        </thead>
        <tbody>
          {active.map((misconception) => (
            <tr key={misconception.id}>
              <td>{misconception.id}</td>
              <td>{misconception.district}</td>
              <td>{misconception.description}</td>
              <td>{misconception.childHint}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Import corpus proposals (misconception-import.json)</h2>
        <form className="cc-form" action={importMisconceptionsAction}>
          <label>
            Paste the artefact — entries land as PROPOSED, never active
            <textarea name="payload" rows={6} required />
          </label>
          <button className="cc-button-quiet" type="submit">
            Import as PROPOSED
          </button>
        </form>
      </div>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Add or update</h2>
        <form className="cc-form" action={upsertMisconceptionAction}>
          <label>
            Slug (e.g. vr-analogy-surface-match)
            <input name="id" type="text" required pattern="[a-z0-9-]+" />
          </label>
          <label>
            District
            <select name="district" defaultValue="VR">
              <option value="VR">VR</option>
              <option value="NVR">NVR</option>
              <option value="MATHS">MATHS</option>
              <option value="ENGLISH">ENGLISH</option>
            </select>
          </label>
          <label>
            Description (teacher-facing)
            <textarea name="description" rows={2} required maxLength={500} />
          </label>
          <label>
            Child hint (shown when this distractor is chosen — warm, no banned words)
            <textarea name="childHint" rows={2} required maxLength={300} />
          </label>
          <button className="cc-button" type="submit">
            Save
          </button>
        </form>
      </div>
    </main>
  );
}
