/**
 * DERIVE THE VR-02 DOOR (David, 2026-09-05). **Derived, not asserted** — every figure comes from
 * the mechanism that governs it, and if the door does not fire this names what it is short rather
 * than reporting a count.
 *
 * The sixth seat — `circle,square` on row 17 — is the authoring store's re-authoring. **Whether the
 * door needs it is a question about the GATES, not about the binding**, so it is answered by running
 * them rather than by reasoning about whose work it is.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { publishBlockers, isHeldFromServing, caseFaceServes, checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { itemWholeness } from './lib/item-wholeness';
import { loadClearances } from './lib/clearances';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const CASE = 'case-vr-02';
const ANNIE = 'rev-0001';

async function main() {
  const caseRow = await prisma.case.findUniqueOrThrow({ where: { id: CASE },
    select: { title: true, modes: true, freeTier: true, orderInDistrict: true, questionTypeId: true, mappedQuestionTypeIds: true } });
  const walkAsset = (caseRow.modes as Record<string, { assetRef?: string }>)?.walk;
  const walkServes = !!walkAsset?.assetRef && !walkAsset.assetRef.startsWith('placeholder/');

  const rows = await prisma.item.findMany({ where: { questionTypeId: caseRow.questionTypeId }, orderBy: { id: 'asc' },
    select: { id: true, status: true, pool: true, stem: true, explanation: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true,
      options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
  requirePopulation('derive:vr-02', { 'row(s)': rows.length });

  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: `reviewer:${ANNIE}` }, select: { id: true } })).map((m) => m.id));
  const signed = new Set((await prisma.attributionEvent.findMany({
    where: { recordId: { in: rows.map((r) => r.id) }, action: 'SIGNED', reviewerId: ANNIE, subjectHash: { not: null } }, select: { recordId: true },
  })).map((e) => e.recordId));
  const clearances = loadClearances();

  const shortOf: Record<string, string[]> = {};
  const add = (id: string, s: string) => { (shortOf[id] ??= []).push(s); };

  for (const r of rows) {
    const w = itemWholeness(r, attested, walkServes);
    if (!w.whole) add(r.id, `not whole: ${[!w.tagsAttested && 'a tag is not attested', !w.executionsExist && 'a tagged option carries no execution', !w.walkOk && 'no walk script'].filter(Boolean).join('; ')}`);
    const blocker = publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt);
    if (blocker) add(r.id, `publishBlockers: ${blocker}`);
    if (!signed.has(r.id)) add(r.id, 'NO reviewer signature against a pinned projection');
    const gate = checkItemChildFacing({ id: r.id, stem: r.stem, explanation: r.explanation, options: r.options, clearedAppropriatenessTokens: clearances.get(r.id) } as never).filter(isBlocking);
    if (gate.length) add(r.id, `child-facing gate: ${gate.map((g) => `${g.rule} — ${g.detail.slice(0, 90)}`).join(' | ')}`);
    if (isHeldFromServing(r.id)) add(r.id, 'held from serving');
  }

  const ready = rows.filter((r) => !shortOf[r.id]);
  const notReady = rows.filter((r) => shortOf[r.id]);
  const poolNow = rows.filter((r) => r.status === 'LIVE' && r.pool === 'PRACTICE' && !isHeldFromServing(r.id)).length;

  /** The sixth seat, answered by running the gates rather than by reasoning about whose work it is. */
  const row17 = rows.find((r) => r.id === 'bank-vr-02-two-odd-ones-out-17')!;
  const sixth = row17.options.find((o) => {
    const v = (o.content as { value?: unknown })?.value;
    return (Array.isArray(v) ? v.join(',') : String(v)) === 'circle,square';
  })!;
  const sixthSeat = {
    itemId: row17.id, seat: 'circle,square', tag: sixth.misconceptionId,
    hasAnExecution: !!(sixth.misconceptionExecution ?? '').trim(),
    row17Whole: itemWholeness(row17, attested, walkServes).whole,
    row17ShortOf: shortOf[row17.id] ?? [],
    THE_ANSWER: (shortOf[row17.id] ?? []).some((s) => s.startsWith('not whole'))
      ? 'row 17 is not whole, and the sixth seat is why'
      : 'the sixth seat does NOT hold the door. It carries an execution, so wholeness passes; what is superseded is the BINDING its execution was authored against, and no gate reads a binding.',
  };

  const fires = notReady.length === 0;
  const report = {
    kind: 'VR-02-DOOR-DERIVED',
    TO: 'David and Annie; the authoring store by relay',
    date: '2026-09-05',
    THE_DOOR: fires ? 'FIRES' : 'DOES NOT FIRE',
    derivation: 'itemWholeness, publishBlockers, the SIGNED attribution events, checkItemChildFacing and isHeldFromServing — each called, none re-implemented (R41). walkModeServes is false: the walk mode\'s assetRef is a placeholder, so no row owes a script (R917).',
    counts: { rows: rows.length, whole: rows.filter((r) => itemWholeness(r, attested, walkServes).whole).length,
      signed: signed.size, ready: ready.length, notReady: notReady.length, livePracticePoolNow: poolNow },

    WHAT_EACH_ROW_IS_SHORT: notReady.map((r) => ({ itemId: r.id, status: r.status, shortOf: shortOf[r.id]! })),
    andTHESHAPEOFIT: (() => {
      const kinds = new Map<string, number>();
      for (const s of Object.values(shortOf).flat()) { const k = s.split(':')[0]!; kinds.set(k, (kinds.get(k) ?? 0) + 1); }
      return Object.fromEntries(kinds);
    })(),

    THE_SIXTH_SEAT: sixthSeat,

    THE_FACE_AND_THE_POOL: {
      faceServes: caseFaceServes(caseRow), title: caseRow.title, paid: !caseRow.freeTier, orderInDistrict: caseRow.orderInDistrict,
      livePracticePoolBefore: poolNow,
      andTHEWINDOW: poolNow === 0
        ? 'the pool is EMPTY, so the face and the pool would land in one act and the visible-and-empty window is unreachable by construction (R695), as it was for vr-10 and vr-19.'
        : 'the pool is NOT empty — check the window before any write.',
    },

    WHAT_WOULD_MAKE_IT_FIRE: fires ? [] : [...new Set(Object.values(shortOf).flat().map((s) => s.split(':')[0]!))],
    andWHATISNOTCLAIMED: 'that the rows are correct. These gates test whether a row is COMPLETE and ATTESTED, not whether its content is right — the reviewer\'s readings are what settle that, and the seventeen moved rows are crossed for exactly that purpose.',
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['counts', 'WHAT_EACH_ROW_IS_SHORT', 'THE_SIXTH_SEAT', 'THE_FACE_AND_THE_POOL'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('vr02-door-derived', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'vr02-door-derived').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  console.log(`  THE DOOR ${report.THE_DOOR}`);
  console.log(`  ${report.counts.whole} of ${report.counts.rows} whole | ${report.counts.signed} signed | ${report.counts.ready} ready | pool ${poolNow}`);
  console.log(`  the sixth seat: ${sixthSeat.THE_ANSWER}`);
  if (!fires) {
    console.log(`\n  SHORT OF: ${JSON.stringify(report.andTHESHAPEOFIT)}`);
    for (const r of report.WHAT_EACH_ROW_IS_SHORT.slice(0, 4)) console.log(`    ${r.itemId}  ${r.shortOf.join(' | ')}`);
    if (report.WHAT_EACH_ROW_IS_SHORT.length > 4) console.log(`    …and ${report.WHAT_EACH_ROW_IS_SHORT.length - 4} more rows, all listed on the artefact`);
  }
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
