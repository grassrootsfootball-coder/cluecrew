/**
 * CASE-EN-06, PARTS ONE TO THREE (David's build instruction, 2026-08-24 — R686).
 * Part four — publication — executes ONLY on the desk's go; nothing here flips an item LIVE.
 *
 *  1. The Case row, face failing closed: empty title, empty narrative slot. `caseFaceServes`
 *     keeps it invisible to every child until an Annie-approved wording lands through
 *     `scripts/lib/case-face.ts` (the NVR-notice pattern).
 *  2. The publication membership, DERIVED from the rows and reported before anything moves.
 *  3. The standing walls, asserted on the report's face from bytes and live runs — derived,
 *     not recalled. Each wall names its source (R41).
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  // ---- Part one: the row, face failing closed ----
  const existing = await prisma.case.findUnique({ where: { id: 'case-en-06' } });
  if (existing) {
    console.log('case-en-06 already exists — face state:', existing.title === '' ? 'EMPTY (fails closed)' : `LANDED: ${existing.title}`);
    // THE DOOR EXTENSION (David's ruling, second emission — R687): en-06 maps spelling-spot too.
    if (APPLY && !existing.mappedQuestionTypeIds.includes('en-spag-spelling-spot')) {
      await prisma.case.update({ where: { id: 'case-en-06' }, data: { mappedQuestionTypeIds: ['en-spag-spelling-spot'] } });
      console.log('  MAPPED  en-spag-spelling-spot onto case-en-06 (read by itemPool)');
    }
  } else if (APPLY) {
    await prisma.case.create({
      data: {
        id: 'case-en-06',
        questionTypeId: 'en-spag-cloze',
        title: '',
        narrativeIntro: { state: 'EMPTY — the face lands ONLY through scripts/lib/case-face.ts, Annie-approved with her return digest as authority. An empty face renders nothing (caseFaceServes).' },
        modes: { state: 'EMPTY — authored with the face' },
        orderInDistrict: 27,
        freeTier: false,
      },
    });
    console.log('  CREATED case-en-06 — ENGLISH via en-spag-cloze, PAID (freeTier: false), order 27, FACE EMPTY (fails closed)');
  } else {
    console.log('  WOULD CREATE case-en-06 (en-spag-cloze, PAID, order 27, face empty)');
  }

  // ---- Part two: the publication membership, derived ----
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-003' } },
    select: { id: true, status: true, questionTypeId: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } },
    orderBy: { id: 'asc' },
  });
  if (items.length !== 34) throw new Error(`REFUSED — expected the 34 signed ENG-003 items, found ${items.length}`);
  const byType = new Map<string, typeof items>();
  for (const i of items) byType.set(i.questionTypeId, [...(byType.get(i.questionTypeId) ?? []), i]);

  const EN06_TYPES = ['en-spag-cloze', 'en-spag-spelling-spot'];
  const en06Items = EN06_TYPES.flatMap((qt) => byType.get(qt) ?? []);
  const otherHomes = [...byType.entries()].filter(([qt]) => !EN06_TYPES.includes(qt));
  const casesByType = new Map(
    (await prisma.case.findMany({ select: { id: true, questionTypeId: true } })).map((c) => [c.questionTypeId, c.id]),
  );

  const cza2 = items.find((i) => i.id === 'ENG-003-A-CZ-A2');
  if (!cza2) throw new Error('REFUSED — ENG-003-A-CZ-A2 not among the 34');

  const membership = {
    mapToEn06: {
      questionTypes: EN06_TYPES,
      mapping: 'en-spag-cloze is the PRIMARY (mastery/pacing unit); en-spag-spelling-spot rides the mappedQuestionTypeIds column, read by itemPool (R687). THE NINE SPELLING-SPOT ITEMS ARE NO LONGER HOMELESS — the door extension homes them here.',
      statedLimit: 'mastery and pacing stay keyed to the primary type; the mapping widens only the item pool. If the desk wants per-type mastery on a two-type case, that is a separate ruling.',
      count: en06Items.length,
      items: en06Items.map((i) => ({ id: i.id, questionType: i.questionTypeId, status: i.status })),
    },
    differentHomes: otherHomes.map(([qt, rows]) => ({
      questionType: qt,
      count: rows.length,
      existingCase: casesByType.get(qt) ?? 'NO CASE EXISTS — these items have no home until one is built or ruled',
      items: rows.map((i) => i.id),
    })),
    cza2: {
      id: cza2.id, status: cza2.status,
      servingOptionCount: cza2.options.length,
      servingOptions: cza2.options.map((o) => ({ ...(o.content as Record<string, unknown>), isCorrect: o.isCorrect, misconceptionId: o.misconceptionId })),
      factOne: cza2.options.length === 3
        ? 'HOLDS THREE OPTIONS: her fourth (landed authoring-side) needs transport through the standing path before this item can go LIVE.'
        : `holds ${cza2.options.length} options — the three-option premise has changed; re-derive before acting`,
      factTwo: 'THE FOURTH\'S NULL TAG BLOCKS LIVE UNTIL ASSIGNED: the transported option must land with its misconception tag assigned, or the item stays unpublishable.',
    },
  };

  // ---- Part three: the standing walls, derived not recalled ----
  const surface = readFileSync(join(REPO, 'apps/web/components/crew/engines/wordweb.tsx'), 'utf8');
  const carrierBlock = surface.slice(surface.indexOf('data-testid="cloze-carrier"'), surface.indexOf('</p>', surface.indexOf('data-testid="cloze-carrier"')));
  const ruling1 = carrierBlock.length > 10 && !['“', '”', '&quot;', '&ldquo;', '&rdquo;'].some((q) => carrierBlock.includes(q));
  const ruling2 = ['splitCarrierAtGaps', 'aria-hidden="true"', 'fd-visually-hidden'].every((n) => surface.includes(n));
  if (!ruling1 || !ruling2) throw new Error('REFUSED — a cloze ruling is no longer on the serving surface; the wall has moved');

  const passages = ['cloze-eng003-a-eco-club', 'cloze-eng003-b-sports-day'].map((pid) => {
    const p = JSON.parse(readFileSync(join(REPO, 'content/passages', `${pid}.json`), 'utf8')) as { passageStatus?: { status?: string } };
    return { pid, status: p.passageStatus?.status ?? 'ABSENT' };
  });
  if (!passages.every((p) => p.status === 'SERVABLE')) throw new Error(`REFUSED — a passage is not SERVABLE: ${JSON.stringify(passages)}`);

  let guardResult: string;
  try {
    execSync('pnpm check:derived-writes', { cwd: REPO, stdio: 'pipe', encoding: 'utf8' });
    guardResult = 'GREEN — pnpm check:derived-writes exited 0 at report time';
  } catch {
    throw new Error('REFUSED — the reviewed-content guard check failed; the wall is down');
  }

  const walls = {
    clozeRulingsOnServingSurface: {
      verdict: 'STANDING — asserted from the render-path bytes at report time (this script REFUSES if either is absent)',
      noAddedQuotes: 'the carrier block contains no quotation character',
      gapSelfNaming: 'splitCarrierAtGaps + aria-hidden marker + fd-visually-hidden name present',
      citing: 'the discharge diff, cloze-rulings-discharge-diff-1a38116305b91b68.json, sha256 1a38116305b91b688298058b5cdee400cee50905bf29515228210ea886e55a2b — verified three ways at the desk',
    },
    passagesServable: {
      verdict: passages,
      citing: "her 115th's landing (annie-115-for-code.md, sha256 365925a8… — the first front-door judgements; both passages KEEP, statuses moved through movePassageStatus with her authority)",
      source: 'read from content/passages/*.json passageStatus.status at report time',
    },
    editorialGuard: {
      verdict: guardResult,
      source: "the reviewed-content guard (packages/db/prisma/reviewed-guard.ts, R62) exercised through pnpm check:derived-writes — the write-path property that no deriving writer can rewrite reviewed rows. NAMED EXPLICITLY (R41): if the desk meant a different instrument by 'the editorial guard', this line makes the mismatch visible.",
    },
  };

  const artefact = {
    kind: 'case-en-06-build-report',
    what: 'Parts one to three of the case-en-06 build: the row created with its face failing closed; the publication membership derived from the rows; the standing walls asserted from bytes and live runs. Part four — publication — executes only on the desk\'s go; nothing has been flipped LIVE.',
    partOne: {
      row: 'case-en-06 — ENGLISH via en-spag-cloze, PAID (freeTier: false), orderInDistrict 27',
      face: 'EMPTY, FAILS CLOSED: caseFaceServes (packages/core/src/case-face.ts) keeps the case invisible to every child; the serve path (orchestrator) filters on it; the face lands only through scripts/lib/case-face.ts — MAY_JUDGE name, return digest authority, child-facing gate, prior stamped, event recorded.',
    },
    partTwo: membership,
    partThree: walls,
    partFour: 'AWAITING THE DESK\'S GO. No item status has moved.',
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  if (APPLY) {
    const name = stampedName('case-en-06-build-report', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'case-en-06-build-report');
  } else {
    console.log('\nDRY REPORT PREVIEW:');
    console.log(`  en-06 items: ${membership.mapToEn06.count}; other homes: ${membership.differentHomes.map((h) => `${h.count} ${h.questionType} -> ${h.existingCase}`).join('; ')}`);
    console.log(`  CZ-A2: ${membership.cza2.servingOptionCount} options, ${membership.cza2.status}`);
    console.log(`  walls: cloze rulings ${ruling1 && ruling2 ? 'STANDING' : 'DOWN'}; passages ${passages.map((p) => p.status).join('/')}; guard pending run`);
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
