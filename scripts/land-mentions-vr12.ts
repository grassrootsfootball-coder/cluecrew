/**
 * HER §2 WIDENED TO vr-12 (David, 2026-08-26 — R742): same mechanical substitution, same per-row
 * assertions. **The substitution function is IMPORTED from the vr-06 lander, never re-derived** —
 * a second copy of this rule would be R738 in the very turn that registered it.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing, gapMarkerSpans, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { quoteMentions } from './land-annie-161';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const AUTH = "annie-162-for-code.md, sha256 86294bfe2e10d800531ae57a6da03cbde47609e54ded50aed76fd90369d7896d; §2 widened to vr-12 by David, 2026-08-26";
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

async function run() {
  assertFixture('land:mentions-vr12', [
    { name: 'a mention run is moved', input: 'Put BRUSH after it.', mustBeCaught: true },
    { name: 'a frame token is not', input: 'The word stops at DE___VE.', mustBeCaught: false },
    { name: 'prose with no capital run is untouched', input: 'Read the sentence to the end.', mustBeCaught: false },
    { name: 'a single capital is not a run', input: 'A dog barked here.', mustBeCaught: false },
  ], (t) => quoteMentions(t).moved.length > 0);

  const items = await prisma.item.findMany({
    where: { questionTypeId: 'vr-12-compound-words' },
    select: { id: true, status: true, stem: true, explanation: true, questionType: { select: { mechanic: true } }, options: { orderBy: { id: 'asc' }, select: { content: true, misconceptionId: true } } },
    orderBy: { id: 'asc' },
  });
  const rows: Array<Record<string, unknown>> = [];
  for (const i of items) {
    const e = i.explanation as Record<string, unknown>;
    const before = String(e.walkScript ?? '');
    if (!before.trim()) continue;
    const { out, moved, frames } = quoteMentions(before);

    for (const f of frames) if (!out.includes(f)) throw new Error(`REFUSED — ${i.id}: frame token ${JSON.stringify(f)} did not survive`);
    const framesAfter = gapMarkerSpans(out).map(([s, en]) => out.slice(s, en));
    if (JSON.stringify(framesAfter) !== JSON.stringify(frames)) throw new Error(`REFUSED — ${i.id}: frame tokens changed`);
    const maskBefore = before.replace(/\b[A-Z]{2,}\b/g, (m, off: number) => (gapMarkerSpans(before).some(([s, en]) => off >= s && off + m.length <= en) ? m : '§'));
    const maskAfter = out.replace(/“[a-z]+”/g, '§');
    if (maskBefore !== maskAfter) throw new Error(`REFUSED — ${i.id}: something other than the mention runs moved`);

    const nextExpl = { ...e, walkScript: out };
    const gateOf = (expl: unknown) => checkItemChildFacing({ id: i.id, stem: i.stem, explanation: expl, mechanic: i.questionType.mechanic, options: i.options.map((o) => ({ content: o.content, misconceptionId: o.misconceptionId })) }).filter(isBlocking).map((f) => `${f.rule}: ${f.detail}`);
    const faultsBefore = gateOf(e);
    const introduced = gateOf(nextExpl).filter((f) => !faultsBefore.includes(f));
    if (introduced.length) throw new Error(`REFUSED — ${i.id}: the substitution INTRODUCED ${introduced.join('; ')}`);

    rows.push({ id: i.id, status: i.status, frameTokensUntouched: frames, mentionsMoved: moved, before, after: out, beforeSha256: sha256(before), afterSha256: sha256(out), ...(faultsBefore.length ? { preExistingFaultsUntouchedByThisEdit: faultsBefore } : {}) });
    if (APPLY) await prisma.item.update({ where: { id: i.id }, data: { explanation: nextExpl } });
  }
  if (APPLY && rows.length) {
    await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: 'template:vr-12-compound-words', action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'explanation.walkScript', method: `her 161st §2 widened to vr-12 by David (${AUTH})`, note: `${rows.length} rows; frame tokens asserted unchanged; refused on the diff, not the total` } });
  }
  const artefact = {
    kind: 'mentions-vr12-landing',
    what: 'Her mentions ruling widened to the twenty-five vr-12 walk scripts: same mechanical substitution, same per-row assertions.',
    authority: AUTH,
    theSubstitutionIsImportedNotCopied: 'quoteMentions is imported from land-annie-161.ts. A second copy of this rule would be R738 in the turn that registered it.',
    noFramesHere: 'vr-12 walk scripts carry NO frame tokens, so every capital run in them is a mention — which is why the frame assertion is vacuously true on all 25 and is reported as such rather than as a pass.',
    rowsAmended: rows.length,
    rows,
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  if (APPLY) {
    const name = stampedName('mentions-vr12-landing', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'mentions-vr12-landing');
  }
  console.log(`rows ${rows.length}; sample: ${rows[0] ? JSON.stringify((rows[0] as { after: string }).after).slice(0, 110) : 'none'}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
