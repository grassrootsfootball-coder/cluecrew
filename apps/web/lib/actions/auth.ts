'use server';

/**
 * Auth server actions with progressive enhancement (§4). These forms must
 * work BEFORE hydration: on a slow connection or low-end device the login
 * button is live from first paint, and a pre-hydration submit is a proper
 * POST to the action — never a native GET that would put a password in the
 * URL, and never a dead button.
 */
import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { signIn } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { registerParent, signupSchema } from '@/lib/signup';

export interface AuthFormState {
  error: string | null;
  done: boolean;
}

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/parent',
    });
    return { error: null, done: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          'We could not sign you in. Check your email and password — and make sure you have verified your email first.',
        done: false,
      };
    }
    // Success surfaces as a redirect, which must flow through.
    throw error;
  }
}

export async function signupAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // Prelaunch: signup is off until 5A — the middleware holds the page, this
  // holds the action.
  if (process.env.PRELAUNCH === 'on') {
    return { error: 'Signups are not open yet.', done: false };
  }
  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: 'Too many attempts — please try again in an hour.', done: false };
  }

  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  });
  if (!parsed.success) {
    return { error: 'That did not work — please check the details and try again.', done: false };
  }

  const host = requestHeaders.get('host') ?? 'localhost:3100';
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  await registerParent(parsed.data, `${protocol}://${host}`);

  return { error: null, done: true };
}
