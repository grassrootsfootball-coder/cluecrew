import { currentStaff } from '@/lib/staff';
import { auth, signIn } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await currentStaff();

  if (!staff) {
    const session = await auth();
    if (session) {
      return (
        <main className="cc-container">
          <h1>Admin</h1>
          <p>This account does not have staff access.</p>
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
      <main className="cc-container">
        <h1>Staff sign-in</h1>
        <form action={login} className="cc-form">
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          <button className="cc-button" type="submit">
            Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <>
      <nav className="cc-nav" aria-label="Admin">
        <strong>Admin CMS</strong>
        <a href="/admin">Overview</a>
        <a href="/admin/items">Items</a>
        <a href="/admin/import">Bulk import</a>
        <a href="/admin/misconceptions">Misconceptions</a>
        <a href="/admin/words">Words</a>
        <a href="/admin/regions">Regions</a>
        <a href="/admin/bursaries">Bursaries</a>
        <a href="/admin/audit">Audit log</a>
        <span className="cc-muted">
          {staff.displayName} · {staff.effectiveRole}
        </span>
      </nav>
      {children}
    </>
  );
}
