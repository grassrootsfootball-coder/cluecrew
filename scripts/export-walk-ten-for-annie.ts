/**
 * WALK'S FIRST TEN, FOR ANNIE'S READ — the scripts that decide whether Walk serves.
 *
 * **THESE TEN ARE THE SERVING GATE.** `WALK_APPROVED_ITEM_IDS` is empty, so the dispatcher is built
 * and Walk offers nothing. Each id she approves goes into that list with the return that approved
 * it; nothing else opens it. **A machine scan cannot substitute** — Cowork's zero em dashes and
 * zero shouts across 378 scripts is a screen for two faults and says nothing about a script that
 * coaches the key, names a scaffold not on the screen, or misreads the line it cites (R94).
 *
 * **WHAT SHE IS READING IS NOT WHAT THE MODE WAS SPECIFIED TO BE, AND THE FILE SAYS SO FIRST.**
 * Walk was specified as a faded example. These are worked solutions — 3-4 sentences explaining one
 * item's answer, no fading, because no fading content was ever written (R232). The mode's promise
 * changed to match the content, which is a narrowing of a teaching commitment and is hers and
 * David's to accept or refuse.
 *
 * **THE NEW COPY TRAVELS WITH THEM AS A HINT-CLASS STRING**, gated by the same rules as any hint:
 * reading age, sentence cap, full-stop endings, vocabulary. Its verdict is in the file.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'walk-ten-for-annie';
const CASE_ID = 'case-en-01';

/** The proposed replacement for MODE_BLURBS.walk, quoted from the component it now lives in. */
const NEW_COPY = 'Here is how this one works out. Read it through whenever you are ready.';
const OLD_COPY = "We'll do one together, then one where you finish it, then one that's all yours.";
const MY_REFUSED_DRAFT = "I'll show you how I worked this one out. One bit at a time, then you try the next.";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);

async function main() {
  const kase = await prisma.case.findUniqueOrThrow({ where: { id: CASE_ID }, select: { id: true, questionTypeId: true, title: true } });
  const items = await prisma.item.findMany({
    where: { questionTypeId: kase.questionTypeId, status: 'LIVE' },
    select: { id: true, stem: true, explanation: true, options: { select: { content: true, isCorrect: true } } },
    orderBy: { id: 'asc' },
  });
  const withScript = items.filter((i) => {
    const w = ((i.explanation ?? {}) as Record<string, unknown>).walkScript;
    return typeof w === 'string' && w.trim() !== '';
  });
  requirePopulation('walk ten', { 'LIVE items in the case': items.length, 'carrying a walk script': withScript.length });

  const copyFaults = checkChildFacingText({ role: 'hint', label: 'MODE_BLURBS.walk', text: NEW_COPY });

  const scripts = withScript.map((item) => {
    const script = String(((item.explanation ?? {}) as Record<string, unknown>).walkScript);
    const faults = checkChildFacingText({ role: 'hint', label: `${item.id}.walkScript`, text: script });
    const key = item.options.find((o) => o.isCorrect)?.content as { value?: string } | undefined;
    return {
      itemId: item.id,
      // The child's question, so a script can be read against what it is explaining.
      stem: ((item.stem ?? {}) as { text?: string }).text ?? null,
      key: key?.value ?? null,
      // R25 — verbatim, exactly as it would reach a child.
      walkScript: script,
      asServed: sentences(script),
      words: words(script),
      sentenceCount: sentences(script).length,
      gateVerdict: faults.filter(isBlocking).length === 0 ? 'PASSES' : 'BLOCKED',
      gateFaults: faults.map((f) => `${f.rule}: ${f.detail}`),
    };
  });

  const payload = {
    what: `The ${scripts.length} walk scripts for ${CASE_ID}, for Annie's read. Approving an id is what lets Walk serve it.`,
    theModeChanged:
      'Walk was specified as a FADED EXAMPLE ("do one together, finish one, do one alone"). These are WORKED SOLUTIONS — one explanation of one answer, no fading — because no fading content was ever written. The mode now matches the content. That is a narrowing of a teaching commitment, offered openly rather than absorbed.',
    howItReachesAChild:
      'Opened from the miss path. The script is revealed one sentence at a time, the child taps for the next, and the last tap shows the whole thing exactly as written. No words are changed by the split.',
    theCopy: {
      field: 'MODE_BLURBS.walk — the line a child reads when the mode is offered',
      was: OLD_COPY,
      wasUntrue: 'It promised a faded example. Nothing in the product did that, and after this ruling nothing will.',
      myDraftWasRefused: {
        text: MY_REFUSED_DRAFT,
        why: [
          '"One bit at a time" promises step structure the content does not have — all 670 scripts are single strings, one step by measurement.',
          '"Then you try the next" promises a NEXT ITEM, which is the three-item sequence Walk was ruled not to be. The faded example walked back in wearing plainer clothes.',
          '"I\'ll show you" proposes a PERSONA. Nothing else a child reads here speaks in the first person; that is a product decision and it was not taken inside a mode fix.',
        ],
        lesson: 'Copy rewritten AFTER a narrowing drifts back toward what it replaced. It has to be rewritten as part of the narrowing.',
      },
      nowProposed: NEW_COPY,
      whoseWording: 'ANNIE\'S, verbatim — the second of the two lines she authored.',
      whichOfHerTwoAndWhy: {
        theFactItTurnsOn: 'After the walk, does the child get another attempt at THAT item?',
        answer: 'NO.',
        evidence: 'On every submission, miss included, the item id is appended to focus.servedItemIds (packages/core/src/session.ts:433). Both selection paths in the orchestrator exclude that set — the preferred one (orchestrator.ts:663) and the recency-relaxed fallback (orchestrator.ts:674). The item cannot return in that session.',
        soHerOtherLineWouldBeFalse: '"…then try it again" would promise a retry the product does not offer.',
      },
      class: 'hint-class string — reading age, 16-word sentence cap, full-stop endings, vocabulary scan',
      words: words(NEW_COPY),
      longestSentenceWords: Math.max(...sentences(NEW_COPY).map(words)),
      gateVerdict: copyFaults.filter(isBlocking).length === 0 ? 'PASSES' : 'BLOCKED',
      gateFaults: copyFaults.map((f) => `${f.rule}: ${f.detail}`),
      status: 'PROPOSED, NOT SETTLED — written into the component in the same act as the dispatcher so the product never promises what it does not do, and offered here for her wording.',
    },
    servingGate: {
      approvedSoFar: 0,
      mechanism: 'WALK_APPROVED_ITEM_IDS in packages/core/src/walk-approval.ts, checked at the API door before the row is read.',
      note: 'A machine scan is not a reviewer read. Cowork reported zero em dashes and zero shouts across 378 scripts; that screens two faults and none of the ones reading finds.',
    },
    scripts,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    "the ten walk scripts for case-en-01 verbatim, with the proposed mode copy and its gate verdict", ['scripts']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`${CASE_ID} (${kase.questionTypeId}) — ${scripts.length} script(s) for her read`);
  console.log(`  all pass the gate: ${scripts.every((s) => s.gateVerdict === 'PASSES')}`);
  console.log(`  sentences per script: ${scripts.map((s) => s.sentenceCount).join(', ')}`);
  console.log(`  new copy: ${payload.theCopy.gateVerdict} (${payload.theCopy.words}w, longest sentence ${payload.theCopy.longestSentenceWords}w)`);
  console.log(`\n  ${path}`);
  await prisma.$disconnect();
}

main();
