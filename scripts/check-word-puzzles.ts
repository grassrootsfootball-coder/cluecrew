/**
 * THE DICTIONARY GATE — `pnpm check:word-puzzles`
 *
 * Every candidate answer an item's own rule permits is derived and checked
 * against the wordlist. More than one survivor = the item has more than one
 * right answer and cannot serve. Also checks that an item's internal symbols
 * do not collide with the labels its options will be given.
 *
 * Same policy as the other database gates: a LIVE item fails the build, a
 * DRAFT one is reported as backlog.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  checkLabelCollision,
  makeLexicon,
  solveHiddenWord,
  solveMakeAWord,
  deriveSeries,
  movableLetters,
  solveInsertLetter,
  solveOrdering,
  solveMoveLetter,
  type WordPuzzleFailure,
} from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

const WORDLIST = resolve(import.meta.dirname, '../content/wordlists/en-lower.txt');
const isWord = makeLexicon(readFileSync(WORDLIST, 'utf8').split('\n').filter(Boolean));

/**
 * THREE OUTCOMES, adopted from Cowork's model (David's ruling, 2026-08-02).
 *
 *   PASS       one candidate. The rule produces the key and nothing else.
 *   AMBIGUOUS  a competitor survives the STRICT floor — a word in common
 *              usage. A child can plausibly find it, so the item is unfair
 *              and the finding is real.
 *   REVIEW     competitors exist only under the PERMISSIVE floor — dictionary
 *              entries like "teth" and "tala". Probably noise; a person
 *              decides.
 *
 * The two floors exist because neither list can do the job alone. Narrowing
 * the GATE to common usage was tried and rejected: it drops "stile" and
 * "pare", which is to say it drops the SPARE/TILE case this gate exists for.
 * Judging every dictionary entry equally credible buries the real findings
 * under obscure ones. So the permissive list decides what EXISTS and the
 * strict list decides how much it MATTERS.
 */
const COMMON = new Set(
  readFileSync(resolve(import.meta.dirname, '../content/wordlists/common-en.txt'), 'utf8')
    .split('\n')
    .filter(Boolean),
);
const commonCount = (words: readonly string[]): number =>
  words.filter((word) => COMMON.has(word.toLowerCase())).length;

type Outcome = 'PASS' | 'AMBIGUOUS' | 'REVIEW';
const outcomes: Record<Outcome, number> = { PASS: 0, AMBIGUOUS: 0, REVIEW: 0 };

/**
 * The key is not a competitor with itself. What decides the outcome is
 * whether any OTHER surviving candidate is a word in common usage.
 */
function gradeCandidates(candidates: readonly string[], key: string): Outcome {
  const competitors = candidates.filter((word) => word.toUpperCase() !== key.toUpperCase());
  if (competitors.length === 0) return 'PASS';
  return commonCount(competitors) > 0 ? 'AMBIGUOUS' : 'REVIEW';
}

const serving: WordPuzzleFailure[] = [];
const draft: WordPuzzleFailure[] = [];
/**
 * DEFECTS, not warnings (David's ruling, 2026-08-02). A `key-not-derivable`
 * item cannot be answered correctly by any child: the rule it states either
 * produces nothing, or produces something other than the key. Ambiguity is a
 * fairness problem a reviewer can weigh; this is a broken question.
 *
 * So the finding is written to the row as `answerFlaggedAt`, the three
 * REVIEWED doors refuse a flagged item, and no sign-off clears it — the flag
 * lifts when the item is fixed and this gate stops setting it.
 */
const defects = new Map<string, string>();

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { questionTypeId: { in: ['vr-01-insert-letter', 'vr-08-move-letter', 'vr-13-make-a-word', 'vr-05-hidden-word', 'vr-07-letters-for-numbers', 'vr-09-letter-series', 'vr-11-number-series', 'vr-06-missing-word', 'vr-15-reading-information', 'vr-12-compound-words'] } },
    include: { options: true },
    orderBy: { id: 'asc' },
  });

  let checked = 0;
  for (const item of items) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const bucket = item.status === 'LIVE' ? serving : draft;
    const key = item.options.find((option) => option.isCorrect);
    const keyValue = String((key?.content as { value?: unknown })?.value ?? '').toUpperCase();
    const found: WordPuzzleFailure[] = [];

    if (item.questionTypeId === 'vr-01-insert-letter') {
      checked += 1;
      // The offered letters, key included: a child chooses from these, so the
      // ambiguity is among what is on the card, not the whole alphabet.
      const offered = item.options.map((o) => String((o.content as { value?: unknown }).value ?? ''));
      const valid = solveInsertLetter(String(stem.word1 ?? ''), String(stem.word2 ?? ''), offered, isWord);
      const key = keyValue.toLowerCase();
      const words = (letter: string): [string, string] => [
        String(stem.word1).replace(/\(\?\)/g, letter),
        String(stem.word2).replace(/\(\?\)/g, letter),
      ];
      const shows = (letter: string): string => {
        const [w1, w2] = words(letter);
        return `${w1}/${w2}`;
      };
      // A competitor is REAL only if BOTH words it makes are in common usage.
      // The permissive dictionary completes green→greet→"toise" and
      // cloud→clour→"rance"; no child produces those, so they are not a second
      // answer a child could tick. Same floor the other three gates use.
      const others = valid.filter((letter) => letter !== key);
      const realDoubles = others.filter((letter) => commonCount(words(letter)) === 2);
      const dictOnly = others.filter((letter) => commonCount(words(letter)) < 2);
      if (realDoubles.length > 0) {
        // A DEFECT, not a warning (David's ruling): a second OFFERED letter
        // completes both words with words a child knows, so they can tick it
        // and be right.
        found.push({
          where: `item:${item.id}`,
          rule: 'key-not-derivable',
          detail:
            `more than one offered letter completes both words — ` +
            [key, ...realDoubles].map((l) => `${l} (${shows(l)})`).join(', ') +
            `; key is "${key}"`,
        });
      } else if (dictOnly.length > 0) {
        // A competitor exists only through an obscure dictionary word. Worth a
        // human glance, not a block — reported like a REVIEW.
        outcomes.REVIEW += 1;
        found.push({
          where: `item:${item.id}`,
          rule: 'needs-review',
          detail:
            `[REVIEW] a distractor completes both words only via an uncommon word — ` +
            dictOnly.map((l) => `${l} (${shows(l)})`).join(', ') +
            `; key "${key}" is the only common answer`,
        });
      } else if (!valid.includes(key)) {
        found.push({
          where: `item:${item.id}`,
          rule: 'key-not-derivable',
          detail: `key "${key}" does not complete both words: ${shows(key)}`,
        });
      }
    }

    if (item.questionTypeId === 'vr-09-letter-series' || item.questionTypeId === 'vr-11-number-series') {
      checked += 1;
      const isLetters = item.questionTypeId === 'vr-09-letter-series';
      // Letters are positions in the alphabet, so the same numeric rules apply
      // to A=1..Z=26 and the prediction is mapped back.
      const toNum = (v: unknown): number =>
        isLetters ? String(v).trim().toUpperCase().charCodeAt(0) - 64 : Number(v);
      const back = (n: number): string => (isLetters ? String.fromCharCode(n + 64) : String(n));
      const terms = ((stem.series as unknown[]) ?? []).map(toNum);
      const keyNum = toNum(keyValue);
      const rules = deriveSeries(terms);
      const distractors = item.options
        .filter((o) => !o.isCorrect)
        .map((o) => toNum((o.content as { value?: unknown }).value));

      if (rules.length === 0) {
        found.push({ where: `item:${item.id}`, rule: 'key-not-derivable', detail: `series ${terms.map(back).join(',')} follows no rule in the family` });
      } else if (!rules.some((r) => r.next === keyNum)) {
        found.push({
          where: `item:${item.id}`,
          rule: 'key-not-derivable',
          detail: `key "${keyValue}" does not follow the series ${terms.map(back).join(',')} — the rules give ${rules.map((r) => `${back(r.next)} (${r.name})`).join(', ')}`,
        });
      } else {
        // A distractor that ALSO follows a fitting rule, other than the one the
        // key follows, is a rival answer. Common-tier rival → AMBIGUOUS;
        // exotic-tier → REVIEW. Same split as insert-letter (ratified).
        const rivals = rules.filter((r) => r.next !== keyNum && distractors.includes(r.next));
        if (rivals.length > 0) {
          const common = rivals.some((r) => r.tier === 'common');
          outcomes[common ? 'AMBIGUOUS' : 'REVIEW'] += 1;
          found.push({
            where: `item:${item.id}`,
            rule: common ? 'ambiguous-answer' : 'needs-review',
            detail:
              `[${common ? 'AMBIGUOUS' : 'REVIEW'}] series ${terms.map(back).join(',')} — key ${keyValue}, ` +
              `but a distractor follows a rival rule: ${rivals.map((r) => `${back(r.next)} (${r.name})`).join(', ')}`,
          });
        }
      }
    }

    if (item.questionTypeId === 'vr-08-move-letter') {
      checked += 1;
      const solutions = solveMoveLetter(String(stem.word1 ?? ''), String(stem.word2 ?? ''), isWord);
      const letters = movableLetters(solutions);
      const plausible = solutions.filter((s) => commonCount([s.from, s.to]) === 2).length;
      if (letters.length > 1) {
        // A move is credible only if BOTH resulting words are in common use.
        const credible = solutions.filter((s) => commonCount([s.from, s.to]) === 2);
        const outcome: Outcome = credible.some((s) => s.letter !== keyValue) ? 'AMBIGUOUS' : 'REVIEW';
        outcomes[outcome] += 1;
        found.push({
          where: `item:${item.id}`,
          rule: outcome === 'AMBIGUOUS' ? 'ambiguous-answer' : 'needs-review',
          detail:
            `[${outcome}] ${stem.word1}/${stem.word2} admits ${letters.length} answers — ` +
            solutions.map((s) => `${s.letter} (${s.from}/${s.to})`).join(', ') +
            ` [${plausible} with both words in common usage]`,
        });
      } else if (solutions.length > 1) {
        // One letter, several ways to place it. Answerable as offered — the
        // options are letters — but the stem's own words are satisfied by
        // more than one result, which matters the day an item asks for the
        // word instead. Reported, weaker.
        found.push({
          where: `item:${item.id}`,
          rule: 'ambiguous-outcome',
          detail:
            `${stem.word1}/${stem.word2}: one letter "${letters[0]}" but ${solutions.length} valid results — ` +
            solutions.map((s) => `${s.from}/${s.to}`).join(', ') +
            ` [${plausible} in common usage]`,
        });
      } else if (solutions.length === 0) {
        found.push({ where: `item:${item.id}`, rule: 'key-not-derivable', detail: `${stem.word1}/${stem.word2} admits NO valid move` });
      }
      if (letters.length === 1 && letters[0] !== keyValue && solutions.length > 0) {
        found.push({
          where: `item:${item.id}`,
          rule: 'key-not-derivable',
          detail: `key is "${keyValue}" but the only valid move is "${solutions[0]!.letter}" (${solutions[0]!.from}/${solutions[0]!.to})`,
        });
      }
    }

    if (item.questionTypeId === 'vr-13-make-a-word') {
      checked += 1;
      const answer = solveMakeAWord((stem.words as string[]) ?? []);
      if (!answer) {
        found.push({ where: `item:${item.id}`, rule: 'key-not-derivable', detail: 'the outer words do not support the rule' });
      } else if (!isWord(answer)) {
        found.push({ where: `item:${item.id}`, rule: 'not-a-word', detail: `the rule produces "${answer}", which is not a word` });
      } else if (answer !== keyValue) {
        found.push({ where: `item:${item.id}`, rule: 'key-not-derivable', detail: `key is "${keyValue}" but the rule produces "${answer}"` });
      }
    }

    if (item.questionTypeId === 'vr-05-hidden-word') {
      checked += 1;
      const answers = solveHiddenWord(String(stem.sentence ?? ''), keyValue.length || 4, isWord);
      if (answers.length > 1) {
        const outcome = gradeCandidates(answers, keyValue);
        outcomes[outcome] += 1;
        const competitors = answers.filter((w) => w.toUpperCase() !== keyValue);
        found.push({
          where: `item:${item.id}`,
          rule: outcome === 'AMBIGUOUS' ? 'ambiguous-answer' : 'needs-review',
          detail:
            `[${outcome}] "${stem.sentence}" hides ${answers.length} words at a join: ${answers.join(', ')} ` +
            `— competitors in common usage: ${competitors.filter((w) => COMMON.has(w)).join(', ') || 'none'}`,
        });
      } else if (answers.length === 0) {
        found.push({ where: `item:${item.id}`, rule: 'key-not-derivable', detail: `"${stem.sentence}" hides no word at a join` });
      } else if (answers[0]!.toUpperCase() !== keyValue) {
        found.push({ where: `item:${item.id}`, rule: 'key-not-derivable', detail: `key is "${keyValue}" but the only hidden word is "${answers[0]}"` });
      }
    }

    if (item.questionTypeId === 'vr-07-letters-for-numbers') {
      checked += 1;
      // Verify the ARITHMETIC, not just the labels. Substitute each code
      // letter's value into the sum and evaluate left to right; the result
      // must equal the key. A wrong computed key would otherwise pass on the
      // label check alone.
      const code = (stem.code ?? {}) as Record<string, string>;
      const expr = String(stem.sum ?? '').replace(/[−–—]/g, '-');
      const tokens = expr.split(/\s+/).filter(Boolean);
      let total: number | null = null;
      let op = '+';
      let ok = true;
      for (const token of tokens) {
        if (token === '+' || token === '-') { op = token; continue; }
        const value = Number(code[token]);
        if (Number.isNaN(value)) { ok = false; break; }
        total = total === null ? value : op === '+' ? total + value : total - value;
      }
      if (!ok || total === null) {
        found.push({ where: `item:${item.id}`, rule: 'key-not-derivable', detail: `sum "${stem.sum}" cannot be evaluated from the code ${JSON.stringify(code)}` });
      } else if (total !== Number(keyValue)) {
        found.push({ where: `item:${item.id}`, rule: 'key-not-derivable', detail: `sum "${stem.sum}" resolves to ${total} but the key is ${keyValue}` });
      }
    }

    if (item.questionTypeId === 'vr-06-missing-word') {
      checked += 1;
      // Rebuild the whole word by dropping each option into the gap. The key
      // must make a real word (else the item is unanswerable). Each distractor
      // is checked against what its TAG claims: fits-gap-not-word must make a
      // NON-word; ignores-sentence must make a REAL word (SHOAK, tagged
      // ignores-sentence, is the mistag the reviewer found).
      const sentence = String(stem.sentence ?? '');
      const gapToken = sentence.split(/\s+/).find((t) => t.includes('_')) ?? '';
      const fill = (letters: string) => gapToken.replace(/_+/g, letters).replace(/[^A-Za-z]/g, '');
      const keyWord = fill(keyValue);
      if (!isWord(keyWord)) {
        found.push({ where: `item:${item.id}`, rule: 'key-not-derivable', detail: `key "${keyValue}" makes "${keyWord}", not a word` });
      }
      for (const option of item.options.filter((o) => !o.isCorrect)) {
        const value = String((option.content as { value?: unknown }).value ?? '');
        const madeWord = isWord(fill(value));
        const tag = option.misconceptionId ?? '';
        if (tag.includes('fits-gap-not-word') && madeWord) {
          found.push({ where: `item:${item.id}`, rule: 'needs-review', detail: `[MISTAG] "${value}" makes real word "${fill(value)}" but is tagged fits-gap-not-word` });
        }
        if (tag.includes('ignores-sentence') && !madeWord) {
          found.push({ where: `item:${item.id}`, rule: 'needs-review', detail: `[MISTAG] "${value}" makes non-word "${fill(value)}" but is tagged ignores-sentence (a real word wrong in context)` });
        }
      }
    }

    if (item.questionTypeId === 'vr-15-reading-information') {
      checked += 1;
      // The answer is deduced from the clues; confirm the clues force the key
      // and nothing else. Clues read "<Name> is <comp> than <Name>."
      const clues = Array.isArray(stem.clues) ? (stem.clues as string[]) : [];
      const question = String(stem.question ?? '');
      const edges: Array<[string, string]> = [];
      const people = new Set<string>();
      for (const clue of clues) {
        const m = /^(\w+)\s+is\s+\w+\s+than\s+(\w+)/.exec(clue);
        if (m) { edges.push([m[1]!, m[2]!]); people.add(m[1]!); people.add(m[2]!); }
      }
      for (const o of item.options) { const v = String((o.content as { value?: unknown }).value ?? ''); if (v) people.add(v); }
      // Which end is asked? The generator's top superlative is "-est" on the
      // comparative root; a "short/small/young/slow/light" superlative asks the
      // bottom. Decide by whether the key is the closure's top or bottom.
      const top = solveOrdering([...people], edges, 'top');
      const bottom = solveOrdering([...people], edges, 'bottom');
      if (keyValue.toLowerCase() !== String(top).toLowerCase() && keyValue.toLowerCase() !== String(bottom).toLowerCase()) {
        found.push({
          where: `item:${item.id}`,
          rule: 'key-not-derivable',
          detail: `"${question}" key "${keyValue}" is not the clues' top (${top ?? 'ambiguous'}) or bottom (${bottom ?? 'ambiguous'})`,
        });
      }
      // Whichever end the key sits at must be UNIQUELY determined.
      const keyEnd = keyValue.toLowerCase() === String(top).toLowerCase() ? top : bottom;
      if (keyEnd === null) {
        found.push({ where: `item:${item.id}`, rule: 'ambiguous-answer', detail: `[AMBIGUOUS] the clues do not force a single answer to "${question}"` });
        outcomes.AMBIGUOUS += 1;
      }
    }

    if (item.questionTypeId === 'vr-12-compound-words') {
      checked += 1;
      // The base word joins the key to make one compound. A DISTRACTOR that
      // also makes a real compound with the base is a second right answer —
      // the raindrop/toothpaste/starshine/airplane class (David, 2026-08-02),
      // the same defect as an insert-letter double-key.
      const base = String(((stem.words as unknown[]) ?? [])[0] ?? '').toLowerCase();
      const forms = (other: string) => isWord(base + other) || isWord(other + base);
      for (const option of item.options.filter((o) => !o.isCorrect)) {
        const value = String((option.content as { value?: unknown }).value ?? '').toLowerCase();
        if (value && forms(value)) {
          const compound = isWord(base + value) ? base + value : value + base;
          found.push({
            where: `item:${item.id}`,
            rule: 'key-not-derivable',
            detail: `distractor "${value}" also forms a real compound with "${base}" (${compound}) — a second answer`,
          });
        }
      }
    }

    // Label collision applies to any item that names its own symbols.
    const symbols = stem.code && typeof stem.code === 'object' ? Object.keys(stem.code as object) : [];
    if (symbols.length > 0) {
      found.push(
        ...checkLabelCollision({
          label: `item:${item.id}`,
          symbols,
          optionCount: item.options.length,
          optionLabels: item.options.map((option) => (option.content as { label?: string }).label),
        }),
      );
    }
    for (const failure of found) {
      if (failure.rule === 'key-not-derivable' || failure.rule === 'not-a-word') {
        defects.set(item.id, failure.detail);
      }
    }
    bucket.push(...found);
  }

  // Reconcile the flag with what the gate just found: set it on every defect,
  // and lift it from anything that has since been fixed. A stale flag would be
  // as bad as a missing one — it would block an item nobody could unblock.
  const flagged = await prisma.item.findMany({ where: { answerFlaggedAt: { not: null } }, select: { id: true } });
  const now = new Date();
  let raised = 0;
  let lifted = 0;
  for (const [id, detail] of defects) {
    if (flagged.some((row) => row.id === id)) continue;
    await prisma.item.update({ where: { id }, data: { answerFlaggedAt: now, answerFlagNote: detail } });
    raised += 1;
  }
  for (const row of flagged) {
    if (defects.has(row.id)) continue;
    await prisma.item.update({ where: { id: row.id }, data: { answerFlaggedAt: null, answerFlagNote: null } });
    lifted += 1;
  }

  console.log(`Word-puzzle gate: ${checked} rule-based item(s) solved against ${WORDLIST.split('/').pop()}.`);
  console.log(
    `Unanswerable items flagged: ${defects.size} (${raised} newly raised, ${lifted} lifted after a fix). ` +
      'A flagged item cannot reach REVIEWED by any route.',
  );
  if (defects.size > 0) {
    console.log('\nDEFECTS — the item\'s own rule does not produce its key:');
    for (const [id, detail] of defects) console.log(`  ✗ ${id}: ${detail}`);
  }

  const report = (name: string, list: WordPuzzleFailure[]): void => {
    if (list.length === 0) return;
    const byRule = list.reduce<Record<string, number>>((acc, f) => { acc[f.rule] = (acc[f.rule] ?? 0) + 1; return acc; }, {});
    console.log(`\n${name}: ${list.length} — ${Object.entries(byRule).map(([r, n]) => `${r}: ${n}`).join(', ')}`);
    for (const f of list.slice(0, 20)) console.log(`  · [${f.rule}] ${f.where}: ${f.detail}`);
    if (list.length > 20) console.log(`  … and ${list.length - 20} more`);
  };
  report('DRAFT backlog (not serving, not blocking)', draft);
  console.log(
    `\nThree-outcome grading — AMBIGUOUS ${outcomes.AMBIGUOUS} (a competitor is a word in common usage) · ` +
      `REVIEW ${outcomes.REVIEW} (competitors are dictionary-only). ` +
      `Everything else passed.`,
  );

  const escaped = await prisma.item.findMany({
    where: { answerFlaggedAt: { not: null }, status: { in: ['REVIEWED', 'LIVE'] } },
    select: { id: true, status: true, answerFlagNote: true },
  });
  if (escaped.length > 0) {
    console.error(`\nUNANSWERABLE ITEMS PAST THE REVIEW DOOR (${escaped.length}):`);
    for (const row of escaped) console.error(`  ✗ ${row.id} [${row.status}]: ${row.answerFlagNote}`);
    console.error('\nThese cannot be signed off. Fix the item or retire it.');
    await prisma.$disconnect();
    process.exit(1);
  }

  if (serving.length > 0) {
    console.error(`\nSERVING items FAILED the word-puzzle gate (${serving.length}):`);
    for (const f of serving) console.error(`  ✗ [${f.rule}] ${f.where}: ${f.detail}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log('\nNothing serving has more than one right answer.');
  await prisma.$disconnect();
}

void main();
