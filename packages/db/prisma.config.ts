/**
 * PRISMA 7 CONFIG (R1049). Prisma 7 no longer reads connection URLs from schema.prisma, and its CLI no
 * longer loads .env on its own. The package scripts already wrap every database command in
 * `dotenv -e ../../.env --`, so the URLs come from the environment exactly as before; `generate`
 * needs no connection, so an absent URL is left undefined rather than refused here.
 */
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
