import { prisma } from '@cluecrew/db';
import { upsertWordAction } from '@/lib/actions/admin-libraries';

export default async function WordsPage() {
  const words = await prisma.word.findMany({ orderBy: [{ tier: 'asc' }, { id: 'asc' }] });

  return (
    <main className="cc-container">
      <h1>Word list</h1>
      <p className="cc-muted">{words.length} words. Definitions are authored at reading age ≤9.</p>
      <table className="cc-table">
        <thead>
          <tr>
            <th>Word</th>
            <th>Tier</th>
            <th>Child definition</th>
            <th>Sentence</th>
            <th>Root family</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => (
            <tr key={word.id}>
              <td>{word.headword}</td>
              <td>{word.tier}</td>
              <td>{word.definitionChild}</td>
              <td>{word.sentence}</td>
              <td>{word.rootFamily ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Add or update a word</h2>
        <form className="cc-form" action={upsertWordAction}>
          <label>
            Slug
            <input name="id" type="text" required pattern="[a-z0-9-]+" />
          </label>
          <label>
            Headword
            <input name="headword" type="text" required maxLength={40} />
          </label>
          <label>
            Child definition (reading age ≤9, max 160 chars)
            <input name="definitionChild" type="text" required maxLength={160} />
          </label>
          <label>
            Example sentence
            <input name="sentence" type="text" required maxLength={200} />
          </label>
          <label>
            Root family (optional, e.g. latin-port)
            <input name="rootFamily" type="text" pattern="[a-z]+-[a-z]+" />
          </label>
          <label>
            Tier (1–5)
            <input name="tier" type="number" min={1} max={5} required defaultValue={3} />
          </label>
          <button className="cc-button" type="submit">
            Save
          </button>
        </form>
      </div>
    </main>
  );
}
