/**
 * AGGREGATE THE SECOND-READER SWEEP (R1037). Reads every `content/agent-review/sweep/<batch>/verdicts.json`
 * against its `batch.json` and writes `sweep/findings.json`.
 *
 * Refuses rather than guesses (R173): a batch with no verdicts file, a verdict for an item not in its
 * batch, or a card with no verdict is a failure, never a silent skip. States every denominator (R60).
 *
 * OVERRULED HOLDS are kept and marked, never deleted: a verdict whose only fault is the place-sense of
 * "behind" was an artefact of the sweep brief, which listed "behind" as banned outright when manifesto
 * v1.7 bans only its PROGRESS sense. The brief, not the content, was wrong.
 *
 *   tsx scripts/agent-review/aggregate-sweep.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';

const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'sweep');
// Read and confirmed by hand, one by one — a pattern over fault text overruled a REAL line-number fault
// that merely quoted the word (ENG-002-pp-12) on its first run, so this is a list, not a regex.
const OVERRULED: Record<string, string> = {
  'ENG-022-GK-03': 'its only fault is the place-sense "behind" ("behind somebody\'s head"), which manifesto v1.7 permits; the sweep brief wrongly listed "behind" as banned outright',
};
type V = { itemId: string; verdict: 'SIGN' | 'HOLD' | 'REFUSE'; faultAt?: string[]; fault?: string | null; objective?: boolean | null; suggestedFix?: string };
const index = JSON.parse(readFileSync(pjoin(DIR, 'index.json'), 'utf8')) as { batches: Array<{ id: string; district: string; rows: number }> };
const out: Array<V & { batch: string; district: string; questionType: string; overruled?: string }> = [];
const missing: string[] = [];
for (const b of index.batches) {
  const vf = pjoin(DIR, b.id, 'verdicts.json');
  if (!existsSync(vf)) { missing.push(b.id); continue; }
  const batch = JSON.parse(readFileSync(pjoin(DIR, b.id, 'batch.json'), 'utf8')) as { cards: Array<{ itemId: string; questionType: string }> };
  const body = JSON.parse(readFileSync(vf, 'utf8')) as { verdicts?: V[] };
  if (!Array.isArray(body.verdicts)) throw new Error(`${b.id}: verdicts.json has no verdicts array`);
  const byId = new Map(body.verdicts.map((v) => [v.itemId, v]));
  for (const v of body.verdicts) if (!batch.cards.some((c) => c.itemId === v.itemId)) throw new Error(`${b.id}: verdict for ${v.itemId}, which is not in the batch`);
  for (const c of batch.cards) {
    const v = byId.get(c.itemId);
    if (!v) throw new Error(`${b.id}: no verdict for ${c.itemId}`);
    const row = { ...v, batch: b.id, district: b.district, questionType: c.questionType } as (typeof out)[number];
    const why = OVERRULED[c.itemId];
    if (why && v.verdict !== 'SIGN') row.overruled = why;
    out.push(row);
  }
}
if (missing.length) { console.log(`NOT COMPLETE — no verdicts yet for: ${missing.join(', ')}`); process.exitCode = 1; }
const live = out.filter((r) => !r.overruled);
const count = (f: (r: (typeof out)[number]) => boolean) => live.filter(f).length;
const byDistrict = Object.fromEntries(['ENGLISH', 'MATHS', 'VR'].map((d) => [d, { read: out.filter((r) => r.district === d).length, hold: count((r) => r.district === d && r.verdict === 'HOLD'), refuse: count((r) => r.district === d && r.verdict === 'REFUSE') }]));
const summary = { read: out.length, sign: count((r) => r.verdict === 'SIGN'), hold: count((r) => r.verdict === 'HOLD'), refuse: count((r) => r.verdict === 'REFUSE'), overruled: out.filter((r) => r.overruled).length, objectiveFaults: count((r) => r.verdict !== 'SIGN' && r.objective === true), byDistrict, missingBatches: missing };
writeFileSync(pjoin(DIR, 'findings.json'), `${JSON.stringify({ ruling: 'R1037', summary, findings: out.filter((r) => r.verdict !== 'SIGN') }, null, 1)}\n`);
console.log(JSON.stringify(summary, null, 1));
for (const r of out.filter((x) => x.overruled)) console.log(`  overruled: ${r.itemId} — ${r.fault}`);
