'use client';

import { useActionState } from 'react';
import { acceptInviteAction } from '@/lib/actions/staff-invites';

export function AcceptInviteForm({
  token,
  email,
  totpSecret,
  otpauthUri,
}: {
  token: string;
  email: string;
  totpSecret: string;
  otpauthUri: string;
}) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, { error: null });

  return (
    <form className="cc-form" action={formAction}>
      <p>
        Signing in as <strong>{email}</strong>
      </p>
      <label>
        Choose a password (at least 10 characters)
        <input name="password" type="password" required minLength={10} autoComplete="new-password" />
      </label>

      <div className="cc-card">
        <p style={{ marginTop: 0 }}>
          <strong>Connect your authenticator.</strong> Add this setup key in any authenticator app
          (or open the link on the device that has one):
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', wordBreak: 'break-all' }} data-testid="totp-secret">
          {totpSecret}
        </p>
        <p>
          <a href={otpauthUri}>Open in authenticator</a>
        </p>
        <label>
          Enter the 6-digit code it shows now
          <input name="totpCode" type="text" inputMode="numeric" required minLength={6} maxLength={8} />
        </label>
      </div>

      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="totpSecret" value={totpSecret} />
      {state.error ? <p role="alert">{state.error}</p> : null}
      <button className="cc-button" type="submit" disabled={pending}>
        {pending ? 'Setting up…' : 'Activate my access'}
      </button>
    </form>
  );
}
