import { beginInviteAcceptance } from '@/lib/actions/staff-invites';
import { totpUri } from '@/lib/totp';
import { AcceptInviteForm } from './accept-form';

/**
 * Invite acceptance (Phase 2 §5): set your own password, enroll an
 * authenticator, prove it with one code. The TOTP secret is minted here,
 * shown once, and never appears in any email or log.
 */
export default async function StaffInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const begun = await beginInviteAcceptance(token);

  if (begun.error || !begun.totpSecret || !begun.email) {
    return (
      <main className="cc-container">
        <h1>Staff invite</h1>
        <p>{begun.error ?? 'This invite link is not valid any more.'}</p>
      </main>
    );
  }

  return (
    <main className="cc-container" style={{ maxWidth: '34rem' }}>
      <h1>Welcome to the desk</h1>
      <p className="cc-muted">
        Two steps, one minute: choose a password only you know, then connect an authenticator app
        — every staff sign-in uses both from now on.
      </p>
      <AcceptInviteForm
        token={token}
        email={begun.email}
        totpSecret={begun.totpSecret}
        otpauthUri={totpUri(begun.totpSecret, begun.email)}
      />
    </main>
  );
}
