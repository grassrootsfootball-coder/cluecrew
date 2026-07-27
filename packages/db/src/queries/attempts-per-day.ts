/**
 * Sample analytics query (gate checklist #6): attempts per child per day,
 * read from the append-only Event table.
 */
import { prisma } from '../index';

export interface AttemptsPerChildPerDay {
  childId: string;
  day: string;
  attempts: number;
}

export async function attemptsPerChildPerDay(): Promise<AttemptsPerChildPerDay[]> {
  const rows = await prisma.$queryRaw<Array<{ childId: string; day: Date; attempts: bigint }>>`
    SELECT "childId", date_trunc('day', "createdAt") AS day, count(*) AS attempts
    FROM "Event"
    WHERE name = 'attempt_submitted' AND "childId" IS NOT NULL
    GROUP BY "childId", day
    ORDER BY day DESC, "childId"
  `;
  return rows.map((row) => ({
    childId: row.childId,
    day: row.day.toISOString().slice(0, 10),
    attempts: Number(row.attempts),
  }));
}

const isDirectRun = process.argv[1]?.endsWith('attempts-per-day.ts');
if (isDirectRun) {
  attemptsPerChildPerDay()
    .then((rows) => {
      console.table(rows);
      return prisma.$disconnect();
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
