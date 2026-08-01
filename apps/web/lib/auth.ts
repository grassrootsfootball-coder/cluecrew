import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@cluecrew/db';
import { verifyPassword } from '@/lib/passwords';
import { verifyTotp } from '@/lib/totp';
import { sendEmail } from '@/lib/email';
import { accountLockedTemplate } from '@/lib/email-templates';

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, totp: {} },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.toLowerCase().trim() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        if (!email || !password) return null;

        const parent = await prisma.parentAccount.findUnique({ where: { email } });
        if (!parent || parent.deletedAt) return null;

        // DB-backed lockout (§4): survives restarts and multiple instances.
        if (parent.lockedUntil && parent.lockedUntil > new Date()) return null;

        const valid = await verifyPassword(parent.passwordHash, password);
        if (!valid) {
          const failedLogins = parent.failedLogins + 1;
          const lock = failedLogins >= MAX_FAILED_LOGINS;
          await prisma.parentAccount.update({
            where: { id: parent.id },
            data: {
              failedLogins,
              lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
            },
          });
          if (lock) {
            await sendEmail({
              to: parent.email,
              ...accountLockedTemplate(parent.displayName, failedLogins, LOCKOUT_MINUTES),
            });
          }
          return null;
        }

        // Email must be verified before the account is usable (§4).
        if (!parent.emailVerified) return null;

        // Staff 2FA (Phase 2 §5 hardening): an enrolled staff account never
        // signs in on a password alone.
        if (parent.totpEnabledAt && parent.totpSecret) {
          const totp = typeof credentials?.totp === 'string' ? credentials.totp : '';
          if (!verifyTotp(parent.totpSecret, totp)) return null;
        }

        if (parent.failedLogins > 0 || parent.lockedUntil) {
          await prisma.parentAccount.update({
            where: { id: parent.id },
            data: { failedLogins: 0, lockedUntil: null },
          });
        }

        return { id: parent.id, email: parent.email, name: parent.displayName };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.parentId = user.id;
        const account = await prisma.parentAccount.findUnique({
          where: { id: user.id },
          select: { staffRole: true, email: true },
        });
        const bootstrapAdmins = (process.env.ADMIN_EMAILS ?? '')
          .split(',')
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean);
        token.staffRole = bootstrapAdmins.includes((account?.email ?? '').toLowerCase())
          ? 'ADMIN'
          : (account?.staffRole ?? 'NONE');
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.parentId === 'string') session.parentId = token.parentId;
      return session;
    },
  },
});

/** Returns the signed-in, non-deleted parent account or null. */
export async function currentParent() {
  const session = await auth();
  if (!session?.parentId) return null;
  const parent = await prisma.parentAccount.findUnique({ where: { id: session.parentId } });
  if (!parent || parent.deletedAt) return null;
  return parent;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
