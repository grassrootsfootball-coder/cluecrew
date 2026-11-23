/**
 * HER 200th: five seats re-author to the third-act family.
 *
 * **Both her rulings stand and what falls is the seats' worth.** Partial-group has two inputs on a
 * row, one per odd word; a third carrier re-uses an input whose output already exists, and a tag
 * that is true while adding nothing fires a hint the child already earns elsewhere.
 *
 * **MATCHED ON THE REPLACED VALUE, NOT ON HER OPTION LABEL.** Her amendment block names seats D, D,
 * D, D and B — and vr-02 options carry no `label` key at all, so those references resolve to
 * nothing here. The `replaced` values resolve to exactly one option each and are the anchor used,
 * which is the same match her 197th needed. **A landing that had trusted the label would have found
 * no seat and either failed or, worse, fallen back to position.**
 *
 * The displaced pair vacates its seat and is retained on the option as `_previousValue`: nothing
 * CARRIES it as a tagged answer, which is what she ruled, and the record of what stood there is
 * provenance rather than carriage (R900).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const RETURN_SHA = 'abb14dc7b6d04d3ffc7a65ae5e8c15a366d70f09311a8b64369bea7b51694931';
const MINT = 'vr02-answered-the-opposite';

const SEATS: Array<{ itemId: string; replaced: string[]; authored: string[]; herReason: string }> = [
  { itemId: 'bank-vr-02-two-odd-ones-out-17', replaced: ['oval', 'star'], authored: ['triangle', 'star'], herReason: 'both pointed, both of the group' },
  { itemId: 'bank-vr-02-two-odd-ones-out-22', replaced: ['hen', 'dog'], authored: ['snake', 'frog'], herReason: 'both egg-layers, a real pull inside the rule' },
  { itemId: 'bank-vr-02-two-odd-ones-out-23', replaced: ['soft', 'cold'], authored: ['soft', 'smooth'], herReason: 'members sharing sound and sense' },
  { itemId: 'bank-vr-02-two-odd-ones-out-24', replaced: ['net', 'run'], authored: ['jump', 'run'], herReason: 'both continuous motions of the legs' },
  { itemId: 'bank-vr-02-two-odd-ones-out-25', replaced: ['tuna', 'seal'], authored: ['whale', 'dolphin'], herReason: 'the classic pair, both sea mammals' },
];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

async function run() {
  if (sha(readFileSync('/Users/davidb/Downloads/annie-200-for-code.md', 'utf8')) !== RETURN_SHA) throw new Error('the return does not hash to its declared value — refusing');

  assertFixture('seat-anchor', [
    { name: 'the replaced value anchors the seat', input: JSON.stringify([['oval', 'star'], ['oval', 'star']]), mustBeCaught: true },
    { name: 'a reversed pair is not the seat', input: JSON.stringify([['oval', 'star'], ['star', 'oval']]), mustBeCaught: false },
    { name: 'the authored pair is not the seat', input: JSON.stringify([['oval', 'star'], ['triangle', 'star']]), mustBeCaught: false },
  ], (raw) => { const [a, b] = JSON.parse(raw); return same(a, b); });

  const refusals: string[] = [];
  const plan: Array<(typeof SEATS)[number] & { optionId: string; priorTag: string | null; words: string[]; key: string[] }> = [];
  for (const s of SEATS) {
    const row = await prisma.item.findUniqueOrThrow({ where: { id: s.itemId },
      select: { stem: true, options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true, misconceptionId: true } } } });
    const words = (row.stem as { words: string[] }).words;
    const key = row.options.find((o) => o.isCorrect)!.content as { value: string[] };
    const hits = row.options.filter((o) => !o.isCorrect && same((o.content as { value: unknown }).value, s.replaced));
    if (hits.length !== 1) { refusals.push(`${s.itemId}: replaced ${JSON.stringify(s.replaced)} resolves to ${hits.length} options, expected 1`); continue; }
    if (!s.authored.every((w) => words.includes(w))) { refusals.push(`${s.itemId}: authored pair is not entirely inside the stem's word list`); continue; }
    if (s.authored.some((w) => key.value.includes(w))) { refusals.push(`${s.itemId}: authored pair overlaps the KEY — it would not be two group members`); continue; }
    if (row.options.some((o) => same((o.content as { value: unknown }).value, s.authored))) { refusals.push(`${s.itemId}: the authored pair is already an option on this row`); continue; }
    plan.push({ ...s, optionId: hits[0]!.id, priorTag: hits[0]!.misconceptionId, words, key: key.value });
  }
  requirePopulation('land:annie-200', { 'seat(s) she re-authored': SEATS.length, 'seat(s) resolved': plan.length });

  if (refusals.length === 0 && APPLY) {
    await prisma.$transaction(async (tx) => {
      for (const s of plan) {
        await tx.itemOption.update({ where: { id: s.optionId }, data: {
          misconceptionId: MINT,
          content: { value: s.authored, _previousValue: s.replaced, _previousMisconceptionId: s.priorTag },
        } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: s.itemId, action: 'AMENDED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'options[].content.value+misconceptionId',
          returnArtefact: RETURN_SHA,
          method: `her 200th: the seat re-authors from ${JSON.stringify(s.replaced)} to ${JSON.stringify(s.authored)} and takes ${MINT}. ${s.herReason}. Matched on the REPLACED VALUE — her block names an option label this row does not carry.`,
          note: 'a mechanism\'s carriers are bounded by its distinct inputs. Partial-group has two inputs on a row, one per odd word; this was a third carrier re-using an input whose output already existed — true, and empty. The displaced pair vacates: nothing carries it as an answer, and it is retained on the option as provenance.' } });
      }
    });
  }

  const after = await prisma.itemOption.count({ where: { misconceptionId: MINT } });
  const v02 = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out', status: 'DRAFT' },
    select: { options: { orderBy: { id: 'asc' }, select: { isCorrect: true, misconceptionId: true } } } });
  const pgPerRow = v02.map((r) => r.options.filter((o) => o.misconceptionId === 'vr02-partial-group').length);

  const full = {
    kind: 'annie-200-landing', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    return: 'annie-200-for-code.md', returnSha256: RETURN_SHA,
    returnSha256Spec: 'sha256 over the return file bytes exactly as delivered, unparsed',
    outcome: refusals.length ? 'REFUSED' : (APPLY ? 'LANDED' : 'WOULD LAND'), refusals,
    MATCHED_ON_VALUE_NOT_LABEL: 'her amendment block names seats D, D, D, D and B. vr-02 options carry no `label` key, so those references resolve to nothing here; the `replaced` values resolve to exactly one option each and are the anchor used. Reported because a landing that trusted the label would have found no seat, or fallen back to position.',
    ASSERTED_BEFORE_WRITING: 'per seat — the replaced value resolves to exactly one non-key option; the authored pair is entirely inside the stem\'s word list; it does not overlap the key; and it is not already an option on the row.',
    seats: plan.map((s) => ({ itemId: s.itemId, replaced: s.replaced, authored: s.authored, herReason: s.herReason,
      priorTag: s.priorTag, nowCarries: MINT, groupWords: s.words, key: s.key })),
    THE_MINT_NOW_CARRIES: after,
    partialGroupPerRowAcrossTheCase: { two: pgPerRow.filter((n) => n === 2).length, three: pgPerRow.filter((n) => n === 3).length, other: pgPerRow.filter((n) => n !== 2 && n !== 3).length },
  };
  const lines = plan.map((s) => `${s.itemId}\t${JSON.stringify(s.replaced)}\t${JSON.stringify(s.authored)}`);
  const d = digestOverText('one line per seat, "<itemId>\\t<replaced>\\t<authored>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['seats', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'annie-200-landing' : 'annie-200-landing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${full.outcome}${refusals.length ? ': ' + refusals.join('; ') : ''}`);
  for (const s of plan) console.log(`   ${s.itemId.slice(-2)}  ${JSON.stringify(s.replaced).padEnd(20)} -> ${JSON.stringify(s.authored).padEnd(24)} ${s.herReason}`);
  console.log(`  ${MINT} now carries ${after}; partial-group per row — two: ${full.partialGroupPerRowAcrossTheCase.two}, three: ${full.partialGroupPerRowAcrossTheCase.three}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
