'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { logEvent, prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { bursaryReceivedTemplate } from '@/lib/email-templates';
import { encryptEvidence } from '@/lib/evidence';

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];

export async function submitBursaryApplication(formData: FormData): Promise<void> {
  const parent = await currentParent();
  if (!parent || !parent.emailVerified) redirect('/login');

  const existing = await prisma.bursaryApplication.findFirst({
    where: { parentId: parent.id, status: { in: ['RECEIVED', 'WAITLISTED', 'APPROVED'] } },
  });
  if (existing) redirect('/bursary?state=already-applied');

  const confirmation = z.enum(['fsm', 'pupil_premium']).parse(formData.get('confirmation'));
  const file = formData.get('evidence');
  if (!(file instanceof File) || file.size === 0) redirect('/bursary?state=evidence-required');
  if (file.size > MAX_EVIDENCE_BYTES || !ALLOWED_MIME.includes(file.type)) {
    redirect('/bursary?state=evidence-invalid');
  }

  const encrypted = new Uint8Array(encryptEvidence(Buffer.from(await file.arrayBuffer())));
  await prisma.bursaryApplication.create({
    data: {
      parentId: parent.id,
      confirmation,
      evidence: encrypted,
      evidenceName: file.name.slice(0, 120),
      evidenceMime: file.type,
    },
  });

  await logEvent({ name: 'bursary_application_submitted', parentId: parent.id, props: { confirmation } });
  await sendEmail({ to: parent.email, ...bursaryReceivedTemplate(parent.displayName) });
  redirect('/bursary?state=received');
}
