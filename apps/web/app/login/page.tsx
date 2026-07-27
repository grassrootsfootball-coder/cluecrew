'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    });
    setBusy(false);
    if (result?.error) {
      setError(
        'We could not sign you in. Check your email and password — and make sure you have verified your email first.',
      );
    } else {
      window.location.href = '/parent';
    }
  }

  return (
    <main className="cc-container">
      <h1>Sign in</h1>
      <form className="cc-form" onSubmit={onSubmit}>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button className="cc-button" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="cc-muted">
        New to ClueCrew? <a href="/signup">Create an account</a>
      </p>
    </main>
  );
}
