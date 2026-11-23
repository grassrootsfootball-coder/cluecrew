/**
 * LAND THE NINE MINT EXECUTIONS — converting a single-holder file into a row in a database.
 *
 * **They are PROVISIONAL and their condition is explicit**: *authored against the projection and not
 * against the population... IF THE REISSUED BYTES DIFFER FROM THIS PROJECTION IN ANY OF THE NINE
 * ROWS, THESE EXECUTIONS ARE REFUSED AND RE-AUTHORED, NOT PATCHED.*
 *
 * So the projection's nine declared changes are verified against these rows FIRST, per row, and any
 * difference refuses the whole run. **The condition names the nine rows, so the nine rows are what
 * is checked** — not a digest this store cannot reproduce without the projection's row shape, and
 * not a sample.
 *
 * The executions are the authoring store's authored prose. This store does not edit them: they land
 * verbatim or not at all.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const SRC = pjoin(homedir(), 'Downloads/HER200thAPPLIEDANDTHEREPAIRPROVEDe3ee8202a008.json');
const SRC_SHA = 'e3ee8202a008d6706ecd2bf7';
const MINT = 'vr02-answered-the-opposite';

interface Change { itemId: string; act: 'TAG' | 'RE-AUTHOR'; value?: string[]; from?: string[]; to: string[] | string; tag?: string }
interface Exec { itemId: string; optionValue: string[]; EXECUTION: string; theGroupsRule?: string; theAttraction?: string }

async function run() {
  const bytes = readFileSync(SRC, 'utf8');
  if (!sha(bytes).startsWith(SRC_SHA)) throw new Error(`the source artefact does not hash to ${SRC_SHA}… — refusing`);
  const doc = JSON.parse(bytes) as {
    THREE_THE_PROJECTION_AND_WHAT_IT_IS_NOT: { projectionDigest: string; changes: Change[] };
    FIVE_THE_NINE_MINT_EXECUTIONS: { THE_EXECUTIONS: Exec[]; PROVISIONAL: string; whoAuthoredWhat: string };
  };
  const { projectionDigest, changes } = doc.THREE_THE_PROJECTION_AND_WHAT_IT_IS_NOT;
  const execs = doc.FIVE_THE_NINE_MINT_EXECUTIONS.THE_EXECUTIONS;

  assertFixture('projection-match', [
    { name: 'a matching pair and tag satisfies a TAG change', input: JSON.stringify([['duck', 'crow'], ['duck', 'crow'], MINT]), mustBeCaught: true },
    { name: 'the right pair with the WRONG tag does not', input: JSON.stringify([['duck', 'crow'], ['duck', 'crow'], 'vr02-partial-group']), mustBeCaught: false },
    { name: 'a different pair does not', input: JSON.stringify([['duck', 'crow'], ['cow', 'hen'], MINT]), mustBeCaught: false },
  ], (raw) => { const [want, got, tag] = JSON.parse(raw) as [string[], string[], string]; return canonicalJson(want) === canonicalJson(got) && tag === MINT; });

  requirePopulation('land:nine-mint-executions', { 'declared change(s) in the projection': changes.length, 'execution(s)': execs.length });

  // ---- THE CONDITION: the nine rows must not differ from the projection -------------------------
  const checks: Array<{ itemId: string; act: Change['act']; projectionExpects: string[];
    thisRowHasThatOption: boolean; itsTag: string | null; tagMatches: boolean;
    displacedPairHasVacated: boolean; executionAlreadyPresent: boolean;
    optionId: string | null; agrees: boolean }> = [];
  for (const c of changes) {
    const row = await prisma.item.findUnique({ where: { id: c.itemId },
      select: { options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
    const want = (c.act === 'TAG' ? c.value : c.to) as string[];
    const opt = row?.options.find((o) => canonicalJson((o.content as { value: unknown }).value) === canonicalJson(want));
    const displacedGone = c.act !== 'RE-AUTHOR' || !row?.options.some((o) => canonicalJson((o.content as { value: unknown }).value) === canonicalJson(c.from));
    checks.push({ itemId: c.itemId, act: c.act, projectionExpects: want,
      thisRowHasThatOption: !!opt, itsTag: opt?.misconceptionId ?? null, tagMatches: opt?.misconceptionId === MINT,
      displacedPairHasVacated: displacedGone, executionAlreadyPresent: !!opt?.misconceptionExecution,
      optionId: opt?.id ?? null,
      agrees: !!opt && opt.misconceptionId === MINT && displacedGone });
  }
  const differing = checks.filter((c) => !c.agrees);

  const plan = execs.map((e) => {
    const c = checks.find((x) => x.itemId === e.itemId && canonicalJson(x.projectionExpects) === canonicalJson(e.optionValue));
    return { ...e, optionId: c?.optionId ?? null, matched: !!c?.agrees, alreadyPresent: c?.executionAlreadyPresent ?? false };
  });
  const unmatched = plan.filter((p) => !p.matched || !p.optionId);

  const refusals = [
    ...differing.map((d) => `${d.itemId}: the row differs from the projection — option present ${d.thisRowHasThatOption}, tag ${d.itsTag}, displaced pair vacated ${d.displacedPairHasVacated}`),
    ...unmatched.map((u) => `${u.itemId}: the execution's option ${canonicalJson(u.optionValue)} did not resolve to a verified seat`),
  ];

  if (refusals.length === 0 && APPLY) {
    await prisma.$transaction(async (tx) => {
      for (const e of plan) {
        await tx.itemOption.update({ where: { id: e.optionId! }, data: { misconceptionExecution: e.EXECUTION } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: e.itemId, action: 'AMENDED',
          reviewerId: null, actor: 'Cowork (authored execution)', recordedBy: 'human:david',
          field: 'options[].misconceptionExecution', subjectHash: sha(e.EXECUTION),
          method: `the mint execution for ${MINT} on option ${canonicalJson(e.optionValue)}, landed VERBATIM from the crossed artefact ${SRC_SHA}…, whose nine declared changes were verified against this row first (its own condition: differ in any of the nine and the executions are refused, not patched).`,
          note: 'the authoring store\'s disk was reclaimed and these executions had ONE holder — a file on a desk. Landing them puts them in a database with a migration history. They are authored prose and are not re-derivable (R922), so this store did not edit a character.' } });
      }
    });
  }

  const after = await prisma.itemOption.count({ where: { misconceptionId: MINT, misconceptionExecution: { not: null } } });
  const full = {
    kind: 'nine-mint-executions-landed', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    outcome: refusals.length ? 'REFUSED' : (APPLY ? 'LANDED' : 'WOULD LAND'), refusals,
    source: { artefact: 'HER200thAPPLIEDANDTHEREPAIRPROVEDe3ee8202a008.json', sha256: sha(bytes), projectionDigest },
    THEIR_CONDITION_VERBATIM: doc.FIVE_THE_NINE_MINT_EXECUTIONS.PROVISIONAL,
    HOW_IT_WAS_CHECKED: 'the projection declares nine changes; each was verified against this store\'s row — the option exists with the projected value, carries the mint, and for a RE-AUTHOR the displaced pair has vacated. The condition names the nine rows, so the nine rows are what is checked.',
    perRow: checks,
    whoAuthoredWhat: doc.FIVE_THE_NINE_MINT_EXECUTIONS.whoAuthoredWhat,
    LANDED_VERBATIM: 'this store did not edit a character. The executions are the authoring store\'s authored prose and are not re-derivable.',
    executionsNowOnTheMint: after,
  };
  const lines = plan.map((p) => `${p.itemId}\t${canonicalJson(p.optionValue)}\t${sha(p.EXECUTION).slice(0, 16)}`);
  const d = digestOverText('one line per execution, "<itemId>\\t<optionValue>\\t<sha256 of the execution>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['perRow', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY && !refusals.length ? 'nine-mint-executions-landed' : 'nine-mint-executions-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${full.outcome}${refusals.length ? ':\n   ' + refusals.join('\n   ') : ''}`);
  console.log(`  projection rows agreeing: ${checks.filter((c) => c.agrees).length} of ${checks.length}`);
  console.log(`  executions now on ${MINT}: ${after}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
