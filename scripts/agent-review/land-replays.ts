/**
 * TURNING ON A MATHS ITEM'S WORKED-EXAMPLE REPLAY (R1064, David: "turn on the Maths worked examples
 * properly").
 *
 * A replay is child-facing: after a miss, "Walk this one with me" plays it line by line. An item
 * replays only when `explanation.replayTemplate` names a template, and this door is the only thing
 * that sets it, per item, on a reviewer's ATTEST. Before any write, for every proposal, it:
 *   - re-renders the replay with the app's own renderer and templates (`renderReplay`), which refuses
 *     a bare value, a fraction answer, an item priced in pence, or any step it cannot show exactly;
 *   - runs every line through the child-facing gate (role `hint`: feedback after a miss);
 *   - for a proposed REORDERED expression (the eight percentage items), requires it to evaluate to
 *     the SAME value and to compute the key (`checkSolution`). A reorder changes the walk, never the
 *     answer.
 * It writes `explanation.replayTemplate` (and the expression where reordered), records an AMENDED
 * event, and, because the explanation is inside the signed row projection, records a fresh
 * `rev-agent-01` signature over the row as it now stands, so no LIVE row is left signed under a stale hash.
 *
 *   tsx scripts/agent-review/land-replays.ts [--apply]
 */
import { existsSync, readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { checkChildFacingText, checkSolution, evaluateSolution, isBlocking, renderReplay } from '../../packages/core/src/index';
import { SIGNATURE_SUBJECTS } from '../../packages/core/src/signature-subject';
import { recordSignature } from '../../packages/db/prisma/reviewed-guard';
import { prisma } from '../../packages/db/src/index';
import { exportContentSnapshot } from '../content-snapshot';
import { canonicalOrderHash } from '../lib/pin-projection';
import { requirePopulation } from '../lib/population';

const REPO = pjoin(__dirname, '..', '..');
const DIR = pjoin(REPO, 'content', 'agent-review', 'maths-replay');
const APPLY = process.argv.includes('--apply');
const REVIEWER = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const TEMPLATES = (JSON.parse(readFileSync(pjoin(REPO, 'content', 'replay-templates.json'), 'utf8')) as { templates: Record<string, { intro: string; step: string; outro: string }> }).templates;

interface Proposal { itemId: string; template: string; solution?: string; why?: string }

const readRows = <T>(f: string): T[] => {
  if (!existsSync(f)) throw new Error(`${f} is missing`);
  const x = JSON.parse(readFileSync(f, 'utf8')) as { rows?: unknown };
  if (!Array.isArray(x.rows)) throw new Error(`${f}: expected {rows[]} (R173)`);
  return x.rows as T[];
};

async function main(): Promise<void> {
  const proposals = readRows<Proposal>(pjoin(DIR, 'proposals.json'));
  const items = await prisma.item.findMany({ where: { id: { in: proposals.map((p) => p.itemId) } },
    select: { id: true, status: true, stem: true, solution: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } } });
  requirePopulation('land-replays', { proposals: proposals.length, 'items found': items.length });
  const byId = new Map(items.map((i) => [i.id, i]));

  const faults: string[] = [];
  const ready: Array<{ p: Proposal; solution: string }> = [];
  for (const p of proposals) {
    const item = byId.get(p.itemId);
    if (!item) { faults.push(`${p.itemId}: no such item`); continue; }
    if (item.status !== 'LIVE') { faults.push(`${p.itemId}: not LIVE (${item.status})`); continue; }
    if (!TEMPLATES[p.template]) { faults.push(`${p.itemId}: no template "${p.template}"`); continue; }
    if (!item.solution) { faults.push(`${p.itemId}: no solution expression`); continue; }
    const solution = p.solution ?? item.solution;
    if (p.solution) {
      let same = false;
      try { same = Math.abs(evaluateSolution(p.solution) - evaluateSolution(item.solution)) < 1e-9; } catch { /* reported below */ }
      if (!same) { faults.push(`${p.itemId}: reordered expression "${p.solution}" does not equal "${item.solution}"`); continue; }
      const check = checkSolution(p.solution, item.options);
      if (!check.ok) { faults.push(`${p.itemId}: reordered expression does not compute the key (${check.reason})`); continue; }
    }
    const stemText = String((item.stem as { text?: unknown }).text ?? '');
    const keyDisplay = String((item.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');
    const r = renderReplay(solution, TEMPLATES[p.template]!, { stemText, keyDisplay });
    if (!r.ok) { faults.push(`${p.itemId}: renderer refuses — ${r.reason}`); continue; }
    const gate = r.lines.flatMap((l, n) => checkChildFacingText({ role: 'hint', label: `${p.itemId} replay[${n}]`, text: l }).filter(isBlocking).map((f) => f.detail));
    if (gate.length) { faults.push(`${p.itemId}: ${gate.join('; ')}`); continue; }
    ready.push({ p, solution });
  }
  console.log(`land-replays: ${proposals.length} proposal(s) · ${ready.length} render and pass every gate · ${faults.length} fault(s)`);
  for (const f of faults) console.log(`  ✗ ${f}`);
  if (!APPLY) return;
  if (faults.length) throw new Error('REFUSED — every proposal must pass before any lands');

  const review = readRows<{ itemId: string; verdict: string; reason: string }>(pjoin(DIR, 'proposal-review.json'));
  const reviewer = (JSON.parse(readFileSync(pjoin(DIR, 'proposal-review.json'), 'utf8')) as { reviewer?: string }).reviewer;
  if (reviewer !== REVIEWER) throw new Error(`proposal-review.json is signed by ${reviewer}, not ${REVIEWER}`);
  const attested = new Map(review.filter((v) => v.verdict === 'ATTEST').map((v) => [v.itemId, v.reason]));
  const land = ready.filter((x) => attested.has(x.p.itemId));

  await prisma.$transaction(async (tx) => {
    for (const { p, solution } of land) {
      const item = byId.get(p.itemId)!;
      const explanation = { ...((item.explanation ?? {}) as Record<string, unknown>), replayTemplate: p.template };
      await tx.item.update({ where: { id: p.itemId }, data: { explanation, ...(p.solution ? { solution } : {}) } });
      await tx.attributionEvent.create({ data: { recordType: 'item', recordId: p.itemId, action: 'AMENDED', reviewerId: REVIEWER, actor: 'agent-drafter',
        recordedBy: RECORDED_BY, field: p.solution ? 'explanation.replayTemplate, solution' : 'explanation.replayTemplate', note: 'maths-replay (R1064)',
        method: `Worked-example replay turned on (${p.template})${p.solution ? `; expression reordered for the walk: ${p.why ?? ''}` : ''}; rendered replay attested by ${REVIEWER}: ${attested.get(p.itemId)}`.slice(0, 900) } });
    }
  }, { timeout: 120000 });
  for (const { p } of land) {
    const r = await prisma.item.findUniqueOrThrow({ where: { id: p.itemId }, select: { stem: true, explanation: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
    await recordSignature(prisma, { recordType: 'item', recordId: p.itemId, reviewerId: REVIEWER, recordedBy: RECORDED_BY,
      method: `maths-replay (R1064): the row re-signed as it now stands, its replay read and attested: ${attested.get(p.itemId)}`.slice(0, 900),
      subjectHash: canonicalOrderHash(r), subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind,
      subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec } as Parameters<typeof recordSignature>[1]);
  }
  console.log(`  LANDED ${land.length} replay(s) · NOT LANDED ${ready.length - land.length} (no attestation)`);
}
main().then(() => { if (APPLY && !process.exitCode) exportContentSnapshot(); })
  .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
