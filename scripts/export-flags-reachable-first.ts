/**
 * THE FLAGS THAT GOVERN A SERVING SURFACE, SEPARATED FROM THE BACKGROUND — her reachability-first
 * ordering, applied to a population nobody had scoped (David, 2026-08-19 — R333).
 *
 * **FOUR FLAGS GOVERN WHAT A CHILD CAN MEET. FIFTY-SEVEN DO NOT.** Annie reads the four first and
 * the rest as background, which is the ordering she has applied to every other queue and which
 * nobody had applied here because nobody had asked which passages actually serve.
 *
 * **AND `stream-a-02-railway-children` IS EMITTED SEPARATELY AS AN UNJUDGED PASSAGE**, not as one
 * with an empty verdict. Its `contentFlags` is `[]` — **present and empty**, where the two cloze
 * vehicles have no field at all. Three states, and the middle one is the ambiguous one: an empty
 * array is what a curator writes having looked and found nothing, AND what a template writes
 * having never been filled. **Nothing distinguishes them, so it goes to her as UNJUDGED rather
 * than as CLEAN** — a different artefact, needing a different act.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const PASSAGES = resolve(import.meta.dirname, '../content/passages');
const FAMILY = 'flags-reachable-first';

async function main() {
  const cases = await prisma.case.findMany({ select: { questionTypeId: true, freeTier: true } });
  const doors = new Map(cases.map((c) => [c.questionTypeId, c]));
  const items = await prisma.item.findMany({ select: { id: true, status: true, questionTypeId: true, stem: true }, orderBy: { id: 'asc' } });

  const rows = readdirSync(PASSAGES).filter((n) => n.endsWith('.json')).map((name) => {
    const p = JSON.parse(readFileSync(join(PASSAGES, name), 'utf8')) as Record<string, unknown>;
    const id = String(p.id ?? name);
    const citing = items.filter((i) => ((i.stem ?? {}) as { passageRef?: string }).passageRef === id);
    const live = citing.filter((i) => i.status === 'LIVE');
    const behindADoor = live.filter((i) => doors.has(i.questionTypeId));
    const freeTier = behindADoor.filter((i) => doors.get(i.questionTypeId)!.freeTier);
    const flags = Array.isArray(p.contentFlags) ? p.contentFlags : null;
    return {
      passageId: id,
      work: p.work ?? null,
      flagFieldState: flags === null ? 'ABSENT' : flags.length === 0 ? 'PRESENT BUT EMPTY' : 'POPULATED',
      flags: flags ?? [],
      itemsCiting: citing.length,
      liveItems: live.length,
      behindACaseDoor: behindADoor.length,
      freeTierItems: freeTier.length,
      reachable: behindADoor.length > 0,
    };
  });

  const reachable = rows.filter((r) => r.reachable && r.flags.length > 0);
  const background = rows.filter((r) => !r.reachable && r.flags.length > 0);
  const reachableFlagCount = reachable.reduce((n, r) => n + r.flags.length, 0);
  const backgroundFlagCount = background.reduce((n, r) => n + r.flags.length, 0);
  requirePopulation('flags reachable-first', {
    'passages': rows.length,
    'flags governing a serving surface': reachableFlagCount,
    'flags behind DRAFT items': backgroundFlagCount,
  });

  const unjudged = rows.find((r) => r.passageId === 'stream-a-02-railway-children')!;

  const payload = {
    what: 'The content flags split by whether they govern a surface a child can reach. Reachability-first, her own ordering.',
    countCorrections: [
      'Carried in as "26 contentFlags". It is 26 PASSAGES carrying 61 FLAGS.',
      `Carried in as "6 reachable flags". It is FOUR: one on stream-a-03-wind-in-willows, three on stream-b-01.`,
    ],
    readFirst: {
      flags: reachableFlagCount,
      passages: reachable.map((r) => ({
        passageId: r.passageId,
        liveItems: r.liveItems,
        freeTierItems: r.freeTierItems,
        flags: r.flags,
      })),
    },
    background: {
      flags: backgroundFlagCount,
      passages: background.length,
      note: 'Every one sits behind DRAFT items. None governs anything a child can meet today, and each becomes a read-first the day its bank publishes.',
      rows: background,
    },
    unjudgedPassage: {
      passageId: unjudged.passageId,
      why: 'Its contentFlags is PRESENT AND EMPTY. Two cloze vehicles have NO FIELD; the other 26 are populated. An empty array is what a curator writes having looked and found nothing, AND what a template writes having never been filled — and nothing here distinguishes them.',
      soItIs: 'UNJUDGED, not CLEAN. A different artefact needing a different act.',
      work: unjudged.work,
      items: unjudged.itemsCiting,
      liveItems: unjudged.liveItems,
      reachable: unjudged.reachable,
      whatTheCurationRecordShows:
        'A substantial curationNotes entry exists and it is entirely about FIT, not suitability: the scene was chosen over the red-petticoat train-stopping episode because that one cannot be cut to the word band without losing the landslide or the rescue. It records a judgement about length and shape and says nothing about content. copyrightCheck, similarityCheck and verbatimVerification are all present and all PASS — every OTHER assessment this passage could carry, it carries.',
      theInference: 'That every neighbouring assessment is recorded and this one is empty is evidence, not proof. It is consistent with a curator who screened and found nothing, and equally consistent with a field nobody reached.',
    },
    allPassages: rows,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'content flags split by reachability, with the unjudged passage isolated', ['readFirst', 'background']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\nREAD FIRST — ${reachableFlagCount} flag(s) governing a serving surface:`);
  for (const r of reachable) console.log(`   ${r.passageId}: ${r.flags.length} flag(s) · ${r.liveItems} LIVE items · ${r.freeTierItems} free-tier`);
  console.log(`\nBACKGROUND — ${backgroundFlagCount} flag(s) across ${background.length} passages, all behind DRAFT items`);
  console.log(`\nUNJUDGED — ${unjudged.passageId}: ${unjudged.itemsCiting} items, ${unjudged.liveItems} LIVE, reachable ${unjudged.reachable}`);
  await prisma.$disconnect();
}

main();
