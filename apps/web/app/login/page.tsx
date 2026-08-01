'use client';

/**
 * Login submits to a server action so the form works from first paint,
 * before hydration — a pre-hydration submit is a proper POST, never a dead
 * button or a native GET carrying the password in the URL (§4).
 */
import { useActionState } from 'react';
import { loginAction, type AuthFormState } from '@/lib/actions/auth';

const INITIAL: AuthFormState = { error: null, done: false };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);

  return (
    <main className="cc-container">
      <h1>Sign in</h1>
      <form className="cc-form" action={formAction}>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {state.error ? <p role="alert">{state.error}</p> : null}
        <button className="cc-button" type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="cc-muted">
        New to ClueCrew? <a href="/signup">Create an account</a>
      </p>
    </main>
  );
}
