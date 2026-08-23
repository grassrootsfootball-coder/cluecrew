/**
 * THE NVR SERVABILITY NOTICE'S STANDING PATH (David, 2026-08-23 — R666).
 *
 * The product slot renders the statement wherever NVR is offered, **fails closed to
 * not-rendering**, and takes its string ONLY from a wording landed here: Annie-approved, gated as
 * child-facing, authority recorded, prior stamped. The slot ships empty until her CONFIRMATIONS
 * block exists — this function is what her block lands through, and nothing else writes the file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MAY_JUDGE, checkChildFacingText, isBlocking } from '../../packages/core/src/index';

export function landNvrNotice(repoRoot: string, text: string, approvedBy: string, authority: string): void {
  if (!MAY_JUDGE.includes(approvedBy)) {
    throw new Error(`landNvrNotice REFUSED — approvedBy ${JSON.stringify(approvedBy)} is not a MAY_JUDGE name. A servability statement a child reads is a judgement.`);
  }
  if (!/sha256 [0-9a-f]{64}/.test(authority)) {
    throw new Error('landNvrNotice REFUSED — the authority names her return by file and full digest, or the landing waits.');
  }
  const faults = checkChildFacingText({ role: 'narrative', label: 'nvr-servability-notice', text }).filter(isBlocking);
  if (faults.length > 0) {
    throw new Error(`landNvrNotice REFUSED — the wording fails the child-facing gate: ${faults.map((f) => f.detail).join('; ')}`);
  }
  const path = join(repoRoot, 'content/notices/nvr-servability.json');
  const prior = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  writeFileSync(path, JSON.stringify({
    text, approvedBy, authority, landedAt: new Date().toISOString().slice(0, 10),
    ...(prior.text ? { _previous: prior } : {}),
  }, null, 1));
}
