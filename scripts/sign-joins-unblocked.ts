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

/** The NAMED projection her maths pins were taken under. Retention (`_`-keys) excluded — R858/R859. */
const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)]))
  : v;
const hashOf = (stem: unknown, explanation: unknown, options: Array<{ content: unknown; isCorrect: boolean }>) =>
  sha(canonicalJson(strip({ stem, options: options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation })));

async function run() {
  assertFixture('pin-projection-excludes-tags', [
    { name: 'tagging an option does NOT move the hash', input: 'tag', mustBeCaught: true },
    { name: 'changing an option VALUE does move the hash', input: 'value', mustBeCaught: false },
    { name: 'changing the stem does move the hash', input: 'stem', mustBeCaught: false },
  ], (k) => {
    const base = { stem: { text: 's' }, explanation: {}, options: [{ content: { label: 'A', value: '1' }, isCorrect: false }] };
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
    const now = hashOf(r.stem, r.explanation, r.options);
    const matched = pins.find((p) => p.subjectHash === now);
    const comparison = { pinsOnRow: pins.length, herPin: pins[0]?.subjectHash ?? null, rowNowUnderThatProjection: now, theyMatch: !!matched };
    if (!matched) {
      results.push({ itemId: r.id, outcome: 'REFUSED — the row does not recompute to her pin', comparison, why: 'a signature asserts she read THIS row. It goes back to her, never signed on a hash that moved.' });
      continue;
    }
    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        await tx.item.update({ where: { id: r.id }, data: { reviewedBy: 'reviewer:rev-0001', reviewRecordedBy: 'human:david', reviewMethod: 'content-verified against a pinned row hash', reviewRecordNote: 'Annie, via her 180th, 182nd and 184th returns; unblocked by her 189th minted entries', status: 'REVIEWED' } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: r.id, action: 'SIGNED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'reviewedBy', subjectHash: now,
          method: `signature landed on her pin, recomputed and matched under the named projection {stem, options[{content,isCorrect}], explanation}, retention excluded. Unblocked by a join written to options[].misconceptionId, which is OUTSIDE that projection.`,
          note: 'SCOPING: the pin asserts identity over the whole row; the verdict asserts reading over what was read; the inherited stem fields are pinned and unread.' } });
      });
    }
    results.push({ itemId: r.id, outcome: APPLY ? 'SIGNED' : 'WOULD SIGN', blockerNow: blocker ?? 'none', comparison });
  }

  const counts = results.reduce<Record<string, number>>((a, r) => { const k = String(r.outcome).split(' —')[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {});
  const lines = results.map((r) => `${r.itemId}\t${r.outcome}`);
  const d = digestOverText('the result lines joined by \\n, each "<itemId>\\t<outcome>"', lines.join('\n'));
  const full = {
    kind: 'joins-unblocked-signing', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_PROJECTION: '{stem, options[{content,isCorrect}], explanation}, keys beginning "_" stripped (R858/R859)',
    THE_SCOPING: 'a pin asserts IDENTITY over the whole row under its named projection; a verdict asserts READING over what was read; the inherited fields are PINNED AND UNREAD.',
    counts, results, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec,
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
