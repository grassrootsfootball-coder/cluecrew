import { NextResponse } from 'next/server';
import { registerParent, signupSchema } from '@/lib/signup';
import { clientKey, rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, 'signup'), 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', issues: parsed.error.issues }, { status: 400 });
  }

  await registerParent(parsed.data, new URL(request.url).origin);

  return NextResponse.json(
    { ok: true, message: 'Check your inbox for a verification link.' },
    { status: 201 },
  );
}
