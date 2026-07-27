/**
 * The weekly email (BUILD-PHASE-5 §4): the product for busy parents.
 * Subject = one concrete win; body = 3 blocks max (the win, the one thing to
 * try at home, the runway line); reading time under 60 seconds. One-tap
 * unsubscribe that never touches transactional email.
 */
import { createHmac } from 'node:crypto';
import { prisma } from '@cluecrew/db';
import { billingNow } from '@/lib/billing';
import { sendEmail } from '@/lib/email';
import { parentDashboard } from './dashboard';

const DAY_MS = 86_400_000;

export function weeklyUnsubscribeToken(parentId: string): string {
  return createHmac('sha256', process.env.AUTH_SECRET ?? '')
    .update(`weekly:${parentId}`)
    .digest('hex')
    .slice(0, 32);
}

export interface WeeklyEmail {
  subject: string;
  text: string;
}

export async function buildWeeklyEmail(parentId: string, origin: string): Promise<WeeklyEmail | null> {
  const parent = await prisma.parentAccount.findUnique({ where: { id: parentId } });
  if (!parent || parent.deletedAt || parent.weeklyOptOut || !parent.emailVerified) return null;

  const dashboards = await parentDashboard(parentId);
  if (dashboards.length === 0) return null;
  const now = billingNow();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

  // The win: a cracked case this week beats everything; then new words; then rhythm.
  let subject: string | null = null;
  let winLine: string | null = null;
  for (const child of dashboards) {
    const crackedEvent = await prisma.event.findFirst({
      where: { childId: child.childId, name: 'case_cracked', createdAt: { gte: weekAgo } },
      orderBy: { createdAt: 'desc' },
    });
    if (crackedEvent) {
      const caseId = (crackedEvent.props as { caseId?: string }).caseId;
      const caseRow = caseId ? await prisma.case.findUnique({ where: { id: caseId } }) : null;
      const title = caseRow?.title ?? 'a case';
      subject = `${child.crewName} cracked ${title} this week`;
      winLine = `${child.crewName} cracked "${title}" — that question type is now theirs, and it enters gentle review so it stays theirs.`;
      break;
    }
  }
  if (!subject) {
    const child = dashboards[0]!;
    if (child.wordsThisWeek.length > 0) {
      subject = `${child.crewName} collected ${child.wordsThisWeek.length} new word${child.wordsThisWeek.length === 1 ? '' : 's'} this week`;
      winLine = `${child.crewName}'s Word Vault grew by ${child.wordsThisWeek.length} this week — including "${child.wordsThisWeek[0]!.headword}".`;
    } else if (child.sessionsThisWeek > 0) {
      subject = `${child.crewName} showed up ${child.sessionsThisWeek} time${child.sessionsThisWeek === 1 ? '' : 's'} this week`;
      winLine = `${child.crewName} practised ${child.sessionsThisWeek} time${child.sessionsThisWeek === 1 ? '' : 's'} — showing up is the win; everything else compounds from it.`;
    } else {
      subject = `A fresh week for ${child.crewName}`;
      winLine = `No sessions last week — completely fine. One 15-minute loop this week restarts the rhythm; the streak lantern forgives.`;
    }
  }

  const child = dashboards[0]!;
  const tryLine =
    child.developing[0]
      ? `One thing to try: ${child.developing[0].label} is still warming up. ${child.developing[0].action}`
      : `One thing to try: ${child.wordPrompt}`;
  const runwayLine =
    child.runway.monthsToExam !== null
      ? `Runway: ${child.runway.monthsToExam} months to the test window, ${child.runway.casesCracked} of ${child.runway.casesTotal} cases cracked. ${child.runway.nextMilestone}`
      : `Progress: ${child.runway.casesCracked} of ${child.runway.casesTotal} cases cracked. ${child.runway.nextMilestone}`;

  const unsubscribe = `${origin}/api/email/weekly-unsubscribe?p=${parentId}&t=${weeklyUnsubscribeToken(parentId)}`;

  return {
    subject,
    text: `Hello ${parent.displayName},\n\n${winLine}\n\n${tryLine}\n\n${runwayLine}\n\nThe ClueCrew team\n\n—\nStop these weekly summaries (one tap, transactional emails unaffected):\n${unsubscribe}`,
  };
}

/** Send to every eligible parent. Cron owns the Sunday 17:00 Europe/London schedule. */
export async function sendWeeklyEmails(origin: string): Promise<{ sent: number }> {
  const parents = await prisma.parentAccount.findMany({
    where: { deletedAt: null, weeklyOptOut: false, emailVerified: { not: null } },
    select: { id: true, email: true },
  });
  let sent = 0;
  for (const parent of parents) {
    const email = await buildWeeklyEmail(parent.id, origin);
    if (!email) continue;
    await sendEmail({ to: parent.email, ...email });
    sent += 1;
  }
  return { sent };
}
