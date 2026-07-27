'use client';

import { useState } from 'react';

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
        displayName: form.get('displayName'),
      }),
    });
    setBusy(false);
    if (response.ok) setSubmitted(true);
    else setError('That did not work — please check the details and try again.');
  }

  if (submitted) {
    return (
      <main className="cc-container">
        <h1>Check your inbox</h1>
        <p>
          We have sent you a verification link. Open it to confirm your email, then sign in to set up
          your child&apos;s profile. The link is valid for 24 hours.
        </p>
      </main>
    );
  }

  return (
    <main className="cc-container">
      <h1>Create your parent account</h1>
      <p className="cc-muted">
        Parents own the account; children get their own safe profiles inside it. The 7-day trial
        needs no card.
      </p>
      <form className="cc-form" onSubmit={onSubmit}>
        <label>
          Your first name
          <input name="displayName" type="text" required maxLength={80} autoComplete="given-name" />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password (at least 10 characters)
          <input name="password" type="password" required minLength={10} autoComplete="new-password" />
        </label>
        {/* DMCC/L5: nothing pre-ticked, ever. */}
        <label className="cc-checkbox">
          <input type="checkbox" required />
          <span>I agree to the terms of service.</span>
        </label>
        <label className="cc-checkbox">
          <input type="checkbox" required />
          <span>I have read the privacy notice (plain-English version included).</span>
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button className="cc-button" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="cc-muted">
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </main>
  );
}
