/**
 * RE-HOMED BY SUBSTANCE: the id is not the identity (R903, arriving in VR from the district that
 * taught it).
 *
 * Twenty-one `vr-03` executions name an item id whose row in this store is a DIFFERENT QUESTION —
 * their `01` is this store's `05`. **The question each was written about IS present**, under another
 * id, and the artefact carries enough to find it: `pair` and `stemWord`, which together are the
 * question.
 *
 * **These were one edit away from being recorded as a permanent loss.** They had been classed *no
 * option on this row resolves to that identity*, which is true of the id and false of the corpus.
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
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const DL = pjoin(homedir(), 'Downloads');

interface Rec { itemId: string; optionValue: unknown; entryId?: string; pair?: unknown; stemWord?: unknown; EXECUTION: string }

async function run() {
  assertFixture('rehome-identity', [
    { name: 'the same pair AND stemWord is the same question', input: JSON.stringify([[['a', 'b'], 'c'], [['a', 'b'], 'c']]), mustBeCaught: true },
    { name: 'the same pair with a different stemWord is NOT', input: JSON.stringify([[['a', 'b'], 'c'], [['a', 'b'], 'd']]), mustBeCaught: false },
    { name: 'a different pair is not', input: JSON.stringify([[['a', 'b'], 'c'], [['x', 'y'], 'c']]), mustBeCaught: false },
  ], (raw) => { const [a, b] = JSON.parse(raw) as [[unknown, unknown], [unknown, unknown]]; return canonicalJson(a) === canonicalJson(b); });

  const recs: Array<Rec & { file: string; digest: string }> = [];
  for (const f of readdirSync(DL).filter((n) => n.endsWith('.json'))) {
    let text: string; let doc: unknown;
    try { text = readFileSync(pjoin(DL, f), 'utf8'); doc = JSON.parse(text); } catch { continue }
    if (!text.includes('"EXECUTION"') || !text.includes('"stemWord"')) continue;
    const digest = sha(text);
    const walk = (o: unknown): void => {
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      if (typeof r.itemId === 'string' && typeof r.EXECUTION === 'string' && r.pair !== undefined && r.stemWord !== undefined) {
        recs.push({ ...(r as unknown as Rec), file: f, digest });
      }
      Object.values(r).forEach(walk);
    };
    walk(doc);
  }
  requirePopulation('land:rehomed-executions', { 'record(s) carrying pair+stemWord': recs.length });

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-03-related-words' },
    select: { id: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });

  const plan = []; const refused = [];
  for (const r of recs) {
    const home = rows.find((x) => canonicalJson((x.stem as { pairA?: unknown }).pairA) === canonicalJson(r.pair)
      && String((x.stem as { stemWord?: unknown }).stemWord) === String(r.stemWord));
    if (!home) { refused.push({ artefactId: r.itemId, pair: r.pair, stemWord: r.stemWord, why: 'no row in this store carries that pair and stemWord — the question itself is absent' }); continue; }
    const opt = home.options.find((o) => String((o.content as { value: unknown }).value) === String(r.optionValue));
    if (!opt) { refused.push({ artefactId: r.itemId, homedTo: home.id, optionValue: r.optionValue, why: 'the question is here but no option carries that value' }); continue; }
    if (opt.misconceptionExecution) { refused.push({ artefactId: r.itemId, homedTo: home.id, why: opt.misconceptionExecution === r.EXECUTION ? 'already present and identical' : 'already present and DIFFERENT — left for a reading' }); continue; }
    if (r.entryId && opt.misconceptionId && r.entryId !== opt.misconceptionId) { refused.push({ artefactId: r.itemId, homedTo: home.id, why: `the artefact names ${r.entryId} and the seat carries ${opt.misconceptionId}` }); continue; }
    plan.push({ artefactId: r.itemId, homedTo: home.id, rehomed: r.itemId !== home.id, optionId: opt.id, optionValue: r.optionValue, text: r.EXECUTION, file: r.file, digest: r.digest, entryId: r.entryId ?? null });
  }

  if (APPLY && plan.length) {
    await prisma.$transaction(async (tx) => {
      for (const p of plan) {
        await tx.itemOption.update({ where: { id: p.optionId }, data: { misconceptionExecution: p.text } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: p.homedTo, action: 'AMENDED',
          reviewerId: null, actor: 'Cowork (authored execution)', recordedBy: 'human:david',
          field: 'options[].misconceptionExecution', subjectHash: sha(p.text),
          method: `execution landed VERBATIM from ${p.file} (${p.digest.slice(0, 16)}…)${p.rehomed ? `, RE-HOMED BY SUBSTANCE: the artefact names ${p.artefactId}, whose row here is a different question. This row carries the pairA and stemWord the execution was written about — the id is not the identity (R903).` : ''}`,
          note: 'these were one classification away from a permanent loss: they had been recorded as "no option resolves to that identity", which is true of the id and false of the corpus.' } });
      }
    });
  }
  let verified = 0;
  if (APPLY) for (const p of plan) {
    const o = await prisma.itemOption.findUnique({ where: { id: p.optionId }, select: { misconceptionExecution: true } });
    if (o?.misconceptionExecution === p.text) verified += 1;
  }

  const full = {
    kind: 'executions-rehomed-by-substance', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_RULE: 'the id is not the identity; the question is. Matched on pairA AND stemWord together, which is the question — never on the id alone.',
    counts: { recordsWithASubstanceIdentity: recs.length, LANDED: plan.length, reHomedToADifferentId: plan.filter((p) => p.rehomed).length, verifiedByteIdentical: APPLY ? verified : null, refused: refused.length },
    andWHATTHISNEARLYWAS: 'a permanent loss. These sat in the standing-loss draft under "no option on this row resolves to that identity" — true of the id, false of the corpus, and the tell was that they clustered in one artefact (R955).',
    landed: plan.map((p) => ({ artefactNames: p.artefactId, landedOn: p.homedTo, rehomed: p.rehomed, optionValue: p.optionValue, executionSha256: sha(p.text) })),
    refusedWithCauses: refused,
  };
  const lines = plan.map((p) => `${p.artefactId}\t${p.homedTo}\t${sha(p.text).slice(0, 16)}`);
  const d = digestOverText('one line per landed execution, "<artefact id>\\t<row landed on>\\t<sha>"', lines.join('\n'));
  const body = JSON.parse(JSON.stringify({ ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec }));
  const artefact = { ...body, ...findingsDigest(body, ['counts', 'landed', 'refusedWithCauses', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'executions-rehomed-by-substance' : 'executions-rehomed-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${APPLY ? 'APPLIED' : 'DRY RUN'} — ${plan.length} land, ${plan.filter((p) => p.rehomed).length} of them re-homed to a different id${APPLY ? `, verified ${verified}` : ''}`);
  console.log(`  refused ${refused.length}`);
  for (const r of refused.slice(0, 4)) console.log(`     ${r.artefactId}  ${r.why}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
