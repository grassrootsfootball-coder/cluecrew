import { config as loadEnv } from 'dotenv';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

/**
 * THE FLAG-ON STORY SUITE — a second config, deliberately.
 *
 * STORY_MODE is read from the server's environment, so one process cannot serve both the dark
 * path and the lit one. `playwright.config.ts` runs everything with the flag unset (that is what
 * `story-flag.spec.ts` asserts); this config runs the single lit spec against its own server with
 * STORY_MODE=on, on its own port so both can exist without fighting over 3100.
 *
 * CHAPTERS_DIR points at the e2e fixture chapter rather than content/chapters. A test chapter in
 * the writer's folder would be gated, scanned and shipped as though it were authored content, and
 * would be the first thing a writer saw when opening an otherwise empty directory.
 */
loadEnv({ path: '../../.env', quiet: true });

// One above the main suite's default, so a lit run and a dark run can coexist. The `e2e:story`
// script also sets E2E_PORT to this, because e2e/fixtures.ts builds its API base URL from
// E2E_PORT — leave it at 3100 and the fixtures talk to a server that is not the lit one (or to
// nothing at all).
const PORT = Number(process.env.E2E_PORT ?? 3101);

export default defineConfig({
  testDir: './e2e',
  testMatch: /story-lit\.spec\.ts/,
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
  webServer: {
    // `pnpm start` hardcodes -p 3100, so the port is passed to next directly rather than through
    // the script — otherwise this server would collide with the dark suite's.
    command: process.env.E2E_DEV
      ? `pnpm exec next dev -p ${PORT}`
      : `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      STORY_MODE: 'on',
      // Playwright loads this config as CJS (no import.meta) and runs from apps/web.
      CHAPTERS_DIR: resolve(process.cwd(), 'e2e/fixtures/chapters'),
    },
  },
});
