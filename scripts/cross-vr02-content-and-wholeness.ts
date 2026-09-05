/**
 * VR-02: THE SEVENTEEN MOVED ROWS' CONTENT, AND WHICH OF THE TWENTY-FIVE ARE WHOLE
 * (David's ruling, 2026-09-05 — vr-02 is the next door).
 *
 * **A DIGEST SAYS A ROW CHANGED; IT DOES NOT SAY WHAT THE ROW NOW READS.** The authoring store's
 * ten refusals are bound to superseded bytes, and re-binding them to a new digest would tell it
 * only that its work describes something else — not what to author instead. **That is why vr-19's
 * twenty-five had to be re-authored rather than re-bound**, and it is the same shape here, so this
 * crosses the ROWS: stem, the full three-part set (key, siblings, and their tags with the wording a
 * child would receive — R573), the current row digest AND the keys it was taken over (R985).
 *
 * **AND THE FIVE SEATS ARE NAMED RATHER THAN COUNTED.** Twenty whole at the last measure is a
 * number nobody can act on; "row 07 has an untagged distractor" is a job. Wholeness is derived by
 * `itemWholeness` — the door trigger's own function, never re-implemented (R41).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { compareToPopulation, rowDigest, ROW_DIGEST_SPEC, ROW_DIGEST_SUBJECT_KEYS, digestSubject, type BindableRow } from './lib/population-binding';
import { itemWholeness } from './lib/item-wholeness';
import { threePartSet } from './lib/option-set';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { deriveList } from './lib/derived-list';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const POP = pjoin(DL, '11+', 'archive', 'from-cluecrew', '2026-08', 'vr-arc-census-and-population-bb6be0d3f2fed905.json');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const CASE = 'case-vr-02';
const ANNIE = 'rev-0001';

async function main() {
  const popBytes = readFileSync(POP);
  if (!sha(popBytes).startsWith('bb6be0d3f2fed905')) throw new Error(`the bound population does not verify: ${sha(popBytes).slice(0, 16)}`);
  const pop = JSON.parse(popBytes.toString('utf8')) as { SECTIONS: Array<{ caseId: string; rows: Array<{ itemId: string; stem: unknown; solution?: unknown; options: Array<{ value: unknown; isKey: boolean }> }> }> };
  const popRows = pop.SECTIONS.filter((s) => s.caseId === CASE).flatMap((s) => s.rows);

  const caseRow = await prisma.case.findUniqueOrThrow({ where: { id: CASE }, select: { title: true, questionTypeId: true, modes: true, freeTier: true, orderInDistrict: true } });
  const walkAsset = (caseRow.modes as Record<string, { assetRef?: string }>)?.walk;
  const walkServes = !!walkAsset?.assetRef && !walkAsset.assetRef.startsWith('placeholder/');

  const rows = await prisma.item.findMany({ where: { questionTypeId: caseRow.questionTypeId }, orderBy: { id: 'asc' },
    select: { id: true, status: true, pool: true, stem: true, solution: true, explanation: true, reviewedBy: true,
      options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('vr-02', { 'row(s)': rows.length, 'row(s) in the bound population': popRows.length });

  const library = new Map((await prisma.misconception.findMany({ select: { id: true, childHint: true } })).map((m) => [m.id, m.childHint]));
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: `reviewer:${ANNIE}` }, select: { id: true } })).map((m) => m.id));

  const bindable = (r: (typeof rows)[number]): BindableRow => ({ itemId: r.id, stem: r.stem, solution: r.solution,
    options: r.options.map((o) => ({ value: (o.content as { value?: unknown })?.value, isKey: o.isCorrect })) });
  const div = compareToPopulation(rows.map(bindable), popRows.map((r) => ({ itemId: r.itemId, stem: r.stem, solution: r.solution ?? null, options: r.options })));

  // ── ONE: THE MOVED ROWS, AS CONTENT ──────────────────────────────────────────────────────────
  const moved = deriveList(
    { name: 'the moved rows', parent: `every vr-02 row in the crossed population bb6be0d3`, rule: 'the row\'s content digest differs from the one bb6be0d3 recorded, ignoring serialisation' },
    rows, (r) => div.moved.includes(r.id),
  );
  const movedContent = moved.items.map((r) => {
    const was = popRows.find((p) => p.itemId === r.id);
    const st = r.stem as { words?: unknown[]; prompt?: unknown };
    return {
      itemId: r.id, status: r.status,
      THE_ROW_AS_THE_CHILD_MEETS_IT: { prompt: st.prompt, words: st.words },
      THE_THREE_PART_SET: threePartSet(r.options, library),
      solution: r.solution ?? null,
      rowSha256: rowDigest(bindable(r)),
      rowSha256WasInThePopulation: was ? rowDigest({ itemId: r.id, stem: was.stem, solution: was.solution ?? null, options: was.options }) : null,
      andWHATTHEROWUSEDTOREAD: was ? { words: (was.stem as { words?: unknown })?.words, options: was.options.map((o) => ({ value: o.value, isKey: o.isKey })) } : null,
    };
  });

  // ── TWO: WHOLENESS, PER ROW, WITH WHAT EACH SHORT ONE IS SHORT ───────────────────────────────
  const wholeness = rows.map((r) => {
    const w = itemWholeness(r, attested, walkServes);
    const tagged = r.options.filter((o) => o.misconceptionId !== null);
    const untagged = r.options.filter((o) => !o.isCorrect && o.misconceptionId === null).map((o) => String((o.content as { value?: unknown })?.value));
    const unattested = tagged.filter((o) => !attested.has(o.misconceptionId!)).map((o) => o.misconceptionId!);
    const noExecution = tagged.filter((o) => typeof o.misconceptionExecution !== 'string' || o.misconceptionExecution.trim() === '')
      .map((o) => ({ value: String((o.content as { value?: unknown })?.value), tag: o.misconceptionId }));
    const short: string[] = [];
    if (untagged.length) short.push(`${untagged.length} distractor(s) carry NO TAG: ${untagged.join(', ')}`);
    if (unattested.length) short.push(`${unattested.length} tag(s) NOT ATTESTED by the reviewer: ${[...new Set(unattested)].join(', ')}`);
    if (noExecution.length) short.push(`${noExecution.length} tagged option(s) carry NO EXECUTION: ${noExecution.map((x) => `${x.value} (${x.tag})`).join(', ')}`);
    if (!w.walkOk) short.push('the walk mode serves a real asset and this row has no walkScript');
    return { itemId: r.id, whole: w.whole, tagsAttested: w.tagsAttested, executionsExist: w.executionsExist, walkOk: w.walkOk, shortOf: short };
  });
  const notWhole = wholeness.filter((w) => !w.whole);

  /** The template the twenty whole rows already carry, quoted from a row rather than described. */
  const templateExample = (() => {
    for (const r of rows) for (const o of r.options) {
      if (o.misconceptionId === 'vr02-partial-group' && typeof o.misconceptionExecution === 'string' && o.misconceptionExecution.trim()) {
        return { fromRow: r.id, option: String((o.content as { value?: unknown })?.value), execution: o.misconceptionExecution };
      }
    }
    return null;
  })();

  /** For each short seat, the facts the template needs — computed by the tag predicate itself. */
  const fiveSeats = notWhole.map((w) => {
    const r = rows.find((x) => x.id === w.itemId)!;
    const key = r.options.find((o) => o.isCorrect)!;
    const seat = r.options.find((o) => o.misconceptionId !== null && (typeof o.misconceptionExecution !== 'string' || !o.misconceptionExecution.trim()))!;
    const words = ((r.stem as { words?: unknown[] }).words ?? []).map(String);
    const odd = String((key.content as { value?: unknown })?.value).split(',').map((s) => s.trim());
    const chosen = String((seat.content as { value?: unknown })?.value).split(',').map((s) => s.trim());
    const verdict = checkTagWrite({ stem: r.stem as Record<string, unknown>, optionValue: String((seat.content as { value?: unknown })?.value),
      keyValue: String((key.content as { value?: unknown })?.value), misconceptionId: seat.misconceptionId! }, () => false);
    return { itemId: r.id, seat: String((seat.content as { value?: unknown })?.value), tag: seat.misconceptionId,
      theGroupOfThree: words.filter((x) => !odd.includes(x)), theTwoOddOnes: odd,
      theOddWordInThisSeat: chosen.filter((x) => odd.includes(x)), theGroupMemberInThisSeat: chosen.filter((x) => !odd.includes(x)),
      tagGateVerdict: verdict.verdict, tagGateWhy: verdict.why };
  });

  const report = {
    kind: 'VR-02-THE-MOVED-ROWS-AS-CONTENT-AND-THE-SEATS-NAMED',
    TO: 'the authoring store; Annie and David by relay',
    date: '2026-09-05',
    THE_BOUND_POPULATION: { file: 'vr-arc-census-and-population-bb6be0d3f2fed905.json', sha256: sha(popBytes), verifiedBeforeUse: true,
      andWHEREITISNOW: 'archived out of the lane on 2026-09-05 with 840 other August files; the archive is at ~/Downloads/11+/archive/from-cluecrew/2026-08/ and every digest was re-verified on the move.' },

    ONE_THE_SEVENTEEN_AS_CONTENT: {
      whyCONTENTANDNOTDIGESTS: 'your ten refusals are bound to superseded bytes. A digest says a row CHANGED; it does not say what the row now READS, so re-binding would tell you your work describes something else without telling you what to author instead. That is why vr-19\'s twenty-five were re-authored rather than re-bound.',
      count: moved.items.length,
      derivedFrom: moved.derivedFrom,
      THE_DIGEST_SUBJECT: digestSubject(ROW_DIGEST_SUBJECT_KEYS, ROW_DIGEST_SPEC),
      andWHATEACHROWCARRIES: 'the stem as the child meets it, the FULL three-part set — the key, its siblings, and their tags with the wording a child would receive (R573) — the current rowSha256, the digest it had in bb6be0d3, and what the row used to read.',
      ROWS: movedContent,
    },

    TWO_WHICH_ROWS_ARE_WHOLE: {
      derivation: 'itemWholeness — the door trigger\'s own function, called and not re-implemented (R41). walkModeServes is false: the walk mode\'s assetRef is a placeholder, so no row owes a script (R917).',
      whole: wholeness.length - notWhole.length, of: wholeness.length,
      THE_SEATS_NAMED_RATHER_THAN_COUNTED: notWhole.map((w) => ({ itemId: w.itemId, shortOf: w.shortOf })),
      andWHYNAMEDNOTCOUNTED: '"twenty of twenty-five whole" is a number nobody can act on. "Row 17 is short one sentence" is a job.',
      THE_FIVE_ARE_ONE_DEFECT_FIVE_TIMES: {
        what: 'every one of the five is short the SAME thing: a single vr02-partial-group option carrying no misconceptionExecution. No row is short a tag, no tag is unattested, and no row owes a walk script.',
        andTHETWENTYWHOLEONESSHAREATEMPLATE: templateExample,
        theFactsTHETEMPLATENEEDS: 'the group of three, the two odd ones, which of the pair is the odd word and which is the group member — and the tag predicate ALREADY COMPUTES ALL OF THEM. It PERFORMS on all five seats.',
        perSeat: fiveSeats,
        soWHOSEJOBITIS: 'the sentence is DERIVABLE from facts this store can compute, and it is still child-facing authored content, which goes through the review pipeline and is not this store\'s to write. **What this store can say is that it is one sentence per seat, in a form twenty rows already carry, with every blank already filled by the gate.** That is the difference between a backlog and a task.',
      },
      perRow: wholeness,
    },

    THREE_WHAT_HAPPENS_WHEN_THE_RE_AUTHORINGS_CROSS: {
      theThreeGates: ['checkKeyPerformsStem — the key performs the stem\'s own task',
        'checkTagWrite — every tag names an act its carrier executes, including the vr02 trio added on her 224th',
        'checkItemChildFacing — the child-facing gate, now including the subject-matter screen sited on token fields'],
      thenTheDoor: 'derived by itemWholeness and publishBlockers over the rows after the write, never from a message.',
      andTHEREPORT: 'movement from the rows: pool before and after, the window, servable-case membership, and the blast radius walked from the case table.',
    },

    FOUR_THE_CASE: { id: CASE, title: caseRow.title, questionType: caseRow.questionTypeId, paid: !caseRow.freeTier,
      orderInDistrict: caseRow.orderInDistrict, rows: rows.length, statuses: rows.reduce<Record<string, number>>((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {}),
      walkServesARealAsset: walkServes, livePracticePool: rows.filter((r) => r.status === 'LIVE' && r.pool === 'PRACTICE').length },
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THE_SEVENTEEN_AS_CONTENT', 'TWO_WHICH_ROWS_ARE_WHOLE', 'FOUR_THE_CASE'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('vr02-moved-rows-and-seats-named', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'vr02-moved-rows-and-seats-named').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  console.log(`  ${moved.items.length} moved row(s) crossed as CONTENT, of ${popRows.length} in the bound population.`);
  console.log(`  wholeness: ${wholeness.length - notWhole.length} of ${wholeness.length} whole.`);
  for (const w of notWhole) console.log(`    NOT WHOLE  ${w.itemId}\n        ${w.shortOf.join('\n        ')}`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
