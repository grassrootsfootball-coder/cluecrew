/**
 * Admin CMS access control (BUILD-PHASE-2 §5) and the audit log every admin
 * action must write to.
 */
import { prisma, type ParentAccount, type Prisma, type StaffRole } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';

export type StaffMember = ParentAccount & { effectiveRole: Exclude<StaffRole, 'NONE'> };

/** ADMIN_EMAILS remains a bootstrap path so the first admin can exist. */
export async function currentStaff(): Promise<StaffMember | null> {
  const parent = await currentParent();
  if (!parent) return null;
  const bootstrapAdmins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const effectiveRole = bootstrapAdmins.includes(parent.email.toLowerCase())
    ? 'ADMIN'
    : parent.staffRole !== 'NONE'
      ? parent.staffRole
      : null;
  if (!effectiveRole) return null;
  return { ...parent, effectiveRole };
}

export function roleAllows(role: Exclude<StaffRole, 'NONE'>, allowed: Array<Exclude<StaffRole, 'NONE'>>): boolean {
  return role === 'ADMIN' || allowed.includes(role);
}

export async function recordAudit(
  actorId: string,
  action: string,
  targetKind: string,
  targetId: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  await prisma.adminAuditLog.create({
    data: { actorId, action, targetKind, targetId, detail: (detail as Prisma.InputJsonValue) ?? undefined },
  });
}
