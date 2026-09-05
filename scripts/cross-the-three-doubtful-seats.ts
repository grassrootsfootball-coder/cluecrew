/**
 * THE THREE DOUBTFUL WORDS, WITH THEIR ROWS (Annie's 225th, 2026-08-24).
 *
 * **HER RULING IS PER ROW, NOT PER WORD.** *"SOW and SEAM are known to a competent eleven-year-old
 * in the senses the items would need, and they are also the kind of word whose knownness depends
 * on the sentence around it… the seat asks whether a child meeting this row would recognise this
 * word as a word, and that is a reading of a row."*
 *
 * So this crosses the ROWS, not the words: each seat with its full three-part set — the key, its
 * siblings, and their tags with the wording a child would actually receive (R573) — the stem the
 * child reads, and the frequency readings on BOTH columns, because SOW is exactly the case where
 * they disagree.
 *
 * **AND EVERY FIGURE CARRIES ITS INSTRUMENT** (R993): the authoring store reads GRAN at 3.44 on
 * wordfreq 3.1.1 where this store reads 3.94 on SUBTLEX-UK. A cut without its instrument is not a
 * shared fact.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { moveLetterOutcomes } from '../packages/core/src/key-gate';
import { loadChildLexicon } from './lib/child-lexicon';
import { threePartSet } from './lib/option-set';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const WORDS = ['SOW', 'SEAM', 'BAIN'];

async function main() {
  const lex = loadChildLexicon();
  const library = new Map((await prisma.misconception.findMany({ select: { id: true, childHint: true } })).map((m) => [m.id, m.childHint]));
  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-08-move-letter' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, pool: true, stem: true, explanation: true,
      options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('three-doubtful', { 'vr-08 row(s) searched': rows.length });

  const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '').toUpperCase();
  const seats: Array<Record<string, unknown>> = [];
  for (const r of rows) {
    const s = r.stem as { word1?: string; word2?: string; prompt?: string };
    const w1 = String(s.word1 ?? '').toUpperCase(), w2 = String(s.word2 ?? '').toUpperCase();
    for (const o of r.options.filter((x) => !x.isCorrect)) {
      const leftover = moveLetterOutcomes(w1, w2, val(o))?.left ?? '';
      if (!WORDS.includes(leftover)) continue;
      seats.push({
        THE_WORD: leftover,
        itemId: r.id, status: r.status, pool: r.pool,
        REACHES_A_CHILD: r.status === 'LIVE' || r.status === 'DRAFT',
        THE_ROW_AS_THE_CHILD_MEETS_IT: { prompt: s.prompt, word1: w1, word2: w2 },
        THE_SEAT: { value: val(o), tag: o.misconceptionId, tagChildHint: o.misconceptionId ? library.get(o.misconceptionId) ?? null : null,
          execution: o.misconceptionExecution ?? null,
          theActItRecords: `remove "${val(o)}" from ${w1} and read what is left: ${leftover}` },
        THE_THREE_PART_SET: threePartSet(r.options, library),
        THE_QUESTION_FOR_HER: `a child meeting THIS row takes "${val(o)}" out of ${w1} and reads ${leftover}. Does the row supply the sense — does she recognise ${leftover} as a word here? If yes the seat FLATTERS and is a bad distractor; if no it fails on the earlier ground.`,
        THE_READINGS: { zipf: lex.zipf(leftover), zipfCBBC: lex.zipfCBBC(leftover),
          excludedAsAName: lex.isProperName(leftover),
          passesTheCut: lex.knows(leftover),
          andWHERETHECOLUMNSDISAGREE: lex.zipf(leftover) !== null && lex.zipfCBBC(leftover) !== null
            && (lex.zipf(leftover)! >= 3.0) !== (lex.zipfCBBC(leftover)! >= 3.0)
            ? 'THE TWO COLUMNS DISAGREE ON THIS WORD — it clears the cut on the whole corpus and fails it on children\'s television, which is the sharpest form of the question you are being asked to read.'
            : 'both columns agree',
        },
        theWalkOrExplanation: r.explanation ?? null,
      });
    }
  }

  const byWord = WORDS.map((w) => ({ word: w, seats: seats.filter((s) => s.THE_WORD === w).length }));
  const report = {
    kind: 'THE-THREE-DOUBTFUL-SEATS-WITH-THEIR-ROWS',
    TO: 'Annie, by relay through David',
    date: '2026-09-05',
    WHY_THIS_SHAPE: 'your 225th rules per row, not per word. So these are rows, with the stem the child reads, the seat, its tag and the wording the child would receive, and the full three-part set — the key, its siblings, and their tags (R573).',
    THE_CUT_AND_ITS_INSTRUMENT: lex.provenance.THE_CUT_AND_ITS_INSTRUMENT,
    GRAN_measuredHere: lex.provenance.GRAN_measuredHere,
    andTHECROSSSTORECHECK: 'you named GRAN at 3.44 on wordfreq 3.1.1. This store reads it at 3.94 on SUBTLEX-UK — half a Zipf apart, SAME verdict at 3.0. The instruments disagree in magnitude and agree on this word; that is exactly why the instrument now travels with every figure.',
    SEATS_FOUND: byWord,
    THE_ONE_THAT_REACHES_A_CHILD: 'SOW. Its two seats sit on DRAFT rows in the vr-08 cut (gen-vr-08-move-letter-12 and -24, SNOW/HOE), which are live-eligible. SEAM and BAIN sit on seed rows that are NEVER_SHIPPABLE and reach nobody.',
    AND_ONE_THING_YOUR_RULING_MAY_NOT_HAVE_INTENDED: {
      what: 'you ruled that BAIN fails at 3.0 as a surname and "its seat regenerates with the rest".',
      butTHEROW: 'BAIN\'s seat is on seed-vr08-09 (BRAIN/OIL), which is NEVER_SHIPPABLE by your 210th. There is nothing to regenerate — the row already reaches no child, and rewriting it would change a row that serves nobody while leaving the seed bank\'s status ruling untouched.',
      whatWASdone: 'nothing to that row. The name filter now excludes BAIN from the lexicon entirely, which executes your ruling for every future use without editing a dead row. If you meant the seed row itself to be rebuilt, that is a different act and it is not assumed here.',
    },
    THE_SEATS: seats,
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['THE_SEATS', 'THE_CUT_AND_ITS_INSTRUMENT', 'SEATS_FOUND'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('three-doubtful-seats-with-their-rows', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'three-doubtful-seats-with-their-rows').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  for (const s of seats) console.log(`  ${String(s.THE_WORD).padEnd(5)} ${String(s.itemId).padEnd(30)} [${s.status}] reaches a child: ${s.REACHES_A_CHILD}`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
