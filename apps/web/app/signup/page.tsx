'use client';

/**
 * Signup submits to a server action, progressively enhanced like login:
 * live from first paint, and a pre-hydration submit is a POST to the action
 * — the password can never land in a URL (§4).
 */
import { useActionState } from 'react';
import { GoalBeacon } from '@/components/founding/analytics';
import { Plausible } from '@/components/plausible';
import { signupAction, type AuthFormState } from '@/lib/actions/auth';

const INITIAL: AuthFormState = { error: null, done: false };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, INITIAL);

  if (state.done) {
    return (
      <main className="cc-container">
        {/* V3 §3 funnel: a completed parent signup. Never fires in the child app. */}
        <Plausible />
        <GoalBeacon goal="signup_completed" />
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
      <Plausible />
      <GoalBeacon goal="signup_started" />
      <h1>Create your parent account</h1>
      <p className="cc-muted">
        Parents own the account; children get their own safe profiles inside it. The 7-day trial
        needs no card.
      </p>
      <form className="cc-form" action={formAction}>
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
        {state.error ? <p role="alert">{state.error}</p> : null}
        <button className="cc-button" type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="cc-muted">
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </main>
  );
}
