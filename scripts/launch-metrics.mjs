/**
 * Step-1 launch funnel from FIRST-PARTY events (LIVE-LAUNCH-PACK-V3 §3).
 *
 * first_session_completed and first_case_cracked are deliberately NOT
 * Plausible goals: they happen inside the child app, whose CSP admits no
 * third-party script (manifesto S1) and whose users are children (DPIA: no
 * trackers on child surfaces). The manifesto wins that conflict, so the
 * activation metrics read from the Event table — which already records
 * every signup, session and cracked case with IDs and enums only.
 *
 * Run: node scripts/launch-metrics.mjs   (uses DATABASE_URL from root .env)
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../packages/db/', import.meta.url));

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^"|"$/g, '');
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

const [signups, verified, childProfiles, firstSessions, firstCracks] = await Promise.all([
  prisma.event.findMany({ where: { name: 'signup_completed', createdAt: { gte: since } }, select: { parentId: true } }),
  prisma.event.count({ where: { name: 'email_verified', createdAt: { gte: since } } }),
  prisma.event.count({ where: { name: 'child_profile_created', createdAt: { gte: since } } }),
  prisma.event.groupBy({ by: ['childId'], where: { name: 'session_ended', createdAt: { gte: since } } }),
  prisma.event.groupBy({ by: ['childId'], where: { name: 'case_cracked', createdAt: { gte: since } } }),
]);

// Week-1 return: children whose sessions span more than one calendar day
// within 7 days of their first session.
const sessions = await prisma.event.findMany({
  where: { name: 'session_ended', createdAt: { gte: since } },
  select: { childId: true, createdAt: true },
  orderBy: { createdAt: 'asc' },
});
const byChild = new Map();
for (const s of sessions) {
  if (!s.childId) continue;
  (byChild.get(s.childId) ?? byChild.set(s.childId, []).get(s.childId)).push(s.createdAt);
}
let returned = 0;
for (const dates of byChild.values()) {
  const first = dates[0].getTime();
  const days = new Set(
    dates
      .filter((d) => d.getTime() - first < 7 * 24 * 60 * 60 * 1000)
      .map((d) => d.toISOString().slice(0, 10)),
  );
  if (days.size > 1) returned += 1;
}

console.log(`Launch funnel (last 28 days, first-party events)
  signup_completed:        ${signups.length}
  email_verified:          ${verified}
  child_profile_created:   ${childProfiles}
  children w/ 1+ session:  ${firstSessions.length}
  children w/ 1+ crack:    ${firstCracks.length}  ← activation
  week-1 return (2+ days): ${returned} of ${byChild.size}
Visitor counts and demo/reserve goals live in Plausible; reserves:`);
const reserves = await prisma.waitlistSignup.count({ where: { source: 'founding-reserve' } });
const confirmedReserves = await prisma.waitlistSignup.count({
  where: { source: 'founding-reserve', confirmedAt: { not: null } },
});
console.log(`  founding reserves:       ${reserves} (${confirmedReserves} confirmed)`);
await prisma.$disconnect();
