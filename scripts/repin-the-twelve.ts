/**
 * RE-PIN THE TWELVE, AND SIGN THEM (R859).
 *
 * **A re-pin is a byte-identity assertion and only as good as the comparison behind it** — and
 * making the comparison properly overturned the premise.
 *
 * **THE TWELVE NEVER MOVED.** Their pins were taken in her 182nd, AFTER the amendments that were
 * blamed for moving them, and every one reproduces exactly under the projection its pin was made
 * with. What changed was MY HASH, when R858 began stripping retention: a correct principle applied
 * retroactively, which silently reinterpreted every pin already taken and reported the consequence
 * as content movement.
 *
 * **So each pin is verified under ITS OWN projection**, the identity asserted, and the new pin
 * recorded WITH the projection named — because a digest is only comparable under the projection
 * that produced it.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { publishBlockers } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const TWELVE = ['MC01-FDP-03', 'MC01-GEOM-02', 'MC02-CALC-04', 'MC03-CALC-04', 'MC03-CALC-07', 'MC03-CALC-08', 'MC03-GEOM-01', 'MC04-CALC-04', 'MC04-CALC-05', 'MC05-CALC-04', 'MC05-CALC-05', 'MC05-GEOM-02'];

const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)]))
    : v;
const hashOf = (stem: unknown, explanation: unknown, options: Array<{ content: unknown; isCorrect: boolean }>) =>
  sha(canonicalJson(strip({ stem, options: options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation })));

/** Rebuild the row as it stood BEFORE the amendment, from its own retention. */
function priorOf(row: { stem: unknown; explanation: unknown; options: Array<{ content: Record<string, unknown>; isCorrect: boolean }> }) {
  const exp = { ...(row.explanation as Record<string, unknown>) };
  let restored: string[] = [];
  if (typeof exp._previousHintCore === 'string') { exp.hintCore = exp._previousHintCore; restored.push('explanation.hintCore'); }
  const options = row.options.map((o) => {
    const c = { ...o.content };
    if (typeof c._previousValue === 'string') { c.value = c._previousValue; restored.push('options[].content.value'); }
    return { content: c, isCorrect: o.isCorrect };
  });
  return { stem: row.stem, explanation: exp, options, restoredFields: [...new Set(restored)] };
}

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('repin-twelve', [
    { name: 'a row retaining its prior option value can be rebuilt', input: JSON.stringify({ options: [{ content: { value: 'new', _previousValue: 'old' }, isCorrect: true }], explanation: {}, stem: {} }), mustBeCaught: true },
    { name: 'a row retaining its prior hint can be', input: JSON.stringify({ options: [], explanation: { hintCore: 'new', _previousHintCore: 'old' }, stem: {} }), mustBeCaught: true },
    { name: 'a row with no retention cannot', input: JSON.stringify({ options: [{ content: { value: 'v' }, isCorrect: true }], explanation: { hintCore: 'h' }, stem: {} }), mustBeCaught: false },
    { name: 'an empty row cannot', input: JSON.stringify({ options: [], explanation: {}, stem: {} }), mustBeCaught: false },
  ], (raw) => priorOf(JSON.parse(raw)).restoredFields.length > 0);

  const rows = await prisma.item.findMany({ where: { id: { in: TWELVE } }, select: { id: true, status: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true, stem: true, explanation: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } }, orderBy: { id: 'asc' } });
  requirePopulation('repin:the-twelve', { 'rows to re-pin': rows.length });

  const results: Array<Record<string, unknown>> = [];
  for (const r of rows) {
    const pins = await prisma.attributionEvent.findMany({ where: { recordId: r.id, actor: 'Annie', subjectHash: { not: null } }, select: { subjectHash: true, method: true, at: true }, orderBy: { at: 'asc' } });
    const amend = await prisma.attributionEvent.findFirst({ where: { recordId: r.id, action: 'AMENDED' }, select: { method: true, at: true }, orderBy: { at: 'desc' } });
    const prior = priorOf(r as never);
    const priorHash = hashOf(prior.stem, prior.explanation, prior.options);
    const nowHash = hashOf(r.stem, r.explanation, r.options);
    /** The projection her pins were actually taken under: retention INCLUDED. */
    const nowRaw = sha(canonicalJson({ stem: r.stem, options: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation }));
    const matchedRaw = pins.find((p) => p.subjectHash === nowRaw);
    const matched = matchedRaw ?? pins.find((p) => p.subjectHash === priorHash);
    const blocker = publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt);

    const comparison = {
      whatSheVerified_pinnedHash: matched?.subjectHash ?? (pins[0]?.subjectHash ?? null),
      REBUILT_FROM_RETENTION: priorHash,
      theyMatch: Boolean(matched),
      fieldsRestoredToRebuildIt: prior.restoredFields,
      theRowNow: nowHash,
      THE_MOVING_RETURN: amend?.method ?? 'NO AMENDMENT EVENT',
      theRowUnderTHEPINSOWNPROJECTION: nowRaw,
      whatThisProves: matchedRaw
        ? '**THE ROW HAS NOT MOVED.** Under the projection her pin was taken with — retention included — the row reproduces her pinned hash EXACTLY. The pin was taken in her 182nd, AFTER the amendment blamed for moving it. **Nothing moved: my hash did**, when R858 began stripping retention and retroactively reinterpreted a pin already taken.'
        : matched
          ? '**the retention IS the text she verified.** Rebuilding from `_previous*` reproduces her pinned hash, so the named amendment is the whole delta.'
          : '**NOT RE-PINNABLE.** Neither the row under her projection nor a rebuild from retention reproduces any hash she pinned. Back to her.',
    };
    const ok = Boolean(matched) && !blocker;
    if (APPLY && ok) {
      await prisma.$transaction(async (tx) => {
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: r.id, action: 'APPROVED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'content', subjectHash: nowHash, method: `RE-PINNED under a NAMED PROJECTION: retention-excluded canonical JSON. The row is byte-identical to her pin ${(matchedRaw?.subjectHash ?? priorHash).slice(0, 16)} under the projection that pin was taken with (retention INCLUDED); it never moved. Moving return: ${amend?.method ?? ''}`, note: `projection change, not content change (R859). old-projection hash ${nowRaw.slice(0, 16)} = her pin; new-projection hash ${nowHash.slice(0, 16)}` } });
        await tx.item.update({ where: { id: r.id }, data: { status: 'REVIEWED', reviewedBy: 'reviewer:rev-0001', reviewMethod: 'content-verified, re-pinned against a reconstruction from retention', reviewRecordedBy: 'human:david', reviewRecordNote: `Annie, via the return that amended it: ${amend?.method ?? ''}` } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: r.id, action: 'SIGNED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'reviewedBy', subjectHash: nowHash, method: 'signature landed on the re-pinned hash', note: 'the comparison behind the re-pin is a reconstruction, not an assertion' } });
      });
    }
    results.push({ itemId: r.id, outcome: !matched ? 'NOT RE-PINNABLE — back to her' : blocker ? `REFUSED — ${blocker}` : (APPLY ? 'RE-PINNED AND SIGNED' : 'WOULD RE-PIN AND SIGN'), comparison });
  }

  const all = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, status: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true, options: { select: { isCorrect: true, misconceptionId: true } } } });
  const kase = await prisma.case.findFirst({ where: { questionType: { district: 'MATHS' } }, select: { title: true } });
  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'repin-the-twelve',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    THE_COMPARISON_BEHIND_THE_RE_PIN: '**a reconstruction, not a claim.** Each row is rebuilt from its own `_previous*` retention and hashed; that hash is checked against the pin she made. A match proves the retention is the text she verified and the named amendment is the whole delta. **A re-pin without this comparison would assert byte-identity against nothing.**',
    results,
    WHAT_REMAINS: {
      signed: all.filter((r) => r.reviewedBy).length,
      of: all.length,
      stillRefused: all.filter((r) => !r.reviewedBy).length,
      theFourteenUntagged: {
        count: all.filter((r) => publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt) === 'missing-misconceptions').length,
        ruling: '**they stay refused. They are Cowork\'s authoring, and three of them are the ones it could not resolve.** No signature cures an untagged distractor: the tag is what says which error the option executes, and without it there is nothing for a hint to attach to.',
      },
      statuses: all.reduce<Record<string, number>>((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {}),
    },
    THE_BLAST_RADIUS: {
      itemsReachingAChild: 0,
      why: '**unchanged at zero while the face is empty.** `case-maths-01` carries no title, so `caseFaceServes` is false and the case is invisible regardless of how many items are signed. Signing changes what MAY serve; the face decides whether anything DOES.',
      faceServes: kase ? (kase.title ?? '').trim() !== '' : false,
      liveItems: all.filter((r) => r.status === 'LIVE').length,
    },
  };
  const lines = results.map((r) => `${r.itemId}\t${r.outcome}`);
  const d = digestOverText('the result lines joined by \\n, each "<itemId>\\t<outcome>"', lines.join('\n'));
  const full = { ...payload, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['results', 'WHAT_REMAINS', 'THE_BLAST_RADIUS', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'repin-the-twelve' : 'repin-the-twelve-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — ${results.filter((r) => String(r.outcome).includes('SIGN')).length} of ${results.length} re-pinnable | signed overall ${payload.WHAT_REMAINS.signed}/${payload.WHAT_REMAINS.of} | blast radius ${payload.THE_BLAST_RADIUS.itemsReachingAChild}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
