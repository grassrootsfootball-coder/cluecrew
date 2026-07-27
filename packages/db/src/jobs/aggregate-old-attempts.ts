/**
 * Retention job (§5) — DESIGNED NOW, ENABLED LATER.
 *
 * Attempt-level data older than the child's exam year + 12 months is rolled up
 * into AggregateDailyStat (no childId — anonymous by design) and the raw
 * Attempt rows are deleted. The rollup keeps the evidence base for future
 * cohort claims (manifesto L1) without retaining child-level detail.
 *
 * Flip ENABLED to true only after the DPIA retention section is reviewed at a
 * phase gate and David ratifies the window.
 */
import { prisma } from '../index';

export const ENABLED = false;
const RETENTION_MONTHS_AFTER_EXAM_YEAR = 12;

export async function runAggregation(now = new Date()): Promise<{ aggregated: number; deleted: number }> {
  if (!ENABLED) {
    console.log('Aggregation job is designed but not yet enabled (Phase 1). Nothing done.');
    return { aggregated: 0, deleted: 0 };
  }

  // A child's data ages out after 1 Sept of (examYear) + RETENTION months.
  const children = await prisma.childProfile.findMany({
    where: { examYear: { not: null } },
    select: { id: true, examYear: true },
  });

  let aggregated = 0;
  let deleted = 0;

  for (const child of children) {
    const examSeptember = new Date(Date.UTC(child.examYear!, 8, 1));
    const cutoff = new Date(examSeptember);
    cutoff.setUTCMonth(cutoff.getUTCMonth() + RETENTION_MONTHS_AFTER_EXAM_YEAR);
    if (now < cutoff) continue;

    const attempts = await prisma.attempt.findMany({
      where: { childId: child.id, createdAt: { lt: cutoff } },
      select: { id: true, itemId: true, correct: true, createdAt: true },
    });
    if (attempts.length === 0) continue;

    const items = await prisma.item.findMany({
      where: { id: { in: [...new Set(attempts.map((a) => a.itemId))] } },
      select: { id: true, questionTypeId: true, questionType: { select: { district: true } } },
    });
    const itemById = new Map(items.map((i) => [i.id, i]));

    const buckets = new Map<string, { district: (typeof items)[number]['questionType']['district']; questionTypeId: string; day: Date; attempts: number; correct: number }>();
    for (const attempt of attempts) {
      const item = itemById.get(attempt.itemId);
      if (!item) continue;
      const day = new Date(Date.UTC(attempt.createdAt.getUTCFullYear(), attempt.createdAt.getUTCMonth(), attempt.createdAt.getUTCDate()));
      const key = `${item.questionTypeId}:${day.toISOString()}`;
      const bucket = buckets.get(key) ?? {
        district: item.questionType.district,
        questionTypeId: item.questionTypeId,
        day,
        attempts: 0,
        correct: 0,
      };
      bucket.attempts += 1;
      if (attempt.correct) bucket.correct += 1;
      buckets.set(key, bucket);
    }

    for (const bucket of buckets.values()) {
      await prisma.aggregateDailyStat.upsert({
        where: {
          district_questionTypeId_day: {
            district: bucket.district,
            questionTypeId: bucket.questionTypeId,
            day: bucket.day,
          },
        },
        create: bucket,
        update: {
          attempts: { increment: bucket.attempts },
          correct: { increment: bucket.correct },
        },
      });
      aggregated += 1;
    }

    const removal = await prisma.attempt.deleteMany({
      where: { id: { in: attempts.map((a) => a.id) } },
    });
    deleted += removal.count;
  }

  return { aggregated, deleted };
}

const isDirectRun = process.argv[1]?.endsWith('aggregate-old-attempts.ts');
if (isDirectRun) {
  runAggregation()
    .then((result) => {
      console.log(`Aggregation: ${result.aggregated} bucket(s) written, ${result.deleted} attempt row(s) removed.`);
      return prisma.$disconnect();
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
