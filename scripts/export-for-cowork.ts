/**
 * TWO DELIVERIES COWORK IS WAITING ON — `pnpm export:for-cowork`
 *
 * **AN UNTRAVELLED PATH AND AN ABSENT PATH ARE THE SAME THING** (R88). Both of these were "sent" in
 * the sense that a file exists somewhere, and neither arrived:
 *
 *   · **the vr-04 sixteen** went out as MARKDOWN, for a reader. Cowork consumes stamped JSON, so a
 *     prose table is a document it cannot hold — the R25 shape at the delivery layer: an account of
 *     the values rather than the values.
 *   · **ENG-003** was last delivered on 2026-08-02 as `ENG003spagsetA.json`, before the SpaG surface,
 *     the `gapRef` -> `gapIndex` migration and the cloze gap check. Cowork is building a packet from
 *     a file two weeks stale and has no way to know it.
 *
 * **WHAT THIS SENDS IS READ FROM THE STORE AT RUN TIME, never from the earlier artefact.** Both
 * payloads carry the standard stamp, so a stale copy on either side is detectable rather than
 * arguable, and the old ENG-003 file is superseded by name rather than left beside the new one.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { FAMILY_BY_TYPE } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const PASSAGES = resolve(import.meta.dirname, '../content/passages');

async function exportVr04Sixteen(generatedAt: string): Promise<void> {
  const items = await prisma.item.findMany({
    where: { questionTypeId: 'vr-04-closest-meaning' },
    select: { id: true, stem: true, status: true, difficultyTier: true, options: { orderBy: { id: 'asc' }, select: { isCorrect: true, content: true } } },
  });
  const headword = (i: (typeof items)[number]) =>
    String(((i.stem ?? {}) as { words?: string[] }).words?.[0] ?? '').toLowerCase();
  const key = (i: (typeof items)[number]) =>
    String((i.options.find((o) => o.isCorrect)!.content as { value?: unknown }).value);

  const bank = new Map(items.filter((i) => i.id.startsWith('bank-')).map((i) => [headword(i), i]));
  const gen = new Map(items.filter((i) => i.id.startsWith('gen-')).map((i) => [headword(i), i]));
  const shared = [...bank.keys()].filter((w) => gen.has(w)).sort();
  const disagreeing = shared.filter((w) => key(bank.get(w)!) !== key(gen.get(w)!));

  requirePopulation('export:for-cowork vr-04', {
    'vr-04 items': items.length, 'headwords in both populations': shared.length, 'disagreeing keys': disagreeing.length,
  });

  const body = {
    kind: 'vr04-disagreeing-keys',
    note:
      'The typed constructor never ran over the bank; it emitted a SECOND population beside it. '
      + '40 gen- (DRAFT) and 40 bank- (LIVE) share one questionTypeId. This is the set where the two '
      + 'populations disagree about the key. A QUESTION, not a repair: which of each pair is right is '
      + 'authoring, and the gen- half has never been reviewed.',
    generatedAt,
    denominator: {
      vr04ItemsTotal: items.length,
      bankPopulation: bank.size,
      genPopulation: gen.size,
      headwordsInBoth: shared.length,
      disagreeing: disagreeing.length,
    },
    pairs: disagreeing.map((w) => {
      const b = bank.get(w)!;
      const g = gen.get(w)!;
      return {
        headword: w,
        bank: { itemId: b.id, key: key(b), status: b.status, tier: b.difficultyTier },
        gen: { itemId: g.id, key: key(g), status: g.status, tier: g.difficultyTier },
        whichServes: b.status === 'LIVE' ? 'bank' : g.status === 'LIVE' ? 'gen' : 'neither',
        reviewerRulingFromAugust:
          w === 'obedient' ? 'key rarer than its headword (dutiful) — the fix is in the DRAFT half'
            : w === 'exhausted' ? 'key weaker than its headword (tired) — the fix is in the DRAFT half'
              : null,
      };
    }),
    limits: [
      'No recommendation is expressed or implied. The gen- half has never been reviewed.',
      'Two of the sixteen (obedient, exhausted) are the reviewer\'s own August rulings: the keys she '
      + 'named as faults are the ones serving, and the keys that answer her are DRAFT.',
    ],
  };
  // 'mixed': it carries CONTENT (both populations' keys) and the STATUS that decides which serves.
  const stamp = artefactStamp(body, generatedAt, 'mixed',
    'every vr-04 headword where the bank and the constructor disagree about the key', ['pairs']);
  const path = join(OUT_DIR, stampedName('vr04-disagreeing-keys', stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ ...body, stamp }, null, 2));
  deliver(path, 'vr04-disagreeing-keys');
}

async function exportEng003(generatedAt: string): Promise<void> {
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-003' } },
    include: { options: { orderBy: { id: 'asc' }, include: { misconception: { select: { id: true, status: true, childHint: true } } } } },
    orderBy: { id: 'asc' },
  });
  requirePopulation('export:for-cowork ENG-003', { 'ENG-003 items': items.length });

  // THE VEHICLES TRAVEL WITH THE ITEMS. A cloze item cites a gap in a passage Cowork does not hold;
  // sending the item without the vehicle sends half a question (R86 — what a file needs to be read).
  const referenced = new Set(
    items.map((i) => (i.stem as { passageRef?: unknown })?.passageRef).filter((r): r is string => typeof r === 'string'),
  );
  const vehicles: Record<string, unknown> = {};
  for (const file of readdirSync(PASSAGES).filter((f) => f.endsWith('.json'))) {
    const id = file.replace(/\.json$/, '');
    if (referenced.has(id)) vehicles[id] = JSON.parse(readFileSync(join(PASSAGES, file), 'utf8'));
  }

  const byType = new Map<string, number>();
  for (const i of items) byType.set(i.questionTypeId, (byType.get(i.questionTypeId) ?? 0) + 1);

  const body = {
    kind: 'eng003-spag-current',
    note:
      'ENG-003 as this store holds it TODAY, superseding ENG003spagsetA.json (2026-08-02), which '
      + 'predates the SpaG surface, the gapRef -> gapIndex migration and check:cloze-gaps. Includes '
      + 'the cloze vehicles, because an item that cites a gap in a passage is half a question without it.',
    generatedAt,
    denominator: {
      items: items.length,
      byQuestionType: Object.fromEntries([...byType].sort()),
      vehiclesIncluded: Object.keys(vehicles).length,
      statuses: Object.fromEntries(
        [...items.reduce((m, i) => m.set(i.status, (m.get(i.status) ?? 0) + 1), new Map<string, number>())].sort(),
      ),
    },
    servingSenses: {
      note:
        'R184/R190 — "live" names four things and REACHABLE names WHO. ENG-003 is none of them. '
        + 'The same words are used on both sides: a bare "reachable" is not written here either.',
      PUBLISHED: items.filter((i) => i.status === 'LIVE').length,
      SERVABLE: items.filter((i) => i.status === 'LIVE' && i.pool === 'PRACTICE').length,
      'REACHABLE(paid)': 0,
      'REACHABLE(free)': 0,
      why: 'no Case names en-spag-*, and neither SpaG quarter is in QUARTER_ORDER — deliberately, '
        + 'until these items publish (R175).',
    },
    shuffleWarning:
      'R191 — ERROR-SPOT IS NOT EXCLUDED FROM THE OPTION SHUFFLE. The serving path shuffles at one '
      + 'site with no branch on family or `segmentsInOptions`, and the renderer lays segments out in '
      + 'the order it receives them. On publication, roughly 23 of every 24 children would meet a '
      + 'SCRAMBLED sentence on all 18 spot items. Nothing has shipped (all DRAFT); this is a ruling, '
      + 'not a repair. The 11-of-15-keys-at-A lean is therefore a DRAFTING habit in the authored '
      + 'bank, not a child-facing exploit: the permutation is per child and uniform (R189).',
    gapFieldInThisStore: items.some((i) => typeof (i.stem as { gapIndex?: unknown })?.gapIndex === 'number')
      ? 'gapIndex' : 'gapRef',
    items: items.map((i) => ({
      itemId: i.id,
      questionTypeId: i.questionTypeId,
      family: FAMILY_BY_TYPE[i.questionTypeId] ?? null,
      difficultyTier: i.difficultyTier,
      status: i.status,
      pool: i.pool,
      lineRefs: i.lineRefs,
      stem: i.stem,
      options: i.options.map((o) => ({
        id: o.id,
        content: o.content,
        isCorrect: o.isCorrect,
        misconceptionId: o.misconceptionId,
        misconceptionStatus: o.misconception?.status ?? null,
        childHint: o.misconception?.childHint ?? null,
      })),
      explanation: i.explanation,
      authoredBy: i.authoredBy,
    })),
    vehicles,
    limits: [
      'Cowork is authoritative for authored item content (CLAUDE.md). This is what the DB holds so a '
      + 'drift is visible; it is not an instruction to overwrite anything on that side.',
      'childHint comes from the misconception library, which the DB authors (R25). Propose changes as '
      + 'a transform against the quoted text, never as a rewrite.',
    ],
  };
  const stamp = artefactStamp(body, generatedAt, 'content',
    'ENG-003 as the database holds it, with the cloze vehicles', ['items', 'vehicles']);
  const path = join(OUT_DIR, stampedName('eng003-spag-current', stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ ...body, stamp }, null, 2));
  deliver(path, 'eng003-spag-current');
}

/**
 * THE DISAMBIGUATION, CROSSING (David's ruling, 2026-08-17 — R200).
 *
 * Cowork's store carries both names and cannot say whether they are one person. **This store
 * already distinguishes them and Cowork cannot see that it does**, because the two places the
 * distinction lives — the misconception `approvalNote` and the AttributionEvent notes — are the two
 * classes `check:return-leg` reports STALE. R88 again, and this time the thing that never crossed is
 * the answer to the question being asked.
 *
 * The fact is now settled by David (same person; she signs Annie, he wrote Anne into briefs and
 * addenda from August) with a written confirmation to follow. **The channel is still the finding**,
 * so this crosses regardless: a fact settled in conversation and a fact that travelled are two
 * different things, which is the whole of R88.
 *
 * IT REPORTS THE SIX ANNOTATIONS, IT DOES NOT REWRITE THEM. They currently say Cowork's
 * `approvedBy: Anne` never crossed and is not asserted here — which was exactly right, and becomes
 * stale in the OTHER direction once the confirmation lands. That edit waits for the artefact.
 */
async function exportReviewerIdentity(generatedAt: string): Promise<void> {
  const reviewers: Array<Record<string, unknown>> = await prisma.$queryRaw`select * from "Reviewer"`;
  const events = await prisma.attributionEvent.findMany({ orderBy: { at: 'asc' } });
  const carriesAnneOnly = (row: unknown) => {
    const s = JSON.stringify(row);
    return /\banne\b/i.test(s) && !/\bannie\b/i.test(s);
  };
  const anneRows = (events as Array<Record<string, unknown>>).filter(carriesAnneOnly);
  const annieRows = (events as Array<Record<string, unknown>>).filter((e) => /\bannie\b/i.test(JSON.stringify(e)));

  const lib = await prisma.misconception.findMany({ select: { approvedBy: true } });
  const approverValues = new Map<string, number>();
  for (const m of lib) approverValues.set(String(m.approvedBy), (approverValues.get(String(m.approvedBy)) ?? 0) + 1);

  requirePopulation('export:for-cowork reviewer-identity', {
    'attribution events': events.length,
    'rows naming Anne only': anneRows.length,
    'rows naming Annie': annieRows.length,
  });

  const body = {
    kind: 'reviewer-identity-disambiguation',
    note:
      'ANNE AND ANNIE ARE ONE PERSON. Settled by David, 2026-08-17: she signs Annie; he wrote Anne '
      + 'into briefs and addenda from August. A written confirmation is being produced so the merge '
      + 'has an artefact; this file is sent BEFORE it, because the fact was already settled here and '
      + 'the channel that should have carried it was not working.',
    generatedAt,
    settledBy: { actor: 'human:david@cluecrew.test', on: '2026-08-17', artefact: 'PENDING — written confirmation in preparation' },
    whatThisStoreAsserts: {
      headline: 'NOTHING TO MERGE ON THIS SIDE. Neither name has ever been an approver value here.',
      approvedByValuesAcrossTheLibrary: Object.fromEntries([...approverValues].sort((a, b) => b[1] - a[1])),
      reviewerRows: reviewers.map((r) => ({ id: r.id, displayName: r.displayName, evidence: r.evidence })),
      rowsNamingAnnie: annieRows.length,
      rowsNamingAnneOnly: anneRows.length,
    },
    theSixAnneRows: {
      note:
        'Every occurrence of "Anne" in this store is a QUOTATION OF COWORK\'S OWN STRING, not a claim. '
        + 'All six are AttributionEvent notes from ONE act on 2026-08-16, and each says in terms that '
        + 'the claim did not cross. They are reported here, NOT rewritten: they become stale in the '
        + 'other direction when the written confirmation lands, and that edit waits for the artefact.',
      rows: anneRows.map((e) => ({
        id: e.id,
        at: e.at,
        action: e.action,
        recordType: e.recordType,
        recordId: e.recordId,
        field: e.field,
        actor: e.actor,
        note: e.note,
        method: e.method,
      })),
    },
    theChannelIsTheFinding: {
      note:
        'This disambiguation was settled in this store on 2026-08-16 and has never reached Cowork, '
        + 'because it lives in exactly the two classes check:return-leg reports STALE.',
      staleClasses: [
        'Misconception approvals — boundary notes, method, approver',
        'Attribution events — the reasoning attached to every named ruling',
      ],
      consequence:
        'Cowork was inferring from its own file that two names might be two people, while the '
        + 'sentence saying otherwise sat one un-travelled export away. An untravelled path and an '
        + 'absent path are the same thing (R88).',
    },
    limits: [
      'This store does not and did not assert that Anne and Annie are one person. It asserts only '
      + 'that Cowork\'s approvedBy: Anne never crossed. The identity is settled by DAVID, above, and '
      + 'the artefact is pending.',
      'The six annotations are unchanged. Do not read them as current doubt: they are a true record '
      + 'of what had crossed as of 2026-08-16.',
    ],
  };
  const stamp = artefactStamp(body, generatedAt, 'status',
    'every row in this store naming Anne or Annie, and what it does and does not assert',
    ['theSixAnneRows']);
  const path = join(OUT_DIR, stampedName('reviewer-identity-disambiguation', stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ ...body, stamp }, null, 2));
  deliver(path, 'reviewer-identity-disambiguation');
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  await exportVr04Sixteen(generatedAt);
  await exportEng003(generatedAt);
  await exportReviewerIdentity(generatedAt);
  await prisma.$disconnect();
}

void main();
