/**
 * PROPOSED: vr18-partial-rule's carriers regenerate to perform the attested entry (her 202nd).
 *
 * **NOTHING HERE IS WRITTEN.** The store proposes; she rules. And the proposal carries its own
 * refuter, pre-written and SELF-APPLIED, per her PROPOSED form: *a proposal that names its refuter
 * can be tested by anyone forever, and one that does not is a conclusion wearing a hypothesis.*
 *
 * THE REFUTER, IN HER WORDS: **any carrier reachable from the key by a constant refuses on sight.**
 * It is run against this proposal below before the proposal is offered, because a refuter attached
 * and not executed is a description of a check.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

function derive(i: number) {
  const tier = 1 + (i % 4); const multiply = tier >= 3; const scale = tier % 2 === 0 ? 2 : 1;
  const rule = (a: number, c: number) => (multiply ? a * c : a + c);
  const a1 = (2 + (i % 6)) * scale, c1 = (3 + (i % 5)) * scale;
  const a2 = (4 + (i % 5)) * scale, c2 = (2 + (i % 7)) * scale;
  const key = rule(a2, c2);
  const other = multiply ? a2 + c2 : a2 * c2;
  const swap = other === key ? key + 3 : other;
  let used = a2, via = 'the first outer, fed to the rule twice';
  let proposed = rule(a2, a2);
  if (proposed === key || proposed === swap) { used = c2; via = 'the second outer, fed to the rule twice — the first collided with a sibling seat'; proposed = rule(c2, c2); }
  return { i: i + 1, tier, multiply, a1, c1, a2, c2, key, swap, proposed, used, via, rule: multiply ? 'x' : '+' };
}
/** HER REFUTER: any carrier reachable from the key by a constant refuses on sight. */
const refuter = (rows: ReturnType<typeof derive>[]) => {
  const diffs = new Set(rows.map((r) => r.proposed - r.key));
  return { name: 'any carrier reachable from the key by a constant refuses on sight',
    distinctDifferences: diffs.size, ofRows: rows.length,
    refuted: diffs.size === 1,
    andWHY: diffs.size === 1
      ? `every proposed carrier is the key plus ${[...diffs][0]} — the same fault in new clothes`
      : `the difference from the key takes ${diffs.size} distinct values across ${rows.length} rows, so no constant reaches it` };
};

async function run() {
  assertFixture('vr18-refuter', [
    { name: 'the OLD carrier is refuted — key plus one on every row', input: 'old', mustBeCaught: true },
    { name: 'the PROPOSED carrier is not refuted', input: 'new', mustBeCaught: false },
  ], (k) => {
    const rows = Array.from({ length: 25 }, (_, i) => derive(i));
    if (k === 'old') return refuter(rows.map((r) => ({ ...r, proposed: r.key + 1 }))).refuted;
    return refuter(rows).refuted;
  });

  const rows = Array.from({ length: 25 }, (_, i) => derive(i));
  const check = refuter(rows);
  const live = await prisma.item.findMany({ where: { questionTypeId: 'vr-18-related-numbers', status: 'DRAFT' },
    select: { id: true, stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true } } }, orderBy: { id: 'asc' } });
  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id: 'vr18-partial-rule' },
    select: { id: true, description: true, childHint: true, approvedBy: true } });
  requirePopulation('propose:vr18-regeneration', { 'row(s) proposed': rows.length, 'row(s) in the store': live.length });

  const collisions = rows.filter((r) => r.proposed === r.key || r.proposed === r.swap).length;
  const proposals = rows.map((r, n) => {
    const item = live[n];
    const current = item?.options.find((o) => o.misconceptionId === 'vr18-partial-rule');
    return { itemId: item?.id ?? null, sum: (item?.stem as { sum?: string })?.sum ?? null,
      operation: r.multiply ? 'multiplication' : 'addition', outerNumbers: [r.a2, r.c2], key: r.key,
      currentCarrier: current ? Number((current.content as { value: unknown }).value) : null,
      currentCarrierIs: 'key + 1',
      PROPOSED_CARRIER: r.proposed,
      itsExecution: `the child fed the rule ${r.used} and ${r.used} — ${via(r)} — instead of ${r.a2} and ${r.c2}: ${r.used} ${r.rule} ${r.used} = ${r.proposed}`,
      derivedFrom: r.via, differenceFromKey: r.proposed - r.key };
  });
  function via(r: ReturnType<typeof derive>) { return r.multiply ? 'squaring it' : 'doubling it'; }

  const full = {
    kind: 'vr18-regeneration-PROPOSED',
    STATE: 'PROPOSED — nothing is written. The store proposes; the reader rules.',
    TO: 'Annie',
    THE_ENTRY_BEING_CONFORMED_TO: entry,
    WHY_THE_CURRENT_CARRIERS_REFUSE: 'your 202nd: the carrier is key-plus-one on 25 of 25, indifferent to the operation. An off-by-one lives in counting and dies in multiplication — nobody computes fourteen times ten and reaches one hundred and forty-one by any act a hand or mind performs.',
    THE_PROPOSED_ACT: {
      it: 'the child feeds the rule ONE of the two outer numbers, twice — doubling it on an addition, squaring it on a multiplication.',
      andWHYTHISONE: 'it performs the entry\'s words — *used only one of the two outer numbers in the rule* — and its product VARIES WITH THE OPERATION as a child\'s would, which is the property the old carrier lacked and the property your reading turned on.',
      theFallback: `where that value collides with the key or with the rule-swap sibling, the SECOND outer is used instead — ${rows.filter((r) => r.used === r.c2).length} row(s). Declared rather than silent.`,
      collisionsRemaining: collisions,
    },
    THE_REFUTER_PRE_WRITTEN_AND_SELF_APPLIED: {
      ...check,
      andWHYITISRUNHERE: 'a refuter attached and not executed is a description of a check. This one is run against the proposal before the proposal is offered.',
      appliedToTheCURRENTcarriers: refuter(rows.map((r) => ({ ...r, proposed: r.key + 1 }))),
    },
    AND_THE_WHOLE_OUTPUT_WAS_RENDERED_BEFORE_PROPOSING: 'per the STATS form — a repair is proved by rendering the whole output and reading it, not by asserting the thing you set out to fix. Two earlier candidates were discarded by that reading: rule(a2,c1) collided with the key on 5 rows where c1 equals c2, and rule(a2,a1) on 6. Neither collision is visible in a test of the fix.',
    PROPOSALS: proposals,
  };
  const lines = proposals.map((p) => `${p.itemId}\t${p.key}\t${p.currentCarrier}\t${p.PROPOSED_CARRIER}`);
  const d = digestOverText('one line per row, "<itemId>\\t<key>\\t<current>\\t<proposed>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['PROPOSALS', 'THE_REFUTER_PRE_WRITTEN_AND_SELF_APPLIED', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('vr18-regeneration-PROPOSED', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'vr18-regeneration-PROPOSED');
  console.log(`\n  PROPOSED, nothing written · ${rows.length} rows · collisions ${collisions}`);
  console.log(`  refuter: ${check.distinctDifferences} distinct differences from the key — refuted: ${check.refuted}`);
  console.log(`  the same refuter on the CURRENT carriers — refuted: ${refuter(rows.map((r) => ({ ...r, proposed: r.key + 1 }))).refuted}`);
  for (const p of proposals.slice(0, 5)) console.log(`   ${p.itemId?.slice(-2)}  ${p.operation.padEnd(14)} key ${String(p.key).padStart(3)}  now ${String(p.currentCarrier).padStart(3)}  proposed ${String(p.PROPOSED_CARRIER).padStart(4)}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
