'use server';

/**
 * Founding Crew waitlist (DEMAND-TEST-PACK §3). A server action so the form
 * works from first paint, pre-hydration, like the auth forms. Personal data
 * done properly: email + two optional fields, double opt-in before the
 * address joins any audience, identical response whether or not the address
 * already signed up (no enumeration).
 */
import { createHash, randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@cluecrew/db';
import { sendEmail } from '@/lib/email';
import { foundingReserveTemplate, waitlistConfirmTemplate } from '@/lib/email-templates';
import { rateLimit } from '@/lib/rate-limit';

const signupSchema = z.object({
  email: z.string().email().max(254),
  regionCode: z
    .string()
    .max(40)
    .regex(/^[a-z0-9-]*$/)
    .optional(),
  yearGroup: z.coerce.number().int().min(3).max(6).optional(),
  src: z
    .string()
    .max(40)
    .regex(/^[a-zA-Z0-9-]*$/)
    .optional(),
  // Which capture box (V2 §2; V3 adds founding-reserve).
  source: z.enum(['hero', 'demo-end', 'region-decoder', 'sticky', 'founding-reserve']).optional(),
});

const reserveSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(254),
  tier: z.enum(['FULL_24', 'FULL_12', 'FULL_ROLLING']),
  src: z
    .string()
    .max(40)
    .regex(/^[a-zA-Z0-9-]*$/)
    .optional(),
});

/**
 * "Reserve the founding rate" (LIVE-LAUNCH-PACK-V3 §1 Step 2): explicitly
 * NOT a payment — name + email, rate honoured when checkout opens. Same
 * double opt-in and enumeration-safety as every other capture; the reserve
 * is paid-intent data, not a contract.
 */
export async function reserveFoundingRateAction(formData: FormData): Promise<void> {
  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`waitlist:${ip}`, 10, 60 * 60 * 1000)) redirect('/founding/reserved');

  const parsed = reserveSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    tier: formData.get('tier'),
    src: formData.get('src') || undefined,
  });
  if (!parsed.success) redirect('/founding/reserved');

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.waitlistSignup.findUnique({ where: { email } });

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  if (!existing) {
    await prisma.waitlistSignup.create({
      data: {
        email,
        name: parsed.data.name,
        reservedTier: parsed.data.tier,
        source: 'founding-reserve',
        src: parsed.data.src ?? null,
        tokenHash,
      },
    });
  } else {
    // An existing signup upgrading to a reserve keeps its history; the
    // reserve fields land either way, and an unconfirmed address gets a
    // fresh token.
    await prisma.waitlistSignup.update({
      where: { email },
      data: {
        name: parsed.data.name,
        reservedTier: parsed.data.tier,
        ...(existing.confirmedAt ? {} : { tokenHash }),
      },
    });
  }

  if (!existing || !existing.confirmedAt) {
    const host = requestHeaders.get('host') ?? 'localhost:3100';
    const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
    await sendEmail({
      to: email,
      ...foundingReserveTemplate(
        parsed.data.name,
        `${protocol}://${host}/api/waitlist/confirm?token=${rawToken}`,
      ),
    });
  }

  redirect('/founding/reserved');
}

export async function joinWaitlistAction(formData: FormData): Promise<void> {
  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`waitlist:${ip}`, 10, 60 * 60 * 1000)) redirect('/founding/thanks');

  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    regionCode: formData.get('regionCode') || undefined,
    yearGroup: formData.get('yearGroup') || undefined,
    src: formData.get('src') || undefined,
    source: formData.get('source') || undefined,
  });
  // The email field is native-validated client-side; a malformed server-side
  // value gets the same quiet landing rather than an error a scraper can read.
  if (!parsed.success) redirect('/founding/thanks');

  const email = parsed.data.email.toLowerCase().trim();
  const regionCode =
    parsed.data.regionCode === 'not-sure' ? null : (parsed.data.regionCode ?? null);
  const existing = await prisma.waitlistSignup.findUnique({ where: { email } });

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  if (!existing) {
    await prisma.waitlistSignup.create({
      data: {
        email,
        regionCode,
        yearGroup: parsed.data.yearGroup ?? null,
        src: parsed.data.src ?? null,
        source: parsed.data.source ?? null,
        tokenHash,
      },
    });
  } else if (!existing.confirmedAt) {
    // Re-signup before confirming: refresh the token and send again.
    await prisma.waitlistSignup.update({ where: { email }, data: { tokenHash } });
  }

  if (!existing || !existing.confirmedAt) {
    const host = requestHeaders.get('host') ?? 'localhost:3100';
    const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
    const origin = `${protocol}://${host}`;
    // The Decoder path promised a guide — the confirmation email carries it,
    // so the value arrives with the consent ask, before any list-join (§2).
    const region = regionCode
      ? await prisma.region.findUnique({ where: { id: regionCode }, select: { id: true, name: true } })
      : null;
    await sendEmail({
      to: email,
      ...waitlistConfirmTemplate(
        `${origin}/api/waitlist/confirm?token=${rawToken}`,
        region ? { name: region.name, guideUrl: `${origin}/11-plus/${region.id}` } : null,
      ),
    });
  }

  redirect('/founding/thanks');
}
