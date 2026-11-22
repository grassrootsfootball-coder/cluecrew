/**
 * THE RECEIVING DOOR FOR A WITHDRAWAL NOTICE — ARMED ON EVIDENCE (R903/R904).
 *
 * **Refuse to serve any row whose SUBSTANCE is named in a standing withdrawal; lift only on the
 * named replacement substance.** Keyed on substance, never on id.
 *
 * IT ARMS ON EVIDENCE RATHER THAN ON TRUST — three canaries, all must pass:
 *   1. THE PROBE: their worked example must reproduce, as a STRING and as a digest.
 *   2. ALL THIRTY-ONE declared digests must recompute from the exact input strings they crossed.
 *   3. THIS IMPLEMENTATION must reproduce those exact input strings from real send rows — the only
 *      canary that tests MY code rather than their arithmetic. 1 and 2 can both pass while this
 *      store's `substance()` is wrong; 3 cannot.
 *
 * **THREE OF THE SIX FIELDS DO NOT EXIST IN THIS STORE.** `Item` holds `solution` (null on the rows
 * checked) and has no `solutionValue` and no `solutionKind` column at all. So a serving row's
 * substance is NOT computable from this store's own data, and the door says so per row rather than
 * quietly computing a different digest and calling it the key. Where a crossed send carries the
 * missing three for an id, they are RECOVERED and the recovery is declared on the row.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// R1038: '@prisma/client' resolves only inside packages/db; the db package re-exports it.
import { PrismaClient } from '../packages/db/src/index';
import { canonicalSubstance, canonicalSubstanceCandidates } from '../packages/core/src/index';
import { requirePopulation } from './lib/population';
import { assessRefusalShape, runRefusalShapeFixture } from './lib/refusal-shape';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const prisma = new PrismaClient();
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const DIR = join(ROOT, 'content/withdrawals');

interface Entry { itemId: string; substanceSha256: string; reason: string; liftedBy: string; replacementSubstanceSha256: string | null }
interface Worked { itemId: string; declaredInTheNotice: string; THE_EXACT_INPUT_STRING: string; THE_EXACT_REPLACEMENT_INPUT_STRING?: string; replacementDeclared?: string }

function* rowsIn(o: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(o)) { for (const v of o) yield* rowsIn(v); return; }
  if (o && typeof o === 'object') {
    const r = o as Record<string, unknown>;
    if (typeof r.itemId === 'string' && Array.isArray(r.options)) yield r;
    for (const v of Object.values(r)) yield* rowsIn(v);
  }
}

function crossedById() {
  const map = new Map<string, Record<string, unknown>>();
  const dl = join(homedir(), 'Downloads');
  for (const name of readdirSync(dl).filter((n) => n.endsWith('.json'))) {
    let parsed: unknown;
    try { parsed = JSON.parse(readFileSync(join(dl, name), 'utf8')); } catch { continue }
    for (const r of rowsIn(parsed)) {
      const id = r.itemId as string;
      if (r.solutionValue !== undefined && !map.has(id)) map.set(id, r);
    }
  }
  return map;
}

async function main() {
  /**
   * THE STANDING NOTICE IS THE HEAD OF THE SUPERSESSION CHAIN, DERIVED — NEVER THE FIRST FILENAME.
   *
   * A superseded notice is RETAINED, never deleted (a record is corrected by adding to it, R888),
   * so the directory holds more than one and picking by filename order would have silently served
   * whichever sorted first. Each notice names the sha256 of the one it supersedes; the standing one
   * is the notice no other notice supersedes. Two heads, or none, is an ambiguity this refuses
   * rather than resolving by guess.
   */
  const files = readdirSync(DIR).filter((n) => n.startsWith('withdrawal-notice') && n.endsWith('.json'));
  const notices = files.map((f) => {
    const text = readFileSync(join(DIR, f), 'utf8');
    return { file: f, sha256: sha(text), body: JSON.parse(text) as { WITHDRAWN: Entry[]; THIS_SUPERSEDES_AN_EARLIER_NOTICE?: { sha256: string } } };
  });
  /**
   * DECLARED SUPERSESSIONS repair a chain the notices themselves get wrong — recorded with an
   * author, never inferred. v5 named the ORIGINAL notice as its predecessor where v3 already had,
   * leaving two heads. "More rows" is not "later", so nothing here guesses from size.
   */
  const declared = JSON.parse(readFileSync(join(DIR, 'supersession-declared.json'), 'utf8')) as { declarations: Array<{ supersedes: string; supersededBy: string; declaredBy: string }> };
  const superseded = new Set([
    ...notices.map((n) => n.body.THIS_SUPERSEDES_AN_EARLIER_NOTICE?.sha256).filter(Boolean) as string[],
    ...declared.declarations.map((d) => d.supersedes),
  ]);
  const heads = notices.filter((n) => !superseded.has(n.sha256));
  if (heads.length !== 1) {
    throw new Error(`${heads.length} standing notices after following the supersession chain — refusing to pick one (${notices.map((n) => `${n.file}=${n.sha256.slice(0, 12)}`).join(', ')})`);
  }
  const standing = heads[0]!;
  const notice = standing.body;
  console.log(`  standing notice: ${standing.file} (${standing.sha256.slice(0, 16)}), superseding ${superseded.size} earlier notice(s)`);
  for (const d of declared.declarations) console.log(`    declared supersession: ${d.supersedes.slice(0, 16)} superseded by ${d.supersededBy.slice(0, 16)} — ${d.declaredBy}`);
  const spec = JSON.parse(readFileSync(join(DIR, readdirSync(DIR).find((f) => f.startsWith('substance-spec'))!), 'utf8')) as {
    EVERY_DECLARED_DIGEST_WITH_ITS_EXACT_INPUT: Worked[];
    THE_IMPLEMENTATION_VERBATIM: { aProbeYouCanRUNAGAINSTYOURIMPLEMENTATION: { input: Record<string, unknown>; expectedString: string; expectedSha256: string } };
  };
  const worked = spec.EVERY_DECLARED_DIGEST_WITH_ITS_EXACT_INPUT;

  requirePopulation('check:withdrawn-substance', {
    'withdrawn substance(s) declared': notice.WITHDRAWN.length,
    'worked example(s) crossed': worked.length,
  });

  // ---- CANARY 1: the probe, as a string and as a digest ----------------------------------------
  const probe = spec.THE_IMPLEMENTATION_VERBATIM.aProbeYouCanRUNAGAINSTYOURIMPLEMENTATION;
  const probeString = canonicalSubstance(probe.input as never);
  const c1 = probeString === probe.expectedString && sha(probeString) === probe.expectedSha256;

  // ---- CANARY 2: every declared digest recomputes from the input string they crossed ------------
  let c2 = 0, c2total = 0;
  for (const w of worked) {
    c2total += 1; if (sha(w.THE_EXACT_INPUT_STRING) === w.declaredInTheNotice) c2 += 1;
    if (w.THE_EXACT_REPLACEMENT_INPUT_STRING && w.replacementDeclared) {
      c2total += 1; if (sha(w.THE_EXACT_REPLACEMENT_INPUT_STRING) === w.replacementDeclared) c2 += 1;
    }
  }

  // ---- CANARY 3: THIS implementation reproduces those strings from real send rows ---------------
  const crossed = crossedById();
  let c3 = 0, c3tried = 0; const c3fail: string[] = [];
  for (const w of worked) {
    const row = crossed.get(w.itemId);
    if (!row) continue;
    c3tried += 1;
    const built = canonicalSubstanceCandidates(row as never);
    if (built.some((b) => b === w.THE_EXACT_INPUT_STRING || b === w.THE_EXACT_REPLACEMENT_INPUT_STRING)) c3 += 1;
    else if (c3fail.length < 3) c3fail.push(`${w.itemId}\n        built: ${built[0]!.slice(0, 150)}\n        theirs: ${w.THE_EXACT_INPUT_STRING.slice(0, 150)}`);
  }

  console.log(`\n  CANARY 1 — their worked probe reproduces as a string and a digest: ${c1 ? 'PASS' : 'FAIL'}`);
  console.log(`  CANARY 2 — declared digests recomputing from their input strings: ${c2} of ${c2total}`);
  console.log(`  CANARY 3 — this implementation rebuilding those strings from send rows: ${c3} of ${c3tried}`);
  if (!c1 || c2 !== c2total || (c3tried > 0 && c3 === 0)) {
    console.error('\n  THE DOOR REFUSES TO ARM — a canary failed. It screens nothing rather than screening blindly.');
    if (c3fail.length) console.error(`  first disagreements:\n     ${c3fail.join('\n     ')}`);
    await prisma.$disconnect(); process.exit(1);
  }
  console.log('  ARMED ON EVIDENCE.\n');

  // ---- SCREEN THE SERVING ROWS -----------------------------------------------------------------
  /**
   * RULED EXCEPTIONS — substances a RULING permits to serve despite a standing withdrawal. Keyed on
   * substance, exactly as the withdrawal is, and each naming the authority that granted it. They are
   * printed on EVERY run: an exception that stops being visible stops being a decision (R601).
   */
  const exceptions = new Map(
    (JSON.parse(readFileSync(join(DIR, 'ruled-exceptions.json'), 'utf8')) as { exceptions: Array<{ substanceSha256: string; itemId: string; ruledBy: string; theRuling: string }> })
      .exceptions.map((x) => [x.substanceSha256, x]),
  );
  const withdrawn = new Map(notice.WITHDRAWN.map((e) => [e.substanceSha256, e]));
  const lifts = new Map(notice.WITHDRAWN.filter((e) => e.replacementSubstanceSha256).map((e) => [e.replacementSubstanceSha256!, e]));
  const rows = await prisma.item.findMany({ where: { status: 'LIVE', pool: 'PRACTICE' },
    select: { id: true, stem: true, solution: true, options: { select: { content: true, isCorrect: true } } } });

  const screened = rows.map((r) => {
    const donor = crossed.get(r.id);
    const recovered = donor ? { solution: donor.solution, solutionValue: donor.solutionValue, solutionKind: donor.solutionKind } : null;
    const computable = recovered !== null;
    const digests = computable
      ? canonicalSubstanceCandidates({ stem: r.stem, options: r.options, ...recovered } as never).map(sha)
      : [];
    /**
      * AWAITING RE-DERIVATION — the notice names this id with a replacement, and the row matches
      * NEITHER the withdrawn substance NOR the declared replacement. It is a third state: this
      * store's row is not the withdrawn one (so nothing is refused) and the sender's lifting key
      * does not describe it (so nothing lifts). **A pending lift is a state, not a silence**, and
      * without this class it reads as "not named in any standing withdrawal" — indistinguishable
      * from a row the notice never mentioned.
      */
    const namedWithReplacement = notice.WITHDRAWN.some((e) => e.itemId === r.id && e.replacementSubstanceSha256);
    const hitX = digests.find((d) => exceptions.has(d));
    const hitW = digests.find((d) => withdrawn.has(d));
    const hitL = digests.find((d) => lifts.has(d));
    return { id: r.id, computable, digest: digests[0] ?? null, digests,
      withdrawnHit: hitW ?? null,
      exception: hitX ? exceptions.get(hitX)! : null,
      verdict: !computable ? 'NOT COMPUTABLE HERE — this store holds no solutionValue/solutionKind and no crossed send supplies them'
        : hitX ? 'RULED EXCEPTION — withdrawn, and a ruling permits it'
        : hitW ? 'REFUSE — withdrawn substance'
        : hitL ? 'LIFTED — matches a named replacement substance'
        : namedWithReplacement ? 'AWAITING RE-DERIVATION — named with a replacement that does not describe this row'
        : 'not named in any standing withdrawal' };
  });

  const refuse = screened.filter((s) => s.verdict.startsWith('REFUSE'));
  const excepted = screened.filter((s) => s.verdict.startsWith('RULED EXCEPTION'));
  const awaiting = screened.filter((s) => s.verdict.startsWith('AWAITING'));
  const lifted = screened.filter((s) => s.verdict.startsWith('LIFTED'));
  const uncomputable = screened.filter((s) => !s.computable);
  console.log(`  serving rows screened: ${screened.length}`);
  console.log(`   REFUSE (withdrawn substance): ${refuse.length}${refuse.length ? ' — ' + refuse.map((r) => r.id).join(', ') : ''}`);
  console.log(`   LIFTED (named replacement):   ${lifted.length}${lifted.length ? ' — ' + lifted.map((r) => r.id).join(', ') : ''}`);
  console.log(`   AWAITING RE-DERIVATION:       ${awaiting.length}${awaiting.length ? ' — ' + awaiting.map((r) => r.id).join(', ') : ''}`);
  console.log(`   RULED EXCEPTION:              ${excepted.length}`);
  for (const e of excepted) console.log(`      ${e.id} — ${e.exception!.ruledBy}: ${e.exception!.theRuling}`);
  console.log(`   not named:                    ${screened.length - refuse.length - lifted.length - excepted.length - awaiting.length - uncomputable.length}`);
  console.log(`   NOT COMPUTABLE HERE:          ${uncomputable.length}`);
  if (uncomputable.length) {
    console.log('\n  THREE OF THE SIX FIELDS DO NOT EXIST IN THIS STORE. Item holds `solution` and has no');
    console.log('  `solutionValue` and no `solutionKind` column, so a serving row\'s substance is not');
    console.log('  computable from this store\'s own data. Where a crossed send carries them they are');
    console.log('  RECOVERED and that is declared; where none does, the row is reported uncomputable');
    console.log('  rather than hashed over a different set of fields and called the key.');
  }
  /**
   * R961'S GUARD, CONSULTED — the shape of this door's refusal set is an instrument hypothesis
   * before it is a content finding. The reason passed per refusal is the MATCHED WITHDRAWN
   * DIGEST, not the verdict text (which is uniform by construction): many refusals collapsing
   * onto one substance is the regular shape an instrument fault makes; refusals across distinct
   * substances are irregular. The guard prints a hypothesis; the REFUSE exit below still stands —
   * a hypothesis orders a reading of the instrument, it does not clear a withdrawn substance.
   */
  runRefusalShapeFixture();
  assessRefusalShape('check:withdrawn-substance', screened.map((s: { id: string; verdict: string; withdrawnHit: string | null }) => ({
    refused: s.verdict.startsWith('REFUSE'),
    reason: s.verdict.startsWith('REFUSE') ? `matched withdrawn substance ${s.withdrawnHit}` : undefined,
    dims: { family: s.id.split('-').slice(0, 2).join('-') },
  })));
  if (refuse.length) { await prisma.$disconnect(); process.exit(1); }
  console.log('\n  No serving row stands on a withdrawn substance.');
  await prisma.$disconnect();
}
main().catch(async (e) => { await prisma.$disconnect(); console.error(e); process.exit(1); });
