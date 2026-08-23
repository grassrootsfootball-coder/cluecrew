import { prisma } from '@cluecrew/db';
import { childFromCookie } from '@/lib/crew/server';
import { groupIntoQuarters, type Location } from '@/lib/crew/districts';
import { NvrServabilityNotice } from '@/components/crew/nvr-servability-notice';
import { VOICE } from '@/lib/voice';

/**
 * The district map (BUILD-PHASE-4 §6): a neighbourhood of quarters, one per
 * mechanic family, with every question type placed in its own. Cases whose
 * files are not yet written still hold their location — the district reads as
 * a whole place rather than a broken list of the few cases that happen to
 * exist.
 *
 * **THE QUERY WAS `district: 'VR'` UNTIL 2026-08-17** (R171, stop 4 — the one
 * that gates FINDING a case rather than playing it). `locations` is built from
 * this result, so an English question type could not appear on the map however
 * many of its items were LIVE, and a Case row alone would have been playable
 * and unfindable. Both districts are read now; a district with no ordered
 * quarter still draws nothing, which is `QUARTER_ORDER`'s job, not this query's.
 */
export default async function DistrictPage() {
  const child = await childFromCookie();
  // Pages render in parallel with the layout in the App Router, so the
  // layout's missing-child gate does NOT stop this body executing. Bail
  // quietly; CrewLayout owns the warm, in-world gate the child sees.
  if (!child) return null;

  const [questionTypes, allCases, caseFiles, open] = await Promise.all([
    prisma.questionType.findMany({
      where: { district: { in: ['VR', 'ENGLISH'] } },
      orderBy: { id: 'asc' },
    }),
    prisma.case.findMany(),
    prisma.caseFile.findMany({ where: { childId: child.id } }),
    (await import('@/lib/entitlements')).openCaseIds(child.id),
  ]);
  // D7: a tier-locked case is INDISTINGUISHABLE from one that isn't written
  // yet — by construction, not by styling: dropping it from the open set here
  // sends it down the exact same quiet-chip path as unbuilt content. No
  // child-facing branch anywhere knows why a door is closed.
  const cases = allCases.filter((row) => open === 'all' || open.has(row.id));

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

  // NVR-offered detection from THIS page's own fetched data (never a separate claim): today the
  // query reads VR + ENGLISH only, so this is false and the slot renders nothing. The day NVR
  // joins the query, it flips mechanically — the slot's first fail-closed condition (R666).
  const nvrOffered = questionTypes.some((qt) => String(qt.district) === 'NVR');
  return (
    <main className="crew-stage">
      <h1>The District</h1>
      <NvrServabilityNotice nvrOffered={nvrOffered} />
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
