import { redirect } from 'next/navigation';
import { currentParent } from '@/lib/auth';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const parent = await currentParent();
  if (!parent) redirect('/login');

  return (
    <>
      <nav className="cc-nav" aria-label="Parent HQ">
        <strong>Parent HQ</strong>
        <a href="/parent">Dashboard</a>
        <a href="/parent/children">Children</a>
        <a href="/parent/billing">Billing</a>
        <a href="/parent/casebook">Parents&apos; Casebook</a>
        <a href="/parent/account">Account</a>
      </nav>
      {children}
    </>
  );
}
