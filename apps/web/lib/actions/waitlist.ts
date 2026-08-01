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
import { waitlistConfirmTemplate } from '@/lib/email-templates';
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
  // Which capture box (V2 §2) — buyer temperatures differ by box.
  source: z.enum(['hero', 'demo-end', 'region-decoder', 'sticky']).optional(),
});

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
