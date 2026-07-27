'use client';

/** Parent selects a child profile → child-mode scoped token → Crew HQ (§4 Phase 1). */
export function EnterCrewButton({ childId, crewName }: { childId: string; crewName: string }) {
  async function enter() {
    const response = await fetch('/api/child-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId }),
    });
    if (response.ok) window.location.href = '/crew';
  }

  return (
    <button className="cc-button" onClick={enter}>
      Enter Crew HQ as {crewName}
    </button>
  );
}
