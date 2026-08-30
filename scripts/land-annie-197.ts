/**
 * HER 197th: the mint vr02-answered-the-opposite with four carriers, and five to partial-group.
 *
 * **The carriers are matched on OPTION VALUE, not on row index.** She names them by word pair —
 * duck-and-crow, cow-and-hen, walk-and-jump, rock-and-wood — and a landing that resolved those to
 * rows by position would be trusting my ordering to agree with her reading. The pairs are matched
 * against the stored values and any pair that does not resolve to exactly one untagged option
 * refuses the whole run.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkChildFacingText } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const RETURN_SHA = 'aa2a068ec524f07322f0e78b6f77929dd473b4ddd3cb9426ffd759f41576b6f1';

const MINT = {
  id: 'vr02-answered-the-opposite',
  description: 'chooses two words that do go together by the group\'s own rule, answering which two belong instead of which two are odd.',
  childHint: 'Those two do belong together. The question asks for the two that do not.',
};
const TO_MINT = [['duck', 'crow'], ['cow', 'hen'], ['walk', 'jump'], ['rock', 'wood']];
const TO_PARTIAL = [['oval', 'star'], ['hen', 'dog'], ['soft', 'cold'], ['net', 'run'], ['tuna', 'seal']];
const PARTIAL = 'vr02-partial-group';

const pairOf = (c: unknown) => { const v = (c as { value?: unknown }).value; return Array.isArray(v) ? v.map(String) : [String(v)]; };
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

async function run() {
  if (sha(readFileSync('/Users/davidb/Downloads/annie-197-for-code.md', 'utf8')) !== RETURN_SHA) throw new Error('the return does not hash to its declared value — refusing');

  assertFixture('pair-match', [
    { name: 'an exact ordered pair matches', input: JSON.stringify([['duck', 'crow'], ['duck', 'crow']]), mustBeCaught: true },
    { name: 'a REVERSED pair does not match — order is part of the value', input: JSON.stringify([['duck', 'crow'], ['crow', 'duck']]), mustBeCaught: false },
    { name: 'a different pair does not match', input: JSON.stringify([['duck', 'crow'], ['cow', 'hen']]), mustBeCaught: false },
  ], (raw) => { const [a, b] = JSON.parse(raw) as [string[], string[]]; return same(a, b); });

  const gate = checkChildFacingText({ role: 'hint', label: `${MINT.id}.childHint`, text: MINT.childHint });
  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out', status: 'DRAFT' },
    select: { id: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true } } } });

  const resolve = (pair: string[]) => {
    const hits = rows.flatMap((r) => r.options
      .filter((o) => !o.isCorrect && !o.misconceptionId && same(pairOf(o.content), pair))
      .map((o) => ({ itemId: r.id, optionId: o.id, value: pairOf(o.content) })));
    return hits;
  };
  const plan = [
    ...TO_MINT.map((p) => ({ pair: p, tag: MINT.id, hits: resolve(p) })),
    ...TO_PARTIAL.map((p) => ({ pair: p, tag: PARTIAL, hits: resolve(p) })),
  ];
  requirePopulation('land:annie-197', { 'pair(s) she named': plan.length, 'untagged option(s) available': rows.flatMap((r) => r.options.filter((o) => !o.isCorrect && !o.misconceptionId)).length });

  const refusals: string[] = [];
  if (gate.length) refusals.push(`her childHint fails the child-facing gate: ${gate.map((f) => f.message).join(' | ')}`);
  for (const p of plan) if (p.hits.length !== 1) refusals.push(`${JSON.stringify(p.pair)} resolves to ${p.hits.length} untagged options, expected exactly 1`);

  if (refusals.length === 0 && APPLY) {
    await prisma.$transaction(async (tx) => {
      await tx.misconception.upsert({ where: { id: MINT.id },
        create: { id: MINT.id, district: 'VR', description: MINT.description, childHint: MINT.childHint, status: 'ACTIVE',
          approvedBy: 'reviewer:rev-0001', recordedBy: 'human:david', approvalMethod: 'authored verbatim in her 197th',
          textProvenance: { state: 'RECORDED', date: '2026-08-30', text: 'childHint+description',
            authority: `annie-197-for-code.md, sha256 ${RETURN_SHA}`,
            authoredBy: { kind: 'person', name: 'Annie' }, approvedBy: { kind: 'person', name: 'Annie' },
            method: 'minted in her 197th on one act shared by four carriers; id number attaches at the authoring register',
            servingSha256: sha(MINT.childHint) } },
        update: { description: MINT.description, childHint: MINT.childHint } });
      for (const p of plan) {
        await tx.itemOption.update({ where: { id: p.hits[0].optionId }, data: { misconceptionId: p.tag } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: p.hits[0].itemId, action: 'AMENDED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'options[].misconceptionId', returnArtefact: RETURN_SHA,
          method: `her 197th: option ${JSON.stringify(p.pair)} tagged ${p.tag}, matched on option VALUE and not on row position`,
          note: p.tag === MINT.id
            ? 'two group members linked by the group\'s own rule — the child answered which two BELONG instead of which two are odd. Not partial-group (both are members), not surface (no feature), not real-link-wrong-rule (the link IS the rule).'
            : 'one found odd paired with one group member; no look-or-sound pull, and no association surviving the key-sharing test.' } });
      }
    });
  }

  const after = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out', status: 'DRAFT' },
    select: { options: { select: { isCorrect: true, misconceptionId: true } } } });
  const stillUntagged = after.flatMap((r) => r.options.filter((o) => !o.isCorrect && !o.misconceptionId)).length;

  const full = {
    kind: 'annie-197-landing', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    return: 'annie-197-for-code.md', returnSha256: RETURN_SHA,
    returnSha256Spec: 'sha256 over the return file bytes exactly as delivered, unparsed',
    outcome: refusals.length ? 'REFUSED' : (APPLY ? 'LANDED' : 'WOULD LAND'), refusals,
    THE_MINT: { ...MINT, carriers: TO_MINT, childFacingGate: gate.length === 0 ? 'PASSES' : gate.map((f) => f.message) },
    THE_FIVE_TO_PARTIAL_GROUP: TO_PARTIAL,
    MATCHED_ON_VALUE_NOT_POSITION: 'she names the carriers by word pair; each resolved to exactly one untagged option by comparing stored values, and order is part of the value — a reversed pair does not match. Resolving by row index would have trusted my ordering to agree with her reading.',
    resolution: plan.map((p) => ({ pair: p.pair, tag: p.tag, resolvedTo: p.hits.map((h) => h.itemId) })),
    CASE_VR_02_AFTER: { untaggedDistractorsRemaining: stillUntagged,
      contentComplete: stillUntagged === 0,
      hers: 'twenty-five of twenty-five read, every option tagged or minted' },
  };
  const lines = plan.map((p) => `${p.hits[0]?.itemId ?? '?'}\t${JSON.stringify(p.pair)}\t${p.tag}`);
  const d = digestOverText('one line per pair, "<itemId>\\t<pair>\\t<tag>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['THE_MINT', 'resolution', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'annie-197-landing' : 'annie-197-landing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${full.outcome}${refusals.length ? ': ' + refusals.join('; ') : ''}`);
  for (const p of plan) console.log(`   ${JSON.stringify(p.pair).padEnd(20)} -> ${p.tag.padEnd(28)} ${p.hits.map((h) => h.itemId).join(', ')}`);
  console.log(`  vr-02 untagged distractors remaining: ${stillUntagged}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
