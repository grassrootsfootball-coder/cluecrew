/**
 * Readiness IO (ADDENDUM-C §3/§5): feeds the pure model from the database,
 * snapshots it (nightly + on session end), and fires the unlock events. All
 * of it parent-facing — nothing here ever reaches the child's app.
 */
import {
  academicYearOf,
  computeReadiness,
  intensityForCapture,
  READINESS_THRESHOLDS,
  type Blueprint,
  type Readiness,
} from '@cluecrew/core';
import { logEvent, prisma } from '@cluecrew/db';
import { sendEmail } from '@/lib/email';
import { boardInvitationTemplate } from '@/lib/email-templates';
import { storyEnabled } from '@/lib/story';
import { listBlueprints } from '@/lib/crew/mocks';

/** Boss Round outcomes, newest first. Boss ROUND only: mock paper answers
 *  live on MockSitting, never in Attempt rows, so boss_case attempts are
 *  exactly the daily closer signal the transfer metric wants. */
export async function bossRoundOutcomes(childId: string): Promise<boolean[]> {
  const attempts = await prisma.attempt.findMany({
    where: { childId, context: 'boss_case' },
    orderBy: { createdAt: 'desc' },
    take: READINESS_THRESHOLDS.transferWindow,
    select: { correct: true },
  });
  return attempts.map((attempt) => attempt.correct);
}

export async function readinessFor(childId: string, blueprint: Blueprint): Promise<Readiness> {
  const [caseFiles, districtCaseCount, outcomes, child, halfSittings] = await Promise.all([
    prisma.caseFile.findMany({
      where: { childId },
      include: { case: { select: { questionTypeId: true } } },
    }),
    prisma.case.count(),
    bossRoundOutcomes(childId),
    prisma.childProfile.findUniqueOrThrow({ where: { id: childId } }),
    prisma.mockSitting.findMany({ where: { childId, status: 'COMPLETED' } }),
  ]);

  const halfIds = new Set(
    listBlueprints()
      .filter((candidate) => candidate.district === blueprint.district && candidate.variant === 'half')
      .map((candidate) => candidate.id),
  );

  return computeReadiness({
    blueprint,
    caseFiles: caseFiles.map((file) => ({
      questionTypeId: file.case.questionTypeId,
      masteryLevel: file.masteryLevel,
      cracked: Boolean(file.solvedAt),
    })),
    districtCaseCount,
    bossRoundOutcomes: outcomes,
    streakWeeksInWindow: Math.min(child.streakWeeks, READINESS_THRESHOLDS.rhythmWindowWeeks),
    completedHalfPaper: halfSittings.some((sitting) => halfIds.has(sitting.blueprintId)),
  });
}

/**
 * Recompute per child per FULL blueprint (the ladder's target), snapshot, and
 * fire the crossing events: readiness_half/full_unlocked when the rung rises,
 * intensity_column_changed when the column moves (Addendum D §5). Runs on
 * session end and nightly — dashboard beats and the weekly email read the
 * events, so an unlock is announced once, not every night.
 */
export async function snapshotReadiness(childId: string): Promise<void> {
  const child = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
  const now = new Date();
  const intensity = intensityForCapture(
    child.yearGroupAtCapture,
    child.capturedAcademicYear,
    child.examYear,
    now,
  );

  for (const blueprint of listBlueprints().filter((candidate) => candidate.variant === 'full')) {
    const readiness = await readinessFor(childId, blueprint);
    const previous = await prisma.readinessSnapshot.findFirst({
      where: { childId, district: blueprint.district, blueprintId: blueprint.id },
      orderBy: { computedAt: 'desc' },
    });

    const caseFiles = await prisma.caseFile.findMany({ where: { childId } });
    const tier = caseFiles.length
      ? Math.round(
          caseFiles.reduce((sum, file) => sum + file.tierEstimate, 0) / caseFiles.length,
        )
      : 2;

    await prisma.readinessSnapshot.create({
      data: {
        childId,
        district: blueprint.district,
        blueprintId: blueprint.id,
        coveragePct: readiness.coveragePct,
        crackedPct: readiness.crackedPct,
        transferPct: readiness.transferPct,
        tier,
        intensityColumn: intensity.column,
      },
    });

    // Rung crossings, announced once.
    const previousRung = await lastAnnouncedRung(childId, blueprint.district);
    if (readiness.rung !== 'locked' && previousRung === 'locked') {
      await logEvent({
        name: 'readiness_half_unlocked',
        childId,
        props: { district: blueprint.district, blueprintId: blueprint.id },
      });
      await sendBoardInvitation(childId, 'preliminary');
    }
    if (readiness.rung === 'full' && previousRung !== 'full') {
      await logEvent({
        name: 'readiness_full_unlocked',
        childId,
        props: { district: blueprint.district, blueprintId: blueprint.id },
      });
      await sendBoardInvitation(childId, 'full');
    }
    if (previous && previous.intensityColumn !== intensity.column) {
      await logEvent({
        name: 'intensity_column_changed',
        childId,
        props: { from: previous.intensityColumn, to: intensity.column },
      });
    }
  }
}

/** The highest rung ever announced for this child+district, from events. */
async function lastAnnouncedRung(
  childId: string,
  district: string,
): Promise<'locked' | 'half' | 'full'> {
  const events = await prisma.event.findMany({
    where: { childId, name: { in: ['readiness_half_unlocked', 'readiness_full_unlocked'] } },
    select: { name: true, props: true },
  });
  const inDistrict = events.filter(
    (event) => (event.props as { district?: string }).district === district,
  );
  if (inDistrict.some((event) => event.name === 'readiness_full_unlocked')) return 'full';
  if (inDistrict.length > 0) return 'half';
  return 'locked';
}

/** Rollover state for the parent beat (Addendum D §1). */
export async function rolloverState(childId: string): Promise<{
  pending: boolean;
  effectiveYear: number;
} | null> {
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child) return null;
  const now = new Date();
  const confirmations = await prisma.event.findMany({
    where: { childId, name: { in: ['year_rollover_confirmed', 'year_rollover_corrected'] } },
    select: { props: true },
  });
  const lastConfirmed = confirmations.reduce<number | null>((latest, event) => {
    const year = (event.props as { academicYear?: number }).academicYear ?? null;
    return year !== null && (latest === null || year > latest) ? year : latest;
  }, null);
  const { rolloverPending, effectiveYearGroup } = await import('@cluecrew/core');
  return {
    pending: rolloverPending(child.capturedAcademicYear, lastConfirmed, now),
    effectiveYear: effectiveYearGroup(child.yearGroupAtCapture, child.capturedAcademicYear, now),
  };
}

/** One-tap confirmation of the September rollover (Addendum D §1). */
export async function confirmRollover(parentId: string, childId: string): Promise<void> {
  await logEvent({
    name: 'year_rollover_confirmed',
    parentId,
    childId,
    props: { academicYear: academicYearOf(new Date()) },
  });
}

/**
 * The Board invitation email (STORY BIBLE §6, feature-flagged): rides the
 * announced-once unlock branches above, so it can never send twice. Flag
 * off → unlocks stay silent exactly as before.
 */
async function sendBoardInvitation(
  childId: string,
  rung: 'preliminary' | 'full',
): Promise<void> {
  if (!storyEnabled()) return;
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    include: { parent: true },
  });
  if (!child) return;
  const readinessLine =
    rung === 'full'
      ? `${child.crewName} has now been taught every question type a full paper carries, and their exam-format accuracy says they are ready to sit one.`
      : `${child.crewName} has covered enough question types for a half-length practice paper — a gentle first sitting, no full timings.`;
  await sendEmail({
    to: child.parent.email,
    ...boardInvitationTemplate(child.crewName, rung, readinessLine),
  });
}
