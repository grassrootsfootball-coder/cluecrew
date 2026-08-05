import { currentStaff } from '@/lib/staff';
import { navFor } from '@/lib/admin-nav';
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
        totp: formData.get('totp'),
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
          <label>
            Authenticator code (staff accounts with 2FA)
            <input name="totp" type="text" inputMode="numeric" maxLength={8} />
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
        {navFor(staff.effectiveRole).map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
        <span className="cc-muted">
          {staff.displayName} · {staff.effectiveRole}
        </span>
      </nav>
      {children}
    </>
  );
}
