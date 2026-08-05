/**
 * ONE source of truth for what a REVIEWER may reach in the admin CMS.
 *
 * The middleware refuses everything else at the edge (that is the security
 * layer and it does not move). This module additionally lets the NAV render
 * only the links a given role can actually open — usability only, per David's
 * ruling of 2026-08-02: a teacher who clicks "Regions" out of curiosity in
 * minute three of training used to land on a bare 403 with no way back.
 *
 * Nav and middleware read the SAME list deliberately. Two hand-maintained
 * copies of a permission list drift, and the direction they drift is always
 * the same: the nav offers something the middleware refuses.
 */
import type { StaffRole } from '@cluecrew/db';

export interface AdminNavItem {
  href: string;
  label: string;
}

/**
 * A REVIEWER's world: the review surfaces, and nothing else. Order is the
 * order of a working day — the queue they are here for comes first.
 */
export const REVIEWER_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/misconceptions', label: 'Misconceptions' },
  { href: '/admin/items', label: 'Items' },
  { href: '/admin/words', label: 'Words' },
  { href: '/admin/nvr-samples', label: 'NVR sample sheets' },
  { href: '/admin/sitting-one', label: 'Sitting #1' },
];

/** Everything, for ADMIN and AUTHOR. */
export const FULL_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/items', label: 'Items' },
  { href: '/admin/import', label: 'Bulk import' },
  { href: '/admin/misconceptions', label: 'Misconceptions' },
  { href: '/admin/words', label: 'Words' },
  { href: '/admin/regions', label: 'Regions' },
  { href: '/admin/bursaries', label: 'Bursaries' },
  { href: '/admin/audit', label: 'Audit log' },
];

/**
 * Path prefixes a REVIEWER may enter, derived from the nav above so the two
 * cannot disagree. `/admin` itself is matched exactly by the middleware.
 */
export const REVIEWER_ALLOWED_PREFIXES: string[] = REVIEWER_NAV.map((item) => item.href).filter(
  (href) => href !== '/admin',
);

export function navFor(role: Exclude<StaffRole, 'NONE'>): AdminNavItem[] {
  return role === 'REVIEWER' ? REVIEWER_NAV : FULL_NAV;
}
