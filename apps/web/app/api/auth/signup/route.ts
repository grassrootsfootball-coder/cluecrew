import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logEvent, prisma } from '@cluecrew/db';
import { hashPassword } from '@/lib/passwords';
import { sendEmail } from '@/lib/email';
import { verifyEmailTemplate } from '@/lib/email-templates';
import { clientKey, rateLimit } from '@/lib/rate-limit';

const POLICY_VERSION = 'v1.0';

const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(10).max(200),
  displayName: z.string().min(1).max(80),
});

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, 'signup'), 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', issues: parsed.error.issues }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase().trim();

  // Response is identical whether or not the account already exists,
  // so signup cannot be used to enumerate accounts.
  const existing = await prisma.parentAccount.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await hashPassword(parsed.data.password);
    const parent = await prisma.parentAccount.create({
      data: {
        email,
        passwordHash,
        displayName: parsed.data.displayName,
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

    const origin = new URL(request.url).origin;
    await sendEmail({
      to: email,
      ...verifyEmailTemplate(parsed.data.displayName, `${origin}/api/auth/verify?token=${rawToken}`),
    });
    await logEvent({ name: 'signup_completed', parentId: parent.id, props: {} });
  }

  return NextResponse.json(
    { ok: true, message: 'Check your inbox for a verification link.' },
    { status: 201 },
  );
}
