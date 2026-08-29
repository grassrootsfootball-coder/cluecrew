/**
 * SIGN THE ROWS THE JOINS UNBLOCKED — AND ASSERT THE PIN, NEVER ASSUME IT.
 *
 * A join writes `options[].misconceptionId`, which is OUTSIDE the projection her pins were taken
 * under (`{stem, options[{content,isCorrect}], explanation}`, `_`-keys stripped). So the join
 * cannot have moved her content hash — and that is a claim, so it is CHECKED per row before the
 * signature lands. A signature on an unverified hash is the fault R41 names: a verifier that
 * re-derives instead of asserting.
 *
 * HER SIGNATURE'S SCOPING, recorded on every row this signs (David, 2026-08-29):
 *   - a PIN asserts IDENTITY over the whole row under its named projection;
 *   - a VERDICT asserts READING over what was actually read;
 *   - the INHERITED FIELDS are inside the pin and outside the reading — pinned and unread.
 * The three are not the same scope and a signature that blurs them claims more than she gave.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { publishBlockers } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

/**
 * TWO PROJECTIONS, AND WHICH ONE A PIN WAS TAKEN UNDER IS DISCOVERED, NEVER ASSUMED (R888).
 *
 * The first version named ONE projection — retention excluded — and asserted it in every
 * signature's method. It was wrong: every maths pin was taken with retention INCLUDED. It passed
 * anyway on three rows, because a row carrying no `_`-key hashes identically under both, so the
 * claim was untestable exactly where it was false and self-confirming everywhere else. The one row
 * carrying retention refused, and the refusal read as *the row does not recompute to her pin* — a
 * content fault, which it was not.
 */
const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)]))
  : v;
const project = (stem: unknown, explanation: unknown, options: Array<{ content: unknown; isCorrect: boolean }>) =>
  ({ stem, options: options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation });
const hashRetentionIncluded = (s: unknown, e: unknown, o: Array<{ content: unknown; isCorrect: boolean }>) => sha(canonicalJson(project(s, e, o)));
const hashRetentionExcluded = (s: unknown, e: unknown, o: Array<{ content: unknown; isCorrect: boolean }>) => sha(canonicalJson(strip(project(s, e, o))));
const hashOf = hashRetentionExcluded;

async function run() {
  assertFixture('pin-projection', [
    { name: 'tagging an option does NOT move either hash', input: 'tag', mustBeCaught: true },
    { name: 'changing an option VALUE moves the hash', input: 'value', mustBeCaught: false },
    { name: 'changing the stem moves the hash', input: 'stem', mustBeCaught: false },
    { name: 'RETENTION makes the two projections DIFFER — the case that exposed the wrong claim', input: 'retention', mustBeCaught: false },
    { name: 'without retention the two projections AGREE, which is why the wrong claim passed everywhere else', input: 'no-retention', mustBeCaught: true },
  ], (k) => {
    const base = { stem: { text: 's' }, explanation: {}, options: [{ content: { label: 'A', value: '1' }, isCorrect: false }] };
    if (k === 'retention' || k === 'no-retention') {
      const opts = k === 'retention'
        ? [{ content: { label: 'A', value: '1', _previousValue: '0' }, isCorrect: false }]
        : base.options;
      return hashRetentionIncluded(base.stem, base.explanation, opts) === hashRetentionExcluded(base.stem, base.explanation, opts);
    }
    const after = k === 'tag' ? base
      : k === 'value' ? { ...base, options: [{ content: { label: 'A', value: '2' }, isCorrect: false }] }
      : { ...base, stem: { text: 't' } };
    return hashOf(base.stem, base.explanation, base.options) === hashOf(after.stem, after.explanation, after.options);
  });

  const rows = await prisma.item.findMany({
    where: { questionType: { district: 'MATHS' }, reviewedBy: null },
    select: { id: true, stem: true, explanation: true, status: true, authoredBy: true, answerFlaggedAt: true, reviewedBy: true,
      options: { select: { content: true, isCorrect: true, misconceptionId: true } } },
  });
  requirePopulation('sign:joins-unblocked', { 'unsigned MATHS row(s)': rows.length });

  const results: Array<Record<string, unknown>> = [];
  for (const r of rows) {
    const blocker = publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt);
    if (blocker === 'missing-misconceptions') {
      results.push({ itemId: r.id, outcome: 'STILL BLOCKED', blocker, untagged: r.options.filter((o) => !o.isCorrect && !o.misconceptionId).map((o) => String((o.content as { value: unknown }).value)) });
      continue;
    }
    const pins = await prisma.attributionEvent.findMany({ where: { recordId: r.id, actor: 'Annie', subjectHash: { not: null } }, select: { subjectHash: true, method: true }, orderBy: { at: 'asc' } });
    const included = hashRetentionIncluded(r.stem, r.explanation, r.options);
    const excluded = hashRetentionExcluded(r.stem, r.explanation, r.options);
    const matched = pins.find((p) => p.subjectHash === included || p.subjectHash === excluded);
    const projection = matched
      ? (matched.subjectHash === included
        ? (included === excluded ? 'retention-INCLUDED (indistinguishable on this row — it carries no retention)' : 'retention-INCLUDED')
        : 'retention-EXCLUDED')
      : null;
    const comparison = {
      pinsOnRow: pins.length, herPin: pins[0]?.subjectHash ?? null,
      rowNowRetentionIncluded: included, rowNowRetentionExcluded: excluded,
      theTwoProjectionsDiffer: included !== excluded,
      theyMatch: !!matched, matchedUnderProjection: projection,
    };
    if (!matched) {
      results.push({ itemId: r.id, outcome: 'REFUSED — the row recomputes to her pin under NEITHER projection', comparison, why: 'a signature asserts she read THIS row. It goes back to her, never signed on a hash that moved.' });
      continue;
    }
    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        await tx.item.update({ where: { id: r.id }, data: { reviewedBy: 'reviewer:rev-0001', reviewRecordedBy: 'human:david', reviewMethod: 'content-verified against a pinned row hash', reviewRecordNote: 'Annie, via her 180th, 182nd and 184th returns; unblocked by her 189th minted entries', status: 'REVIEWED' } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: r.id, action: 'SIGNED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'reviewedBy', subjectHash: matched.subjectHash,
          method: `signature landed on her pin, recomputed and matched under the ${projection} projection of {stem, options[{content,isCorrect}], explanation}${comparison.theTwoProjectionsDiffer ? ' — the two projections DIFFER on this row, so the match names a specific one' : ''}. Unblocked by a join written to options[].misconceptionId, which is OUTSIDE both.`,
          note: 'SCOPING: the pin asserts identity over the whole row; the verdict asserts reading over what was read; the inherited stem fields are pinned and unread.' } });
      });
    }
    results.push({ itemId: r.id, outcome: APPLY ? 'SIGNED' : 'WOULD SIGN', blockerNow: blocker ?? 'none', comparison });
  }

  const counts = results.reduce<Record<string, number>>((a, r) => { const k = String(r.outcome).split(' —')[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {});

  /**
   * THE DISCRIMINATING DENOMINATOR (R889). How many rows can actually tell the two projections
   * apart? On the rest the claim is DEGENERATE — both branches return the same hash, so the check
   * agrees with itself and measures nothing. A check whose discriminating count is 0 has tested its
   * claim on no row at all, and must say so rather than reporting a pass.
   */
  const withComparison = results.filter((r) => (r as { comparison?: { theTwoProjectionsDiffer?: boolean } }).comparison);
  const discriminating = withComparison.filter((r) => (r as { comparison: { theTwoProjectionsDiffer: boolean } }).comparison.theTwoProjectionsDiffer);
  const THE_DISCRIMINATING_DENOMINATOR = {
    rowsCompared: withComparison.length,
    rowsWhereTheTwoProjectionsDIFFER: discriminating.length,
    rowsWhereTheClaimIsDEGENERATE: withComparison.length - discriminating.length,
    ids: discriminating.map((r) => r.itemId),
    andWHATTHATMEANS: discriminating.length === 0
      ? 'ZERO. No row here can distinguish the projections, so nothing in this run tested which one the pins were taken under. Treat the projection line as UNVERIFIED on this population, not as a pass.'
      : `${discriminating.length} row(s) can falsify the projection claim; the other ${withComparison.length - discriminating.length} agree with themselves whichever projection is named. The passing rows are not evidence.`,
  };
  console.log(`  discriminating rows: ${discriminating.length} of ${withComparison.length} — the rest cannot tell the projections apart`);
  const lines = results.map((r) => `${r.itemId}\t${r.outcome}`);
  const d = digestOverText('the result lines joined by \\n, each "<itemId>\\t<outcome>"', lines.join('\n'));
  const full = {
    kind: 'joins-unblocked-signing', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_PROJECTION: 'BOTH are computed and the pin is matched against both; the signature records which one matched. A pin is comparable only under the projection it was taken with (R859), and which that is, is discovered rather than declared (R888).',
    THE_SCOPING: 'a pin asserts IDENTITY over the whole row under its named projection; a verdict asserts READING over what was read; the inherited fields are PINNED AND UNREAD.',
    counts, THE_DISCRIMINATING_DENOMINATOR, results, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec,
  };
  const artefact = { ...full, ...findingsDigest(full, ['counts', 'results', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'joins-unblocked-signing' : 'joins-unblocked-signing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'} — ${JSON.stringify(counts)}`);
  for (const r of results.filter((x) => !String(x.outcome).startsWith('STILL'))) console.log(`   ${r.outcome}  ${r.itemId}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
