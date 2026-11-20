/**
 * A GENERATOR CHANGE, TAKEN TO REVIEW (R62's path, made a tool — R1030). When a derivation function
 * changes, `content:generate` refuses to rewrite reviewed rows ("reviewed and WOULD CHANGE"), rightly.
 * This writes the change as a PROPOSAL instead: for every LIVE row of a door, each option whose value or
 * tag the generator now produces differently becomes a `seat` (old value, new value, new tag), with the
 * execution left for a drafter to write. The review then runs as for any other proposal
 * (`land-proposals --from-live`), and once it lands the door is back in step with its generator.
 *
 * Option ids are the generator's own (`<itemId>-opt<n>`, n from 1); a row whose option ids do not match,
 * or whose key moved slot, is refused by name rather than guessed at.
 *
 *   tsx scripts/agent-review/propose-from-generator.ts --type=vr-14-letter-connections --door=patterns/vr-14
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { GENERATORS } from '../../packages/db/prisma/generate-content';
import { requirePopulation } from '../lib/population';
import { canonicalJson } from '../lib/findings-digest';

const TYPE = process.argv.find((a) => a.startsWith('--type='))?.slice(7);
const DOOR = process.argv.find((a) => a.startsWith('--door='))?.slice(7);
const val = (c: unknown) => String((c as { value?: unknown })?.value ?? '');
// --allow-rebuild: a row whose QUESTION the generator now writes differently (vr-14's backward questions)
// becomes a whole-row rebuild, with the same option ids, instead of being refused.
const ALLOW_REBUILD = process.argv.includes('--allow-rebuild');
const L = (n: number) => String.fromCharCode(65 + (((n % 26) + 26) % 26));
/**
 * EXECUTIONS BY TEMPLATE. These mistakes are computations, so each execution is written FROM the operands
 * that produce the value: correct by construction, not drafted. A reviewer still reads every one.
 * Returns null for a tag with no template, which leaves the execution for a person.
 */
function executionFor(id: string, op: Record<string, any>, value: string, key: string): string | null {
  const step = op.step, first = op.first, ans = op.answer;
  switch (id) {
    case 'vr07-value-slip': return `Read a neighbouring row of the code table for one of the letters in ${op.expr}, so the total comes to ${value} instead of ${key}.`;
    case 'vr07-operation-slip': return `Added every term in ${op.expr}, missing the minus sign, so the total comes to ${value} instead of ${key}.`;
    case 'vr07-term-dropped': return `Stopped before the last term of ${op.expr} and never used it, so the total comes to ${value} instead of ${key}.`;
    case 'vr-letter-series-step-repeat': return `Applied the step of ${step} twice from the last letter, landing on ${value} instead of ${key}.`;
    case 'vr-letter-series-direction': return `Ran the series backwards, ${step} back from the first letter ${L(first)}, giving ${value} instead of ${key}.`;
    case 'vr-letter-series-off-by-one': return `Had the step of ${step} right but landed one letter ${value < key ? 'short' : 'too far'}, on ${value} instead of ${key}.`;
    case 'vr-series-off-by-one': return `Had the rule right but slipped by one on the last jump, giving ${value} instead of ${key}.`;
    case 'vr-series-step-applied-twice': return `Added the step of ${step} twice from the last term, giving ${value} instead of ${key}.`;
    case 'vr-series-sum-of-last-two': return `Read the series as each term being the sum of the two before it, and added the last two terms to make ${value}.`;
    case 'vr-series-step-carryover': return `Reused the previous gap of ${op.prevStep} instead of letting it grow, giving ${value} instead of ${key}.`;
    case 'vr14-step-direction': return `Moved ${Math.abs(step)} ${step > 0 ? 'back' : 'forward'} from the new letter ${L(first)} instead of ${step > 0 ? 'forward' : 'back'}, as the first pair goes, giving ${value} instead of ${key}.`;
    case 'vr14-step-size': return `Counted the jump one letter ${Math.abs(value.charCodeAt(0) - L(first).charCodeAt(0)) < Math.abs(step) ? 'short' : 'long'} from the new letter ${L(first)}, landing on ${value} instead of ${key}.`;
    case 'vr14-step-applied-twice': return `Made the first pair's jump of ${step} twice from the new letter ${L(first)}, landing on ${value} instead of ${key}.`;
    default: return null;
  }
}

async function main() {
  if (!TYPE || !DOOR || !GENERATORS[TYPE]) throw new Error('pass --type=<a generated question type> --door=<patterns/...>');
  const dir = pjoin(__dirname, '..', '..', 'content', 'agent-review', DOOR);
  if (!existsSync(pjoin(dir, 'packet.json'))) throw new Error(`${DOOR}: no packet.json — run export-packets --live first`);
  const gen = GENERATORS[TYPE]!().map((it) => ({ id: `gen-${TYPE}-${String(it.n).padStart(2, '0')}`, it }));
  const live = await prisma.item.findMany({ where: { questionTypeId: TYPE, status: 'LIVE', pool: 'PRACTICE' }, orderBy: { id: 'asc' },
    select: { id: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true }, orderBy: { id: 'asc' } } } });
  requirePopulation(`propose-from-generator:${TYPE}`, { 'LIVE rows': live.length });
  const seats: Array<Record<string, unknown>> = []; const redrafts: Array<Record<string, unknown>> = []; const rebuilds: Array<Record<string, unknown>> = []; const refused: string[] = []; let unchanged = 0;
  for (const r of live) {
    const g = gen.find((x) => x.id === r.id);
    if (!g) { refused.push(`${r.id}: the generator does not produce this id`); continue; }
    // Order-insensitive: JSONB does not keep key order, so a raw stringify reports every row as different (CLAUDE.md).
    if (canonicalJson((r.stem as { operands?: unknown }).operands) !== canonicalJson((g.it.stem as { operands?: unknown }).operands)) {
      if (!ALLOW_REBUILD) { refused.push(`${r.id}: operands differ from the generator's — not the same question`); continue; }
      if (g.it.options.length !== r.options.length) { refused.push(`${r.id}: ${r.options.length} options stored, generator makes ${g.it.options.length}`); continue; }
      const genOps = (g.it.stem as { operands: Record<string, unknown> }).operands; const keyV = val(g.it.options.find((x) => x.isCorrect)!.content);
      rebuilds.push({ itemId: r.id, why: 'R1030: the generator now writes this question differently (a backward letter connection), so its distractors spread the key; whole row rebuilt from the generator.',
        stem: { ...(r.stem as Record<string, unknown>), ...(g.it.stem as Record<string, unknown>) },
        options: g.it.options.map((o, n) => ({ optionId: `${r.id}-opt${n + 1}`, value: val(o.content), isKey: o.isCorrect, tag: o.isCorrect ? null : ((o as { mid?: string }).mid ?? null),
          execution: o.isCorrect ? null : executionFor((o as { mid?: string }).mid ?? '', genOps, val(o.content), keyV) })) });
      continue;
    }
    if (g.it.options.length !== r.options.length) { refused.push(`${r.id}: ${r.options.length} options stored, generator makes ${g.it.options.length}`); continue; }
    let changed = false;
    g.it.options.forEach((o, n) => {
      const stored = r.options.find((x) => x.id === `${r.id}-opt${n + 1}`);
      if (!stored) { refused.push(`${r.id}: no option ${r.id}-opt${n + 1}`); return; }
      if (stored.isCorrect !== o.isCorrect) { refused.push(`${r.id}: the key is not in slot ${n + 1} on both`); return; }
      if (o.isCorrect) return;
      const nv = val(o.content); const ov = val(stored.content); const tag = (o as { mid?: string }).mid ?? null;
      if (nv === ov && tag === stored.misconceptionId) return;
      changed = true;
      seats.push({ optionId: stored.id, itemId: r.id, oldValue: ov, tag, newValue: nv, execution: executionFor(tag ?? '', (r.stem as { operands: Record<string, unknown> }).operands, nv, val(g.it.options.find((x) => x.isCorrect)!.content)) ?? '' });
    });
    if (!changed) { unchanged++; continue; }
    // Every other distractor on a touched row needs an execution too (the lander refuses a row otherwise).
    const full = await prisma.itemOption.findMany({ where: { itemId: r.id }, select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } });
    for (const o of full) if (!o.isCorrect && !seats.some((s) => s.optionId === o.id) && (o.misconceptionExecution ?? '').trim().length < 40)
      redrafts.push({ optionId: o.id, itemId: r.id, value: val(o.content), tag: o.misconceptionId, execution: executionFor(o.misconceptionId ?? '', (r.stem as { operands: Record<string, unknown> }).operands, val(o.content), val(r.options.find((x) => x.isCorrect)!.content)) ?? '' });
  }
  writeFileSync(pjoin(dir, 'proposals.skeleton.json'), JSON.stringify({ door: DOOR, proposer: 'generator (R1030) — executions to be written by a drafting agent', source: `GENERATORS['${TYPE}']`, seats, redrafts, rebuilds }, null, 1));
  const blank = [...seats, ...redrafts].filter((x) => !x.execution).length + rebuilds.flatMap((b) => (b.options as Array<{ isKey: boolean; execution: string | null }>)).filter((o) => !o.isKey && !o.execution).length;
  console.log(`${TYPE}: ${live.length} LIVE rows — ${rebuilds.length} rebuild(s), ${redrafts.length} redraft(s), ${blank} execution(s) left blank — ${seats.length} seat(s) on ${live.length - unchanged - refused.length} row(s), ${unchanged} unchanged, ${refused.length} refused`);
  for (const x of refused) console.log(`  ✗ ${x}`);
  if (refused.length) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
