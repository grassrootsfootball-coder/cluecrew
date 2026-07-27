import { currentParent } from '@/lib/auth';
import { changePasswordAction } from '@/lib/actions/parent';

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>;
}) {
  const parent = (await currentParent())!;
  const { password } = await searchParams;

  return (
    <main className="cc-container">
      <h1>Account</h1>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Email</h2>
        <p>{parent.email}</p>
      </div>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Change password</h2>
        {password === 'changed' ? <p role="status">Password changed.</p> : null}
        {password === 'incorrect' ? (
          <p role="alert">The current password did not match — please try again.</p>
        ) : null}
        <form className="cc-form" action={changePasswordAction}>
          <label>
            Current password
            <input name="currentPassword" type="password" required autoComplete="current-password" />
          </label>
          <label>
            New password (at least 10 characters)
            <input name="newPassword" type="password" required minLength={10} autoComplete="new-password" />
          </label>
          <button className="cc-button" type="submit">
            Change password
          </button>
        </form>
      </div>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Your family&apos;s data</h2>
        <p>
          Download everything we hold about your family — profiles, progress, consents and events —
          as a single file, any time.
        </p>
        <a className="cc-button-quiet" href="/api/parent/export">
          Download data export
        </a>
      </div>
    </main>
  );
}
