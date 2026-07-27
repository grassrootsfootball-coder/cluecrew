/**
 * Gate checklist #4: a child-scoped token provably cannot read another
 * child's data or any billing route. Uses the seeded test family
 * (test-family@cluecrew.test with children Alex and Sam).
 */
import { expect, request, test, type APIRequestContext } from '@playwright/test';

const BASE = 'http://localhost:3100';
const PARENT_EMAIL = 'test-family@cluecrew.test';
const PARENT_PASSWORD = 'CrewTest!2026';

async function loginAsParent(): Promise<APIRequestContext> {
  const context = await request.newContext({ baseURL: BASE });
  const csrf = await context.get('/api/auth/csrf');
  const { csrfToken } = (await csrf.json()) as { csrfToken: string };
  const login = await context.post('/api/auth/callback/credentials', {
    form: { csrfToken, email: PARENT_EMAIL, password: PARENT_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  return context;
}

async function childTokenFor(parentContext: APIRequestContext, childId: string): Promise<string> {
  const response = await parentContext.post('/api/child-session', { data: { childId } });
  expect(response.ok()).toBeTruthy();
  const cookies = (await parentContext.storageState()).cookies;
  const token = cookies.find((cookie) => cookie.name === 'crew_token')?.value;
  expect(token).toBeTruthy();
  return token!;
}

test('child-scoped token reaches only its own child data and never billing', async () => {
  const parentContext = await loginAsParent();

  const childrenResponse = await parentContext.get('/api/parent/children');
  expect(childrenResponse.ok()).toBeTruthy();
  const { children } = (await childrenResponse.json()) as {
    children: Array<{ id: string; crewName: string }>;
  };
  const alex = children.find((child) => child.crewName === 'Alex');
  const sam = children.find((child) => child.crewName === 'Sam');
  expect(alex && sam).toBeTruthy();

  const alexToken = await childTokenFor(parentContext, alex!.id);

  // A context holding ONLY the child token — no parent session cookie.
  const childContext = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { cookie: `crew_token=${alexToken}` },
  });

  // Own practice data: allowed.
  const own = await childContext.get(`/api/crew/${alex!.id}/attempts`);
  expect(own.status()).toBe(200);

  // Sibling's data: blocked.
  const sibling = await childContext.get(`/api/crew/${sam!.id}/attempts`);
  expect(sibling.status()).toBe(403);

  // Billing, export, children list, account routes: all blocked.
  for (const path of ['/api/parent/billing', '/api/parent/export', '/api/parent/children']) {
    const response = await childContext.get(path);
    expect(response.status(), `${path} must reject a child token`).toBe(401);
  }

  await childContext.dispose();
  await parentContext.dispose();
});

test('a parent session alone cannot use child practice routes', async () => {
  const parentContext = await loginAsParent();
  const childrenResponse = await parentContext.get('/api/parent/children');
  const { children } = (await childrenResponse.json()) as { children: Array<{ id: string }> };

  // No child-mode token was issued in this context.
  const response = await parentContext.get(`/api/crew/${children[0]!.id}/attempts`);
  expect(response.status()).toBe(401);
  await parentContext.dispose();
});

test('child token cannot mint a session for a different child', async () => {
  const parentContext = await loginAsParent();
  const { children } = (await (await parentContext.get('/api/parent/children')).json()) as {
    children: Array<{ id: string; crewName: string }>;
  };
  const alex = children.find((child) => child.crewName === 'Alex')!;
  const alexToken = await childTokenFor(parentContext, alex.id);

  const childContext = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { cookie: `crew_token=${alexToken}` },
  });
  // /api/child-session requires a parent session, which this context lacks.
  const response = await childContext.post('/api/child-session', {
    data: { childId: children.find((child) => child.crewName === 'Sam')!.id },
  });
  expect(response.status()).toBe(401);

  await childContext.dispose();
  await parentContext.dispose();
});
