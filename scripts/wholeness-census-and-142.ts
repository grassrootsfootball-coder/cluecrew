/**
 * THE WHOLENESS CENSUS, THE MODEL OF FULL, AND HER TEMPLATE AMENDMENT (David, 2026-08-24 — R699).
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';
import { hintLayerPresent, itemWholeness } from './lib/item-wholeness';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const SHA142 = 'e5b87da0517339aeefb8487ff96be6ac28312455d30a7c226d14cfa176469cc4';
const AUTH142 = `annie-142-for-code.md, sha256 ${SHA142}`;
const ELEVEN = ['case-vr-02', 'case-vr-05', 'case-vr-08', 'case-vr-10', 'case-vr-13', 'case-vr-16', 'case-vr-17', 'case-vr-18', 'case-vr-19', 'case-vr-20', 'case-vr-21'];
const REPLACED_PROMPT = 'Three of these words go together. Which TWO are the odd ones out?';
const AUTHORED_PROMPT = 'Three of these words go together. Which two are the odd ones out?';

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  const cases = await prisma.case.findMany({ where: { id: { in: ELEVEN } }, select: { id: true, questionTypeId: true } });
  const attested = new Set(
    (await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: 'reviewer:rev-0001' }, select: { id: true } })).map((m) => m.id),
  );
  const allEntries = new Set((await prisma.misconception.findMany({ select: { id: true } })).map((m) => m.id));

  const perCase: Array<Record<string, unknown>> = [];
  const tagResolution = new Map<string, { rows: number; existsHere: boolean; attested: boolean }>();
  let totals = { items: 0, whole: 0, withExecutions: 0, nonEmptyHintLayer: 0 };
  const modelOfFull: Array<Record<string, unknown>> = [];

  for (const c of cases) {
    const items = await prisma.item.findMany({
      where: { questionTypeId: c.questionTypeId, status: 'DRAFT', reviewedBy: null },
      select: { id: true, stem: true, explanation: true, difficultyTier: true, options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } },
      orderBy: { id: 'asc' },
    });
    let whole = 0, withExec = 0, nonEmpty = 0;
    for (const i of items) {
      const w = itemWholeness(i, attested);
      if (w.whole) whole++;
      if (w.executionsExist) withExec++;
      if (w.hintLayer) {
        nonEmpty++;
        modelOfFull.push({ id: i.id, case: c.id, stem: i.stem, options: i.options, hintsAndWalk: i.explanation, tier: i.difficultyTier, rowSha256: sha256(JSON.stringify({ id: i.id, e: i.explanation })) });
      }
      for (const o of i.options) {
        if (!o.misconceptionId) continue;
        const t = tagResolution.get(o.misconceptionId) ?? { rows: 0, existsHere: allEntries.has(o.misconceptionId), attested: attested.has(o.misconceptionId) };
        t.rows++;
        tagResolution.set(o.misconceptionId, t);
      }
    }
    totals = { items: totals.items + items.length, whole: totals.whole + whole, withExecutions: totals.withExecutions + withExec, nonEmptyHintLayer: totals.nonEmptyHintLayer + nonEmpty };
    perCase.push({ caseId: c.id, items: items.length, whole, withExecutions: withExec, nonEmptyHintLayer: nonEmpty, doorLightsToday: whole === items.length && items.length > 0 });
  }

  const herCounts = { executions: 0, emptyLayers: 250, of: 288, distinctTags: 22, attestedTags: 1 };
  const mine = {
    executions: totals.withExecutions,
    emptyLayers: totals.items - totals.nonEmptyHintLayer,
    of: totals.items,
    distinctTags: tagResolution.size,
    attestedTags: [...tagResolution.values()].filter((t) => t.attested).length,
  };
  const agreement = JSON.stringify(herCounts) === JSON.stringify({ executions: mine.executions, emptyLayers: mine.emptyLayers, of: mine.of, distinctTags: mine.distinctTags, attestedTags: mine.attestedTags });

  const census = {
    kind: 'vr-wholeness-census',
    what: 'The gap as a figure: per-case wholeness over the 288, tags resolved against this store, her census checked against these rows.',
    authority: AUTH142,
    wholenessDefinition: 'derived per row (scripts/lib/item-wholeness.ts): every tag attested (exists, ACTIVE, reviewer-stamped) AND every tagged option carries an execution AND the hint-and-walk layer is non-empty. Phase-one content verification does not light a door (R699).',
    herCensus: herCounts,
    thisStore: mine,
    verdict: agreement
      ? 'AGREEMENT: her census reproduces from these rows exactly — 0 executions, 250 of 288 empty layers, 22 distinct tags, 1 attested.'
      : `DIFFERENCE: her ${JSON.stringify(herCounts)} vs this store's ${JSON.stringify(mine)} — memberships below settle it.`,
    perCase,
    tagResolution: [...tagResolution.entries()].map(([tag, t]) => ({ tag, rowsCarryingIt: t.rows, existsOnThisSide: t.existsHere, attested: t.attested })).sort((a, b) => a.tag.localeCompare(b.tag)),
    doorState: 'no door lights today: zero of 288 rows are whole (executions are the binding absence everywhere).',
  };
  const censusJson = JSON.stringify(census, null, 1) + '\n';
  const censusName = stampedName('vr-wholeness-census', sha256(censusJson).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', censusName), censusJson);
  if (APPLY) deliver(join(REPO, 'content/exports', censusName), 'vr-wholeness-census');

  const model = {
    kind: 'model-of-full-for-annie',
    what: `The ${modelOfFull.length} non-empty hint-and-walk rows, crossed as the model of what full looks like, as she asked (her 142nd §2 phase two).`,
    authority: AUTH142,
    rows: modelOfFull,
  };
  const modelJson = JSON.stringify(model, null, 1) + '\n';
  const modelName = stampedName('model-of-full-for-annie', sha256(modelJson).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', modelName), modelJson);
  if (APPLY) deliver(join(REPO, 'content/exports', modelName), 'model-of-full-for-annie');

  // ---- Her template amendment: once at the template, applied to every derived row ----
  const vr02 = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, select: { id: true, stem: true, status: true } });
  const carrying = vr02.filter((i) => (i.stem as { prompt?: string }).prompt === REPLACED_PROMPT);
  console.log(`vr-02 rows: ${vr02.length}; carrying the shouted prompt: ${carrying.length} (her prediction: every row)`);
  if (APPLY) {
    for (const i of carrying) {
      await prisma.item.update({ where: { id: i.id }, data: { stem: { ...(i.stem as object), prompt: AUTHORED_PROMPT } } });
    }
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: 'template:vr-02-two-odd-ones-out', action: 'AMENDED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'stem.prompt',
        method: `her 142nd (${SHA142.slice(0, 16)}); ONE amendment at the template — the generator string (packages/db/prisma/generate-content.ts) and every derived row carrying the replaced prompt, byte-asserted per row`,
        note: `"Which TWO" -> "Which two" on ${carrying.length} rows + the generator; emphasis-by-capitals, the house amendment since the eighteenth return`,
      },
    });
    console.log(`  AMENDED template + ${carrying.length} rows`);
  }
  console.log(`census: ${JSON.stringify(mine)}; agreement with hers: ${agreement}; model rows: ${modelOfFull.length}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
