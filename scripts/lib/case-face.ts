/**
 * THE CASE FACE'S STANDING PATH (David's case-en-06 instruction, 2026-08-24 — R686).
 *
 * The NVR-notice pattern (R666), applied to a Case row's child-facing face: the title and
 * narrative intro land ONLY through this function — Annie-approved, gated as child-facing,
 * authority recorded (her return by file and full digest), prior stamped. The provenance record
 * lives in git at `content/case-faces/<caseId>.json`; the DB row carries the face the serve path
 * reads, and `caseFaceServes` (packages/core) keeps the case invisible until the face is landed.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MAY_JUDGE, checkChildFacingText, isBlocking } from '../../packages/core/src/index';
import { prisma } from '../../packages/db/src/index';

export async function landCaseFace(
  repoRoot: string,
  caseId: string,
  face: { title: string; narrativeText: string; skippable?: boolean },
  approvedBy: string,
  authority: string,
): Promise<void> {
  if (!MAY_JUDGE.includes(approvedBy)) {
    throw new Error(`landCaseFace REFUSED — approvedBy ${JSON.stringify(approvedBy)} is not a MAY_JUDGE name. A case face a child reads is a judgement.`);
  }
  if (!/sha256 [0-9a-f]{64}/.test(authority)) {
    throw new Error('landCaseFace REFUSED — the authority names her return by file and full digest, or the landing waits.');
  }
  const faults = [
    ...checkChildFacingText({ role: 'narrative', label: `${caseId}.title`, text: face.title }),
    ...checkChildFacingText({ role: 'narrative', label: `${caseId}.narrativeIntro`, text: face.narrativeText }),
  ].filter(isBlocking);
  if (faults.length > 0) {
    throw new Error(`landCaseFace REFUSED — the wording fails the child-facing gate: ${faults.map((f) => f.detail).join('; ')}`);
  }
  const row = await prisma.case.findUniqueOrThrow({ where: { id: caseId }, select: { title: true, narrativeIntro: true } });
  await prisma.case.update({
    where: { id: caseId },
    data: { title: face.title, narrativeIntro: { text: face.narrativeText, skippable: face.skippable ?? true } },
  });
  const recordPath = join(repoRoot, 'content/case-faces', `${caseId}.json`);
  const prior = existsSync(recordPath) ? JSON.parse(readFileSync(recordPath, 'utf8')) as Record<string, unknown> : null;
  writeFileSync(recordPath, JSON.stringify({
    caseId, title: face.title, narrativeText: face.narrativeText,
    approvedBy, authority, landedAt: new Date().toISOString().slice(0, 10),
    ...(prior && prior.title ? { _previous: prior } : {}),
  }, null, 1));
  await prisma.attributionEvent.create({
    data: {
      recordType: 'case', recordId: caseId, action: 'APPROVED',
      reviewerId: 'rev-0001', actor: approvedBy, recordedBy: 'human:david@cluecrew.test',
      field: 'face', method: 'landCaseFace — the standing path; gated, authority recorded, prior stamped',
      note: authority,
    },
  });
}
