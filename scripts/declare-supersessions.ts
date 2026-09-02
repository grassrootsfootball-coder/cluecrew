/**
 * DECLARE THE SUPERSESSIONS THAT ALREADY HAPPENED (R983's backfill).
 *
 * `check:supersession-declared` refuses three cases whose content moved out from under
 * `bb6be0d3` with nothing on record saying so. Two of the three were ruled amendments and one was
 * a regeneration; all three were correct acts, and none of them told the store that was binding to
 * the population they replaced. **That is the omission the check now makes impossible, and this is
 * the arrears.**
 *
 * A notice is DERIVED, never hand-written: the moved rows and their before/after digests come from
 * comparing the live rows with the population, so a notice cannot claim a row moved that did not,
 * or miss one that did.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { compareToPopulation, rowDigest, ROW_DIGEST_SPEC, type BindableRow, type SupersessionNotice } from './lib/population-binding';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const NOTICES = pjoin(REPO, 'content', 'supersessions');
const POP = 'bb6be0d3f2fed905399329e5c18d7a25a707d6d909150eb2ee45e1227c2e8fab';
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

/** Why each case moved — the ruling, not a guess. Anything not named here is refused, not assumed. */
const REASONS: Record<string, string> = {
  'case-vr-02': 'her 197th and 200th: four taggings and the seat re-authorings landed on this case, matched on the replaced VALUE rather than the option label (R936).',
  'case-vr-05': 'the PEAR row was dispositioned and its seat amended; one row only.',
  'case-vr-19': 'the vr-19 regeneration this store proposed and her 203rd accepted at the regeneration artefact\'s own digest — every coded word replaced so that each repeats a letter (her 201st).',
};

async function main() {
  mkdirSync(NOTICES, { recursive: true });
  const pop = JSON.parse(readFileSync(pjoin(LANE, 'vr-arc-census-and-population-bb6be0d3f2fed905.json'), 'utf8')) as { SECTIONS: Array<{ caseId: string; questionType: string; rows: BindableRow[] }> };
  const byCase = new Map<string, { qt: string; rows: BindableRow[] }>();
  for (const s of pop.SECTIONS) {
    const e = byCase.get(s.caseId) ?? { qt: s.questionType, rows: [] };
    e.rows.push(...s.rows);
    byCase.set(s.caseId, e);
  }
  requirePopulation('declare-supersessions', { 'case(s) in the population': byCase.size });

  const written: SupersessionNotice[] = [];
  for (const [caseId, { qt, rows: was }] of [...byCase].sort()) {
    const live = await prisma.item.findMany({ where: { questionTypeId: qt }, orderBy: { id: 'asc' },
      select: { id: true, stem: true, solution: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
    const now: BindableRow[] = live.map((r) => ({ itemId: r.id, stem: r.stem, solution: r.solution,
      options: r.options.map((o) => ({ value: (o.content as { value?: unknown })?.value, isKey: o.isCorrect })) }));
    const d = compareToPopulation(now, was);
    if (d.contentUnchanged) continue;
    const reason = REASONS[caseId];
    if (!reason) throw new Error(`${caseId} diverged and no ruling is named for it. A supersession states WHY the rows moved; inventing one would make the notice a guess wearing a record's shape.`);

    const wasById = new Map(was.map((r) => [r.itemId, rowDigest(r)]));
    const nowById = new Map(now.map((r) => [r.itemId, rowDigest(r)]));
    const notice: SupersessionNotice = {
      supersedesPopulation: POP,
      caseId, questionType: qt, reason,
      declaredOn: '2026-09-02',
      rowsMoved: d.moved.map((id) => ({ itemId: id, rowSha256Was: wasById.get(id)!, rowSha256Now: nowById.get(id)! })),
      caseDigestWas: d.caseDigestAsRecorded,
      caseDigestNow: d.caseDigestNow,
      rowDigestSpec: ROW_DIGEST_SPEC,
      andWHATTHEOTHERSTORESHOULDDO: `re-bind these ${d.moved.length} row(s) before authoring against them; the other ${was.length - d.moved.length} row(s) of this case are unchanged and anything already authored against them still lands.`,
    };
    writeFileSync(pjoin(NOTICES, `${caseId}-supersedes-${POP.slice(0, 12)}.json`), JSON.stringify(notice, null, 1));
    written.push(notice);
    console.log(`  ${caseId}: ${d.moved.length} row(s) moved — notice written`);
  }

  const bundle = {
    kind: 'SUPERSESSION-NOTICES',
    TO: 'the authoring store; David and Annie by relay',
    date: '2026-09-02',
    WHY: 'you bind your lane to bb6be0d3. These cases have moved underneath it and nothing on your disk could tell you. Each notice names the rows whose CONTENT moved, with digests before and after, so you re-bind only what changed.',
    WHAT_NEEDS_NO_NOTICE: 'ten of eleven cases differ from bb6be0d3 only because the population stringified numeric option values — `"7"` where the row holds `7`. The content never moved and nothing bound to those rows is describing them wrongly. Serialisation is not supersession.',
    ANDFROMHEREITISENFORCED: 'pnpm check:supersession-declared compares every crossed population against the live rows and refuses when a case has moved with no notice. A regeneration that lands undeclared now fails the build that follows it, rather than being discovered by refusal at your door.',
    NOTICES: written,
  };
  const clean = JSON.parse(JSON.stringify(bundle)) as Record<string, unknown>;
  const keys = ['NOTICES', 'WHAT_NEEDS_NO_NOTICE'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('supersession-notices', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'supersession-notices').split('/').pop()!;
  const finalSha = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${finalSha}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
  console.log(`\n  crossed: ${name} (FILE ${finalSha.slice(0, 16)})`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
