/**
 * SCORE A CALIBRATION RETURN against the key (R1031). Pure file read: no database.
 *
 *   tsx scripts/agent-review/score-calibration.ts --return=<her return .json> [--sample=01]
 *
 * Refuses a return whose digest is not this sample's (R588: an artefact is matched by digest, never by
 * name). States every denominator (R60): a partial return is scored on the cards she DECIDED, and the
 * undecided count is printed beside every figure, never folded into a rate.
 *
 * The two numbers that matter, and what each one is evidence of:
 *   - On cards the machine SIGNED: how often she would also sign. A refusal here is a fault the machine
 *     passed into a child's pool (its false-accept rate). This is the number the 761 rows rest on.
 *   - On cards the machine HELD: how often she would also hold or refuse. A sign here means the machine
 *     withheld something good (its false-refuse rate) — a cost in speed, not in children's safety.
 * Both carry a Wilson 95% interval, because at n = 32 and n = 8 a bare percentage claims more than it knows.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const SAMPLE = arg('sample') ?? '01';
const RET = arg('return');
if (!RET) throw new Error('--return=<file> is required');
const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'calibration', SAMPLE);

interface KeyRow { card: number; itemId: string; kind: 'SIGNED' | 'HELD'; district: string; questionType: string; machineReason: string }
interface Verdict { card: number; verdict: 'SIGN' | 'HOLD' | 'REFUSE' | null; faultAt: string[]; reason: string | null; complete: boolean }
const key = JSON.parse(readFileSync(pjoin(DIR, 'key.json'), 'utf8')) as { cardsDigest: string; key: KeyRow[] };
const ret = JSON.parse(readFileSync(RET, 'utf8')) as { kind?: string; cardsDigest?: string; reviewer?: string; verdicts?: Verdict[]; partial?: boolean };
if (ret.kind !== 'calibration-return') throw new Error(`not a calibration return (kind: ${String(ret.kind)})`);
if (ret.cardsDigest !== key.cardsDigest) throw new Error(`return is for digest ${ret.cardsDigest}, this sample is ${key.cardsDigest} — not scored`);
if (!Array.isArray(ret.verdicts)) throw new Error('return has no verdicts array (R173: refuse a shape, never score empty)');

const wilson = (k: number, n: number) => { if (!n) return '—'; const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return `${Math.round(100 * p)}% (95% CI ${Math.round(100 * Math.max(0, c - h))}–${Math.round(100 * Math.min(1, c + h))}%)`; };
const byCard = new Map(ret.verdicts.map((v) => [v.card, v]));
const decided = key.key.filter((k) => byCard.get(k.card)?.complete);
console.log(`calibration ${SAMPLE} — reviewer as entered: "${ret.reviewer ?? ''}" (a name typed into a page, not a verified identity)`);
console.log(`  decided ${decided.length} of ${key.key.length} cards${decided.length < key.key.length ? ` — ${key.key.length - decided.length} UNDECIDED, excluded from every rate below` : ''}`);
if (decided.length === 0) { console.log('  NOTHING SCORED — no card carries a complete verdict. This is not an agreement rate of anything.'); process.exitCode = 1; }

const line = (label: string, rows: KeyRow[], agrees: (v: Verdict) => boolean) => { const k = rows.filter((r) => agrees(byCard.get(r.card)!)).length; console.log(`  ${label.padEnd(44)} ${k} of ${rows.length}  ${wilson(k, rows.length)}`); return k; };
const signed = decided.filter((k) => k.kind === 'SIGNED'); const held = decided.filter((k) => k.kind === 'HELD');
line('machine SIGNED → she would also sign', signed, (v) => v.verdict === 'SIGN');
line('machine HELD → she would also hold/refuse', held, (v) => v.verdict !== 'SIGN');
for (const d of ['ENGLISH', 'MATHS', 'VR']) { const s = signed.filter((k) => k.district === d); if (s.length) line(`  ${d}: signed → she signs`, s, (v) => v.verdict === 'SIGN'); }

const disagreements = decided.filter((k) => (k.kind === 'SIGNED') !== (byCard.get(k.card)!.verdict === 'SIGN')).map((k) => ({ ...k, hers: byCard.get(k.card)! }));
console.log(`\n  disagreements: ${disagreements.length}`);
for (const d of disagreements) console.log(`   card ${d.card} ${d.itemId} (${d.questionType}) machine ${d.kind === 'SIGNED' ? 'SIGN' : 'HOLD'} / hers ${d.hers.verdict} at [${d.hers.faultAt.join(', ')}]: ${d.hers.reason ?? ''}`);
writeFileSync(pjoin(DIR, 'score.json'), `${JSON.stringify({ sample: SAMPLE, cardsDigest: key.cardsDigest, reviewerAsEntered: ret.reviewer ?? null, decided: decided.length, of: key.key.length, signedAgree: signed.filter((k) => byCard.get(k.card)!.verdict === 'SIGN').length, signedN: signed.length, heldAgree: held.filter((k) => byCard.get(k.card)!.verdict !== 'SIGN').length, heldN: held.length, disagreements }, null, 1)}\n`);
