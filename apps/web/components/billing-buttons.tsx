'use client';

import { useState } from 'react';

export function CheckoutButton({ tier, label }: { tier: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const response = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });
    if (response.ok) {
      const { url } = (await response.json()) as { url: string };
      window.location.href = url;
    } else {
      setBusy(false);
      setError('Checkout could not start — please try again in a moment.');
    }
  }

  return (
    <>
      <button className="cc-button" onClick={start} disabled={busy}>
        {busy ? 'Opening checkout…' : label}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}

export function PostButton({
  path,
  label,
  quiet,
  redirectTo,
}: {
  path: string;
  label: string;
  quiet?: boolean;
  redirectTo?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const response = await fetch(path, { method: 'POST' });
    if (response.ok) {
      window.location.href = redirectTo ?? '/parent/billing';
    } else {
      setBusy(false);
      setError('That did not go through — please try again.');
    }
  }

  return (
    <>
      <button className={quiet ? 'cc-button-quiet' : 'cc-button'} onClick={run} disabled={busy}>
        {busy ? 'Working…' : label}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
