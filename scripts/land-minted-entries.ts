/**
 * THE JOIN REFUSES RATHER THAN STRETCHES (David's ruling — R865).
 *
 * **The join lands only on POSITIVE VERIFICATION and never on the absence of contradiction.** If an
 * option does not compute as its entry's behaviour, the entry waits for its true carrier.
 *
 *  1. THE ENTRY NAMES ITS CARRIER. This store will not choose one — choosing is the stretch.
 *  2. THE CARRIER EXISTS EXACTLY: the named value on the named row, byte for byte, a DISTRACTOR,
 *     and not already tagged.
 *  3. WHERE THE BEHAVIOUR IS EXECUTABLE, IT IS EXECUTED. R826 withdrew three signals that decided
 *     this by proxy; nothing here infers. A behaviour is executed only from arithmetic the sender
 *     WROTE, and where none was written the join refuses. **An unverifiable join is refused.**
 *
 * THE DELIVERED SHAPE IS NOT THIS GATE'S SHAPE, AND THE MAPPING IS DECLARED (R568/R57). The mint
 * file names `join{itemId,optionLabel,optionValue,working}`; this gate was written against
 * `carrier{itemId,optionValue}` + `computesAs`. Every key present is printed BEFORE any value is
 * read, and the mapping below is stated rather than applied silently — a reader that quietly
 * renames a field is how a null from a rename became a fact about thirty-six items.
 *
 *   join.itemId        -> carrier row
 *   join.optionValue   -> carrier identity, byte for byte
 *   join.optionLabel   -> CORROBORATION ONLY. Never used to select an option: selecting on a second
 *                         key when the first disagrees is the stretch wearing a tiebreak's clothes.
 *   join.working       -> the sender's computation, from which arithmetic is EXTRACTED, not parsed
 *                         for meaning. What was extracted is printed on every row (R569).
 *   entry.behaviour    -> Misconception.description
 *   entry.childHint    -> Misconception.childHint, GATED before it lands
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkChildFacingText } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const MINTS = process.argv.find((a) => a.startsWith('--mints='))?.slice(8)
  ?? '/Users/davidb/Downloads/MATHSMINTEDENTRIES.json';

interface Join { itemId: string; optionLabel?: string; optionValue: string; working?: string }
interface Mint {
  id: string; behaviour?: string; childHint?: string; description?: string; refinement?: string;
  join?: Join; secondCarrierCandidate?: Join; carrier?: { itemId: string; optionValue: string };
  computesAs?: string; humanRuling?: string;
}

/** Numeric components of a value: "£2000" -> [2000]; "(8, 4)" -> [8,4]. Never re-orders them. */
function componentsOf(v: string): number[] | null {
  const parts = v.replace(/[()]/g, '').split(',').map((s) => s.trim());
  const nums = parts.map((s) => Number(s.replace(/[^\d.-]/g, '')));
  return nums.every((n) => !Number.isNaN(n)) && nums.length > 0 ? nums : null;
}

/**
 * Extract arithmetic the sender WROTE. Not an interpreter: ` x ` and `divided by` are the two
 * infix spellings the mint uses, and nothing else is mapped. A phrase naming an operation in
 * words — "the largest of 6, 3, 7 and 4" — yields NOTHING and the join refuses, because building
 * an English-phrase interpreter to land rows is R826 exactly.
 */
function arithmeticIn(working: string): { expr: string[]; source: string } | null {
  const norm = working.replace(/\bx\b/g, '*').replace(/\bdivided by\b/g, '/');
  const tuple = norm.match(/\(([^)]*[+\-*/][^)]*)\)/);
  const candidates = tuple ? tuple[1].split(',') : [norm.match(/[\d.]+(?:\s*[+\-*/]\s*[\d.]+)+/)?.[0] ?? ''];
  const expr = candidates.map((c) => c.trim()).filter((c) => /^[\d\s.+\-*/()]+$/.test(c) && c !== '');
  if (expr.length === 0 || !expr.some((e) => /[+\-*/]/.test(e))) return null;
  return { expr, source: tuple ? tuple[0] : expr[0] };
}

/** Evaluate declared arithmetic against the option's own components. No proxy, no inference. */
function computes(working: string, optionValue: string) {
  const found = arithmeticIn(working);
  if (!found) {
    return { ran: false, detail: 'the working states no arithmetic to execute — it names the act in words. Nothing here interprets a phrase (R826).' };
  }
  const want = componentsOf(optionValue);
  if (!want) return { ran: false, detail: `the option value ${JSON.stringify(optionValue)} has no numeric components to compare` };
  let got: number[];
  try { got = found.expr.map((e) => Function(`"use strict";return (${e})`)() as number); } catch {
    return { ran: false, detail: `the extracted arithmetic ${JSON.stringify(found.expr)} did not evaluate` };
  }
  const agrees = got.length === want.length && got.every((g, i) => Math.abs(g - want[i]) < 1e-9);
  return {
    ran: true, agrees,
    extractedFrom: found.source, extracted: found.expr, evaluatedTo: got, optionComponents: want,
    detail: `extracted ${JSON.stringify(found.expr)} from ${JSON.stringify(found.source)} = ${JSON.stringify(got)}; the option is ${JSON.stringify(want)} — ${agrees ? 'AGREES' : 'DISAGREES'}`,
  };
}

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('minted-join', [
    { name: 'written arithmetic matching the option verifies', input: JSON.stringify(['25 x 80 = 2000', '2000']), mustBeCaught: true },
    { name: 'a division spelled in the mint\'s words verifies', input: JSON.stringify(['15 divided by 3', '5']), mustBeCaught: true },
    { name: 'a tuple verifies componentwise, order preserved', input: JSON.stringify(['(5 + 3, 4)', '(8, 4)']), mustBeCaught: true },
    { name: 'a tuple whose components are swapped REFUSES', input: JSON.stringify(['(5 + 3, 4)', '(4, 8)']), mustBeCaught: false },
    { name: 'arithmetic that does not match the option refuses', input: JSON.stringify(['15 x 4', '61']), mustBeCaught: false },
    { name: 'an operation named in words yields nothing and refuses', input: JSON.stringify(['the largest of 6, 3, 7 and 4', '7']), mustBeCaught: false },
    { name: 'a described property yields nothing and refuses', input: JSON.stringify(['digits 6, 4, 0 in descending order', '640']), mustBeCaught: false },
  ], (raw) => { const [w, v] = JSON.parse(raw) as [string, string]; const r = computes(w, v); return r.ran && r.agrees === true; });

  if (!existsSync(MINTS)) {
    console.log(`no mint file at ${MINTS} — the gate is built and nothing has landed. Re-run with --mints=<path>.`);
    console.log('THE GATE IS THE DELIVERABLE: it refuses by default, so an absent file lands nothing rather than everything.');
    await prisma.$disconnect(); return;
  }

  const raw = readFileSync(MINTS, 'utf8');
  const parsed = JSON.parse(raw) as { entries?: Mint[]; items?: Mint[]; condition?: string; source?: string; populationReference?: string };
  const mints = parsed.entries ?? parsed.items ?? [];
  requirePopulation('land:minted-entries', { 'minted entries offered': mints.length });

  // R568: the keys that are there, before the values anyone wants.
  const keysAtEntry = [...new Set(mints.flatMap((m) => Object.keys(m)))].sort();
  const keysAtJoin = [...new Set(mints.flatMap((m) => Object.keys(m.join ?? {})))].sort();
  console.log(`  keys present on entries: ${keysAtEntry.join(', ')}`);
  console.log(`  keys present on joins:   ${keysAtJoin.join(', ')}`);
  if (!keysAtJoin.includes('itemId') || !keysAtJoin.includes('optionValue')) {
    throw new Error('the delivered joins name no itemId/optionValue — refusing a shape I cannot parse (R173)');
  }

  const entryResults: Array<Record<string, unknown>> = [];
  const joinResults: Array<Record<string, unknown>> = [];

  for (const m of mints) {
    // ---- the ENTRY. Annie's authored library content; it lands on its own merits. -------------
    const hint = m.childHint ?? '';
    const gate = checkChildFacingText({ role: 'hint', label: 'childHint of ' + m.id, text: hint });
    const gateOk = gate.length === 0;
    const entryOk = gateOk && hint.trim() !== '' && (m.behaviour ?? m.description ?? '').trim() !== '';
    entryResults.push({
      entryId: m.id, outcome: entryOk ? (APPLY ? 'MINTED' : 'WOULD MINT') : 'REFUSED',
      ...(entryOk ? {} : { why: gateOk ? 'the entry carries no behaviour or no child hint' : gate.map((f) => f.message) }),
      ...(m.refinement ? { refinementTaken: m.refinement, supersedes: 'the 189th\'s wording; the file\'s wording is what mints' } : {}),
      childHintGate: gateOk ? 'PASSES' : `FAILS — ${gate.map((f) => f.message).join(' | ')}`,
    });
    if (entryOk && APPLY) {
      await prisma.misconception.upsert({
        where: { id: m.id },
        create: { id: m.id, district: 'MATHS', description: m.behaviour ?? m.description ?? '', childHint: hint, status: 'ACTIVE' },
        update: { description: m.behaviour ?? m.description ?? undefined, childHint: hint },
      });
      await prisma.attributionEvent.create({ data: {
        recordType: 'misconception', recordId: m.id, action: 'AUTHORED', reviewerId: null,
        actor: 'Annie', recordedBy: 'human:david', field: 'description,childHint',
        method: `minted from ${parsed.source ?? 'the mint file'}${m.refinement ? '; refinement taken from the file, superseding the 189th\'s wording' : ''}`,
        note: 'ids are names; numbers attach at the authoring register — no number minted here',
      } });
    }

    // ---- the JOINS. Gated, per row, default refusal. ------------------------------------------
    const candidates: Array<{ j: Join; kind: 'declared' | 'conditional' }> = [];
    if (m.join) candidates.push({ j: m.join, kind: 'declared' });
    if (m.secondCarrierCandidate) candidates.push({ j: m.secondCarrierCandidate, kind: 'conditional' });
    if (m.carrier) candidates.push({ j: { itemId: m.carrier.itemId, optionValue: m.carrier.optionValue, working: m.computesAs }, kind: 'declared' });

    if (candidates.length === 0) {
      joinResults.push({ entryId: m.id, outcome: 'REFUSED', why: 'THE ENTRY NAMES NO CARRIER. This store will not choose one — choosing is the stretch the ruling forbids.' });
      continue;
    }

    for (const { j, kind } of candidates) {
      const base = { entryId: m.id, carrier: `${j.itemId} ${j.optionLabel ?? '?'}=${JSON.stringify(j.optionValue)}`, kind };
      const refuse = (why: string, extra: Record<string, unknown> = {}) => joinResults.push({ ...base, outcome: 'REFUSED', why, ...extra });

      const row = await prisma.item.findUnique({ where: { id: j.itemId }, select: { id: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true } } } });
      if (!row) { refuse(`the named carrier row ${j.itemId} is not in this store`); continue; }

      const valueOf = (o: { content: unknown }) => String((o.content as { value: unknown }).value);
      const opt = row.options.find((o) => valueOf(o) === j.optionValue);
      if (!opt) {
        // Positive evidence about WHY, including retention — reported, never used to select (R98).
        const byLabel = row.options.find((o) => (o.content as { label?: string }).label === j.optionLabel);
        const retained = byLabel ? (byLabel.content as { _previousValue?: string })._previousValue : undefined;
        refuse(`no option on ${j.itemId} holds the value ${JSON.stringify(j.optionValue)} — the carrier must match byte for byte`, {
          valuesPresentNow: row.options.map(valueOf),
          ...(retained !== undefined ? {
            THE_DECLARED_VALUE_IS_A_SUPERSEDED_ONE: `option ${j.optionLabel} retains _previousValue ${JSON.stringify(retained)}, which is byte-identical to the declared carrier. The value moved by AMENDMENT, not by drift.`,
            andWHOMOVEDIT: 'her own 180th — money keys and money options carry their unit — landing AFTER the population this mint quotes.',
            whatWouldLandIt: 'her re-declaration against current bytes, or a ruling that a fenced value plus label identifies a carrier. NOT a relaxation here: matching on retention is a new selection rule, and inventing one under pressure to turn a row green is the fault R149 names.',
          } : {}),
        });
        continue;
      }
      if (opt.isCorrect) { refuse('the named carrier is the KEY. An entry describes an error; a key executes none.'); continue; }
      if (opt.misconceptionId) { refuse(`that option already carries ${opt.misconceptionId} — a second entry on one option is two answers to one question`); continue; }
      if (kind === 'conditional') {
        const c = opt.content as Record<string, unknown>;
        refuse('HELD — the file joins this candidate only if the store\'s declared gap prose agrees, and this store holds NO declared gap prose for the option.', {
          antecedent: 'the store\'s declared gap prose',
          antecedentState: 'ABSENT — misconceptionExecution, drafterDeclaredPull, tagStatus, attractorLine, defeaterLine and a36Note are all null on this option',
          andWHYTHATISNOTADISAGREEMENT: 'an absent antecedent is UNKNOWN, not false (R98). The condition says "else waits", and this waits.',
          contentKeysPresent: Object.keys(c),
        });
        continue;
      }

      const check = computes(j.working ?? '', valueOf(opt));
      if (check.ran && check.agrees === false) { refuse('THE OPTION DOES NOT COMPUTE AS THE ENTRY\'S BEHAVIOUR. The entry waits for its true carrier.', { detail: check.detail }); continue; }
      if (!check.ran) {
        refuse('NOT MECHANICALLY VERIFIABLE — the working names the act in words rather than writing the arithmetic. **An unverifiable join is refused, not waved through.**', {
          detail: check.detail,
          theWorkingAsWritten: j.working,
          whatWouldLandIt: 'one declared expression per join, in the sender\'s hand — or her ruling on the join itself. Not an interpreter built here: R826 withdrew three signals that decided this by inference and every one measured something else.',
          andWHOAUTHOREDTHEWORKING: 'the file says the workings were COMPUTED by the sender from her behaviours, so a working is not itself her ruling on the carrier (R203 — where the fact is doubt, the doubt travels with it).',
        });
        continue;
      }

      if (APPLY) {
        await prisma.$transaction(async (tx) => {
          await tx.itemOption.update({ where: { id: opt.id }, data: { misconceptionId: m.id } });
          await tx.attributionEvent.create({ data: {
            recordType: 'item', recordId: row.id, action: 'AMENDED', reviewerId: null,
            actor: 'Cowork (minted entry, joined)', recordedBy: 'human:david', field: 'options[].misconceptionId',
            method: `entry ${m.id} joined to its DECLARED carrier; ${check.detail}`,
            note: 'the join refuses rather than stretches — positively verified by executing the arithmetic the sender wrote, not merely uncontradicted',
          } });
        });
      }
      joinResults.push({ ...base, outcome: APPLY ? 'JOINED' : 'WOULD JOIN', verification: check.detail, extracted: check.extracted, extractedFrom: check.extractedFrom });
    }
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const counts = (rs: Array<Record<string, unknown>>) => rs.reduce<Record<string, number>>((a, r) => { a[String(r.outcome)] = (a[String(r.outcome)] ?? 0) + 1; return a; }, {});
  const lines = [...entryResults.map((r) => `entry\t${r.entryId}\t${r.outcome}`), ...joinResults.map((r) => `join\t${r.entryId}\t${r.carrier ?? '—'}\t${r.outcome}`)];
  const d = digestOverText('the result lines joined by \\n, each "<kind>\\t<entryId>[\\t<carrier>]\\t<outcome>"', lines.join('\n'));
  const full = {
    kind: 'minted-entry-landing', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written', THE_CUT: cut,
    mintFile: MINTS, mintFileSha256: sha(raw),
    mintFileSha256Spec: 'sha256 over the mint file bytes exactly as delivered, unparsed',
    populationTheMintQuotes: parsed.populationReference,
    THE_CONDITION_AS_SENT: parsed.condition,
    THE_RULING_ENFORCED: 'the join refuses rather than stretches: if an option does not compute as its entry\'s behaviour, the entry waits for its true carrier.',
    THE_DEFAULT_IS_REFUSAL: '**a join lands on positive verification, never on the absence of contradiction.**',
    THE_MAPPING_DECLARED: 'join.itemId+optionValue select the carrier; optionLabel CORROBORATES and never selects; working supplies arithmetic that is EXTRACTED, never interpreted; behaviour->description, childHint->childHint (gated).',
    entryCounts: counts(entryResults), joinCounts: counts(joinResults), entries: entryResults, joins: joinResults,
    RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec,
  };
  const artefact = { ...full, ...findingsDigest(full, ['entries', 'joins', 'RESULT_LINES', 'entryCounts', 'joinCounts']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'minted-entry-landing' : 'minted-entry-landing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'}\n  entries: ${JSON.stringify(counts(entryResults))}\n  joins:   ${JSON.stringify(counts(joinResults))}`);
  for (const r of joinResults) console.log(`   ${String(r.outcome).padEnd(10)} ${r.entryId} → ${r.carrier ?? '—'}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
