import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';
import { decryptEvidence } from '@/lib/evidence';
import { currentStaff, recordAudit } from '@/lib/staff';

/** Evidence is decrypted only here, only for ADMIN, and every view is audited. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await currentStaff();
  if (!staff || staff.effectiveRole !== 'ADMIN') {
    return NextResponse.json({ error: 'admin_required' }, { status: 403 });
  }

  const { id } = await params;
  const application = await prisma.bursaryApplication.findUnique({ where: { id } });
  if (!application?.evidence) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await recordAudit(staff.id, 'bursary.evidence_view', 'BursaryApplication', id);

  const decrypted = decryptEvidence(Buffer.from(application.evidence));
  return new NextResponse(new Uint8Array(decrypted), {
    headers: {
      'Content-Type': application.evidenceMime ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${(application.evidenceName ?? 'evidence').replace(/[^\w.-]/g, '_')}"`,
      'Cache-Control': 'no-store',
    },
  });
}
