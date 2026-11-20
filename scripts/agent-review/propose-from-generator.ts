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
    case 'vr07-value-slip': {
      // Name the swap (the reviewer refused the unnamed version: a sentence that fits every row checks nothing).
      const rows = Object.keys(op.values ?? {}); const toks = String(op.expr).replace(/[−–]/g, '-').match(/[A-Za-z]+|[+-]/g) ?? [];
      const evalWith = (vals: Record<string, number>) => { let t = 0, s = 1; for (const k of toks) { if (k === '+') s = 1; else if (k === '-') s = -1; else t += s * vals[k]!; } return t; };
      for (const target of [...new Set(toks.filter((k) => /[A-Za-z]/.test(k)))]) {
        const at = rows.indexOf(target);
        for (const source of [rows[at - 1], rows[at + 1]]) {
          if (!source) continue;
          if (String(evalWith({ ...op.values, [target]: op.values[source] })) === value)
            return `Used ${source}'s value ${op.values[source]} for ${target}, its neighbour in the code, so ${op.expr} comes to ${value} instead of ${key}.`;
        }
      }
      return null;
    }
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

/**
 * WALK SCRIPTS BY TEMPLATE (R1030). A walk script describes ONE question, so a rebuilt row's old script is
 * wrong — the gate caught it only where a stale script named a letter no longer on the card (vr-09), not
 * where it named letters still present (vr-14 row 02 said "J moves two on to L" of a question that now
 * goes D → B, J → H). Every touched row gets a script written from its own stem and options.
 */
function swapOf(op: Record<string, any>, value: string): [string, string] | null {
  const rows = Object.keys(op.values ?? {}); const toks = String(op.expr).replace(/[−–]/g, '-').match(/[A-Za-z]+|[+-]/g) ?? [];
  const ev = (vals: Record<string, number>) => { let t = 0, s = 1; for (const k of toks) { if (k === '+') s = 1; else if (k === '-') s = -1; else t += s * vals[k]!; } return t; };
  for (const target of [...new Set(toks.filter((k) => /[A-Za-z]/.test(k)))]) { const at = rows.indexOf(target);
    for (const source of [rows[at - 1], rows[at + 1]]) if (source && String(ev({ ...op.values, [target]: op.values[source] })) === value) return [source, target]; }
  return null;
}
function walkFor(type: string, stem: Record<string, any>, opts: Array<{ value: string; isKey: boolean; tag: string | null }>): string | null {
  const key = opts.find((o) => o.isKey)!.value; const wrong = opts.filter((o) => !o.isKey);
  // R1030 round 2: a bare capital letter reads as a word ("A runs backwards", "so I moves"), so letters are "the letter X".
  const isLetter = /^[A-Z]$/.test(key); const L = (x: string) => (isLetter ? `the letter ${x}` : x); const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (type === 'vr-07-letters-for-numbers') {
    const code = stem.code as Record<string, string>; const letters = Object.keys(code);
    const sum = String(stem.sum).replace(/[A-Z]/g, (l) => code[l] ?? l); const last = (String(stem.sum).match(/[A-Z]/g) ?? []).at(-1);
    const lines = wrong.map((o) => {
      if (o.tag === 'vr07-value-slip') { const sw = swapOf(stem.operands, o.value); return sw ? `${o.value} uses ${sw[0]}'s number for ${sw[1]}.` : null; }
      if (o.tag === 'vr07-operation-slip') return `${o.value} adds every number.`;
      if (o.tag === 'vr07-term-dropped') return `${o.value} leaves ${last} out.`;
      return null;
    });
    if (lines.some((x) => x === null)) return null;
    return `Look up ${letters.slice(0, -1).join(', ')} and ${letters.at(-1)} first. Then work out ${sum}, which makes ${key}. ${lines.join(' ')}`;
  }
  const why: Record<string, string> = {
    'vr-letter-series-step-repeat': 'takes the step twice', 'vr-letter-series-direction': 'runs backwards', 'vr-letter-series-off-by-one': 'is one letter out',
    'vr14-step-direction': 'goes the other way', 'vr14-step-size': 'is one letter out',
  };
  // One short sentence per wrong answer: the reading-age cap is 16 words, and a joined list broke it.
  const end = wrong.map((o) => `${cap(L(o.value))} ${why[o.tag ?? ''] ?? 'is a slip'}.`).join(' ');
  if (type === 'vr-09-letter-series') {
    const s: string[] = stem.series; const step = Number(stem.operands.step);
    return `Notice the space from ${L(s[0]!)} to ${L(s[1]!)}. You go up ${step} letters each time. Count ${step} on from ${L(s[3]!)} to reach ${L(key)}. ${end}`;
  }
  if (type === 'vr-14-letter-connections') {
    const [p, q] = stem.pairA as string[]; const step = Number(stem.operands.step); const n = Math.abs(step); const dir = step > 0 ? 'on' : 'back';
    return `Start with the first pair, ${p} and ${q}. That pair goes ${n} ${dir}, so ${L(stem.stemWord)} moves ${n} ${dir} to ${L(key)}. ${end}`;
  }

  return null;
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
    const touched = g.it.options.some((o, n) => { const s = r.options.find((x) => x.id === `${r.id}-opt${n + 1}`); return !s || val(s.content) !== val(o.content) || (o.isCorrect ? null : ((o as { mid?: string }).mid ?? null)) !== s.misconceptionId; });
    if (canonicalJson((r.stem as { operands?: unknown }).operands) !== canonicalJson((g.it.stem as { operands?: unknown }).operands) || (ALLOW_REBUILD && (g.it.options.length !== r.options.length || touched))) {
      if (!ALLOW_REBUILD) { refused.push(`${r.id}: operands differ from the generator's — not the same question`); continue; }
      if (g.it.options.length > r.options.length) { refused.push(`${r.id}: ${r.options.length} options stored, generator makes ${g.it.options.length} — adding options is not supported`); continue; }
      if (!r.options.find((x) => x.id === `${r.id}-opt1`)?.isCorrect || !g.it.options[0]!.isCorrect) { refused.push(`${r.id}: the key is not opt1 on both`); continue; }
      const genOps = (g.it.stem as { operands: Record<string, unknown> }).operands; const keyV = val(g.it.options.find((x) => x.isCorrect)!.content);
      const newOptions = g.it.options.map((o, n) => ({ optionId: `${r.id}-opt${n + 1}`, value: val(o.content), isKey: o.isCorrect, tag: o.isCorrect ? null : ((o as { mid?: string }).mid ?? null),
          execution: o.isCorrect ? null : executionFor((o as { mid?: string }).mid ?? '', genOps, val(o.content), keyV) }));
      const newStem = { ...(r.stem as Record<string, unknown>), ...(g.it.stem as Record<string, unknown>) };
      const walk = walkFor(TYPE!, newStem as Record<string, any>, newOptions);
      rebuilds.push({ itemId: r.id, why: 'R1030: the generator now writes this row differently (question design or distractor choice) so the key\'s position and run tells are broken; whole row rebuilt from the generator, walk script rewritten from the row.',
        stem: newStem, options: newOptions,
        ...(walk ? { explanationPatch: { walkScript: walk, walkScriptBatch: 'R1030-TEMPLATE', walkScriptStatus: 'DRAFT' } } : {}),
        ...(g.it.options.length < r.options.length ? { dropOptionIds: r.options.slice(g.it.options.length).map((x) => x.id) } : {}) });
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
