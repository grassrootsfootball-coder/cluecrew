import { defineConfig } from 'vitest/config';

// Gate #1: 90%+ line coverage on mastery, scheduler, adaptivity, session.
const GATE_THRESHOLD = { lines: 90, statements: 90, functions: 90, branches: 80 };

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        'src/mastery.ts': GATE_THRESHOLD,
        'src/scheduler.ts': GATE_THRESHOLD,
        'src/adaptivity.ts': GATE_THRESHOLD,
        'src/session.ts': GATE_THRESHOLD,
      },
    },
  },
});
