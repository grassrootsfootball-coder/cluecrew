/**
 * Parent dashboard data assembly (BUILD-PHASE-5 §4). Reads only; every
 * pedagogical number comes from engine state the core already computed.
 * Framing rules live here: rhythm not league table, plain English not
 * percentages (percentages available behind a tap), no countdown urgency.
 */
import { ENGINE_CONFIG, RANKS, RANK_REQUIREMENTS, computeStreak, type Rank } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { mondayOf } from '@/lib/crew/orchestrator';
import { supportFor, wordConversationPrompt } from './action-library';

const DAY_MS = 86_400_000;
export const GENTLE_WEEKLY_TARGET = 5;

export interface TypeInsight {
  label: string;
  /** Plain-English state, e.g. "cracked it" / "clicking" / "still warming up". */
  state: string;
  action: string;
  /** Behind-a-tap detail for parents who want it. */
  masteryPercent: number;
}

export interface ChildDashboard {
  childId: string;
  crewName: string;
  sessionsThisWeek: number;
  minutesThisWeek: number;
  streak: { state: 'alive' | 'rekindled'; weeks: number };
  clicking: TypeInsight[];
  developing: TypeInsight[];
  wordsThisWeek: Array<{ headword: string; definitionChild: string }>;
  wordPrompt: string;
  runway: {
    monthsToExam: number | null;
    casesCracked: number;
    casesTotal: number;
    nextMilestone: string;
  };
}

function nextMilestone(rank: Rank, casesCracked: number, streakWeeks: number, taughtBack: number): string {
  const rankIndex = RANKS.indexOf(rank);
  const next = RANKS[rankIndex + 1];
  if (!next) return 'Chief Inspector — the top of the force.';
  const requirement = RANK_REQUIREMENTS[next as Exclude<Rank, 'TRAINEE'>];
  const label = next
    .split('_')
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(' ');
  if (casesCracked < requirement.casesCracked) {
    const gap = requirement.casesCracked - casesCracked;
    return `${gap} more case${gap === 1 ? '' : 's'} to ${label}.`;
  }
  if ((requirement.streakWeeks ?? 0) > streakWeeks) return `A steady week or two of sessions reaches ${label}.`;
  if ((requirement.taughtBackCount ?? 0) > taughtBack) return `Teaching the mascot once reaches ${label}.`;
  if (requirement.bossCaseParticipated) return `One Big Question at the end of a session reaches ${label}.`;
  return `${label} is next.`;
}

export async function parentDashboard(parentId: string): Promise<ChildDashboard[]> {
  const children = await prisma.childProfile.findMany({
    where: { parentId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * DAY_MS);

  const dashboards: ChildDashboard[] = [];
  for (const child of children) {
    const [sessions, caseFiles, weekWords, taughtBackCount] = await Promise.all([
      prisma.session.findMany({
        where: { childId: child.id, startedAt: { gte: eightWeeksAgo } },
        select: { startedAt: true, secondsActive: true },
      }),
      prisma.caseFile.findMany({
        where: { childId: child.id },
        include: { case: { select: { questionTypeId: true } } },
      }),
      prisma.wordVaultEntry.findMany({
        where: { childId: child.id, collectedAt: { gte: weekAgo } },
        include: { word: { select: { headword: true, definitionChild: true, rootFamily: true } } },
        orderBy: { collectedAt: 'desc' },
        take: 6,
      }),
      prisma.caseFile.count({ where: { childId: child.id, taughtBackAt: { not: null } } }),
    ]);

    const weekSessions = sessions.filter((session) => session.startedAt >= weekAgo);
    const minutesByDay = new Map<string, number>();
    for (const session of sessions) {
      const key = session.startedAt.toISOString().slice(0, 10);
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + session.secondsActive / 60);
    }
    const weekStarts: Date[] = [];
    for (let start = mondayOf(eightWeeksAgo); start.getTime() < now.getTime(); start = new Date(start.getTime() + 7 * DAY_MS)) {
      weekStarts.push(start);
    }
    const streak = computeStreak(
      [...minutesByDay.entries()].map(([key, minutes]) => ({
        date: new Date(`${key}T00:00:00Z`),
        minutesActive: minutes,
      })),
      weekStarts,
      now,
    );

    const practiced = caseFiles.filter((caseFile) => caseFile.attemptCount > 0);
    const byMastery = [...practiced].sort((a, b) => b.masteryLevel - a.masteryLevel);
    const toInsight = (caseFile: (typeof practiced)[number]): TypeInsight => {
      const support = supportFor(caseFile.case.questionTypeId);
      const cracked = Boolean(caseFile.solvedAt);
      return {
        label: support.label,
        state: cracked
          ? 'cracked it'
          : caseFile.masteryLevel >= ENGINE_CONFIG.mastery.progressing
            ? 'clicking'
            : 'still warming up',
        action: support.action,
        masteryPercent: Math.round(caseFile.masteryLevel * 100),
      };
    };
    const clicking = byMastery
      .filter((caseFile) => caseFile.masteryLevel >= ENGINE_CONFIG.mastery.progressing)
      .slice(0, 2)
      .map(toInsight);
    const developing = byMastery
      .filter((caseFile) => caseFile.masteryLevel < ENGINE_CONFIG.mastery.progressing)
      .slice(-2)
      .reverse()
      .map(toInsight);

    const monthsToExam = child.examYear
      ? Math.max(0, Math.round((Date.UTC(child.examYear, 8, 1) - now.getTime()) / (30.44 * DAY_MS)))
      : null;

    dashboards.push({
      childId: child.id,
      crewName: child.crewName,
      sessionsThisWeek: weekSessions.length,
      minutesThisWeek: Math.round(weekSessions.reduce((sum, session) => sum + session.secondsActive, 0) / 60),
      streak,
      clicking,
      developing,
      wordsThisWeek: weekWords.map((entry) => ({
        headword: entry.word.headword,
        definitionChild: entry.word.definitionChild,
      })),
      wordPrompt: wordConversationPrompt(
        weekWords.map((entry) => entry.word.headword),
        weekWords.find((entry) => entry.word.rootFamily)?.word.rootFamily ?? null,
      ),
      runway: {
        monthsToExam,
        casesCracked: caseFiles.filter((caseFile) => caseFile.solvedAt).length,
        casesTotal: 21,
        nextMilestone: nextMilestone(child.rank, caseFiles.filter((c) => c.solvedAt).length, child.streakWeeks, taughtBackCount),
      },
    });
  }
  return dashboards;
}
