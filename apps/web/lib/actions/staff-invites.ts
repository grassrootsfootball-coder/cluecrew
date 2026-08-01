'use server';

/**
 * Staff invites (Phase 2 §5 hardening, David's ruling 2026-08-01): an admin
 * adds an email with a role; the invitee sets their OWN password and enrolls
 * 2FA on acceptance. No credential ever travels by hand — the link carries a
 * single-use hashed token, and the TOTP secret is generated at acceptance
 * time, shown once, and stored only on the account.
 */
import { createHash, randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@cluecrew/db';
import { sendEmail } from '@/lib/email';
import { staffInviteTemplate } from '@/lib/email-templates';
import { hashPassword } from '@/lib/passwords';
import { currentStaff, recordAudit, roleAllows } from '@/lib/staff';
import { generateTotpSecret, verifyTotp } from '@/lib/totp';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function inviteStaffAction(formData: FormData): Promise<void> {
  const staff = await currentStaff();
  if (!staff || !roleAllows(staff.effectiveRole, [])) redirect('/admin'); // ADMIN only

  const parsed = z
    .object({
      email: z.string().email().max(254),
      role: z.enum(['AUTHOR', 'REVIEWER', 'ADMIN']),
    })
    .parse({ email: formData.get('email'), role: formData.get('role') });
  const email = parsed.email.toLowerCase().trim();

  const rawToken = randomBytes(32).toString('base64url');
  await prisma.staffInvite.upsert({
    where: { email },
    create: {
      email,
      role: parsed.role,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      invitedBy: staff.email,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
    update: {
      role: parsed.role,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      invitedBy: staff.email,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      acceptedAt: null,
    },
  });

  const requestHeaders = await headers();
  const host = requestHeaders.get('host') ?? 'localhost:3100';
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  await sendEmail({
    to: email,
    ...staffInviteTemplate(parsed.role, `${protocol}://${host}/staff-invite/${rawToken}`),
  });
  await recordAudit(staff.id, 'staff.invite', 'StaffInvite', email, { role: parsed.role });
  redirect('/admin?invited=1');
}

export interface AcceptResult {
  error: string | null;
  /** Returned ONCE, on the enrolment step, never stored anywhere else. */
  totpSecret?: string;
  email?: string;
}

/** Step 1: validate the token and mint the TOTP secret for enrolment. */
export async function beginInviteAcceptance(rawToken: string): Promise<AcceptResult> {
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const invite = await prisma.staffInvite.findUnique({ where: { tokenHash } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return { error: 'This invite link is not valid any more. Ask for a fresh one.' };
  }
  return { error: null, totpSecret: generateTotpSecret(), email: invite.email };
}

/** Step 2: set password, prove the authenticator works, activate the role. */
export async function acceptInviteAction(
  _previous: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const parsed = z
    .object({
      token: z.string().min(10),
      password: z.string().min(10).max(200),
      totpSecret: z.string().min(16),
      totpCode: z.string().min(6).max(8),
    })
    .safeParse({
      token: formData.get('token'),
      password: formData.get('password'),
      totpSecret: formData.get('totpSecret'),
      totpCode: formData.get('totpCode'),
    });
  if (!parsed.success) return { error: 'Check the fields — the password needs 10+ characters.' };

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const invite = await prisma.staffInvite.findUnique({ where: { tokenHash } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return { error: 'This invite link is not valid any more. Ask for a fresh one.' };
  }
  if (!verifyTotp(parsed.data.totpSecret, parsed.data.totpCode)) {
    return { error: 'That authenticator code did not match — check the app and try again.' };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.parentAccount.upsert({
      where: { email: invite.email },
      create: {
        email: invite.email,
        displayName: invite.email.split('@')[0]!,
        passwordHash,
        emailVerified: new Date(), // the invite email IS the verification
        staffRole: invite.role,
        totpSecret: parsed.data.totpSecret,
        totpEnabledAt: new Date(),
      },
      update: {
        passwordHash,
        staffRole: invite.role,
        totpSecret: parsed.data.totpSecret,
        totpEnabledAt: new Date(),
        emailVerified: new Date(),
      },
    }),
    prisma.staffInvite.update({
      where: { tokenHash },
      data: { acceptedAt: new Date() },
    }),
  ]);
  redirect('/admin?welcome=1');
}
