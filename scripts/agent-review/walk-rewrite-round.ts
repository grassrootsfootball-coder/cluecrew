/**
 * WALK REWRITE ROUND (R1067): after a review pass on <case>, archive the pass into round<N>/ and write
 * rewrite.json — every REFUSED row with its stored script and the reviewer's reason VERBATIM (R25).
 * Rows named in --faults are question faults: they are listed in faults.json and NOT sent for rewrite
 * (a new script cannot repair a wrong question).
 *
 *   tsx scripts/agent-review/walk-rewrite-round.ts --case=case-en-03-p2 [--faults=ID1,ID2]
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';

const CASE = process.argv.find((a) => a.startsWith('--case='))?.slice(7);
const FAULTS = new Set((process.argv.find((a) => a.startsWith('--faults='))?.slice(9) ?? '').split(',').filter(Boolean));
if (!CASE) throw new Error('pass --case=<folder>');
const dir = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'walk', CASE);
const n = readdirSync(dir).filter((f) => /^round\d+$/.test(f)).length + 1;
const arch = pjoin(dir, `round${n}`); mkdirSync(arch);
for (const f of ['packet.json', 'drafts.json', 'review.json', 'landed-apply.json']) if (existsSync(pjoin(dir, f))) copyFileSync(pjoin(dir, f), pjoin(arch, f));
const packet = JSON.parse(readFileSync(pjoin(dir, 'packet.json'), 'utf8')) as { rows: Array<{ itemId: string; walkScript: string | null }> };
const drafts = existsSync(pjoin(dir, 'drafts.json')) ? new Map((JSON.parse(readFileSync(pjoin(dir, 'drafts.json'), 'utf8')) as { drafts: Array<{ itemId: string; walkScript: string }> }).drafts.map((d) => [d.itemId, d.walkScript])) : new Map<string, string>();
const review = JSON.parse(readFileSync(pjoin(dir, 'review.json'), 'utf8')) as { rows: Array<{ itemId: string; source: string; verdict: string; reason: string }> };
const refused = review.rows.filter((r) => r.verdict !== 'APPROVE');
const script = (r: { itemId: string; source: string }) => (r.source === 'draft' ? drafts.get(r.itemId) : packet.rows.find((p) => p.itemId === r.itemId)?.walkScript) ?? null;
const rows = refused.filter((r) => !FAULTS.has(r.itemId)).map((r) => ({ itemId: r.itemId, currentScript: script(r), whyRewrite: r.reason }));
const faults = refused.filter((r) => FAULTS.has(r.itemId)).map((r) => ({ itemId: r.itemId, reviewerReason: r.reason }));
for (const id of FAULTS) if (!refused.some((r) => r.itemId === id)) throw new Error(`${id}: named as a fault but not refused in this pass`);
writeFileSync(pjoin(dir, 'rewrite.json'), JSON.stringify({ case: CASE, round: n + 1, rows }, null, 1));
if (faults.length) writeFileSync(pjoin(dir, 'faults.json'), JSON.stringify({ case: CASE, faults }, null, 1));
console.log(`${CASE}: pass archived to round${n}/; ${rows.length} row(s) to rewrite, ${faults.length} question fault(s) held out`);
