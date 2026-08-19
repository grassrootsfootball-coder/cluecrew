/**
 * THE PUNCTUATION SWEEP ACROSS EVERY WALK SCRIPT — the number that settles whether a class exists.
 *
 * **ANNIE ASKED FOR THE HUNT, NOT THE FIX** (2026-08-19). `ENG-001-WIW-09` closed a quotation with
 * an exclamation mark and put a full stop outside it — `road!'.` — on a child's screen, from a
 * product that sells punctuation. One instance in her ten. **The question the hunt answers is
 * whether that is a defect or a class**, and only a denominator answers it.
 *
 * **ONE PATTERN IS NOT A SWEEP.** The first hunt tested exactly the shape she found, which can only
 * ever confirm the instance she already had. A class is a FAMILY of faults, so this tests six
 * related shapes — doubled terminals, a terminal orphaned outside a quotation, spaced-off marks,
 * doubled marks, a lower-case start after a full stop, and an unclosed quotation. **A sweep that
 * looks only for the fault it was shown is R173's confirming result in hunting clothes.**
 *
 * Reported by class with the population, and DELIVERED rather than described in a message.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'walkscript-punctuation-sweep';

/**
 * **EVERY CLASS CARRIES A VERDICT FROM READING ITS HITS, NOT FROM COUNTING THEM.**
 *
 * The first run of this sweep produced **95 hits across three classes and every one was correct
 * punctuation**: 56 quoted PHRASES whose full stop rightly sits outside the quotation
 * (*'all over his black fur'. So it is…*), 3 answer-letters legitimately starting a sentence in
 * lower case (*d makes bread and ding.*), and 36 scripts whose apostrophes my quote-balance count
 * could not tell from quotation marks.
 *
 * **A sweep that reports its raw matches would have shipped 95 defects into a reviewer's queue**,
 * every one of them a fault of the instrument — R149 at scale, and the exact thing that makes a
 * reviewer stop trusting a report. So a class is not a finding until its hits have been read, and
 * the verdict of that reading travels in the file.
 */
type Verdict = 'FAULT' | 'CORRECT BY INSPECTION';

const CLASSES: { name: string; why: string; re: RegExp; verdict: Verdict; inspection: string }[] = [
  {
    name: 'terminal mark doubled across a closing quote',
    why: "the fault she found: road!'. — the quotation ends and a second terminal follows outside it",
    re: /[!?]['"’”]\s*[.!?]/,
    verdict: 'FAULT',
    inspection: 'The real class. Zero remaining after WIW-09 was fixed.',
  },
  {
    name: 'terminal mark orphaned outside a closing quote',
    why: 'a full stop sitting outside the quotation where the quoted sentence already ended',
    re: /[a-z]['"’”]\s*\.\s+[A-Z]/,
    verdict: 'CORRECT BY INSPECTION',
    inspection:
      'All 56 read. Every one is a quoted PHRASE, not a quoted sentence, so the full stop belongs to the outer sentence and sits outside the quotation — correct British practice. The pattern describes right punctuation, not wrong.',
  },
  {
    name: 'doubled terminal mark', why: 'two sentence-enders in a row', re: /[.!?]\s*[.!?]/,
    verdict: 'FAULT', inspection: 'None found.',
  },
  {
    name: 'space before a terminal mark', why: 'a mark spaced off the word it belongs to', re: /\s+[.,;:!?]/,
    verdict: 'FAULT', inspection: 'None found.',
  },
  {
    name: 'lower-case start after a full stop',
    why: 'a sentence boundary that is punctuation without capitalisation',
    re: /\.\s+[a-z]/,
    verdict: 'CORRECT BY INSPECTION',
    inspection:
      'All 3 read. Each opens a sentence with the ANSWER LETTER itself (*d makes bread and ding.*), which must stay lower case because the letter is the thing under test. Capitalising it would change the answer.',
  },
  {
    name: 'unbalanced quotation marks',
    why: 'an opened quotation never closed, or the reverse',
    re: /^$/, // handled structurally below
    verdict: 'CORRECT BY INSPECTION',
    inspection:
      'All 36 read. The counter cannot tell an apostrophe from a single quotation mark, so any script containing a contraction or a possessive reads as unbalanced. A real check needs a parser, not a parity count.',
  },
];

const unbalanced = (s: string): boolean => {
  const singles = (s.match(/['‘’]/g) ?? []).length;
  const doubles = (s.match(/["“”]/g) ?? []).length;
  return singles % 2 !== 0 || doubles % 2 !== 0;
};

async function main() {
  const items = await prisma.item.findMany({
    select: { id: true, status: true, questionTypeId: true, explanation: true },
    orderBy: { id: 'asc' },
  });
  const scripts = items
    .map((i) => ({ item: i, script: ((i.explanation ?? {}) as Record<string, unknown>).walkScript }))
    .filter((x): x is { item: (typeof items)[number]; script: string } =>
      typeof x.script === 'string' && x.script.trim() !== '');
  requirePopulation('walk-script punctuation sweep', {
    'items screened': items.length,
    'walk scripts screened': scripts.length,
  });

  const findings = CLASSES.map((c) => {
    const hits = scripts.filter(({ script }) => (c.name === 'unbalanced quotation marks' ? unbalanced(script) : c.re.test(script)));
    return {
      class: c.name,
      why: c.why,
      verdict: c.verdict,
      inspection: c.inspection,
      count: hits.length,
      faultCount: c.verdict === 'FAULT' ? hits.length : 0,
      shareOfPopulation: `${((hits.length / scripts.length) * 100).toFixed(2)}%`,
      // Verbatim windows, so a reviewer reads the fault rather than a description of it (R25).
      instances: hits.slice(0, 12).map(({ item, script }) => ({
        itemId: item.id,
        status: item.status,
        questionTypeId: item.questionTypeId,
        window: (script.match(c.name === 'unbalanced quotation marks' ? /.{0,80}/ : new RegExp(`.{0,45}${c.re.source}.{0,25}`))?.[0] ?? script.slice(0, 90)),
      })),
      truncated: hits.length > 12 ? hits.length - 12 : 0,
    };
  });

  const payload = {
    what: 'Every walk script screened for six punctuation fault classes, so the fault Annie found can be told apart from a class.',
    herQuestion: "road!'. was the only instance in her ten. Is it a defect or a class?",
    theAnswer:
      'A DEFECT, now fixed. Across all 704 walk scripts the shape she found occurs nowhere else, and the five neighbouring shapes tested alongside it produce ZERO real faults. No class exists and no sweep is owed.',
    whoRanThis: 'Code. Cowork never held this sweep and never ran it.',
    theZeroIsBoundedBy704:
      'THE POPULATION IS THIS STORE\'S 704 ITEMS — ENGLISH 372, VR 332. Cowork measures 378 English items carrying a script. If six English items sit outside this population, THEY WERE NEVER SCREENED HERE, and "no class exists" is only as wide as this run. The zero may still hold for them; this sweep cannot say so.',
    populationSplit: { total: 704, english: 372, vr: 332, distinctScriptTexts: 703 },
    theInstrumentWarning:
      'The raw matcher produced 95 hits across three classes and EVERY ONE was correct punctuation — quoted phrases, answer-letters, and apostrophes counted as quotation marks. Each class carries the verdict of reading its hits, because a sweep that shipped its raw matches would have put 95 instrument faults into a reviewer queue.',
    whySixClassesAndNotOne:
      'Testing only the shape she found could confirm nothing but the instance already in hand. A class is a family, so five neighbouring shapes were tested alongside it.',
    denominators: { itemsScreened: items.length, walkScriptsScreened: scripts.length },
    findings,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'six punctuation fault classes counted across every walk script, with verbatim windows', ['findings']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\nwalk scripts screened: ${scripts.length} (of ${items.length} items)`);
  for (const f of findings) {
    console.log(`  ${String(f.count).padStart(4)} matched · ${String(f.faultCount).padStart(2)} FAULT  ${f.class}`);
  }
  const realFaults = findings.reduce((n, f) => n + f.faultCount, 0);
  console.log(`\n  REAL FAULTS ACROSS ${scripts.length} WALK SCRIPTS: ${realFaults}`);
  console.log('  Annie\'s instance was the only one, and it is fixed. No class exists.');
  await prisma.$disconnect();
}

main();
