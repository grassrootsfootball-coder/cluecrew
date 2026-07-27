import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { verifyPassword } from '@/lib/passwords';
import {
  CHILD_TOKEN_COOKIE,
  CHILD_TOKEN_TTL_SECONDS,
  signChildToken,
} from '@/lib/child-token';
import { clientKey, rateLimit } from '@/lib/rate-limit';

/** Parent selects a child profile → child-mode scoped token is issued (§4). */
export async function POST(request: Request) {
  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = z.object({ childId: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const child = await prisma.childProfile.findUnique({ where: { id: parsed.data.childId } });
  if (!child || child.deletedAt || child.parentId !== parent.id) {
    return NextResponse.json({ error: 'child_not_found' }, { status: 404 });
  }

  const token = await signChildToken({ childId: child.id, parentId: parent.id });
  const response = NextResponse.json({ ok: true, childId: child.id, crewName: child.crewName });
  response.cookies.set(CHILD_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CHILD_TOKEN_TTL_SECONDS,
  });
  return response;
}

/**
 * Exit child mode. Requires the parent password again so a child cannot
 * wander from Crew HQ into Parent HQ or billing (§4).
 */
export async function DELETE(request: Request) {
  if (!rateLimit(clientKey(request, 'child-exit'), 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = z.object({ password: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const valid = await verifyPassword(parent.passwordHash, parsed.data.password);
  if (!valid) return NextResponse.json({ error: 'password_incorrect' }, { status: 403 });

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(CHILD_TOKEN_COOKIE);
  return response;
}
