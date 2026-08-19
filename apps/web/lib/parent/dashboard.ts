/**
 * Parent dashboard data assembly (BUILD-PHASE-5 §4). Reads only; every
 * pedagogical number comes from engine state the core already computed.
 * Framing rules live here: rhythm not league table, plain English not
 * percentages (percentages available behind a tap), no countdown urgency.
 */
import { ENGINE_CONFIG, RANKS, RANK_REQUIREMENTS, computeStreak, type Rank } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { mondayOf } from '@/lib/crew/orchestrator';
import { openCaseIds } from '@/lib/entitlements';
import { supportFor, wordConversationPrompt } from './action-library';

const DAY_MS = 86_400_000;

/**
 * District enum -> what a parent calls the subject. Not the child's quarter names (The Reading Room,
 * Codebreaker Lane) — those are the in-world map and mean nothing on a billing-adjacent screen.
 * A district absent from here falls back to its own id rather than vanishing: a subject nobody has
 * named yet is still a subject the parent is paying for (R61).
 */
const DISTRICT_LABEL: Record<string, string> = {
  VR: 'Verbal Reasoning',
  ENGLISH: 'English',
};
export const GENTLE_WEEKLY_TARGET = 5;

export interface TypeInsight {
  label: string;
  /** Plain-English state, e.g. "cracked it" / "clicking" / "still warming up". */
  state: string;
  action: string;
  /** Behind-a-tap detail for parents who want it. */
  masteryPercent: number;
}

/**
 * WHAT EXISTS IN A DISTRICT, AND HOW MUCH OF IT THIS CHILD CAN OPEN (David's ruling, 2026-08-17 —
 * R176). Per DISTRICT, never whole-account: a single "12 of 25 cases open" hides that VR is nearly
 * all open and English is half, and the question a parent is actually asking is per-subject — *is my
 * child getting English out of this?*
 */
export interface DistrictAvailability {
  /** Plain English, not the enum and not the child's in-world quarter name. */
  label: string;
  /** Every case that EXISTS here. The honest denominator. */
  casesTotal: number;
  /** How many this child can open right now. */
  casesOpen: number;
  allOpen: boolean;
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
  /**
   * NOT ON THE CHILD'S MAP, EVER. D7 keeps a locked case indistinguishable from an unwritten one
   * there, and that protection is for HER, mid-session. It is the wrong rule in the parent's
   * context, where the same silence says the English district is half-BUILT when it is fully built
   * and half-SOLD.
   *
   * AND IT DOES NOT ITEMISE THE LOCKED CASES. Naming them turns a status line into a sales page,
   * and this dashboard is where a parent checks on their child, not where we sell to them.
   */
  districts: DistrictAvailability[];
  runway: {
    monthsToExam: number | null;
    casesCracked: number;
    /** DERIVED. It read a hard-coded 21 until 2026-08-17, when there were 25. */
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
  /**
   * READ ONCE, OUTSIDE THE LOOP: which district each case belongs to. Joined through QuestionType
   * rather than parsed from the case id — `case-en-01` looks parseable and a prefix convention is
   * not a schema (R57).
   */
  const allCases = await prisma.case.findMany({ select: { id: true, questionTypeId: true } });
  const typeDistrict = new Map(
    (await prisma.questionType.findMany({ select: { id: true, district: true } }))
      .map((t) => [t.id, String(t.district)]),
  );

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

    /**
     * WHAT THIS CHILD CAN OPEN, from `openCaseIds` — the SAME function the district page and the
     * orchestrator use, never a re-derivation of the tier rule (R41). If entitlement logic changes,
     * this line changes with it or not at all; it cannot drift into telling a parent something the
     * product does not do.
     */
    const open = await openCaseIds(child.id);
    const perDistrict = new Map<string, { total: number; open: number }>();
    for (const row of allCases) {
      const d = typeDistrict.get(row.questionTypeId) ?? '(unassigned)';
      const e = perDistrict.get(d) ?? { total: 0, open: 0 };
      e.total += 1;
      if (open === 'all' || open.has(row.id)) e.open += 1;
      perDistrict.set(d, e);
    }
    const districts = [...perDistrict]
      .map(([d, v]) => ({
        label: DISTRICT_LABEL[d] ?? d,
        casesTotal: v.total,
        casesOpen: v.open,
        allOpen: v.open === v.total,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

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
      districts,
      runway: {
        monthsToExam,
        casesCracked: caseFiles.filter((caseFile) => caseFile.solvedAt).length,
        // DERIVED. Hard-coded 21 until 2026-08-17, by which time there were 25 across two
        // districts — the same shape as the district lede that said "Five corners" (R172).
        casesTotal: allCases.length,
        nextMilestone: nextMilestone(child.rank, caseFiles.filter((c) => c.solvedAt).length, child.streakWeeks, taughtBackCount),
      },
    });
  }
  return dashboards;
}
