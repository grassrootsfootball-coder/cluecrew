import { prisma } from '@cluecrew/db';
import { childFromCookie } from '@/lib/crew/server';

/** The VR District map (§6): each Case is a location; any case is enterable. */
export default async function DistrictPage() {
  const child = (await childFromCookie())!;
  const [cases, caseFiles] = await Promise.all([
    prisma.case.findMany({ orderBy: { orderInDistrict: 'asc' } }),
    prisma.caseFile.findMany({ where: { childId: child.id } }),
  ]);
  const fileByCase = new Map(caseFiles.map((caseFile) => [caseFile.caseId, caseFile]));
  const currentCase = cases.find((candidate) => !fileByCase.get(candidate.id)?.solvedAt);

  return (
    <main className="crew-stage">
      <h1>The VR District</h1>
      <p className="cc-muted">Every door is a case. Take any one — the amber glow is where you left off.</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {cases.map((candidate) => {
          const caseFile = fileByCase.get(candidate.id);
          const cracked = Boolean(caseFile?.solvedAt);
          return (
            <a
              key={candidate.id}
              className={`crew-location${candidate.id === currentCase?.id ? ' current' : ''}`}
              href={`/crew/case/${candidate.id}`}
            >
              {cracked ? <span className="crew-stamp">CRACKED ✓</span> : null}
              <strong>{candidate.title}</strong>
              <p className="cc-muted" style={{ margin: '0.3rem 0 0' }}>
                Case №{candidate.orderInDistrict}
                {caseFile?.taughtBackAt ? ' · you taught this one 🎓' : ''}
              </p>
            </a>
          );
        })}
      </div>
      <p>
        <a className="crew-tap" href="/crew">
          ← Back to HQ
        </a>
      </p>
    </main>
  );
}
