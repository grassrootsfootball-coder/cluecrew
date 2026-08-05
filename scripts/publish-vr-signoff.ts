/**
 * VR FREE-TEN SIGN-OFF — `pnpm publish:vr-signoff` (`--apply` to write).
 *
 * The specialist reviewer signed off the VR free ten on written review. This
 * publishes those items to LIVE through the written-review path: reviewedBy the
 * reviewer, reviewRecordedBy David — never merged (DB CHECK enforces it) — with
 * her verbatim confirmation on the record.
 *
 * EVERY gate runs on the way through and an item that fails ANY of them is
 * REFUSED, not published:
 *   · the child-facing gates (reading age, banned vocabulary, no internal ids);
 *   · no answerability defect (answerFlaggedAt — the word-puzzle gate's net);
 *   · a correct option exists and every wrong option carries a misconception (P3);
 *   · every referenced misconception is ACTIVE (Addendum E);
 *   · the reviewer is not the author.
 * Publishing to a child is one-way; a refusal is the safe default.
 */
import { checkChildFacingText, isBlocking, lettersNamedNotOnCard, roleForItemStem, wordOptionsNamedNotOnCard } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

/** Every readable string in a Json stem/option, path-labelled — the same
 *  extraction check:db-content uses, so the publish gate cannot pass a field
 *  the serving sweep would fail (the stem.sentence gap that leaked six vr-06
 *  items live before this was fixed). */
function textsFrom(value: unknown, path: string): Array<[string, string]> {
  if (typeof value === 'string') return value.trim().includes(' ') ? [[path, value]] : [];
  if (Array.isArray(value)) return value.flatMap((entry, i) => textsFrom(entry, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value as Record<string, unknown>).flatMap(([k, e]) => textsFrom(e, path ? `${path}.${k}` : k));
  return [];
}

const APPLY = process.argv.includes('--apply');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const TODAY = new Date().toISOString().slice(0, 10);
const METHOD = `written review — VR sign-off, ${TODAY}`;
const NOTE = 'I confirm I am content for the VR items I have passed to go live to children.';

async function main(): Promise<void> {
  const operator = await prisma.parentAccount.findUnique({ where: { email: RECORDER.replace(/^human:/, '') }, select: { id: true } });
  const approver = await prisma.parentAccount.findUnique({ where: { email: REVIEWER.replace(/^human:/, '') }, select: { staffRole: true } });
  if (!operator) throw new Error(`${RECORDER} is not an account`);
  if (approver?.staffRole !== 'REVIEWER') throw new Error(`${REVIEWER} is not a REVIEWER account`);

  const active = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE' }, select: { id: true } })).map((m) => m.id));
  const cases = await prisma.case.findMany({ where: { freeTier: true }, orderBy: { orderInDistrict: 'asc' } });

  const perCase: Array<{ id: string; title: string; qt: string; total: number; published: number; refused: number; liveAfter: number }> = [];
  const refusals: string[] = [];
  let publishedTotal = 0;

  for (const kase of cases) {
    const items = await prisma.item.findMany({ where: { questionTypeId: kase.questionTypeId }, include: { options: true, questionType: true } });
    let published = 0; let refused = 0;
    for (const item of items) {
      if (item.status === 'LIVE') continue; // already live, leave it
      const reasons: string[] = [];
      const role = roleForItemStem(item.questionType.mechanic);
      const faults = [
        // EVERY stem string, not just the prompt — a cloze `sentence`, a word
        // list, a series are all read by the child.
        ...textsFrom(item.stem, '').flatMap(([path, text]) => checkChildFacingText({ role, label: `${item.id} stem.${path}`, text }).filter(isBlocking)),
        ...item.options.flatMap((o) => textsFrom(o.content, '').flatMap(([, text]) => checkChildFacingText({ role: 'item-option', label: `${item.id} option`, text }).filter(isBlocking))),
      ];
      if (faults.length) reasons.push(`child-facing: ${faults[0]!.detail}`);
      // The walk script becomes child-facing the moment the item is LIVE, so it
      // is gated too — copy AND staleness (a script naming an option not on the
      // card, the vr-03 hot/deep case). An item with no script serves its
      // misconception hint instead and is not blocked for lacking one.
      const explanation = (item.explanation ?? {}) as Record<string, unknown>;
      const walk = String(explanation.walkScript ?? explanation.walk ?? '');
      if (walk.trim()) {
        const optionWords = item.options.flatMap((o) => { const v = (o.content as { value?: unknown }).value; return (Array.isArray(v) ? v : [v]).flatMap((x) => String(x ?? '').split(/\s+/)).filter(Boolean); });
        const optionValues = item.options.map((o) => String((o.content as { value?: unknown }).value ?? ''));
        const walkFaults = checkChildFacingText({ role: 'hint', label: `${item.id} walkScript`, text: walk, testedTokens: optionWords }).filter(isBlocking);
        if (walkFaults.length) reasons.push(`walk script: ${walkFaults[0]!.detail}`);
        const stale = [...lettersNamedNotOnCard(walk, optionValues, JSON.stringify(item.stem)), ...wordOptionsNamedNotOnCard(walk, optionValues, JSON.stringify(item.stem))];
        if (stale.length) reasons.push(`walk script stale — names option(s) not on the card: ${stale.join(', ')}`);
      }
      if (item.answerFlaggedAt) reasons.push('answerability defect (answerFlaggedAt)');
      if (!item.options.some((o) => o.isCorrect)) reasons.push('no correct option');
      if (item.options.some((o) => !o.isCorrect && !o.misconceptionId)) reasons.push('a wrong option has no misconception (P3)');
      const propTags = item.options.map((o) => o.misconceptionId).filter((id): id is string => !!id).filter((id) => !active.has(id));
      if (propTags.length) reasons.push(`misconception not ACTIVE: ${propTags[0]}`);
      if (item.authoredBy === REVIEWER) reasons.push('reviewer is the author');

      if (reasons.length) { refused += 1; refusals.push(`  ✗ ${item.id}: ${reasons.join(' | ')}`); continue; }
      if (APPLY) {
        await prisma.item.update({ where: { id: item.id }, data: { status: 'LIVE', reviewedBy: REVIEWER, reviewRecordedBy: RECORDER, reviewMethod: METHOD, reviewRecordNote: NOTE } });
        await prisma.adminAuditLog.create({ data: { actorId: operator.id, action: 'item.publish_recorded', targetKind: 'Item', targetId: item.id, detail: { reviewedBy: REVIEWER, recordedBy: RECORDER, method: METHOD, note: NOTE } } });
      }
      published += 1; publishedTotal += 1;
    }
    const liveAfter = await prisma.item.count({ where: { questionTypeId: kase.questionTypeId, status: 'LIVE' } });
    perCase.push({ id: kase.id, title: kase.title, qt: kase.questionTypeId, total: items.length, published, refused, liveAfter: APPLY ? liveAfter : liveAfter + published });
  }

  console.log(`${APPLY ? 'PUBLISHED' : '--dry-run (no --apply)'} — ${publishedTotal} item(s) ${APPLY ? 'now LIVE' : 'would publish'}\n`);
  console.log('per free-tier case (LIVE / floor 15):');
  let allMeet = true;
  for (const c of perCase) {
    const meets = c.liveAfter >= 15; if (!meets) allMeet = false;
    console.log(`  ${c.id.padEnd(11)} ${c.qt.padEnd(26)} LIVE ${String(c.liveAfter).padStart(3)}  (published ${c.published}, refused ${c.refused})  ${meets ? 'meets 15' : 'BELOW 15'}`);
  }
  console.log(`\nAll ten meet the 15-item floor: ${allMeet ? 'YES' : 'NO'}`);
  if (refusals.length) { console.log(`\nREFUSED (${refusals.length}) — not published:`); for (const r of refusals.slice(0, 20)) console.log(r); }
  await prisma.$disconnect();
}

void main();
