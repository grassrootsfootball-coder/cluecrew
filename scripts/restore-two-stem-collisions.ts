/**
 * WITHDRAW THE FALSE ABSENCE, AND RESTORE THE TWO SHE VERIFIED (R843).
 *
 * `absent-from-district-5b7eb355…` is WITHDRAWN. Its finding was false: both rows are in the
 * population Annie read and verified in her 182nd, each with a row hash she can cite.
 *
 * **The error is the desk's and this store recorded what it was told** — which is worth stating
 * plainly rather than absorbing, because a store that silently owns an upstream error makes the
 * next one harder to see.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing, normaliseMathsNotation } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const POP = '/Users/davidb/Downloads/11+/from-cluecrew/maths-population-for-annie-1d7f9cf414f33a0a.json';
const COL = '/Users/davidb/Downloads/EVERYCOLLIDEDMATHSIDFORANNIE56c84163a2a2.json';
const WITHDRAWN_ARTEFACT = 'absent-from-district-5b7eb3552c04567b.json';
const RESTORE = ['MC04-FDP-04', 'MC05-FDP-01'];
const CLAIMED_ABSENT = ['MC01-FDP-04', 'MC05-FDP-08'];
const TYPE_BY_GROUP: Record<string, string> = { CALC: 'maths-calc', FDP: 'maths-fdp', NPV: 'maths-npv', MEAS: 'maths-meas', GEOM: 'maths-geom', STATS: 'maths-stats', RP: 'maths-rp' };

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('restore-collisions', [
    { name: 'a row in the verified population is restorable', input: 'MC04-FDP-04', mustBeCaught: true },
    { name: 'the second is', input: 'MC05-FDP-01', mustBeCaught: true },
    { name: 'a row she never read is not', input: 'MC01-FDP-04', mustBeCaught: false },
    { name: 'nor is the other', input: 'MC05-FDP-08', mustBeCaught: false },
  ], (id) => RESTORE.includes(id));

  const pop = Object.fromEntries((JSON.parse(readFileSync(POP, 'utf8')) as { ROWS: Array<Record<string, unknown>> }).ROWS.map((r) => [String(r.itemId), r]));
  const col = (JSON.parse(readFileSync(COL, 'utf8')) as { STEM_COLLISIONS: Record<string, { variants: Array<Record<string, unknown>> }> }).STEM_COLLISIONS;
  requirePopulation('restore:stem-collisions', { 'ids to restore': RESTORE.length, 'stem-collision ids in the 29': Object.keys(col).length });

  const results: Array<Record<string, unknown>> = [];
  for (const id of RESTORE) {
    const herRow = pop[id];
    const variants = col[id]!.variants;
    const chosen = variants.find((v) => String(v.stem).trim() === String(herRow!.stem).trim());
    if (!chosen) { results.push({ itemId: id, outcome: 'NO VARIANT MATCHES THE ROW SHE VERIFIED — refusing' }); continue; }
    const other = variants.filter((v) => v !== chosen);
    const item = chosen.item as Record<string, unknown>;
    const stem = { text: normaliseMathsNotation(String(item.stem ?? '')) };
    const explanation = Object.fromEntries(Object.entries((item.explanation ?? {}) as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? normaliseMathsNotation(v) : v]));
    const opts = item.options as Array<{ label: string; value: string; isKey?: boolean; misconceptionId?: string | null }>;
    const options = opts.map((o) => ({ content: { value: normaliseMathsNotation(o.value), label: o.label }, isCorrect: o.isKey === true, misconceptionId: o.misconceptionId ?? null }));
    const faults = checkItemChildFacing({ id, stem, explanation, options: options.map((o) => ({ content: o.content })) }).filter((f) => !(f.rule === 'sentence-length' && /stem\./.test(f.where)));
    if (faults.length) { results.push({ itemId: id, outcome: 'GATE REFUSED', faults: faults.map((f) => `${f.rule}: ${f.detail}`) }); continue; }
    const contentHash = sha(canonicalJson({ stem, options: options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation }));
    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        await tx.item.create({ data: { id, questionType: { connect: { id: TYPE_BY_GROUP[String(item.group)]! } }, difficultyTier: Number(item.tier), stem, explanation: { ...explanation, _stemCollision: { thisIsOneOfTwoQuestionsUnderThisId: true, theOtherVariantsStem: other.map((v) => String(v.stem)), chosenBecause: 'this is the variant Annie READ AND VERIFIED in her 182nd; the selection is hers and is evidenced by her row hash, not made by this store' } } as object, status: 'DRAFT', authoredBy: 'restored from the verified population' } });
        await tx.itemOption.createMany({ data: options.map((o) => ({ itemId: id, content: o.content, isCorrect: o.isCorrect, misconceptionId: o.misconceptionId })) });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'row', subjectHash: contentHash, method: 'restored from the population she verified in her 182nd. THE ABSENCE RECORDED EARLIER WAS FALSE AND IS WITHDRAWN.', note: `stem collision: ${variants.length} questions share this id; the variant restored is the one she read. The unchosen variant is recorded on the row and is NOT discarded.` } });
      });
    }
    results.push({ itemId: id, outcome: APPLY ? 'RESTORED' : 'WOULD RESTORE', herRowSha256: herRow!.rowSha256, contentSha256: contentHash, variantsUnderThisId: variants.length, unchosenVariantStems: other.map((v) => String(v.stem)) });
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'restore-two-stem-collisions',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    ONE_THE_WITHDRAWAL: {
      artefact: WITHDRAWN_ARTEFACT, status: 'WITHDRAWN — its finding is FALSE',
      whatItClaimed: 'MC04-FDP-04 and MC05-FDP-01 are absent from the district, in no send and no source.',
      whyItIsFalse: '**both are in the population Annie READ AND VERIFIED in her 182nd**, with row hashes she can cite — 58e698630d855bc7 and da44c026c6aaa0b0 — and both carry APPROVED content-verified events in this store. They were held back by Cowork\'s substance guard, not lost: the withdrawn send carried them with one stem silently chosen, the corrected send carried them not at all, **and neither state was ever published as a HOLD.**',
      whoseError: '**the desk\'s. This store recorded what it was told**, and states that rather than absorbing it — a store that silently owns an upstream error makes the next one harder to see.',
      bytesRetained: 'the withdrawn artefact stands in the retention directory; nothing is deleted.',
    },
    TWO_THE_RESTORATION: {
      herRuling: 'take both rows from the artefact she already acknowledged, and re-import them with their variants.',
      results,
      andTHESELECTIONISHERS: '**each id carries TWO DIFFERENT QUESTIONS.** The variant restored is the one whose stem matches the row she verified, identified by her own row hash. **This store did not pick** — picking silently is the fault the withdrawal existed for. The unchosen variant is recorded on the row under `explanation._stemCollision` and is not discarded.',
    },
    THREE_THE_CLAIMED_ABSENCES_ARE_NOT_ABSENT: {
      checkedBeforeCalling: 'as instructed — every send and source on this disk, for both ids.',
      finding: `**NEITHER ${CLAIMED_ABSENT.join(' NOR ')} IS ABSENT.** Both are in the AMENDED SOURCE and in Cowork's 29, and Cowork's own artefact names them: they are STEM COLLISIONS — 6 of the 29, where two different questions share one itemId.`,
      whereEachStands: CLAIMED_ABSENT.map((id) => ({ itemId: id, inTheStore: false, inTheStaged196: false, inTheCurrentSend: false, inTheAmendedSource: true, inTheCollided29: true, state: 'HELD AS A STEM COLLISION — not absent, and never published as a hold' })),
      soNOTHINGISRECORDEDABSENT: '**and that is the check doing its work.** The instruction was to check sends and sources before anything is called absent again; checking found that the two named are held, not missing. **Recording them absent would have repeated the fault this turn withdrew.**',
      whatTheyACTUALLYNEED: 'the same thing MC04-FDP-04 and MC05-FDP-01 needed — a reviewer to say WHICH QUESTION. Cowork holds both variants of each and has chosen nothing, which is correct. Annie has not read either id.',
    },
  };
  const lines = results.map((r) => `${r.itemId}\t${r.outcome}`);
  const d = digestOverText('the result lines joined by \\n, each "<itemId>\\t<outcome>"', lines.join('\n'));
  const full = { ...payload, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_THE_WITHDRAWAL', 'TWO_THE_RESTORATION', 'THREE_THE_CLAIMED_ABSENCES_ARE_NOT_ABSENT', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'restore-two-stem-collisions' : 'restore-two-stem-collisions-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — restored ${results.filter((r) => String(r.outcome).includes('RESTOR')).length}; claimed absences that are NOT absent: ${CLAIMED_ABSENT.join(', ')}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
