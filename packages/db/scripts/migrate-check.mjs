// CI gate: fails when prisma/migrations no longer matches schema.prisma
// (migration drift, BUILD-PHASE-1 §2). Uses the shadow database.
import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../../../.env') });

const shadowUrl = process.env.SHADOW_DATABASE_URL;
if (!shadowUrl) {
  console.error('SHADOW_DATABASE_URL is not set');
  process.exit(1);
}

const result = spawnSync(
  'pnpm',
  [
    'exec',
    'prisma',
    'migrate',
    'diff',
    '--from-migrations',
    './prisma/migrations',
    '--to-schema-datamodel',
    './prisma/schema.prisma',
    '--shadow-database-url',
    shadowUrl,
    '--exit-code',
  ],
  { cwd: resolve(here, '..'), stdio: 'inherit' },
);

if (result.status !== 0) {
  console.error('\nMigration drift detected: prisma/migrations does not produce schema.prisma.');
  process.exit(1);
}
console.log('No migration drift.');
