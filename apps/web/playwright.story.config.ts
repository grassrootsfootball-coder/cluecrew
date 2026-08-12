import { config as loadEnv } from 'dotenv';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

/**
 * THE FLAG-ON STORY SUITE — a second config, deliberately.
 *
 * STORY_MODE is read from the server's environment, so one process cannot serve both the dark
 * path and the lit one. `playwright.config.ts` runs everything with the flag unset (that is what
 * `story-flag.spec.ts` asserts); this config runs the lit specs against their own servers with
 * STORY_MODE=on, on their own ports so they never fight over 3100.
 *
 * THREE SERVERS, ONE VARIABLE APART EACH TIME.
 *
 *   3101  lit · CHAPTERS_DIR=e2e fixture     → story-lit.spec.ts
 *   3102  lit · content/chapters · staging   → story-gated-chapter.spec.ts, review VISIBLE
 *   3103  lit · content/chapters · production→ story-gated-chapter.spec.ts, review ABSENT
 *
 * 3102 and 3103 read the writer's own folder, so what they render is a chapter that passed
 * validate:content, scan:vocab, check:reading-age, scan:chapter-style and verify:chapters — all
 * of which run ahead of the e2e steps in CI. That is the path a first delivery takes, and 3101
 * cannot exercise it: `e2e` is an excluded segment in the vocabulary scanner, so a fixture there
 * reaches the reader ungated by construction.
 *
 * 3101 keeps its own fixture only because story-lit still builds its own LIVE rows at test time.
 * That reason is now expiring: the seed gained a PERMANENT read-only fixture set
 * (`zz-e2e-fixture-word` / `zz-e2e-fixture-item`, both LIVE, seeded before the chapter gates run
 * in CI), which is what lets the gated chapter carry a `clueTap` at all. Once story-lit points at
 * those rows instead of creating its own, its chapter can move into content/chapters and this
 * server can go — leaving two, differing only in APP_ENV.
 *
 * 3102 and 3103 differ ONLY in APP_ENV, because that is the whole of `readable()`: released
 * everywhere, review outside production. Proving both halves needs two processes, not two
 * requests.
 */
loadEnv({ path: '../../.env', quiet: true });

// One above the main suite's default, so a lit run and a dark run can coexist. The `e2e:story`
// script also sets E2E_PORT to this, because e2e/fixtures.ts builds its API base URL from
// E2E_PORT — leave it at 3100 and the fixtures talk to a server that is not the lit one (or to
// nothing at all). The two gated servers are addressed by absolute URL from the spec, so they
// need no baseURL of their own.
const PORT = Number(process.env.E2E_PORT ?? 3101);
const GATED_PORT = Number(process.env.E2E_GATED_PORT ?? 3102);
const GATED_PROD_PORT = Number(process.env.E2E_GATED_PROD_PORT ?? 3103);

/**
 * A REUSED SERVER MUST BE THE RIGHT SERVER (David, 2026-08-12).
 *
 * `reuseExistingServer` is true off CI, so a server already listening on one of these ports is
 * adopted whatever it was started with. That cost real time already: orphaned `next start`
 * processes from earlier runs were adopted here, one of them without APP_ENV=production, and two
 * gated-chapter tests failed as though the ISOLATION RULE were broken. The failure pointed at the
 * app; the fault was the harness.
 *
 * So a spec asserts the server it is talking to. `/api/health` already reports `env`, which is
 * the one variable these three servers differ on, and `STORY_MODE` is proved by the tests
 * themselves (with the flag off there is nothing to see). Called from a spec's beforeAll, it
 * turns a day of chasing an imaginary app bug into one line naming the real cause.
 */
export async function assertServerEnv(baseURL: string, expected: string): Promise<void> {
  const response = await fetch(`${baseURL}/api/health`);
  const body = (await response.json()) as { env?: string };
  if (body.env !== expected) {
    throw new Error(
      `WRONG SERVER on ${baseURL}: /api/health reports APP_ENV="${body.env}", expected "${expected}".\n` +
        'reuseExistingServer adopted a process started with different settings — almost certainly an\n' +
        'orphan from an earlier run. Kill anything listening on 3101-3103 and re-run. This is a\n' +
        'harness fault, not an app fault: nothing about the application is being tested right now.',
    );
  }
}

/** `pnpm start` hardcodes -p 3100, so the port goes to next directly rather than through it. */
const serve = (port: number): string =>
  process.env.E2E_DEV ? `pnpm exec next dev -p ${port}` : `pnpm exec next start -p ${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /story-(lit|gated-chapter)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  // Same reasoning as the main config: a retry that turns a real race green is a discarded signal.
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    channel: 'chromium',
  },
  webServer: [
    {
      command: serve(PORT),
      url: `http://localhost:${PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        STORY_MODE: 'on',
        // Playwright loads this config as CJS (no import.meta) and runs from apps/web.
        CHAPTERS_DIR: resolve(process.cwd(), 'e2e/fixtures/chapters'),
      },
    },
    {
      command: serve(GATED_PORT),
      url: `http://localhost:${GATED_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // No CHAPTERS_DIR: this server reads content/chapters, the writer's own folder.
      env: { STORY_MODE: 'on', APP_ENV: 'staging' },
    },
    {
      command: serve(GATED_PROD_PORT),
      url: `http://localhost:${GATED_PROD_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // The one variable under test. Everything else on this server matches 3102.
      env: { STORY_MODE: 'on', APP_ENV: 'production' },
    },
  ],
});
