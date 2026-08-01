/**
 * The one signup path (§4), shared by the API route and the signup form's
 * server action so the two can never drift. The response is identical whether
 * or not the account already exists — signup cannot enumerate accounts.
 */
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { logEvent, prisma } from '@cluecrew/db';
import { hashPassword } from '@/lib/passwords';
import { sendEmail } from '@/lib/email';
import { verifyEmailTemplate } from '@/lib/email-templates';

const POLICY_VERSION = 'v1.0';

export const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(10).max(200),
  displayName: z.string().min(1).max(80),
});

export type SignupInput = z.infer<typeof signupSchema>;

export async function registerParent(input: SignupInput, origin: string): Promise<void> {
  const email = input.email.toLowerCase().trim();

  const existing = await prisma.parentAccount.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await hashPassword(input.password);
  const parent = await prisma.parentAccount.create({
    data: {
      email,
      passwordHash,
      displayName: input.displayName,
      consentLog: {
        create: [
          { kind: 'tos', version: POLICY_VERSION },
          { kind: 'privacy', version: POLICY_VERSION },
        ],
      },
    },
  });

  const rawToken = randomBytes(32).toString('base64url');
  await prisma.verificationToken.create({
    data: {
      parentId: parent.id,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendEmail({
    to: email,
    ...verifyEmailTemplate(input.displayName, `${origin}/api/auth/verify?token=${rawToken}`),
  });
  await logEvent({ name: 'signup_completed', parentId: parent.id, props: {} });
}
