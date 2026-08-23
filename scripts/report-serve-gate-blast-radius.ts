/**
 * THE REPORT-ONLY GATE'S BLAST RADIUS, AS MEMBERSHIP (David, 2026-08-23 — R656).
 *
 * Candidate rule: refuse to serve a passage carrying a REFER disposition or an UNMET condition
 * (condition present, conditionMetBy empty — the reader's own enforceUse refusal). **A membership
 * list, not a count: the whole decision turns on identity** — one refusal on a passage no child
 * reaches is free; one on a serving case is not. Nothing changes for a child on this run.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentFlags } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation, declareMayBeEmpty } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO, 'content/passages');

async function main() {
  const files = readdirSync(PASSAGES).filter((f) => f.endsWith('.json'));
  requirePopulation('serve-gate-blast-radius', { 'passage file(s) evaluated': files.length });

  const wouldRefuse: Array<{ passage: string; reasons: string[] }> = [];
  for (const f of files) {
    const p = JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as Record<string, unknown>;
    const r = readContentFlags(p, { enforceUse: true });
    const reasons: string[] = [];
    for (const fl of r.standardFlags) if (fl.disposition === 'refer') reasons.push(`flag ${fl.axis} carries REFER`);
    for (const x of r.refusals) if (x.code === 'CONDITION_MISSING') reasons.push(`unmet condition: ${x.detail.slice(0, 90)}`);
    if (reasons.length) wouldRefuse.push({ passage: String(p.id), reasons });
  }

  // The identity chain: passages -> LIVE items citing them -> serving cases those items belong to.
  const items = await prisma.item.findMany({ where: { status: 'LIVE' }, select: { id: true, questionTypeId: true, stem: true } });
  const cases = await prisma.case.findMany({ select: { id: true, questionTypeId: true, title: true } });
  const servingCaseByType = new Map<string, string>();
  for (const c of cases) {
    const live = items.filter((i) => i.questionTypeId === c.questionTypeId).length;
    if (live > 0) servingCaseByType.set(c.questionTypeId, c.id);
  }

  const membership = wouldRefuse.map((w) => {
    const behind = items.filter((i) => (i.stem as { passageRef?: unknown })?.passageRef === w.passage);
    return {
      passage: w.passage,
      reasons: w.reasons,
      liveItemsBehindIt: behind.map((i) => i.id),
      servingCasesReached: [...new Set(behind.map((i) => servingCaseByType.get(i.questionTypeId)).filter(Boolean))],
    };
  });

  // The reference memberships the decision reads AGAINST — what serving actually touches today.
  const passagesServing = new Map<string, { items: string[]; cases: string[] }>();
  for (const i of items) {
    const ref = (i.stem as { passageRef?: unknown })?.passageRef;
    if (typeof ref !== 'string') continue;
    const e = passagesServing.get(ref) ?? { items: [], cases: [] };
    e.items.push(i.id);
    const c = servingCaseByType.get(i.questionTypeId);
    if (c && !e.cases.includes(c)) e.cases.push(c);
    passagesServing.set(ref, e);
  }

  declareMayBeEmpty('serve-gate-blast-radius', 'passage(s) the rule would refuse', wouldRefuse.length,
    `Every disposition in the corpus is keep or cut and every condition carries a non-empty `
    + `conditionMetBy (the three standing conditions are discharged-at-present and fall due on NEW `
    + `items, which is a future refusal, not a present one). ${files.length} passages WERE evaluated `
    + `through the reader with enforceUse on.`);

  console.log('\n  WOULD-REFUSE MEMBERSHIP (not a count):');
  if (membership.length === 0) console.log('    (none — see the declared reason above)');
  for (const m of membership) console.log(`    ${m.passage}: ${m.reasons.join('; ')}\n      items behind: ${m.liveItemsBehindIt.join(', ') || '(none LIVE)'}\n      serving cases reached: ${m.servingCasesReached.join(', ') || '(none)'}`);
  console.log('\n  WHAT SERVING TOUCHES TODAY [the identity the decision reads against]:');
  for (const [pid, e] of [...passagesServing].sort()) {
    console.log(`    ${pid}: ${e.items.length} LIVE item(s) across ${e.cases.join(', ')}`);
  }
  const fourCases = ['case-en-01', 'case-en-02', 'case-en-03', 'case-en-04'];
  console.log(`\n  the four live comprehension cases: ${fourCases.join(', ')} — items reaching a child sit only behind the passages above.`);

  const payload = { what: 'Blast radius of the candidate serve-gate rule, as membership. Report-only; nothing changed for a child.', rule: 'refuse to serve a passage carrying REFER or an unmet condition', wouldRefuse: membership, servingToday: Object.fromEntries(passagesServing), evaluated: files.length };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content', 'the serve-gate blast radius, membership not count', ['what', 'rule', 'wouldRefuse', 'servingToday', 'evaluated']);
  const out = join(REPO, 'content/exports', stampedName('serve-gate-blast-radius', stamp.sourceHash, 'json'));
  writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(out, 'serve-gate-blast-radius');
  await prisma.$disconnect();
}

void main();
