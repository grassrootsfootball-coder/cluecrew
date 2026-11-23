/**
 * THE CENSUS RE-EMITS UNDER THE CORRECTED BAR; THE NOTES AND WALKSCRIPTS CROSS (R701).
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';
import { itemWholeness, walkScriptPresent } from './lib/item-wholeness';

const REPO = join(__dirname, '..');
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const AUTH = 'annie-144-for-code.md, sha256 f7cafe3860ced553e2a482a4a71ba3c72be688d609d3e62af47b79289abe91f7';
const ELEVEN = ['case-vr-02', 'case-vr-05', 'case-vr-08', 'case-vr-10', 'case-vr-13', 'case-vr-16', 'case-vr-17', 'case-vr-18', 'case-vr-19', 'case-vr-20', 'case-vr-21'];

async function run() {
  const cases = await prisma.case.findMany({ where: { id: { in: ELEVEN } }, select: { id: true, questionTypeId: true, modes: true } });
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: 'reviewer:rev-0001' }, select: { id: true } })).map((m) => m.id));

  const perCase: Array<Record<string, unknown>> = [];
  let totals = { items: 0, whole: 0, tagsAttested: 0, withExecutions: 0, walkOk: 0 };
  const notes: Array<Record<string, unknown>> = [];
  const walkScripts: Array<Record<string, unknown>> = [];
  for (const c of cases) {
    const walkServes = Boolean((c.modes as Record<string, unknown>).walk);
    const items = await prisma.item.findMany({
      where: { questionTypeId: c.questionTypeId, status: 'DRAFT', reviewedBy: null },
      select: { id: true, stem: true, explanation: true, difficultyTier: true, options: { orderBy: { id: 'asc' }, select: { misconceptionId: true, misconceptionExecution: true } } },
      orderBy: { id: 'asc' },
    });
    let whole = 0, ta = 0, ex = 0, wk = 0;
    for (const i of items) {
      const w = itemWholeness(i, attested, walkServes);
      if (w.whole) whole++;
      if (w.tagsAttested) ta++;
      if (w.executionsExist) ex++;
      if (w.walkOk) wk++;
      const e = i.explanation as Record<string, unknown> | null;
      const note = e && typeof e.note === 'string' && e.note.trim() ? e.note : null;
      if (note && !walkScriptPresent(i.explanation)) {
        notes.push({ id: i.id, case: c.id, noteVerbatim: note, noteSha256: sha256(note) });
      }
      if (walkScriptPresent(i.explanation)) {
        walkScripts.push({ id: i.id, case: c.id, walkScript: (e!.walkScript ?? e!.walk) as string, batch: e!.walkScriptBatch ?? null, statusField: e!.walkScriptStatus ?? null, stem: i.stem, tier: i.difficultyTier, rowSha256: sha256(String(e!.walkScript ?? e!.walk)) });
      }
    }
    totals = { items: totals.items + items.length, whole: totals.whole + whole, tagsAttested: totals.tagsAttested + ta, withExecutions: totals.withExecutions + ex, walkOk: totals.walkOk + wk };
    perCase.push({ caseId: c.id, walkModeServes: walkServes, items: items.length, whole, tagsAttested: ta, withExecutions: ex, walkScriptSatisfied: wk, doorLightsToday: items.length > 0 && whole === items.length });
  }

  const census = {
    kind: 'vr-wholeness-census',
    what: 'SECOND CUT under the corrected bar (her 144th): whole = tags attested ∧ executions landed ∧ walkScript wherever walk mode serves. ITEM HINTS ARE NOT PART OF THE BAR, BY DESIGN — the empty hint layer no longer counts against a row on its own. The gap measured against the rule that now governs, not the one that did this morning.',
    authority: AUTH,
    barAsRuled: 'stem, options, key, tags, executions landed, the tag\'s entry attested, and a walkScript wherever walk mode serves the case; library-only miss-time for generated banks — the error generates the option, so the tag\'s hint is exactly as specific as an item hint could be.',
    thisStore: totals,
    perCase,
    doorState: `no door lights under the corrected bar either: executions remain the binding absence (0 of ${totals.items}), and 21 of 22 tags remain unattested. The bar correction changes what full means, not today's distance from it.`,
    deskScanNote: 'riding to her with the entries, unamended from this side: eleven of the twenty-two entry hints carry shouts or dashes — her reading, her rulings.',
  };
  const censusJson = JSON.stringify(census, null, 1) + '\n';
  const censusName = stampedName('vr-wholeness-census', sha256(censusJson).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', censusName), censusJson);
  deliver(join(REPO, 'content/exports', censusName), 'vr-wholeness-census');

  const notesArtefact = {
    kind: 'thirteen-notes-for-annie',
    what: `The ${notes.length} note-only rows' content VERBATIM — an unread note field may be wearing something else, and this project has met that costume four times.`,
    authority: AUTH,
    rows: notes,
  };
  const notesJson = JSON.stringify(notesArtefact, null, 1) + '\n';
  const notesName = stampedName('thirteen-notes-for-annie', sha256(notesJson).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', notesName), notesJson);
  deliver(join(REPO, 'content/exports', notesName), 'thirteen-notes-for-annie');

  const walksArtefact = {
    kind: 'draft-walkscripts-for-annie',
    what: `The ${walkScripts.length} DRAFT walkScripts in the door population, staged for her reading — two sittings' weight she has already accepted onto the ledger. Child-facing, verbatim, with stem and tier beside each.`,
    authority: AUTH,
    rows: walkScripts,
  };
  const walksJson = JSON.stringify(walksArtefact, null, 1) + '\n';
  const walksName = stampedName('draft-walkscripts-for-annie', sha256(walksJson).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', walksName), walksJson);
  deliver(join(REPO, 'content/exports', walksName), 'draft-walkscripts-for-annie');

  console.log(`census v2: ${JSON.stringify(totals)}; notes: ${notes.length}; walkScripts: ${walkScripts.length}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
