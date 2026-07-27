'use client';

import { useState } from 'react';

export function StartLoopButton({
  childId,
  caseId,
  label,
}: {
  childId: string;
  caseId?: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    const response = await fetch(`/api/crew/${childId}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseId ? { caseId } : {}),
    });
    if (response.ok) window.location.href = '/crew/play';
    else setBusy(false);
  }

  return (
    <button className="crew-tap primary" onClick={start} disabled={busy}>
      {busy ? 'Opening your case…' : label}
    </button>
  );
}
