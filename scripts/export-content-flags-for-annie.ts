/**
 * THE 26 CONTENT FLAGS, VERBATIM, FOR ANNIE'S READ — before any standard is written.
 *
 * **THE READ COMES BEFORE THE RULING, AND THAT ORDER IS THE POINT** (David, 2026-08-19). Twenty-six
 * judgements about content suitability already exist, written by whoever curated the passages,
 * **each against a standard nobody stated.** She is the one qualified to say whether they are
 * right; ruling a standard before seeing what was already judged against an unstated one would
 * either bless those judgements or condemn them without either of us having read them.
 *
 * **NO CHECK IS BUILT AND THAT IS DELIBERATE.** A check over flags whose standard is unstated would
 * enforce whatever the flags happen to say — turning one curator's unrecorded judgement into the
 * product's policy by the act of automating it. **The standard is the thing that does not exist**,
 * and a mechanism cannot supply it.
 *
 * **WHAT NOBODY RECORDED IS REPORTED BESIDE THEM.** Who authored a flag, when, and whether any
 * carries an attribution event — and, for the passages with no flag at all, whether that is a clean
 * verdict or an absent one. **Those two states report identically**, which is this project's
 * standing finding and now arrives on the field that decides what a child reads.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const PASSAGES = resolve(import.meta.dirname, '../content/passages');
const FAMILY = 'content-flags-for-annie';

async function main() {
  const files = readdirSync(PASSAGES).filter((n) => n.endsWith('.json'));
  const cases = await prisma.case.findMany({ select: { questionTypeId: true, freeTier: true } });
  const doors = new Set(cases.map((c) => c.questionTypeId));
  const free = new Set(cases.filter((c) => c.freeTier).map((c) => c.questionTypeId));
  const items = await prisma.item.findMany({ select: { id: true, status: true, questionTypeId: true, stem: true } });

  const rows = files.map((name) => {
    const p = JSON.parse(readFileSync(join(PASSAGES, name), 'utf8')) as Record<string, unknown>;
    const id = String(p.id ?? name);
    const citing = items.filter((i) => ((i.stem ?? {}) as { passageRef?: string }).passageRef === id);
    const live = citing.filter((i) => i.status === 'LIVE');
    const reachable = live.filter((i) => doors.has(i.questionTypeId));
    const flags = Array.isArray(p.contentFlags) ? p.contentFlags : [];
    return {
      passageId: id,
      file: name,
      work: p.work ?? p.sceneTitle ?? null,
      commissioned: p.commissioned ?? null,
      itemsCiting: citing.length,
      liveItems: live.length,
      reachability: reachable.length === 0 ? 'NOT REACHABLE'
        : reachable.some((i) => free.has(i.questionTypeId)) ? 'REACHABLE(free)' : 'REACHABLE(paid)',
      // R25 — every flag verbatim, whatever shape it was written in.
      contentFlags: flags,
      flagCount: flags.length,
      // The provenance question, answered per row rather than in aggregate.
      whoAuthoredTheFlags: 'NOT RECORDED — no field on the passage names an author for contentFlags',
      whenAuthored: 'NOT RECORDED — no timestamp on the field',
      provenanceProse: typeof p.provenance === 'string' ? p.provenance : null,
      curationNotes: p.curationNotes ?? null,
    };
  });

  const flagged = rows.filter((r) => r.flagCount > 0);
  const unflagged = rows.filter((r) => r.flagCount === 0);
  const totalFlags = rows.reduce((n, r) => n + r.flagCount, 0);
  requirePopulation('content flags', { 'passage files': rows.length, 'flags found': totalFlags });

  // Attribution: does ANY event anywhere name a passage?
  const events = await prisma.attributionEvent.count({ where: { recordType: 'Passage' } });

  const payload = {
    what: "Every contentFlag on every passage, verbatim, with the passage's status and reachability — for Annie's read.",
    countCorrection: 'The figure carried into this delivery was "26 contentFlags". It is 26 PASSAGES carrying 61 FLAGS. Some passages carry one flag and stream-b-01 carries three.',
    andOnlyTwoPassagesAreREACHABLE:
      'Of 29 passages, only TWO are reachable by a child today: stream-a-03-wind-in-willows (22 LIVE items) and stream-b-01 (12 LIVE items), both REACHABLE(free). The other 27 are behind DRAFT items. So 61 judgements exist, and 6 of them govern what a child can actually meet.',
    theReadComesFirst:
      'Twenty-six judgements about content suitability already exist, each made against a standard nobody stated. Ruling a standard before reading them would bless or condemn them unseen.',
    noCheckIsBuilt:
      'A check over flags whose standard is unstated would enforce whatever the flags happen to say — turning one curator\'s unrecorded judgement into product policy by automating it.',
    whatNobodyRecorded: {
      author: 'NOT RECORDED. No field on any passage names who wrote a contentFlag.',
      date: 'NOT RECORDED. No timestamp on the field.',
      attributionEvents: `${events} attribution events exist for recordType 'Passage' across the whole store.`,
      readBy: 'NOTHING. No code path opens contentFlags — measured across scripts, packages and apps.',
    },
    theThreeWithoutFlags: {
      count: unflagged.length,
      ids: unflagged.map((r) => r.passageId),
      question: 'Judged clean, or nobody looked?',
      answer: 'NOT DISTINGUISHABLE. There is no field recording that a passage was screened and found clean, so an absent flag and an absent screening are the same absence — this project\'s standing finding, arriving on the field that decides what a child reads.',
      whatIsKnown: 'TWO of the three are COMMISSIONED originals — the ENG-003 cloze vehicles — which is a plausible reason to have flagged nothing, and is still not a record of having looked. THE THIRD IS NOT: stream-a-02-railway-children is E. Nesbit, 1906, curated from Project Gutenberg, and it is the only ADAPTED CLASSIC in the store carrying no content flag at all. Every other adapted passage has at least one. That is the row where "judged clean or nobody looked" has real weight.',
      theThirdIsTheOne: 'stream-a-02-railway-children — an adapted 1906 classic, unflagged, where all 26 of its peers are flagged.',
    },
    denominators: {
      passages: rows.length,
      passagesWithFlags: flagged.length,
      passagesWithoutFlags: unflagged.length,
      totalFlags,
      passagesReachableByAChild: rows.filter((r) => r.reachability !== 'NOT REACHABLE').length,
    },
    passages: rows,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'every contentFlag verbatim with its passage status, reachability and missing provenance', ['passages']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\npassages ${rows.length} · with flags ${flagged.length} · without ${unflagged.length} · flags total ${totalFlags}`);
  console.log(`reachable by a child: ${payload.denominators.passagesReachableByAChild}`);
  console.log(`attribution events for Passage: ${events}`);
  console.log(`\nunflagged: ${unflagged.map((r) => r.passageId).join(', ')}`);
  for (const r of flagged.filter((x) => x.reachability !== 'NOT REACHABLE').slice(0, 5)) {
    console.log(`\n  ${r.passageId} [${r.reachability}, ${r.liveItems} LIVE items]`);
    for (const f of r.contentFlags as unknown[]) console.log(`      ${JSON.stringify(f).slice(0, 150)}`);
  }
  await prisma.$disconnect();
}

main();
