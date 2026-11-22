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
import { carrierWorking, crossedOptionKeys } from './lib/crossed-carrier-working';
import { determines } from './lib/determination';
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

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('join-determination', [
    { name: 'arithmetic determines', input: JSON.stringify(['80 x 25 = 2000', '£2000', 'What is 25% of £80?']), mustBeCaught: true },
    { name: 'arithmetic whose result is one component of a tuple option determines', input: JSON.stringify(['5 + 3 = 8 → (8, 4)', '(8, 4)', 'corners at (2, 1), (5, 1) and (2, 4)']), mustBeCaught: true },
    { name: 'a nested fraction determines', input: JSON.stringify(['15 / (1/4) = 60', '60', 'holds 3/4 kg from 15 kg']), mustBeCaught: true },
    { name: 'SELECTION determines', input: JSON.stringify(['biggest number = 7', '7', 'Ava 6, Ben 3, Cara 7, Dev 4. total?']), mustBeCaught: true },
    { name: 'ORDERING by a stated sequence determines', input: JSON.stringify(['6,4,0 = 640', '640', 'Use the digits 6, 0 and 4 once each']), mustBeCaught: true },
    { name: 'ORDERING stated in words determines', input: JSON.stringify(['put 6 first, then 0,4 -> 604', '604', 'Use the digits 6, 0 and 4 once each']), mustBeCaught: true },
    { name: 'GESTURE determines nothing', input: JSON.stringify(['looks about right', '7', 'Ava 6, Ben 3, Cara 7, Dev 4']), mustBeCaught: false },
    { name: 'a TIED selection determines nothing', input: JSON.stringify(['biggest number = 7', '7', 'Ava 7, Ben 7']), mustBeCaught: false },
    { name: 'a permutation not grounded in the item determines nothing', input: JSON.stringify(['9,9,9 = 999', '999', 'Use the digits 6, 0 and 4']), mustBeCaught: false },
    { name: 'a selection naming the wrong option refuses', input: JSON.stringify(['biggest number = 7', '6', 'Ava 6, Ben 3, Cara 7, Dev 4']), mustBeCaught: false },
    { name: 'arithmetic that does not hold refuses', input: JSON.stringify(['80 x 25 = 1000', '1000', 'What is 25% of £80?']), mustBeCaught: false },
    /**
     * RETIRED WITH HER 192nd, DELIBERATELY AND NOT SILENTLY: two cases here asserted that
     * `the largest of 6, 3, 7 and 4` and `digits 6, 4, 0 in descending order` must NOT verify.
     * They were correct while the condition was read as arithmetic and they are wrong now — the
     * ruling is that selection and ordering determine. **A fixture case that a ruling invalidates
     * is removed in the commit that implements the ruling, with the reason**, because a stale
     * must-be-clean case is an instrument enforcing a superseded rule and it fails loudly on the
     * correct behaviour (R887).
     */
    { name: 'bare arithmetic reproducing the option determines', input: JSON.stringify(['15 divided by 3', '5', 'holds 3/4 kg from 15 kg']), mustBeCaught: true },
    { name: 'a tuple determines componentwise, order preserved', input: JSON.stringify(['(5 + 3, 4)', '(8, 4)', 'corners at (2, 1), (5, 1) and (2, 4)']), mustBeCaught: true },
    { name: 'a tuple whose components are SWAPPED determines nothing', input: JSON.stringify(['(5 + 3, 4)', '(4, 8)', 'corners at (2, 1), (5, 1) and (2, 4)']), mustBeCaught: false },
  ], (raw) => { const [w, v, s] = JSON.parse(raw) as [string, string, string]; return determines(w, v, s).determines; });

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
  console.log(`  keys present on CROSSED carrier options: ${crossedOptionKeys().join(', ')}`);
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
      ...(entryOk ? {} : { why: gateOk ? 'the entry carries no behaviour or no child hint' : gate.map((f) => f.detail) }),
      ...(m.refinement ? { refinementTaken: m.refinement, supersedes: 'the 189th\'s wording; the file\'s wording is what mints' } : {}),
      childHintGate: gateOk ? 'PASSES' : `FAILS — ${gate.map((f) => f.detail).join(' | ')}`,
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

      const row = await prisma.item.findUnique({ where: { id: j.itemId }, select: { id: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true } } } });
      if (!row) { refuse(`the named carrier row ${j.itemId} is not in this store`); continue; }

      const valueOf = (o: { content: unknown }) => String((o.content as { value: unknown }).value);
      /**
       * R886 — A JOIN'S DECLARED VALUE RE-DERIVES AGAINST THE CARRIER'S CURRENT BYTES AT LANDING
       * (Annie's 192nd). Her own quote was born stale: she computed the join from a population
       * snapshot and the money-units class landed after the cut, so her file said `2000` where the
       * store rightly carries `£2000`. The mechanism and the working are unchanged; only the
       * number's clothes moved.
       *
       * **IDENTITY ANCHORS ON THE LABEL, AND THE RE-DERIVATION IS CORROBORATED, NEVER ASSUMED.**
       * A declared value matching neither the carrier's current bytes NOR its retained prior names
       * something this carrier has never been, and that refuses — otherwise "re-derive" would mean
       * "believe whichever option the label points at", which is the stretch by another route.
       */
      const opt = j.optionLabel
        ? row.options.find((o) => (o.content as { label?: string }).label === j.optionLabel)
        : row.options.find((o) => valueOf(o) === j.optionValue);
      if (!opt) {
        refuse(`no option on ${j.itemId} answers to ${JSON.stringify(j.optionLabel ?? j.optionValue)}`, { valuesPresentNow: row.options.map(valueOf) });
        continue;
      }
      const current = valueOf(opt);
      const retained = (opt.content as { _previousValue?: string })._previousValue;
      let reDerivation: Record<string, unknown> | null = null;
      if (current !== j.optionValue) {
        if (retained !== j.optionValue) {
          refuse('THE DECLARED VALUE NAMES SOMETHING THIS CARRIER HAS NEVER BEEN — it matches neither the current bytes nor the retained prior. Re-derivation corroborates; it does not believe.', { declared: j.optionValue, currentBytes: current, retainedPrior: retained ?? null });
          continue;
        }
        reDerivation = {
          declared: j.optionValue, reDerivedTo: current,
          corroboratedBy: `the carrier's own retained _previousValue ${JSON.stringify(retained)}, byte-identical to the declaration`,
          why: 'the declaration was born stale — computed from a population snapshot taken before her 180th put the unit on the money options. The mechanism is unchanged; the number keeps its deliberate wrongness with its unit attached (her 192nd).',
        };
      }
      if (opt.isCorrect) { refuse('the named carrier is the KEY. An entry describes an error; a key executes none.'); continue; }
      if (opt.misconceptionId) { refuse(`that option already carries ${opt.misconceptionId} — a second entry on one option is two answers to one question`); continue; }
      if (kind === 'conditional') {
        /**
         * HER 192nd §3: **the antecedent existing at the store is not the antecedent existing at
         * her desk.** The declared gap prose was found — it is the carrier's own working in the
         * crossed bytes — so this is no longer an absent antecedent. It is a READING of two texts
         * against each other, and one of them has never crossed to her. That is not something this
         * store can settle by finding the text; it settles when she has both.
         */
        const prose = carrierWorking(j.itemId, (opt.content as { label?: string }).label ?? j.optionLabel ?? '');
        refuse('CONDITIONAL — the reading waits on bytes, as every reading does (her 192nd).', {
          antecedent: 'the declared gap prose for this option',
          antecedentState: prose.state === 'PRESENT' ? 'PRESENT at this store, ABSENT at her desk' : prose.state,
          THE_PROSE_VERBATIM: prose.verbatim ?? null,
          theEntrysBehaviour: m.behaviour ?? null,
          theReadingRequired: 'whether that prose agrees with the entry — two texts against each other, which is hers and needs both in front of her',
          whatLandsIt: 'the prose crossing verbatim. She rules same-day; the candidate holds its conditional state until then, which costs nothing and asserts nothing.',
        });
        continue;
      }

      /**
       * R881 — THE CARRIER'S OWN WORKING, READ FROM THE AUTHORING STORE'S CROSSED BYTES.
       * The sender's working is recorded as provenance and is NEVER the evidence: when one party
       * names the entry, names the carrier and supplies the account of how that carrier executes
       * it, the working is the same claim restated in arithmetic (R879).
       */
      const own = carrierWorking(j.itemId, (opt.content as { label?: string }).label ?? j.optionLabel ?? '');
      if (own.state === 'ABSENT') {
        refuse('NO CARRIER EVIDENCE HAS CROSSED. The carrier states no working of its own in any crossed artefact.', { theSendersWorking: j.working ?? null, andWHYTHATISNOTENOUGH: 'a working supplied by the party naming the entry is not the carrier\'s own evidence (R879).' });
        continue;
      }
      if (own.state === 'DISAGREE') {
        refuse('THE CROSSED COPIES DISAGREE about this carrier\'s working. Nothing here picks between them.', { readings: own.readings, copiesHoldingTheCarrier: own.copiesHoldingTheCarrier });
        continue;
      }
      const stemText = String((row.stem as { text?: unknown })?.text ?? '');
      const check = determines(own.verbatim as string, current, stemText);
      if (!check.determines) {
        refuse(check.act === null
          ? 'THE CARRIER\'S OWN WORKING DETERMINES NOTHING — it is gesture. The condition asks that a stated act, run on the item\'s own material, produce exactly this value and no other (her 192nd).'
          : `THE ${String(check.act).toUpperCase()} THE CARRIER STATES DOES NOT PRODUCE THIS OPTION. The entry waits for its true carrier.`, {
          detail: check.detail,
          actRecognised: check.act ?? 'none — the working is GESTURE',
          materialItRanOn: check.material,
          THE_CARRIERS_OWN_WORKING: own.verbatim,
          copiesAgreeing: own.copiesHoldingTheCarrier,
          theSendersWorking: j.working,
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
            method: `entry ${m.id} joined to its DECLARED carrier by ${check.act}; ${check.detail}${reDerivation ? `; declared value ${JSON.stringify(j.optionValue)} RE-DERIVED to ${JSON.stringify(current)} against the carrier's current bytes, corroborated by its retained prior (her 192nd)` : ''}`,
            note: 'the join refuses rather than stretches — positively verified by executing the act the CARRIER states, over the item\'s own material, not merely uncontradicted',
          } });
        });
      }
      joinResults.push({ ...base, outcome: APPLY ? 'JOINED' : 'WOULD JOIN', THE_CARRIERS_OWN_WORKING: own.verbatim, copiesAgreeing: own.copiesHoldingTheCarrier, verification: check.detail, actRecognised: check.act, materialItRanOn: check.material, produced: check.produced, ...(reDerivation ? { THE_DECLARED_VALUE_RE_DERIVED: reDerivation } : {}), theSendersWorking: j.working ?? null, andWHOSEEVIDENCECOUNTED: 'the carrier\'s, from crossed bytes. The sender\'s is recorded and was not used (R879/R881).' });
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
    THE_RULING_ENFORCED: 'the join refuses rather than stretches. The condition tests DETERMINATION, not arithmetic (her 192nd): the stated act, run on the item\'s own material, produces exactly this value and no other. Selection and ordering determine; gesture does not.',
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
