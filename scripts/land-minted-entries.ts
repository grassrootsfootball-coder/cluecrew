/**
 * THE JOIN REFUSES RATHER THAN STRETCHES (David's ruling — R865).
 *
 * When Cowork's six mints land, each must attach to a carrier. **The join lands only on POSITIVE
 * VERIFICATION and never on the absence of contradiction** — if an option does not compute as its
 * entry's behaviour, the entry waits for its true carrier.
 *
 * **Three gates, and the default is refusal.**
 *  1. THE ENTRY NAMES ITS CARRIER. A mint with no declared item and option value cannot be joined at
 *     all: this store will not choose a carrier for an entry, which is the stretching the ruling
 *     forbids.
 *  2. THE CARRIER EXISTS EXACTLY. The named option value must be on the named row, byte for byte,
 *     and must be a DISTRACTOR — an entry naming a key is refused outright.
 *  3. WHERE THE BEHAVIOUR IS EXECUTABLE, IT IS EXECUTED. R826 withdrew three signals that tried to
 *     decide this by proxy; nothing here decides by proxy. A behaviour is executed only when the
 *     mint declares HOW — an explicit `computesAs` expression over the stem's numbers — and where it
 *     does not, the row is marked NOT MECHANICALLY VERIFIED and refuses unless a human ruling
 *     accompanies it. **An unverifiable join is refused, not waved through.**
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const MINTS = process.argv.find((a) => a.startsWith('--mints='))?.slice(8) ?? '/Users/davidb/Downloads/MATHSMINTEDENTRIES.json';

interface Mint { id: string; childHint?: string; description?: string; carrier?: { itemId: string; optionValue: string }; computesAs?: string; humanRuling?: string }

/** Evaluate a declared arithmetic expression. No proxy, no inference — only what the mint states. */
function computes(expr: string, optionValue: string): { ran: boolean; agrees?: boolean; got?: number; detail: string } {
  if (!/^[\d\s.+\-*/()]+$/.test(expr)) return { ran: false, detail: 'the declared expression is not plain arithmetic; refusing to interpret it' };
  let got: number;
  try { got = Function(`"use strict";return (${expr})`)() as number; } catch { return { ran: false, detail: 'the declared expression did not evaluate' }; }
  const want = Number(String(optionValue).replace(/[^\d.-]/g, ''));
  if (Number.isNaN(want)) return { ran: false, detail: 'the option value is not numeric, so the expression cannot be compared with it' };
  const agrees = Math.abs(got - want) < 1e-9;
  return { ran: true, agrees, got, detail: `${expr} = ${got}; the option is ${want} — ${agrees ? 'AGREES' : 'DISAGREES'}` };
}

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('minted-join', [
    { name: 'a declared expression that matches the option verifies', input: JSON.stringify(['30+10', '40']), mustBeCaught: true },
    { name: 'a second matching pair verifies', input: JSON.stringify(['5*4', '20']), mustBeCaught: true },
    { name: 'an expression that does NOT match the option refuses', input: JSON.stringify(['30+10', '41']), mustBeCaught: false },
    { name: 'a non-arithmetic declaration refuses', input: JSON.stringify(['rounds up and does not compensate', '40']), mustBeCaught: false },
  ], (raw) => { const [e, v] = JSON.parse(raw) as [string, string]; const r = computes(e, v); return r.ran && r.agrees === true; });

  if (!existsSync(MINTS)) {
    console.log(`no mint file at ${MINTS} — the gate is built and nothing has landed. Re-run with --mints=<path> when the six cross.`);
    console.log('THE GATE IS THE DELIVERABLE: it refuses by default, so an absent file lands nothing rather than landing everything.');
    await prisma.$disconnect();
    return;
  }

  const parsed = JSON.parse(readFileSync(MINTS, 'utf8')) as { entries?: Mint[]; items?: Mint[] };
  const mints = parsed.entries ?? parsed.items ?? [];
  requirePopulation('land:minted-entries', { 'minted entries offered': mints.length });

  const results: Array<Record<string, unknown>> = [];
  for (const m of mints) {
    const refuse = (why: string, extra: Record<string, unknown> = {}) => results.push({ entryId: m.id, outcome: 'REFUSED', why, ...extra });
    if (!m.carrier?.itemId || !m.carrier?.optionValue) { refuse('THE ENTRY NAMES NO CARRIER. This store will not choose one — choosing is the stretch the ruling forbids.'); continue; }
    const row = await prisma.item.findUnique({ where: { id: m.carrier.itemId }, select: { id: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true } } } });
    if (!row) { refuse(`the named carrier row ${m.carrier.itemId} is not in this store`); continue; }
    const opt = row.options.find((o) => String((o.content as { value: string }).value) === m.carrier!.optionValue);
    if (!opt) { refuse(`no option on ${m.carrier.itemId} has the value ${JSON.stringify(m.carrier.optionValue)} — the carrier must match byte for byte`, { valuesPresent: row.options.map((o) => String((o.content as { value: string }).value)) }); continue; }
    if (opt.isCorrect) { refuse('the named carrier is the KEY. An entry describes an error; a key executes none.'); continue; }
    if (opt.misconceptionId) { refuse(`that option already carries ${opt.misconceptionId} — a second entry on one option is two answers to one question`); continue; }

    const check = m.computesAs ? computes(m.computesAs, m.carrier.optionValue) : { ran: false, detail: 'the mint declares no `computesAs`, so nothing here can execute its behaviour (R826 — no proxy)' };
    if (check.ran && check.agrees === false) { refuse('THE OPTION DOES NOT COMPUTE AS THE ENTRY\'S BEHAVIOUR. The entry waits for its true carrier.', { detail: check.detail }); continue; }
    if (!check.ran && !m.humanRuling) { refuse('NOT MECHANICALLY VERIFIABLE and no human ruling accompanies it. **An unverifiable join is refused, not waved through.**', { detail: check.detail }); continue; }

    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        await tx.misconception.upsert({ where: { id: m.id }, create: { id: m.id, district: 'MATHS', description: m.description ?? '', childHint: m.childHint ?? '', status: 'ACTIVE' }, update: { description: m.description ?? undefined, childHint: m.childHint ?? '' } });
        await tx.itemOption.update({ where: { id: opt.id }, data: { misconceptionId: m.id } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: row.id, action: 'AMENDED', reviewerId: null, actor: 'Cowork (minted entry)', recordedBy: 'human:david', field: 'options[].misconceptionId', method: `minted entry ${m.id} joined to its DECLARED carrier; ${check.ran ? `verified: ${check.detail}` : `human ruling: ${m.humanRuling}`}`, note: 'the join refuses rather than stretches — this one was positively verified, not merely uncontradicted' } });
      });
    }
    results.push({ entryId: m.id, outcome: APPLY ? 'JOINED' : 'WOULD JOIN', carrier: m.carrier, verification: check.ran ? check.detail : `human ruling: ${m.humanRuling}` });
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'minted-entry-landing',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    THE_RULING_ENFORCED: 'the join refuses rather than stretches: if an option does not compute as its entry\'s behaviour, the entry waits for its true carrier.',
    THE_DEFAULT_IS_REFUSAL: '**a join lands on positive verification, never on the absence of contradiction.** A mint with no declared carrier, a carrier that does not match byte for byte, a key named as a carrier, an option already tagged, a declared computation that disagrees, or a behaviour nothing can execute and no human has ruled — every one of those refuses.',
    andWHYNOPROXY: 'R826 withdrew three signals that tried to decide "does this option execute this error" by inference, and every one measured something else. **So nothing here infers.** A behaviour is executed only where the mint DECLARES the arithmetic, and where it does not, a human ruling must accompany it.',
    counts: results.reduce<Record<string, number>>((a, r) => { a[String(r.outcome)] = (a[String(r.outcome)] ?? 0) + 1; return a; }, {}),
    results,
  };
  const lines = results.map((r) => `${r.entryId}\t${r.outcome}`);
  const d = digestOverText('the result lines joined by \\n, each "<entryId>\\t<outcome>"', lines.join('\n'));
  const full = { ...payload, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['counts', 'results', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'minted-entry-landing' : 'minted-entry-landing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — ${JSON.stringify(payload.counts)}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
