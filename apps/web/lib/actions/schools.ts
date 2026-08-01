'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@cluecrew/db';

/**
 * Schools register-interest (AMENDMENT-1 §1): the waitlist measures demand,
 * nothing is built. Stored as a consent-style event on no account — school
 * addresses are business contacts, not families.
 */
export async function registerSchoolInterestAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({
      email: z.string().email().max(200),
      school: z.string().max(200).optional(),
    })
    .safeParse({
      email: formData.get('email'),
      school: String(formData.get('school') || '') || undefined,
    });
  if (!parsed.success) redirect('/schools?error=1');
  await prisma.schoolInterest.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    create: { email: parsed.data.email.toLowerCase(), school: parsed.data.school ?? null },
    update: { school: parsed.data.school ?? null },
  });
  redirect('/schools?registered=1');
}
