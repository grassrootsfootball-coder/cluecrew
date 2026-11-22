/**
 * LANDING MATHS SOLUTION EXPRESSIONS (David, 2026-11-22 — R1040: "Add them, reviewed").
 *
 * BUILD-DISTRICT-MATHS §5 requires every maths item to carry a `solution` expression whose computed
 * value equals the keyed option, so a wrong key cannot ship. The district went LIVE on 2026-08-29
 * with none, and `verify:solutions` had never screened an item until CI first read the real store.
 *
 * THE CHECK ONLY MEANS SOMETHING IF THE EXPRESSION IS BLIND. The drafter was given the question text
 * and the key's UNIT, never its value (packet.json says so). An expression written while looking at
 * the key would agree with it by construction, and the gate would be decoration. So:
 *   - a MATCH lands, once the reviewer has ATTESTED that the expression is the question's working;
 *   - a MISMATCH never lands. It is a possible wrong key, reported for a key review, and the row
 *     keeps no expression until that review settles which side was wrong;
 *   - a key that is not a single number (a coordinate, a clock time, a named choice) cannot carry an
 *     expression. With the reviewer's attestation it is DECLARED in content/maths-noncomputable-keys.json,
 *     which `verify:solutions` reads and prints on every run.
 *
 * Writes only `Item.solution` (and the declaration file). It never touches the stem, the options or
 * the status, so no signature subject moves (the row projection does not include `solution`).
 * Replays stay off: an item replays only when its explanation names a template (R1040).
 *
 *   tsx scripts/agent-review/land-solutions.ts --precheck   compare every proposal with the live key
 *   tsx scripts/agent-review/land-solutions.ts --apply      land the ATTESTED matches and declarations
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { checkSolution, evaluateSolution } from '../../packages/core/src/solution';
import { prisma } from '../../packages/db/src/index';
import { exportContentSnapshot } from '../content-snapshot';
import { requirePopulation } from '../lib/population';

const REPO = pjoin(__dirname, '..', '..');
const DIR = pjoin(REPO, 'content', 'agent-review', 'maths-solutions');
const DECLARED = pjoin(REPO, 'content', 'maths-noncomputable-keys.json');
const REVIEWER = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const APPLY = process.argv.includes('--apply');

interface Proposal { itemId: string; solution: string | null; bare?: boolean; nonNumeric?: string | null; ownAnswer?: string | null; doubt?: string | null }
interface Verdict { itemId: string; verdict: 'ATTEST' | 'REFUSE'; reason: string }
export interface Declaration { itemId: string; key: string; reason: string; attestedBy: string; note: string }

const readJson = <T>(f: string, shape: string, ok: (x: unknown) => boolean): T => {
  if (!existsSync(f)) throw new Error(`${f} is missing`);
  const x = JSON.parse(readFileSync(f, 'utf8')) as unknown;
  if (!ok(x)) throw new Error(`${f}: expected ${shape} (R173)`);
  return x as T;
};

async function main(): Promise<void> {
  const proposals = readJson<{ rows: Proposal[]; blind?: boolean }>(pjoin(DIR, 'proposals.json'), '{rows[]}', (x) => Array.isArray((x as { rows?: unknown }).rows)).rows;
  const items = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' }, status: { not: 'RETIRED' } }, orderBy: { id: 'asc' },
    select: { id: true, solution: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true } } } });
  requirePopulation('land-solutions', { 'MATHS items': items.length, proposals: proposals.length });
  const byId = new Map(items.map((i) => [i.id, i]));
  const keyOf = (id: string) => String((byId.get(id)!.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');

  const unknown = proposals.filter((p) => !byId.has(p.itemId)).map((p) => p.itemId);
  if (unknown.length) throw new Error(`proposals name items that are not live MATHS rows: ${unknown.join(', ')}`);
  const missing = items.filter((i) => !proposals.some((p) => p.itemId === i.id)).map((i) => i.id);

  const match: Proposal[] = []; const mismatch: Array<Proposal & { computed: number | null; key: string; why: string }> = []; const nonNum: Proposal[] = [];
  for (const p of proposals) {
    const item = byId.get(p.itemId)!;
    if (p.nonNumeric) { nonNum.push(p); continue; }
    if (!p.solution) { mismatch.push({ ...p, computed: null, key: keyOf(p.itemId), why: 'no expression and no nonNumeric reason' }); continue; }
    const r = checkSolution(p.solution, item.options);
    if (r.ok) match.push(p); else mismatch.push({ ...p, computed: r.computed, key: keyOf(p.itemId), why: r.reason ?? '' });
  }
  console.log(`land-solutions: ${proposals.length} proposals for ${items.length} MATHS items${missing.length ? ` (${missing.length} with no proposal: ${missing.join(', ')})` : ''}`);
  console.log(`  MATCH ${match.length} · MISMATCH ${mismatch.length} · NOT A SINGLE NUMBER ${nonNum.length}`);
  for (const m of mismatch) console.log(`  ✗ ${m.itemId}: ${m.solution ?? '(none)'} = ${m.computed} but key "${m.key}" — ${m.why}${m.doubt ? ` [drafter doubt: ${m.doubt}]` : ''}`);
  for (const n of nonNum) console.log(`  · ${n.itemId}: key "${keyOf(n.itemId)}" · drafter's own answer "${n.ownAnswer ?? ''}" — ${n.nonNumeric}`);
  writeFileSync(pjoin(DIR, 'comparison.json'), `${JSON.stringify({ door: 'maths-solutions', ruling: 'R1040',
    match: match.map((p) => ({ itemId: p.itemId, solution: p.solution, value: evaluateSolution(p.solution!), key: keyOf(p.itemId), bare: !!p.bare })),
    mismatch, nonNumeric: nonNum.map((n) => ({ ...n, key: keyOf(n.itemId) })) }, null, 1)}\n`);
  if (!APPLY) return;

  const review = readJson<{ reviewer: string; rows: Verdict[] }>(pjoin(DIR, 'proposal-review.json'), '{reviewer, rows[]}', (x) => Array.isArray((x as { rows?: unknown }).rows));
  if (review.reviewer !== REVIEWER) throw new Error(`proposal-review.json is signed by ${review.reviewer}, not ${REVIEWER}`);
  const attested = new Map(review.rows.filter((v) => v.verdict === 'ATTEST').map((v) => [v.itemId, v.reason]));

  const toLand = match.filter((p) => attested.has(p.itemId));
  const already = toLand.filter((p) => byId.get(p.itemId)!.solution && byId.get(p.itemId)!.solution !== p.solution);
  if (already.length) throw new Error(`REFUSED — these rows already carry a different expression: ${already.map((p) => p.itemId).join(', ')}`);
  await prisma.$transaction(async (tx) => {
    for (const p of toLand) {
      if (byId.get(p.itemId)!.solution === p.solution) continue;
      await tx.item.update({ where: { id: p.itemId }, data: { solution: p.solution } });
      await tx.attributionEvent.create({ data: { recordType: 'item', recordId: p.itemId, action: 'AMENDED', reviewerId: REVIEWER, actor: 'agent-drafter',
        recordedBy: RECORDED_BY, field: 'solution', note: 'maths-solutions (R1040)',
        method: `Solution expression drafted BLIND (question text and key unit only), computes the stored key; attested by ${REVIEWER}: ${attested.get(p.itemId)}`.slice(0, 900) } });
    }
  }, { timeout: 120000 });

  const decl: Declaration[] = nonNum.filter((n) => attested.has(n.itemId)).map((n) => ({ itemId: n.itemId, key: keyOf(n.itemId), reason: n.nonNumeric!,
    attestedBy: REVIEWER, note: attested.get(n.itemId)! }));
  writeFileSync(DECLARED, `${JSON.stringify({ what: 'MATHS items whose key is not a single number, so no solution expression can verify it (BUILD-DISTRICT-MATHS §5). verify:solutions prints these on every run and fails if a key here becomes a number.', ruling: 'R1040', declared: decl.sort((a, b) => a.itemId.localeCompare(b.itemId)) }, null, 1)}\n`);
  const notLanded = proposals.length - toLand.length - decl.length;
  console.log(`  LANDED ${toLand.length} expressions · DECLARED ${decl.length} non-numeric keys · NOT LANDED ${notLanded} (mismatches and refusals stay without an expression)`);
  exportContentSnapshot();
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
