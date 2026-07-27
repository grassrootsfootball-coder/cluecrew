import { auth, isAdminEmail, signIn } from '@/lib/auth';

/** Bare admin login (Phase 1 §8: no UI beyond health check and this). */
export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.email) {
    if (!isAdminEmail(session.user.email)) {
      return (
        <main style={{ padding: '4rem 2rem' }}>
          <h1>Admin</h1>
          <p>This account does not have admin access.</p>
        </main>
      );
    }
    return (
      <main style={{ padding: '4rem 2rem' }}>
        <h1>Admin</h1>
        <p>Signed in as {session.user.email}. Admin tooling arrives with content authoring (Phase 2+).</p>
      </main>
    );
  }

  async function login(formData: FormData) {
    'use server';
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/admin',
    });
  }

  return (
    <main style={{ padding: '4rem 2rem', maxWidth: 420 }}>
      <h1>Admin sign-in</h1>
      <form action={login} style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          Email
          <input name="email" type="email" required style={{ display: 'block', width: '100%' }} />
        </label>
        <label>
          Password
          <input name="password" type="password" required style={{ display: 'block', width: '100%' }} />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
