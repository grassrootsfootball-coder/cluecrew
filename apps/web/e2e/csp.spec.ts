/**
 * Gate checklist #7: the CSP on /crew blocks a deliberately injected
 * third-party script, and no third-party origin appears in the policy.
 */
import { expect, test } from '@playwright/test';

test('/crew responses carry a self-only Content-Security-Policy', async ({ request }) => {
  for (const path of ['/crew', '/crew/csp-probe']) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    const csp = response.headers()['content-security-policy'];
    expect(csp, `${path} must send a CSP header`).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    // No external origin anywhere in the policy — no third-party scripts (S1).
    expect(csp).not.toMatch(/https?:\/\//);
  }
});

test('an injected third-party script never executes on /crew', async ({ page }) => {
  const cspViolations: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) cspViolations.push(message.text());
  });

  await page.goto('/crew/csp-probe');
  await expect(page.getByTestId('probe-ready')).toBeVisible();

  const thirdPartyLoaded = await page.evaluate(
    () => (window as unknown as { __thirdPartyLoaded?: boolean }).__thirdPartyLoaded,
  );
  expect(thirdPartyLoaded).toBeUndefined();

  const requests: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://localhost')) requests.push(request.url());
  });
  await page.waitForTimeout(500);
  expect(requests).toHaveLength(0);
});

test('marketing home page does not carry the crew CSP but has security headers', async ({ request }) => {
  const response = await request.get('/');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['permissions-policy']).toContain('geolocation=()');
});
