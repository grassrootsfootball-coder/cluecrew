import { prisma } from '@cluecrew/db';
import { childFromCookie } from '@/lib/crew/server';
import { groupIntoQuarters, type Location } from '@/lib/crew/districts';
import { VOICE } from '@/lib/voice';

/**
 * The VR District map (BUILD-PHASE-4 §6): a neighbourhood of five quarters,
 * one per mechanic family, with every one of the 21 question types placed in
 * its own. Cases whose files are not yet written still hold their location —
 * the district reads as a whole place rather than a broken list of the few
 * cases that happen to exist.
 */
export default async function DistrictPage() {
  const child = await childFromCookie();
  // Pages render in parallel with the layout in the App Router, so the
  // layout's missing-child gate does NOT stop this body executing. Bail
  // quietly; CrewLayout owns the warm, in-world gate the child sees.
  if (!child) return null;

  const [questionTypes, cases, caseFiles] = await Promise.all([
    prisma.questionType.findMany({ where: { district: 'VR' }, orderBy: { id: 'asc' } }),
    prisma.case.findMany(),
    prisma.caseFile.findMany({ where: { childId: child.id } }),
  ]);

  const caseByType = new Map(cases.map((row) => [row.questionTypeId, row]));
  const fileByCase = new Map(caseFiles.map((caseFile) => [caseFile.caseId, caseFile]));

  // "Where you left off" is the first written case not yet cracked.
  const written = [...cases].sort((a, b) => a.orderInDistrict - b.orderInDistrict);
  const currentCaseId = written.find((row) => !fileByCase.get(row.id)?.solvedAt)?.id ?? null;

  const locations: Location[] = questionTypes.map((questionType) => {
    const caseRow = caseByType.get(questionType.id) ?? null;
    const caseFile = caseRow ? fileByCase.get(caseRow.id) : undefined;
    return {
      questionTypeId: questionType.id,
      label: caseRow?.title ?? questionType.name,
      caseId: caseRow?.id ?? null,
      cracked: Boolean(caseFile?.solvedAt),
      taughtBack: Boolean(caseFile?.taughtBackAt),
      isCurrent: caseRow?.id === currentCaseId,
    };
  });

  const quarters = groupIntoQuarters(locations);
  const crackedTotal = locations.filter((location) => location.cracked).length;

  return (
    <main className="crew-stage">
      <h1>The VR District</h1>
      <p className="crew-lede">
        {crackedTotal === 0 ? VOICE.districtNothingCracked : VOICE.districtIntro}
      </p>

      {quarters.map(({ quarter, locations: inQuarter, openCount, crackedCount }) => (
        <section className="crew-quarter" key={quarter.family}>
          <div className={`crew-quarter-head ${quarter.family}`}>
            <h2>{quarter.name}</h2>
            <p className="crew-quarter-blurb">{quarter.blurb}</p>
            {openCount > 0 ? (
              <p className="crew-quarter-count">{VOICE.quarterProgress(crackedCount, openCount)}</p>
            ) : null}
          </div>

          {/* Open cases lead. Rendering every unwritten case as a full card
              made the empty half of the district the loudest thing on the
              screen — the opposite of what the map is for. */}
          <div className="crew-quarter-grid">
            {inQuarter
              .filter((location) => location.caseId)
              .map((location) => (
                <a
                  key={location.questionTypeId}
                  className={`crew-location${location.isCurrent ? ' current' : ''}`}
                  href={`/crew/case/${location.caseId}`}
                >
                  {location.cracked ? <span className="crew-stamp">CRACKED ✓</span> : null}
                  <strong>{location.label}</strong>
                  {location.taughtBack ? (
                    <p className="crew-location-note">you taught this one 🎓</p>
                  ) : location.isCurrent ? (
                    <p className="crew-location-note">where you left off</p>
                  ) : null}
                </a>
              ))}
          </div>

          {inQuarter.some((location) => !location.caseId) ? (
            <div className="crew-pending-row">
              <p className="crew-pending-lead">{VOICE.caseNotWritten}</p>
              <ul className="crew-pending-list">
                {inQuarter
                  .filter((location) => !location.caseId)
                  .map((location) => (
                    <li key={location.questionTypeId} className="crew-pending-chip">
                      {location.label}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </section>
      ))}

      <p>
        <a className="crew-tap" href="/crew">
          ← Back to HQ
        </a>
      </p>
    </main>
  );
}
