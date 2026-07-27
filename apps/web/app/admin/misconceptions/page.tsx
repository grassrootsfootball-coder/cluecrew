import { prisma } from '@cluecrew/db';
import { upsertMisconceptionAction } from '@/lib/actions/admin-libraries';

export default async function MisconceptionsPage() {
  const misconceptions = await prisma.misconception.findMany({ orderBy: { id: 'asc' } });

  return (
    <main className="cc-container">
      <h1>Misconception library</h1>
      <p className="cc-muted">
        Every incorrect option in every item maps to one of these (P3). Child hints use
        &ldquo;not yet&rdquo; language only.
      </p>
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
          {misconceptions.map((misconception) => (
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
