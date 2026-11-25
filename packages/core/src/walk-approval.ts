/**
 * WHICH WALK SCRIPTS MAY REACH A CHILD — a declared set, empty by design until Annie has read them.
 *
 * **THE SCRIPTS WERE NEVER RULED CHILD-FACING BECAUSE THEY WERE MEASURED UNREACHABLE** (R221).
 * Building Walk makes them reachable, which is the point, and the same act flips 670 scripts from
 * provisional-in-scope to actually child-facing. So the dispatcher ships with the serving gate
 * CLOSED and this file is the only thing that opens it.
 *
 * **A MACHINE SCAN IS NOT A REVIEWER READ** (R94). Cowork's report of zero em dashes and zero
 * shouts across 378 scripts is a screen for two specific faults. It says nothing about a script
 * that coaches the key, names a scaffold not on the screen, or misreads the line it cites — every
 * one of which has been found by reading in this district. Nothing here may be filled in on the
 * strength of a scan.
 *
 * **EMPTY IS THE CORRECT STATE TODAY AND IT SAYS SO OUT LOUD** (R61). An empty approval set is not
 * a gap to be inferred around; it is a declaration that no script has yet been read. Callers get
 * `null` and the surface says why.
 */

/** Item ids whose walkScript a named reviewer has read and approved for serving. */
export const WALK_APPROVED_ITEM_IDS: readonly string[] = [
  // APPROVED 2026-08-19, Annie's read of case-en-01's ten. Six of the ten; the other four were
  // not refused, they were not part of this read.
  'ENG-001-WIW-01',
  'ENG-001-WIW-02',
  'ENG-001-WIW-06',
  'ENG-001-WIW-09',
  'ENG-001-WIW-12',
  'ENG-001-WIW-15',
  // The other four of case-en-01's ten. Refused on her first read for teaching retrieval by
  // proximity (R262), repaired to the six as the model, approved 2026-08-19. They carry the
  // ENG-028 prefix and are `en-comp-retrieval` like the six — the same Case, a different passage.
  'ENG-028-PR-02',
  'ENG-028-PR-04',
  'ENG-028-PR-07',
  'ENG-028-PR-10',
];

export const WALK_APPROVAL_STATE = {
  approvedCount: WALK_APPROVED_ITEM_IDS.length,
  approvedBy: 'reviewer:rev-0001',
  approvedOn: '2026-08-19',
  reasonWhenEmpty:
    'No walk script has been read by a reviewer yet. The scripts became child-facing when Walk was built; until they are read, Walk offers no content rather than offering unread content.',
  firstScopeWhenOpened: 'case-en-01 (en-comp-retrieval), 10 scripts',
} as const;

/**
 * **APPROVAL CARRIED ON THE ROW, BOUND TO THE TEXT (R1067, 2026-11-25).** The declared list above was
 * the only door, and it held ten English ids: 1,075 stored scripts (617 VR, 379 English, 179 Maths)
 * reached no child because a hand-kept list cannot grow at the rate scripts are read. Under R1031 a
 * separate agent reviews and signs as `rev-agent-01`, so a reading is recorded ON THE ROW:
 *
 *   · `walkScriptApprovedBy` — a REVIEWER id, one of `WALK_APPROVERS` (a name, never a flag — R94);
 *   · `walkScriptAuthority` — where the reading is recorded (the review file and its digest);
 *   · `walkScriptApprovedSha256` — the sha256 of the EXACT script that was read.
 *
 * **THE DIGEST IS THE POINT.** An approval that outlives an edit to its script serves unread text
 * under a reader's name. The caller passes the digest of the script as it stands now; any change to
 * the words withholds the script until it is read again. All three must be present — a bare name is
 * an assertion and a bare citation is unattributed (the same rule as `chooseHint`).
 */
export const WALK_APPROVERS: readonly string[] = ['reviewer:rev-0001', 'reviewer:rev-agent-01'];

export type WalkApproval =
  | { serves: true; via: 'declared list' | 'row approval'; approvedBy: string }
  | { serves: false; why: 'no row approval' | 'approver is not a known reviewer' | 'no authority recorded' | 'script changed since it was approved' };

export function walkApprovalOf(
  itemId: string,
  explanation: Record<string, unknown> | null | undefined,
  currentScriptSha256: string | null,
): WalkApproval {
  if (WALK_APPROVED_ITEM_IDS.includes(itemId)) return { serves: true, via: 'declared list', approvedBy: WALK_APPROVAL_STATE.approvedBy };
  const e = explanation ?? {};
  const by = typeof e.walkScriptApprovedBy === 'string' ? e.walkScriptApprovedBy.trim() : '';
  if (!by) return { serves: false, why: 'no row approval' };
  if (!WALK_APPROVERS.includes(by)) return { serves: false, why: 'approver is not a known reviewer' };
  const authority = typeof e.walkScriptAuthority === 'string' ? e.walkScriptAuthority.trim() : '';
  if (!authority) return { serves: false, why: 'no authority recorded' };
  const sha = typeof e.walkScriptApprovedSha256 === 'string' ? e.walkScriptApprovedSha256.trim() : '';
  if (!sha || !currentScriptSha256 || sha !== currentScriptSha256) return { serves: false, why: 'script changed since it was approved' };
  return { serves: true, via: 'row approval', approvedBy: by };
}

/** The declared list alone — kept for callers that hold no row. A row-carried approval needs `walkApprovalOf`. */
export function walkScriptMayServe(itemId: string): boolean {
  return WALK_APPROVED_ITEM_IDS.includes(itemId);
}

/**
 * **THE DECLARED REACHABILITY STATE OF ONE WALK SCRIPT** (Cowork's blocker on Debt 2's split,
 * 2026-08-19 — R287). Yes: walkScript is a surface with a nameable state, and this is the name.
 *
 * The 378 held-until-reachable entries need a surface to be held AGAINST, and a surface whose state
 * nobody can name is one nothing can be held against. **Three independent conditions, in the order
 * they gate**, so an entry's hold can cite which one it is waiting on rather than "not yet":
 *
 *   · the item must be PUBLISHED — a DRAFT serves nothing;
 *   · a Case must name its question type — no door, no child;
 *   · the script must be in the APPROVED SET — built, but reviewed is what opens it.
 *
 * **THE STATE CHANGES AS WALK WIDENS, WHICH IS THE POINT.** Today ten ids are approved on one Case.
 * Each id added moves exactly those items from `AWAITING_REVIEWER_READ` to `REACHABLE`, and nothing
 * else moves — so a held entry can be re-evaluated by re-running this rather than by re-reading a
 * ruling.
 */
export type WalkReachability =
  /** LIVE, a Case names its type, and the script is approved. A child can meet this script. */
  | 'REACHABLE'
  /** LIVE and behind a door, but no reviewer has read the script. The common state today. */
  | 'AWAITING_REVIEWER_READ'
  /** LIVE, script approved or not, but no Case names its question type. */
  | 'NO_DOOR'
  /** Not published. Nothing downstream matters yet. */
  | 'NOT_PUBLISHED'
  /** The item carries no walk script at all. */
  | 'NO_SCRIPT';

export function walkScriptReachability(input: {
  itemId: string;
  hasScript: boolean;
  isPublished: boolean;
  /** Whether any Case row names this item's question type. Read from Case, never inferred. */
  hasCaseDoor: boolean;
  /** The row-carried approval from `walkApprovalOf`, when the caller holds the row. Absent: the declared list alone. */
  approved?: boolean;
}): WalkReachability {
  if (!input.hasScript) return 'NO_SCRIPT';
  if (!input.isPublished) return 'NOT_PUBLISHED';
  if (!input.hasCaseDoor) return 'NO_DOOR';
  return (input.approved ?? walkScriptMayServe(input.itemId)) ? 'REACHABLE' : 'AWAITING_REVIEWER_READ';
}
