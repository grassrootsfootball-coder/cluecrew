/**
 * NEW LIBRARY ENTRIES under the agent-review regime (R1021; R1026). A drafting agent proposes entries in
 * `content/agent-review/library/new-entries-<batch>.json`; a SEPARATE agent attests or refuses each one in
 * `new-entries-review-<batch>.json`. An entry is created only if it is ATTESTED, its id is new and in house
 * form, and it passes the same gates every library text passes (`checkMisconceptionProposal` and the
 * blocking child-facing checks on its hint). Created ACTIVE, approved by the MACHINE reviewer — the
 * provenance says so in its own field (R94, R98), and no person's name is written.
 *
 *   tsx scripts/agent-review/land-new-entries.ts --batch=M1 [--apply]
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { checkChildFacingText, checkMisconceptionProposal, isBlocking } from '../../packages/core/src/content-gates';

const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'library');
const BATCH = process.argv.find((a) => a.startsWith('--batch='))?.slice(8);
const APPLY = process.argv.includes('--apply');
const AGENT = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
type Entry = { id: string; district: 'MATHS' | 'VR' | 'ENGLISH' | 'NVR'; category?: string; description: string; childHint: string; why: string; carriers?: string[] };

async function main() {
  if (!BATCH) throw new Error('pass --batch=<name>');
  const propText = readFileSync(pjoin(DIR, `new-entries-${BATCH}.json`), 'utf8');
  const revText = readFileSync(pjoin(DIR, `new-entries-review-${BATCH}.json`), 'utf8');
  const prop = JSON.parse(propText) as { entries: Entry[] };
  const rev = JSON.parse(revText) as { entries: Array<{ id: string; verdict: string; reason?: string }> };
  if (!prop.entries?.length) throw new Error(`${BATCH}: no entries proposed — nothing to land is a failed read, not a clean run (R173)`);
  const verdict = new Map(rev.entries.map((e) => [e.id, e]));
  const out: Array<Record<string, unknown>> = [];
  for (const e of prop.entries) {
    const faults: string[] = [];
    if (!/^[a-z]+-\d+-[a-z0-9-]+$/.test(e.id)) faults.push(`id "${e.id}" is not house form <district>-<n>-<slug>`);
    if (await prisma.misconception.findUnique({ where: { id: e.id } })) faults.push('id already exists');
    for (const f of checkMisconceptionProposal(e)) faults.push(`${f.rule}: ${f.detail}`);
    for (const f of checkChildFacingText({ role: 'hint', label: `${e.id}.childHint`, text: e.childHint }).filter(isBlocking)) faults.push(`${f.rule}: ${f.detail}`);
    const v = verdict.get(e.id);
    if (v?.verdict !== 'ATTEST') faults.push(`not attested (${v?.verdict ?? 'no verdict'}${v?.reason ? `: ${v.reason}` : ''})`);
    out.push({ id: e.id, outcome: faults.length ? 'HELD' : 'CREATE', faults });
  }
  console.log(`new entries ${BATCH} — ${APPLY ? 'APPLY' : 'DRY RUN'}: ${out.filter((o) => o.outcome === 'CREATE').length} create, ${out.filter((o) => o.outcome === 'HELD').length} held`);
  for (const o of out) console.log(`  ${o.outcome === 'CREATE' ? '✓' : '✗'} ${o.id}${(o.faults as string[]).length ? `\n      ${(o.faults as string[]).join('\n      ')}` : ''}`);
  if (!APPLY) return;
  const method = `NEW ENTRY under R1021/R1026: drafted by an agent, ATTESTED by the machine reviewer ${AGENT} acting in the reviewer role; new-entries-${BATCH} sha256 ${sha(propText).slice(0, 16)}, review sha256 ${sha(revText).slice(0, 16)}; gated before the write. Not read by a person.`;
  const date = new Date().toISOString().slice(0, 10);
  await prisma.$transaction(async (tx) => {
    for (const o of out.filter((x) => x.outcome === 'CREATE')) {
      const e = prop.entries.find((x) => x.id === o.id)!;
      await tx.misconception.create({ data: { id: e.id, district: e.district, category: e.category ?? null, description: e.description, childHint: e.childHint,
        status: 'ACTIVE', proposedBy: 'agent:drafter (R1021)', approvedBy: `reviewer:${AGENT}`, approvalMethod: method, recordedBy: RECORDED_BY,
        // The drafter's reason AND the reviewer's: a reviewer can find more than the drafter claimed (maths-113's
        // overlap with maths-99 on four rows, not one), and an approval note carrying only the drafter's half is incomplete.
        // Not truncated: the column is text, and a cut here silently dropped the REVIEWER's half on a long
        // drafter note (caught by the reviewer of batch M2). A note is evidence; it is stored whole.
        approvalNote: `Why (drafter): ${e.why} | Reviewer (${AGENT}): ${verdict.get(e.id)?.reason ?? ''}`,
        textProvenance: { state: 'RECORDED', date, text: 'description+childHint', method,
          authoredBy: { kind: 'MACHINE', name: 'agent:drafter' }, approvedBy: { kind: 'MACHINE', name: `reviewer:${AGENT}` } } } });
      await tx.attributionEvent.create({ data: { recordType: 'misconception', recordId: e.id, action: 'AUTHORED', reviewerId: AGENT, actor: 'agent-drafter', recordedBy: RECORDED_BY, field: 'description/childHint', method } });
      await tx.attributionEvent.create({ data: { recordType: 'misconception', recordId: e.id, action: 'APPROVED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'approvedBy', method } });
    }
  });
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
