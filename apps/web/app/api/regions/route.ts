import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';

/**
 * Public, read-only Region Registry summary (DEMAND-TEST-PACK-V2 §5) — the
 * Region Decoder's data source. Serves only the registry's verified,
 * already-public fields; no PII exists here to leak.
 */
export async function GET() {
  const regions = await prisma.region.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      examFormat: true,
      formatSummary: true,
      typicalTestMonth: true,
      subjects: true,
    },
  });
  return NextResponse.json(
    { regions },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
  );
}
