/**
 * Nightly calibration job (BUILD-PHASE-3 §2): recompute calibratedDifficulty
 * from aggregate attempt data. Items drifting ≥1.5 tiers from the authored
 * tier are flagged to the CMS review queue (calibrationFlaggedAt) — the live
 * QC net for authoring errors, including AI-drafted ones.
 */
import { calibrateItem } from '@cluecrew/core';
import { prisma } from '../index';

export async function runCalibration(now = new Date()): Promise<{ calibrated: number; flagged: number }> {
  const items = await prisma.item.findMany({
    where: { status: { in: ['LIVE', 'DRAFT', 'REVIEWED'] } },
    select: { id: true, difficultyTier: true, calibrationFlaggedAt: true },
  });

  let calibrated = 0;
  let flagged = 0;
  for (const item of items) {
    const attempts = await prisma.attempt.findMany({
      where: { itemId: item.id },
      select: { correct: true },
      take: 2000,
      orderBy: { createdAt: 'desc' },
    });
    const result = calibrateItem(item.difficultyTier, attempts);
    if (result.calibratedDifficulty === null) continue;

    await prisma.item.update({
      where: { id: item.id },
      data: {
        calibratedDifficulty: result.calibratedDifficulty,
        calibrationFlaggedAt: result.driftFlagged ? (item.calibrationFlaggedAt ?? now) : null,
      },
    });
    calibrated += 1;
    if (result.driftFlagged) flagged += 1;
  }
  return { calibrated, flagged };
}

const isDirectRun = process.argv[1]?.endsWith('calibrate-items.ts');
if (isDirectRun) {
  runCalibration()
    .then(({ calibrated, flagged }) => {
      console.log(`Calibration complete: ${calibrated} item(s) calibrated, ${flagged} flagged for review.`);
      return prisma.$disconnect();
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
