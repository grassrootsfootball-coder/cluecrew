/**
 * Gate checklist #4: a child-scoped token provably cannot read another child's
 * data or any billing route.
 *
 * Builds its own two-child family per test (see e2e/fixtures.ts) rather than
 * borrowing the seeded one. That matters here more than anywhere: this is a
 * security boundary, and it should be proved against a family whose shape this
 * test controls, not one whose children another test could rename or remove.
 */
import { expect, request, test, type APIRequestContext } from '@playwright/test';
import { cleanupFixtures, createFamily, parentApi, type FixtureFamily } from './fixtures';

const BASE = 'http://localhost:3100';

test.afterAll(cleanupFixtures);

/** A signed-in parent of two children: the elder first. */
async function twoChildFamily(
  label: string,
): Promise<{ api: APIRequestContext; family: FixtureFamily }> {
  const family = await createFamily(label, { crewNames: ['Elder', 'Younger'] });
  return { api: await parentApi(family.email), family };
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
  const { api: parentContext, family } = await twoChildFamily('isolation-siblings');

  // The API agrees with the fixture about who is in this family.
  const childrenResponse = await parentContext.get('/api/parent/children');
  expect(childrenResponse.ok()).toBeTruthy();
  const { children } = (await childrenResponse.json()) as {
    children: Array<{ id: string; crewName: string }>;
  };
  expect(children.map((child) => child.id).sort()).toEqual(
    family.children.map((child) => child.id).sort(),
  );

  const [elder, younger] = family.children;
  const elderToken = await childTokenFor(parentContext, elder!.id);

  // A context holding ONLY the child token — no parent session cookie.
  const childContext = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { cookie: `crew_token=${elderToken}` },
  });

  // Own practice data: allowed.
  const own = await childContext.get(`/api/crew/${elder!.id}/attempts`);
  expect(own.status()).toBe(200);

  // Sibling's data: blocked.
  const sibling = await childContext.get(`/api/crew/${younger!.id}/attempts`);
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
  const { api: parentContext, family } = await twoChildFamily('isolation-parent-only');

  // No child-mode token was issued in this context.
  const response = await parentContext.get(`/api/crew/${family.child.id}/attempts`);
  expect(response.status()).toBe(401);
  await parentContext.dispose();
});

test('child token cannot mint a session for a different child', async () => {
  const { api: parentContext, family } = await twoChildFamily('isolation-cross-mint');
  const [elder, younger] = family.children;
  const elderToken = await childTokenFor(parentContext, elder!.id);

  const childContext = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { cookie: `crew_token=${elderToken}` },
  });
  // /api/child-session requires a parent session, which this context lacks.
  const response = await childContext.post('/api/child-session', {
    data: { childId: younger!.id },
  });
  expect(response.status()).toBe(401);

  await childContext.dispose();
  await parentContext.dispose();
});

test('a child token from one family cannot reach another family', async () => {
  // Cross-family isolation was never covered: every case above compares
  // siblings, which share a parent. Two independent fixtures make the
  // stronger claim cheap to state.
  const { api: firstParent, family: first } = await twoChildFamily('isolation-family-a');
  const { api: secondParent, family: second } = await twoChildFamily('isolation-family-b');
  const firstToken = await childTokenFor(firstParent, first.child.id);

  const childContext = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { cookie: `crew_token=${firstToken}` },
  });
  const response = await childContext.get(`/api/crew/${second.child.id}/attempts`);
  expect(response.status(), "another family's child must be refused").toBe(403);

  await childContext.dispose();
  await firstParent.dispose();
  await secondParent.dispose();
});
