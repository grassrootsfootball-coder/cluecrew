/**
 * ONE VR CASE'S TEN WALK SCRIPTS, FOR ANNIE'S READ — exactly as English went.
 *
 * **HER EVIDENCE IS THE ENGLISH TEN, AND IT IS AN ARGUMENT ABOUT SAMPLING.** Six passed and four
 * were not walks at all — and **the four shared one shape across one bank.** If a VR bank carries a
 * shape fault, **ten scripts finds it and 297 finds it 297 times.** So: one Case first, ten scripts,
 * and the 297 are not scoped.
 *
 * The Case is chosen by the largest LIVE script population behind a single free-tier door, so the
 * ten are representative of the bank most children will meet rather than of a quiet corner.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'walk-vr-ten-for-annie';

const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

async function main() {
  const cases = await prisma.case.findMany({ where: { freeTier: true }, select: { id: true, questionTypeId: true, title: true } });
  const vrCases = cases.filter((c) => c.questionTypeId.startsWith('vr-'));
  requirePopulation('VR walk ten', { 'free-tier VR Cases': vrCases.length });

  const counts = await Promise.all(vrCases.map(async (c) => ({
    ...c,
    live: await prisma.item.count({ where: { questionTypeId: c.questionTypeId, status: 'LIVE' } }),
  })));
  const chosen = counts.sort((a, b) => b.live - a.live)[0]!;

  const items = await prisma.item.findMany({
    where: { questionTypeId: chosen.questionTypeId, status: 'LIVE' },
    select: { id: true, stem: true, explanation: true, options: { select: { content: true, isCorrect: true } } },
    orderBy: { id: 'asc' },
  });
  const withScript = items.filter((i) => typeof ((i.explanation ?? {}) as Record<string, unknown>).walkScript === 'string');
  const ten = withScript.slice(0, 10);
  requirePopulation('VR walk ten', { 'LIVE items in the chosen Case': items.length, 'carrying a script': withScript.length });

  const scripts = ten.map((item) => {
    const script = String(((item.explanation ?? {}) as Record<string, unknown>).walkScript);
    const faults = checkChildFacingText({ role: 'hint', label: `${item.id}.walkScript`, text: script });
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    return {
      itemId: item.id,
      stemWords: stem.words ?? null,
      stemPrompt: stem.prompt ?? null,
      key: ((item.options.find((o) => o.isCorrect)?.content ?? {}) as { value?: string }).value ?? null,
      walkScript: script,
      asServed: sentences(script),
      sentenceCount: sentences(script).length,
      words: words(script),
      gateVerdict: faults.filter(isBlocking).length === 0 ? 'PASSES' : 'BLOCKED',
      gateFaults: faults.map((f) => `${f.rule}: ${f.detail}`),
    };
  });

  const payload = {
    what: `The first ten VR walk scripts, from ${chosen.id} (${chosen.questionTypeId}), for Annie's read.`,
    whyOneCase:
      'Her ruling, and her evidence is the English ten: six passed and four were not walks at all, the four sharing one shape across one bank. If a VR bank carries a shape fault, ten scripts finds it and 297 finds it 297 times.',
    theCase: { id: chosen.id, title: chosen.title, questionTypeId: chosen.questionTypeId, liveItems: chosen.live },
    notScoped: 'The other 297 VR scripts. Deliberately.',
    whatIsDifferentFromEnglish:
      'These explain a letter, number or word-pattern step rather than a line of prose, so the failure modes may not be the English ones. That is the reason for reading ten rather than assuming the English result carries over.',
    servingState: 'None of these ten is in WALK_APPROVED_ITEM_IDS, so Walk offers nothing on this Case until she approves ids.',
    scripts,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    "the first ten VR walk scripts verbatim with their stems, keys and gate verdicts", ['scripts']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\nCase: ${chosen.id} "${chosen.title}" (${chosen.questionTypeId}) — ${chosen.live} LIVE items`);
  console.log(`scripts sent: ${scripts.length} · all pass the gate: ${scripts.every((s) => s.gateVerdict === 'PASSES')}`);
  console.log(`sentences per script: ${scripts.map((s) => s.sentenceCount).join(', ')}`);
  for (const s of scripts.slice(0, 3)) console.log(`\n  ${s.itemId}: ${s.walkScript}`);
  await prisma.$disconnect();
}

main();
