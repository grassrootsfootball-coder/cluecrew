/**
 * IS THIS CLUSTER SHIPPABLE, AND WHAT WOULD IT PUBLISH? — `pnpm check:cluster <ENG-001> [--publish]`
 *
 * Annie's tranched model (2026-08-16): each cluster ships when its sample returns clean, rather than
 * everything waiting for everything. **LIVE is already per-item — the bank runs 298 LIVE beside 729
 * DRAFT — so shipping one cluster was never blocked by the schema. What was missing is a gate shaped
 * like the decision:** every check here reports district-wide, which is the right default and the
 * wrong shape for shipping one cluster at a time. A district-wide green says nothing about ENG-028,
 * and a district-wide red does not say ENG-028 is the reason.
 *
 * IT CALLS THE SAME FUNCTIONS THE DOORS CALL (R41), NEVER A RE-DERIVATION:
 *   · `publishBlockers` + `inactiveMisconceptions` — packages/core/src/verdict-blockers.ts, what
 *     `markReviewedAction` uses to decide whether a verdict may be given at all.
 *   · `checkItemChildFacing` + `isBlocking` — what every door to REVIEWED or LIVE wraps.
 *   · the serving-path assertions — routes, stem, passage, citations — because an item that cannot
 *     be delivered is not shippable however clean its content is. **That is R120's whole finding: a
 *     bank can be signed and unservable, and nothing said so.**
 *
 * `--publish` MOVES ROWS. It refuses unless the cluster is clean, and prints exactly what it would
 * do first. Reviewed content, so it names the ruling that authorised it.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  FAMILY_BY_TYPE, checkItemChildFacing, inactiveMisconceptions, isBlocking, publishBlockers,
} from '../packages/core/src/index';
import { stemText } from '../apps/web/components/crew/engines/shared';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const PASSAGES = resolve(import.meta.dirname, '../content/passages');
const RUNNER = resolve(import.meta.dirname, '../apps/web/components/crew/play-runner.tsx');
const NEEDS_NO_PASSAGE = new Set(['en-spag-punct-spot', 'en-spag-spelling-spot']);
const NEEDS_NO_LINEREFS = new Set(['en-spag-cloze']);

function enginesInRunner(): Set<string> {
  const block = readFileSync(RUNNER, 'utf8').split('const engines = {')[1]?.split('};')[0];
  if (!block) throw new Error('could not find the engines map — refusing to guess');
  return new Set([...block.matchAll(/^\s*([a-zA-Z0-9_]+)\s*:/gm)].map((m) => m[1]!));
}

interface Line { n?: number | null; text?: string }
function passages(): Map<string, { numberedLines?: Line[] }> {
  const out = new Map<string, { numberedLines?: Line[] }>();
  for (const f of readdirSync(PASSAGES).filter((f) => f.endsWith('.json'))) {
    try { out.set(f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(PASSAGES, f), 'utf8'))); } catch { /* reported as unresolved below */ }
  }
  return out;
}

async function main(): Promise<void> {
  const cluster = process.argv[2];
  const doPublish = process.argv.includes('--publish');
  if (!cluster || cluster.startsWith('--')) {
    console.error('usage: pnpm check:cluster <ENG-001> [--publish]');
    process.exit(1);
  }

  const items = await prisma.item.findMany({
    where: { id: { startsWith: `${cluster}-` } },
    include: { options: { orderBy: { id: 'asc' } }, questionType: { select: { mechanic: true } } },
    orderBy: [{ clusterPosition: 'asc' }, { id: 'asc' }],
  });
  // A CLUSTER NAME THAT MATCHES NOTHING IS A TYPO, NOT AN EMPTY CLUSTER. Refusing here is the
  // difference between "ENG-0001 is clean" and "ENG-0001 does not exist".
  requirePopulation(`check:cluster ${cluster}`, { [`items in ${cluster}`]: items.length });

  const lib = await prisma.misconception.findMany({ select: { id: true, status: true } });
  const statusById = new Map(lib.map((m) => [m.id, m.status]));
  const engines = enginesInRunner();
  const passageById = passages();

  const rows = items.map((item) => {
    const blockers: string[] = [];
    const opts = item.options.map((o) => ({ isCorrect: o.isCorrect, misconceptionId: o.misconceptionId }));

    // — CONTENT: can it receive a verdict at all? —
    for (const cond of ['unanswerable', 'no-correct-option', 'missing-misconceptions'] as const) {
      const flag = cond === 'unanswerable' ? item.answerFlaggedAt : null;
      if (publishBlockers(opts, null, item.authoredBy, flag) === cond) blockers.push(cond);
    }
    if (item.similarityFlaggedAt && !item.similarityClearedBy) blockers.push('similarity-review');
    for (const id of inactiveMisconceptions(item.options, statusById)) {
      const s = statusById.get(id);
      blockers.push(`${s === 'PROPOSED' ? 'tag-proposed' : s === 'RETIRED' ? 'tag-retired' : 'tag-missing'}:${id}`);
    }
    const faults = checkItemChildFacing({
      id: item.id, stem: item.stem, explanation: item.explanation,
      mechanic: item.questionType.mechanic, options: item.options,
    }).filter(isBlocking);
    for (const f of faults) blockers.push(`child-facing:${f.rule}`);

    // — DELIVERY: could a child actually see it? —
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const family = FAMILY_BY_TYPE[item.questionTypeId];
    if (!family) blockers.push(`no-family:${item.questionTypeId}`);
    else if (!engines.has(family)) blockers.push(`no-engine:${family}`);
    // `stemText` THROWS on a stem with neither field — that is its job (R120), and a gate must not
    // die on the item it is judging.
    try { if (!stemText(stem).trim()) blockers.push('blank-stem'); }
    catch { blockers.push('blank-stem'); }

    const ref = typeof stem.passageRef === 'string' ? stem.passageRef : null;
    const passage = ref ? passageById.get(ref) : undefined;
    if (!NEEDS_NO_PASSAGE.has(item.questionTypeId)) {
      if (!ref) blockers.push('no-passageRef');
      else if (!passage) blockers.push(`passage-missing:${ref}`);
    }
    const declaredWhole = Array.isArray(item.lineRefs) && (item.lineRefs as unknown[]).length === 0;
    if (!NEEDS_NO_PASSAGE.has(item.questionTypeId) && !NEEDS_NO_LINEREFS.has(item.questionTypeId) && !declaredWhole) {
      const cited = Array.isArray(item.lineRefs) ? (item.lineRefs as unknown[]).map(Number) : [];
      const have = new Set((passage?.numberedLines ?? []).map((l) => l.n).filter((n): n is number => typeof n === 'number'));
      if (!cited.length) blockers.push('no-lineRefs');
      else {
        const missing = cited.filter((n) => !have.has(n));
        if (missing.length) blockers.push(`lineRefs-unresolved:${missing.join(',')}`);
      }
    }
    return { id: item.id, status: item.status, blockers };
  });

  const blocked = rows.filter((r) => r.blockers.length);
  const wouldPublish = rows.filter((r) => !r.blockers.length && r.status !== 'LIVE');
  const alreadyLive = rows.filter((r) => r.status === 'LIVE');

  console.log(`\n${cluster}: ${rows.length} item(s) · ${alreadyLive.length} already LIVE\n`);
  for (const r of rows) {
    const mark = r.blockers.length ? 'x' : r.status === 'LIVE' ? '=' : '+';
    console.log(`  ${mark} ${r.id.padEnd(18)} ${r.status.padEnd(8)} ${r.blockers.join(', ') || 'clean'}`);
  }
  console.log(`\n  ${blocked.length} blocked · ${wouldPublish.length} would publish · ${alreadyLive.length} already LIVE`);

  if (blocked.length) {
    console.log(`\n  ${cluster} IS NOT SHIPPABLE. Nothing is published while any item in it is blocked —`);
    console.log('  a cluster ships whole or not at all, because a child meets it as a whole.');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`\n  ${cluster} IS CLEAN. Every item can receive a verdict AND be delivered to a child.`);
  if (!doPublish) {
    console.log(`  Nothing was written. Re-run with --publish to move ${wouldPublish.length} item(s) to LIVE.`);
    await prisma.$disconnect();
    return;
  }

  // WRITES REVIEWED CONTENT. Annie's tranched-shipping ruling of 2026-08-16 authorises it.
  const ids = wouldPublish.map((r) => r.id);
  await prisma.$transaction([
    prisma.item.updateMany({ where: { id: { in: ids } }, data: { status: 'LIVE' } }),
    ...ids.map((id) => prisma.attributionEvent.create({ data: {
      reviewerId: 'rev-0001', recordType: 'item', recordId: id, action: 'APPROVED',
      actor: 'Annie', recordedBy: 'human:david@cluecrew.test',
      method: `tranched shipping — ${cluster} passed check:cluster`,
      note: 'Published as part of a whole cluster: every item can receive a verdict and be delivered.',
    } })),
  ]);
  const live = await prisma.item.count({ where: { id: { in: ids }, status: 'LIVE' } });
  if (live !== ids.length) throw new Error(`only ${live} of ${ids.length} landed`);
  console.log(`\n  PUBLISHED ${live} item(s) to LIVE, verified by re-reading.`);
  await prisma.$disconnect();
}

void main();
