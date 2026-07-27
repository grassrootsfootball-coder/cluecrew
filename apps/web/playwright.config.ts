import { defineConfig } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 2,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: process.env.CI ? `pnpm start` : `pnpm dev`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
