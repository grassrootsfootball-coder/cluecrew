/**
 * EVERY CARRIER OF ONE LIBRARY ENTRY, WITH THE FIT QUESTION (Annie, 2026-08-22 — R587).
 *
 * **`--entry <id>`.** Generalised from the `en-attribute-transfer` delivery the moment a second entry
 * needed the same reading — a third bespoke exporter is R429 with a new name.
 *
 * **A LIBRARY HINT IS READ AGAINST ITS CARRIERS (R572), AND SHE WILL NOT AUTHOR WITHOUT THEM.** Her
 * rule, set last turn and meeting its first test here: *"a move-hint needs to know the move is right
 * for the error, and the error's shape on real items is what I do not have."* Every carrier arrives
 * with its stem, its three-part set (R573), and the option that actually carries the tag.
 *
 * **WHERE THE DESCRIPTION IS DISJUNCTIVE, THE BRANCHES TRAVEL WITH IT (R580).** `en-vocab-form-
 * lookalike` names *a different word the target resembles* OR *a morpheme met in other words*, and
 * the hint — *"Read it letter by letter"* — reaches the first and cannot reach the second: **reading
 * the letters of `stranger` gives the same letters, and the fault is in how they were parsed.** Two
 * branches, two moves, and by her own unstressed-vowel ruling that is a SPLIT rather than a merged
 * hint: a tag chooses one hint and one hint names one move.
 *
 * **THE FORM SIGNAL IS SCOPED AND MARKED, NEVER SCORED (R569, R94).** It applies only where a
 * headword is quoted in the stem — vocabulary items — and it is a proxy for which branch a carrier
 * belongs to, not a verdict on one.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { branches } from './lib/description-branches';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { readFieldsByName } from './lib/field-read';
import { threePartSet } from './lib/option-set';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const entryArg = process.argv.indexOf('--entry');
const ENTRY = entryArg === -1 ? null : process.argv[entryArg + 1];

/** Suffixes and combining forms a child can meet in other words. The morpheme branch's evidence. */
const SUFFIXES = ['able', 'ible', 'ness', 'less', 'ment', 'tion', 'sion', 'ous', 'ful', 'est', 'ing',
  'ly', 'er', 'ed', 'y', 'al', 'ic'];
/**
 * **PREFIXES, because the first version had only suffixes and mis-sized the split.** `misgave` —
 * whose distractor is *"handed him something by mistake"* — is `mis-` + `gave`, a morpheme fault
 * through and through, and it was signalled LOOKALIKE because nothing was looking at the front of
 * the word. A branch count is the thing she is about to author against; a signal blind to half the
 * morphology would have handed her a smaller morpheme branch than the corpus holds.
 */
const PREFIXES = ['mis', 'irre', 'irr', 'un', 'dis', 'over', 'under', 'pre', 'sub', 'inter', 're', 'in', 'im', 'il', 'ir'];
const COMBINING = ['scope', 'graph', 'logy', 'phone', 'meter', 'port', 'ject', 'dict', 'spect'];

function formSignal(headword: string): { branch: string; evidence: string } | null {
  const w = headword.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length < 4) return null;
  for (const c of COMBINING) {
    if (w.includes(c) && w !== c) return { branch: 'MORPHEME', evidence: `contains the combining form -${c}` };
    if (w === c) return { branch: 'MORPHEME', evidence: `is itself the combining form -${c}, met inside longer words` };
  }
  for (const a of SUFFIXES) {
    if (w.endsWith(a) && w.length - a.length >= 4) {
      return { branch: 'MORPHEME', evidence: `splits as "${w.slice(0, -a.length)}" + "-${a}"` };
    }
  }
  for (const p of PREFIXES) {
    if (w.startsWith(p) && w.length - p.length >= 3) {
      return { branch: 'MORPHEME', evidence: `splits as "${p}-" + "${w.slice(p.length)}"` };
    }
  }
  return { branch: 'LOOKALIKE', evidence: 'no affix or combining form — the whole word resembles another' };
}

async function main() {
  if (!ENTRY) throw new Error('deliver-entry-carriers: --entry <misconception-id> is required.');
  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id: ENTRY } });
  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });
  const lib = new Map((await prisma.misconception.findMany({ select: { id: true, childHint: true } }))
    .map((m) => [m.id, m.childHint]));

  readFieldsByName(
    `deliver:entry-carriers(${ENTRY}) / item.stem`,
    items.map((i) => (i.stem ?? {}) as Record<string, unknown>),
    ['text', 'prompt', 'sentence', 'passageRef'],
  );

  const carriers = items.filter((i) => i.options.some((o) => (o as { misconceptionId?: string | null }).misconceptionId === ENTRY));
  requirePopulation(`deliver:entry-carriers(${ENTRY})`, {
    'item(s) scanned': items.length,
    'carrier(s)': carriers.length,
  });

  const rows = carriers.sort((a, b) => a.id.localeCompare(b.id)).map((i) => {
    const stem = i.stem as Record<string, unknown>;
    const stemText = [stem.text, stem.prompt, stem.sentence].find((t): t is string => typeof t === 'string') ?? '';
    const set = threePartSet(i.options, lib);
    // The headword is the quoted span in a vocabulary stem. Absent elsewhere, and null is honest.
    /**
     * **THE HEADWORD IS THE ONE THE QUESTION ASKS ABOUT, NOT THE FIRST QUOTED SPAN.** A vocabulary
     * stem often quotes the passage line AND the word: *"Mr Darcy says Elizabeth 'is tolerable: but
     * not handsome enough to tempt me'. What does 'tolerable' mean here?"* Taking the first match
     * returned `". What does"` — a fragment, signalled LOOKALIKE, and wrong. Prefer the span the
     * question names; fall back to the shortest, since a headword is a word and a citation is a line.
     */
    const asked = /what does\s+['‘"“]([^'’"”]{2,40})['’"”]\s*mean/i.exec(stemText);
    const allQuoted = [...stemText.matchAll(/['‘"“]([^'’"”]{2,40})['’"”]/g)]
      .map((m) => (m[1] ?? '').trim()).filter(Boolean)
      .sort((a, b) => a.length - b.length);
    const headword = (asked?.[1] ?? allQuoted[0] ?? null)?.replace(/^the\s+/i, '').trim() ?? null;
    return {
      itemId: i.id,
      status: i.status,
      questionTypeId: i.questionTypeId,
      stem: stemText,
      headwordQuotedInStem: headword,
      theOptionsCarryingThisEntry: set.siblings.filter((s) => s.tag === ENTRY).map((s) => s.value),
      theSet: set,
      formSignal: headword ? formSignal(headword) : null,
      /**
       * **A DELIBERATELY UNPLACED ROW SAYS SO (R604).** `unplacedBySplit` was written by the split
       * and read by nothing — a decision being ignored by default, in the same turn the check for
       * that fault was built. A carrier delivered without it invites the reader to re-place a row
       * somebody already decided to leave alone.
       */
      unplacedBySplit: ((i.explanation ?? {}) as Record<string, unknown>).unplacedBySplit ?? null,
    };
  });

  const bs = branches(String(entry.description ?? ''));
  const signalled = rows.filter((r) => r.formSignal);
  const byBranch = new Map<string, number>();
  for (const r of signalled) byBranch.set(r.formSignal!.branch, (byBranch.get(r.formSignal!.branch) ?? 0) + 1);

  const payload = {
    what: `Every carrier of ${ENTRY}, with the fit question stated.`,
    theQuestionThisKindTakes: 'A library hint is read against its carriers and asked whether one wording fits them all.',
    theTwoFields: { childHint: String(entry.childHint ?? ''), description: String(entry.description ?? '') },
    theBranches: bs
      ? { count: bs.length, branches: bs.map((b) => b.trim()),
        note: 'The description states a disjunction. A hint naming one MOVE reaches one branch; two branches need two moves, which is a SPLIT rather than a merged hint.' }
      : { count: 1, branches: [String(entry.description ?? '')], note: 'The description states one case.' },
    theFormSignal: {
      what: 'Which branch a carrier looks like, from the shape of the headword quoted in its stem.',
      bound: 'Scoped to items that quote a headword. MORPHEME where the word splits into a stem plus a suffix, or carries a combining form met in longer words; LOOKALIKE otherwise. A PROXY, marked on every row with its evidence — it does not know what the child actually did.',
      counts: Object.fromEntries(byBranch),
      rowsWithNoHeadwordQuoted: rows.length - signalled.length,
    },
    denominators: { carriers: rows.length, liveCarriers: rows.filter((r) => r.status === 'LIVE').length,
      deliberatelyUnplaced: rows.filter((r) => r.unplacedBySplit !== null).length,
      questionTypes: [...new Set(rows.map((r) => r.questionTypeId))].sort() },
    rows,
  };
  const family = `carriers-${ENTRY}`;
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    `every carrier of ${ENTRY} with the fit question, the two fields and the branch signal`,
    ['what', 'theQuestionThisKindTakes', 'theTwoFields', 'theBranches', 'theFormSignal', 'denominators', 'rows']);
  const path = join(REPO, 'content/exports', stampedName(family, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, family);
  console.log(`\n${rows.length} carrier(s). Branch signal: ${[...byBranch].map(([k, v]) => `${k} ${v}`).join(', ')}`);
  await prisma.$disconnect();
}

void main();
