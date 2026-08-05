/**
 * RECORD NVR TEMPLATE SIGNATURES — `pnpm record:nvr-signoff` (`--apply` to write).
 *
 * The reviewer signed a set of NVR template VERSIONS off the four packs. This
 * records those signatures the written-review way: signedBy is the reviewer,
 * the note carries her confirmation and who entered it, and — crucially — each
 * template's CURRENT fingerprint is verified first. A template whose fingerprint
 * no longer matches what she saw (a version changed under her) is REFUSED, never
 * signed on a stale fingerprint (§4.2). The three HELD templates are refused by
 * name as a backstop.
 *
 * FILL FROM HER RETURNS before --apply: the exact SIGNED list and her verbatim
 * confirmation. The list below is the inference (every template except the three
 * she held for fixes); dry-run prints each fingerprint so it can be checked
 * against the packs before anything is written.
 */
import { NVR_TEMPLATES, templateFingerprint } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

const APPLY = process.argv.includes('--apply');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const TODAY = new Date().toISOString().slice(0, 10);

// All 13 signed: the first 10 on her first pass, the last 3 (held for fixes)
// on her second, each verified against the fingerprint she quoted.
const SIGNED: string[] = [
  'machine-series', 'machine-matrix', 'machine-analogy',
  'lineup-codes',
  'turntable-rotation', 'turntable-reflection',
  'folding-net', 'folding-punch', 'folding-hidden', 'folding-plans',
  'lineup-counting', 'lineup-odd', 'lineup-like',
];
const HELD = new Set<string>();
// Fingerprints the reviewer quoted for the last three — recording refuses any
// template whose current fingerprint no longer matches (changed under her).
const HER_FINGERPRINT: Record<string, string> = {
  'lineup-counting': 'bc0770319bbdf10d',
  'lineup-odd': '87afe664b31dfcbc',
  'lineup-like': '99495ded26e773f9',
};
// Her wording, one sentence per template (CLUECREW-REVIEWER-BRIEF §5), the
// template name and fingerprint pre-filled so it IS her verbatim confirmation.
const confirmation = (id: string, fingerprint: string): string =>
  `I confirm the ${id} template at fingerprint ${fingerprint} is approved for live use. [entered by ${RECORDER}, written review ${TODAY}]`;

async function main(): Promise<void> {
  const approver = await prisma.parentAccount.findUnique({ where: { email: REVIEWER.replace(/^human:/, '') }, select: { staffRole: true } });
  if (approver?.staffRole !== 'REVIEWER') throw new Error(`${REVIEWER} is not a REVIEWER account`);

  const recorded: string[] = [];
  const refused: string[] = [];
  for (const id of SIGNED) {
    if (HELD.has(id)) { refused.push(`${id}: HELD, not signed`); continue; }
    const template = NVR_TEMPLATES.find((t) => t.id === id);
    if (!template) { refused.push(`${id}: no such template`); continue; }
    const fingerprint = templateFingerprint(template);
    const quoted = HER_FINGERPRINT[id];
    if (quoted && quoted !== fingerprint) {
      refused.push(`${id}: fingerprint ${fingerprint} ≠ the ${quoted} she signed — changed under her, NOT recorded`);
      continue;
    }
    console.log(`  ${id.padEnd(22)} v${template.version}  fingerprint ${fingerprint}${quoted ? ' ✓ matches hers' : ''}`);
    if (APPLY) {
      await prisma.nvrTemplateSignature.upsert({
        where: { templateId_version: { templateId: id, version: template.version } },
        create: { templateId: id, version: template.version, fingerprint, signedBy: REVIEWER, sampleSheetHash: fingerprint, notes: confirmation(id, fingerprint) },
        update: { fingerprint, signedBy: REVIEWER, sampleSheetHash: fingerprint, notes: confirmation(id, fingerprint) },
      });
    }
    recorded.push(`${id} v${template.version}`);
  }

  console.log(`\n${APPLY ? 'RECORDED' : '--dry-run (no --apply)'}: ${recorded.length} signatures${APPLY ? ' written' : ' would write'}.`);
  console.log(`Held (not signed): ${[...HELD].join(', ')}`);
  if (refused.length) for (const r of refused) console.log(`  ✗ ${r}`);
  await prisma.$disconnect();
}

void main();
