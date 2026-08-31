/**
 * EVERY EXECUTION THE AUTHORING STORE CROSSED AND THIS STORE NEVER LANDED.
 *
 * **None of it is re-derivable.** An execution is authored prose about one option (R922), so a
 * crossed-but-unlanded execution has exactly one holder — a file — and landing it is the only thing
 * that ends the exposure (R951).
 *
 * The scan is over every crossed artefact, keyed on the fields that actually carry an execution, and
 * **it prints the field names it found before it reads any values** (R568): a scan that looks for one
 * spelling and reports zero is indistinguishable from a corpus with none.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const DL = pjoin(homedir(), 'Downloads');
/** Every spelling an execution has worn in a crossed artefact. Derived by scanning, then listed. */
const EXEC_KEYS = ['EXECUTION', 'execution', 'misconceptionExecution', 'theExecution', 'executionText'];

interface Found { file: string; digest: string; itemId: string; optionValue: unknown; key: string; text: string }

/**
 * TWO SHAPES CARRY AN EXECUTION AND THE FIRST WALKER ONLY HANDLED ONE.
 *
 *  A. `{ itemId, optionValue, EXECUTION }` — flat, one record per execution.
 *  B. an ITEM `{ itemId, options: [{ label, content|value, misconceptionExecution }] }` — the
 *     execution sits on an option nested inside the item, and the option identifies itself by
 *     `content` or `value` or `label`, not by `optionValue`.
 *
 * The first version propagated `optionValue` down from whatever ancestor had a `value` key and
 * reported **569 executions with no seat in this store** — of which 565 had their ROW right here.
 * A matcher failing to resolve an option is indistinguishable, in a count, from a store that does
 * not hold it (R173, R568). The identity is now read from the option's OWN keys.
 */
function* walk(o: unknown, ctx: { itemId?: string }): Generator<{ itemId: string; optionValue: unknown; key: string; text: string }> {
  if (Array.isArray(o)) { for (const v of o) yield* walk(v, ctx); return; }
  if (!o || typeof o !== 'object') return;
  const r = o as Record<string, unknown>;
  const itemId = typeof r.itemId === 'string' ? r.itemId : (typeof r.id === 'string' && Array.isArray(r.options) ? r.id : ctx.itemId);
  for (const k of EXEC_KEYS) {
    const v = r[k];
    if (typeof v === 'string' && v.length > 40 && itemId) {
      const own = r.optionValue !== undefined ? r.optionValue
        : r.content !== undefined ? (typeof r.content === 'object' && r.content !== null && 'value' in (r.content as object) ? (r.content as { value: unknown }).value : r.content)
        : r.value !== undefined ? r.value
        : r.label;
      yield { itemId, optionValue: own, key: k, text: v };
    }
  }
  for (const v of Object.values(r)) yield* walk(v, { itemId });
}

async function run() {
  assertFixture('exec-scan', [
    { name: 'an execution nested under an itemId is found', input: JSON.stringify({ itemId: 'x', optionValue: ['a'], EXECUTION: 'y'.repeat(60) }), mustBeCaught: true },
    { name: 'a short string is not an execution', input: JSON.stringify({ itemId: 'x', EXECUTION: 'short' }), mustBeCaught: false },
    { name: 'an execution with no itemId in scope is not attributable', input: JSON.stringify({ EXECUTION: 'y'.repeat(60) }), mustBeCaught: false },
  ], (raw) => [...walk(JSON.parse(raw), {})].length > 0);

  const found: Found[] = [];
  const keysSeen = new Set<string>();
  for (const f of readdirSync(DL).filter((n) => n.endsWith('.json'))) {
    let text: string; let doc: unknown;
    try { text = readFileSync(pjoin(DL, f), 'utf8'); doc = JSON.parse(text); } catch { continue }
    if (!EXEC_KEYS.some((k) => text.includes(`"${k}"`))) continue;
    for (const k of EXEC_KEYS) if (text.includes(`"${k}"`)) keysSeen.add(k);
    const digest = sha(text);
    for (const hit of walk(doc, {})) found.push({ file: f, digest, ...hit });
  }
  requirePopulation('report:unlanded-executions', { 'crossed execution(s) found': found.length, 'field name(s) carrying one': keysSeen.size });
  console.log(`  execution field names present in the crossed artefacts: ${[...keysSeen].join(', ')}`);

  // dedupe on (itemId, optionValue, text)
  const uniq = new Map<string, Found>();
  for (const f of found) uniq.set(sha(`${f.itemId}|${canonicalJson(f.optionValue)}|${f.text}`), f);

  const rows = await prisma.item.findMany({ where: { id: { in: [...new Set([...uniq.values()].map((f) => f.itemId))] } },
    select: { id: true, questionType: { select: { district: true } }, options: { select: { content: true, misconceptionId: true, misconceptionExecution: true } } } });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const assessed = [...uniq.values()].map((f) => {
    const row = byId.get(f.itemId);
    /** An option matches on its VALUE, or failing that on its LABEL — both are how a crossed file names one. */
    const same = (a: unknown, b: unknown) => canonicalJson(a) === canonicalJson(b);
    const opt = row?.options.find((o) => {
      const c = o.content as Record<string, unknown>;
      return same(c.value, f.optionValue) || same(c, f.optionValue) || (c.label !== undefined && same(c.label, f.optionValue));
    });
    const landedHere = opt?.misconceptionExecution ?? null;
    return { itemId: f.itemId, district: row?.questionType.district ?? '(row not in this store)',
      optionValue: f.optionValue, sourceFile: f.file, sourceDigest: f.digest.slice(0, 16), field: f.key,
      rowExistsHere: !!row, optionExistsHere: !!opt,
      LANDED: landedHere !== null, byteIdentical: landedHere === f.text,
      executionSha256: sha(f.text), lengthChars: f.text.length };
  });
  const unlanded = assessed.filter((a) => a.optionExistsHere && !a.LANDED);
  const landed = assessed.filter((a) => a.LANDED);
  const noSeat = assessed.filter((a) => !a.optionExistsHere);

  const full = {
    kind: 'unlanded-executions-census',
    THE_CLASS: 'every execution the authoring store crossed and this store never landed. None of it is re-derivable — an execution is authored prose about one option, not a computation (R922).',
    THE_SCAN: { artefactsWithAnExecutionField: [...new Set(found.map((f) => f.file))].length,
      fieldNamesFound: [...keysSeen],
      andWHYTHATISPRINTED: 'a scan that looks for one spelling and reports zero is indistinguishable from a corpus with none (R568). The names are listed before any value is read.' },
    counts: { crossedExecutions: uniq.size, alreadyLandedHere: landed.length, byteIdentical: landed.filter((a) => a.byteIdentical).length,
      UNLANDED_AND_HELD_ONCE: unlanded.length, noSeatInThisStore: noSeat.length },
    THE_UNLANDED_MEMBERSHIP: unlanded,
    alreadyLanded: landed,
    withNoSeatHere: noSeat,
    andWHATENDSTHEEXPOSURE: 'landing them. Nothing else does — a second artefact is a second copy of the same file, and this store cannot re-author what it did not write.',
  };
  const lines = unlanded.map((u) => `${u.itemId}\t${canonicalJson(u.optionValue)}\t${u.executionSha256.slice(0, 16)}`);
  const d = digestOverText('one line per unlanded execution', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['counts', 'THE_UNLANDED_MEMBERSHIP', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('unlanded-executions-census', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'unlanded-executions-census');
  console.log(`\n  crossed executions ${uniq.size} · already landed ${landed.length} (${landed.filter((a) => a.byteIdentical).length} byte-identical) · UNLANDED ${unlanded.length} · no seat here ${noSeat.length}`);
  for (const u of unlanded.slice(0, 12)) console.log(`     ${u.itemId}  ${canonicalJson(u.optionValue)}  ${u.sourceFile.slice(0, 44)}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
