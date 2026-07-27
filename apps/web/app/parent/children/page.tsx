import { MAX_CHILD_PROFILES } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { addChildAction, archiveChildAction, updateChildAction } from '@/lib/actions/parent';
import { EnterCrewButton } from '@/components/enter-crew-button';

interface ChildSettings {
  reducedMotion?: boolean;
  dyslexiaFont?: boolean;
  audioDefault?: boolean;
}

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: Promise<{ full?: string }>;
}) {
  const parent = (await currentParent())!;
  const { full } = await searchParams;
  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <main className="cc-container">
      <h1>Children</h1>
      <p className="cc-muted">
        Additional children are free on the same subscription (up to {MAX_CHILD_PROFILES} profiles).
      </p>
      {full ? (
        <p role="alert">
          You have reached the maximum of {MAX_CHILD_PROFILES} profiles. Archive one to add another.
        </p>
      ) : null}

      {children.map((child) => {
        const settings = (child.settings ?? {}) as ChildSettings;
        return (
          <div className="cc-card" key={child.id}>
            <h2 style={{ marginTop: 0 }}>{child.crewName}</h2>
            <p>
              <EnterCrewButton childId={child.id} crewName={child.crewName} />
            </p>
            <form className="cc-form" action={updateChildAction}>
              <input type="hidden" name="childId" value={child.id} />
              <label>
                First name or nickname
                <input name="crewName" type="text" defaultValue={child.crewName} required maxLength={40} />
              </label>
              <label>
                Year group
                <select name="yearGroup" defaultValue={String(child.yearGroup)}>
                  <option value="4">Year 4</option>
                  <option value="5">Year 5</option>
                  <option value="6">Year 6</option>
                </select>
              </label>
              <label>
                Exam year
                <input
                  name="examYear"
                  type="number"
                  min={2026}
                  max={2035}
                  defaultValue={child.examYear ?? undefined}
                />
              </label>
              <label className="cc-checkbox">
                <input type="checkbox" name="dyslexiaFont" defaultChecked={Boolean(settings.dyslexiaFont)} />
                <span>Dyslexia-friendly text settings</span>
              </label>
              <label className="cc-checkbox">
                <input type="checkbox" name="audioDefault" defaultChecked={Boolean(settings.audioDefault)} />
                <span>Read instructions aloud by default</span>
              </label>
              <label className="cc-checkbox">
                <input type="checkbox" name="reducedMotion" defaultChecked={Boolean(settings.reducedMotion)} />
                <span>Reduce animation and movement</span>
              </label>
              <button className="cc-button-quiet" type="submit">
                Save changes
              </button>
            </form>
            <form action={archiveChildAction} style={{ marginTop: '0.75rem' }}>
              <input type="hidden" name="childId" value={child.id} />
              <button className="cc-button-quiet" type="submit">
                Archive profile
              </button>
            </form>
          </div>
        );
      })}

      {children.length < MAX_CHILD_PROFILES ? (
        <div className="cc-card">
          <h2 style={{ marginTop: 0 }}>Add a child</h2>
          <form className="cc-form" action={addChildAction}>
            <label>
              First name or nickname
              <input name="crewName" type="text" required maxLength={40} />
            </label>
            <label>
              Year group
              <select name="yearGroup" defaultValue="5">
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
                <option value="6">Year 6</option>
              </select>
            </label>
            <label>
              Exam year (optional)
              <input name="examYear" type="number" min={2026} max={2035} />
            </label>
            <label className="cc-checkbox">
              <input type="checkbox" name="dyslexiaFont" />
              <span>Dyslexia-friendly text settings</span>
            </label>
            <label className="cc-checkbox">
              <input type="checkbox" name="audioDefault" />
              <span>Read instructions aloud by default</span>
            </label>
            <label className="cc-checkbox">
              <input type="checkbox" name="reducedMotion" />
              <span>Reduce animation and movement</span>
            </label>
            <button className="cc-button" type="submit">
              Add child
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
