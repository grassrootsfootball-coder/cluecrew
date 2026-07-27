import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: { connected: true, latencyMs: Date.now() - startedAt },
      env: process.env.APP_ENV ?? 'dev',
    });
  } catch {
    return NextResponse.json(
      { ok: false, db: { connected: false } },
      { status: 503 },
    );
  }
}
