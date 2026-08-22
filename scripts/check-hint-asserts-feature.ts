/**
 * DOES A LIBRARY HINT ASSERT A FEATURE ITS CARRIERS DO NOT HAVE? (Annie, 2026-08-22 — R577.)
 *
 * **The library-fit reading with a machine-findable subset, and the bound is the locator's bound in
 * a new place.** A library hint fails by GENERALITY — it does not know which item it will land on.
 * But a hint that ASSERTS something about the item makes a checkable claim, and the claim is either
 * true of a carrier or it is not:
 *
 *     "Two people are being described."          asserts a PAIR
 *     "Keep the mark inside the speech marks."   asserts SPEECH
 *     "Check the line numbers."                  asserts LINE REFERENCES
 *     "Find the small negative word."            asserts A NEGATIVE
 *
 * **`en-attribute-transfer` is the instance that started it**: 43 carriers, and its hint tells the
 * child that two people are being described. **All four LIVE carriers name at most one person**, and
 * it lands on 0 of 8 vocabulary items and 0 of 3 technique items — where there are no characters at
 * all. The hint is not merely general; **on those it instructs an act the item does not contain.**
 *
 * **THE BOUND, AS A COUNT, ON EVERY RUN (her rule, from the locator).**
 *
 *   FINDABLE    the hint asserts a COUNTABLE feature and the carrier either has it or does not:
 *               speech marks, line references, a negative. Decided by looking.
 *   CANDIDATE   the feature is real but only a proxy is available — "two people" is counted as
 *               "two capitalised names", which cannot see *the older rabbit* or *her mother*.
 *   NOT SCREENED  the hint describes a MOVE rather than asserting a feature — *"ask what the echo
 *               does to the reader"*. There is nothing to test a carrier against.
 *
 * Every row is a candidate for her reading (R94), marked with the evidence it matched on (R569).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO, 'content/passages');

interface Feature {
  name: string;
  kind: 'FINDABLE' | 'CANDIDATE';
  /** The hint asserts this feature. */
  assertedBy: RegExp;
  /** Does the carrier have it? `scanned` is stem + every option value; `passage` may be empty. */
  present: (scanned: string, passage: string, lineRefs: unknown) => boolean;
  why: string;
}

const NOT_A_NAME = new Set(
  ('The A An And But Or If When Where What Which Who How Why Read Find Check Look Two One This That These'
  + ' Those He She They It There Here Mr Mrs Miss His Her Their In On At To For From With Is Are Was Were'
  + ' Line Lines Some All Both Each Every Do Does Did Not No So As Then Than You Your').split(' '),
);
function namesIn(text: string): string[] {
  const out = new Set<string>();
  for (const s of text.split(/(?<=[.!?])\s+|\n/)) {
    s.trim().split(/\s+/).forEach((raw, i) => {
      const t = raw.replace(/[^A-Za-z'-]/g, '');
      if (i === 0 || t.length < 3 || NOT_A_NAME.has(t)) return;
      if (/^[A-Z][a-z'-]+$/.test(t)) out.add(t.replace(/'s$/, ''));
    });
  }
  return [...out];
}

const FEATURES: Feature[] = [
  {
    name: 'SPEECH',
    kind: 'FINDABLE',
    assertedBy: /\b(speech marks|spoken words|the mark inside)\b/i,
    present: (scanned, passage) => /["“”']\s*\w/.test(scanned) || /["“”]/.test(passage),
    why: 'Speech marks are punctuation. Their presence in the item or its passage is decided by looking.',
  },
  {
    name: 'LINE REFERENCES',
    kind: 'FINDABLE',
    assertedBy: /\b(line numbers|the lines|line \d)\b/i,
    present: (scanned, _p, lineRefs) =>
      /\bline[s]?\s*\d/i.test(scanned) || (Array.isArray(lineRefs) && lineRefs.length > 0),
    why: 'An item either cites lines or it does not. Both the stem wording and the lineRefs column say so.',
  },
  {
    name: 'A NEGATIVE',
    kind: 'FINDABLE',
    assertedBy: /\b(negative word|small negative|'not'|word 'no')\b/i,
    /**
     * **THE SCOPE IS THE PASSAGE, BECAUSE THE HINT SAYS "IN THE LINE".** The first version scanned
     * the stem and options only and reported 23 of 36 carriers lacking a negative — a number
     * manufactured by looking in the wrong place, since the word the child is sent to find is in the
     * TEXT, not in the question. R453: a wrong scope produces a real-looking count.
     */
    present: (scanned, passage) => /\b(not|no|never|none|nothing|n't)\b/i.test(`${scanned} ${passage}`),
    why: 'A negative word is a word, and the hint sends the child to the LINE — so the passage is in '
      + 'scope alongside the stem and options. Decided by looking.',
  },
  {
    name: 'A PAIR OF PEOPLE',
    kind: 'CANDIDATE',
    assertedBy: /\b(two people|two characters|which one each)\b/i,
    present: (scanned) => namesIn(scanned).length >= 2,
    why: 'Counted as two capitalised names, which is a PROXY: it cannot see "the older rabbit" or '
      + '"her mother", which are two people without being two names. A miss here is a row to read.',
  },
];

/** Asserted but NOT screened — declared so the unfindable band has a size rather than a silence. */
const NOT_SCREENED = [
  { pattern: /\b(compar|metaphor|simile|like a)\b/i, why: 'a COMPARISON is a technique reading, not a countable feature' },
  { pattern: /\b(list|each of the)\b/i, why: 'a LIST in the option set is not the same object as a list in the text' },
];

function passages(): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of readdirSync(PASSAGES).filter((n) => n.endsWith('.json'))) {
    const p = JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as { id?: string; extract?: unknown };
    if (typeof p.id === 'string' && typeof p.extract === 'string') out.set(p.id, p.extract);
  }
  return out;
}

async function main() {
  const texts = passages();
  const lib = await prisma.misconception.findMany({ select: { id: true, childHint: true } });
  const items = await prisma.item.findMany({ include: { options: true } });

  const english = lib.filter((m) => m.id.startsWith('en-') && String(m.childHint ?? '').trim() !== '');
  const asserting = english.filter((m) => FEATURES.some((f) => f.assertedBy.test(String(m.childHint))));
  const notScreened = english.filter((m) =>
    !FEATURES.some((f) => f.assertedBy.test(String(m.childHint)))
    && NOT_SCREENED.some((n) => n.pattern.test(String(m.childHint))));

  requirePopulation('check:hint-asserts-feature', {
    'English library hint(s)': english.length,
    'of those, asserting a feature this can TEST — THE POPULATION': asserting.length,
    'item(s) available as carriers': items.length,
  });

  const findings: string[] = [];
  for (const m of asserting.sort((a, b) => a.id.localeCompare(b.id))) {
    const hint = String(m.childHint);
    for (const f of FEATURES) {
      if (!f.assertedBy.test(hint)) continue;
      const carriers = items.filter((i) => i.options.some((o) => (o as { misconceptionId?: string | null }).misconceptionId === m.id));
      if (carriers.length === 0) continue;
      const lacking = carriers.filter((i) => {
        const stem = i.stem as Record<string, unknown>;
        const stemText = [stem.text, stem.prompt, stem.sentence].find((t): t is string => typeof t === 'string') ?? '';
        const scanned = [stemText, ...i.options.map((o) => String(((o.content ?? {}) as { value?: unknown }).value ?? ''))].join(' ');
        const ref = stem.passageRef;
        return !f.present(scanned, (typeof ref === 'string' ? texts.get(ref) : '') ?? '', i.lineRefs);
      });
      if (lacking.length === 0) continue;
      const live = lacking.filter((i) => i.status === 'LIVE');
      findings.push(
        `  ${f.kind === 'FINDABLE' ? 'LACKS THE FEATURE' : 'CANDIDATE        '}  ${m.id}  asserts ${f.name}`
        + `\n      hint: ${hint}`
        + `\n      ${lacking.length} of ${carriers.length} carrier(s) lack it — ${live.length} of them LIVE`
        + `\n      first few: ${lacking.slice(0, 5).map((i) => i.id).join(', ')}`
        + `\n      how tested: ${f.why}`,
      );
    }
  }

  console.log(`\n${findings.length} FINDING(S) — each a row worth her reading, never a verdict.\n`);
  for (const l of findings) console.log(`${l}\n`);
  console.log(
    '  THE BOUND, AS A COUNT:\n'
    + `      ${asserting.length} English hint(s) assert a feature this can TEST  — the population.\n`
    + `      ${notScreened.length} assert something NOT SCREENED — ${NOT_SCREENED.map((n) => n.why).join('; ')}.\n`
    + `      ${english.length - asserting.length - notScreened.length} describe a MOVE and assert nothing about the item, so there is\n`
    + '                                        nothing to test a carrier against. UNFINDABLE, and that\n'
    + '                                        is the ordinary case rather than a gap.\n'
    + '\n  A FINDABLE row is decided by looking; a CANDIDATE row rests on a proxy that is named on the\n'
    + '  row itself. The two are never added together.',
  );
  await prisma.$disconnect();
}

void main();
