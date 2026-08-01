import { enterCrewAction } from '@/lib/actions/parent';

/**
 * Parent selects a child profile → child-mode scoped token → Crew HQ (§4).
 * A plain form posting to a server action: no client JS, so the button works
 * from first paint — a pre-hydration tap enters the crew exactly like a
 * hydrated one.
 */
export function EnterCrewButton({ childId, crewName }: { childId: string; crewName: string }) {
  return (
    <form action={enterCrewAction} style={{ display: 'inline' }}>
      <input type="hidden" name="childId" value={childId} />
      <button className="cc-button" type="submit">
        Enter Crew HQ as {crewName}
      </button>
    </form>
  );
}
