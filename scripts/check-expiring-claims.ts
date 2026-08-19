/**
 * CLAIMS THAT ARE TRUE TODAY AND WILL SILENTLY BECOME FALSE — `pnpm check:expiring-claims`
 *
 * **THIS CLASS SURVIVES BY BEING TRUE WHEN WRITTEN** (David, 2026-08-17 — R179/R180). "Five
 * corners" was true when it was typed and the sixth quarter made it false. `casesTotal: 21` was true
 * and a second district made it false. `all 21 GL-style question types` is true right now. **Nothing
 * reports a sentence that is correct**, so the only moment these are visible is the moment they are
 * written — and after that they are invisible until a customer reads one.
 *
 * **A LIST IS NOT ENOUGH, WHICH IS THE WHOLE LESSON OF THIS REGISTER.** A markdown file of "things
 * to remember to update" is the same instrument as a comment: correct, true, and silent. So each
 * claim carries an ASSERTION, and this runs in CI beside every other gate. A claim that cannot be
 * asserted is declared UNVERIFIABLE with the reason, never listed as if it were covered (R61).
 *
 * **AND IT FINDS THEM TOO, WHICH IS THE HALF THAT MAKES DECLARING NON-OPTIONAL** (David, 2026-08-17
 * — R181). Declaring was a discipline, and a check that depends on someone remembering to declare is
 * the carriage registry before it was structured. The fix there was to make the field RESOLVE
 * against the schema rather than asking people to remember; the equivalent here is a scan that FAILS
 * on an undeclared quantity claim in public copy.
 *
 * **IT NEEDS NO PROSE PARSER, WHICH IS WHY IT IS CHEAP.** The copy is JSX, and TypeScript's own
 * parser hands back `JsxText` nodes exactly. Better still, `{expr}` is a `JsxExpression` and NOT
 * `JsxText`, so **a derived number is invisible to this scan by construction** — which is the
 * correct semantics, because a derived number cannot rot.
 *
 * **THE NARROWING WAS MEASURED, NOT GUESSED.** A bare number in public copy is mostly noise: 77
 * matches across 18 files, nearly all "the 11+", "15 calm minutes", "one toggle", "30 days". A gate
 * failing on 74 false positives is a gate someone switches off. Two narrowings, measured in order:
 * require the number to QUANTIFY ONE OF OUR OWN NOUNS (77 -> 16), and drop "one"/"two", which in
 * English prose are the indefinite article far more often than a count (16 -> **10, with no false
 * positives**). Anything looser cries wolf; anything tighter starts missing real claims.
 *
 * **IT NOW HOLDS TWO KINDS, AND THE SECOND IS A RULING'S PREMISE** (David's ruling, 2026-08-17 —
 * R196). A decision and its premise are two facts and only one gets written down, so a later change
 * cannot know what it invalidates. Measured against the last twenty rulings, only **2 of 20** rest
 * on a load-bearing premise a machine can resolve — most are judgement, taste or discipline, and a
 * good ruling often survives its own premise on purpose. So there is NO premise register: rulings
 * that condition on a SERVING-PATH FACT (tier, reachability, status, or the size of a named
 * population) declare HERE, beside the copy claims, and nothing else was built. A third instrument
 * doing what the first already does is the shape this register has a hundred entries about.
 *
 * **THE n=2 CAVEAT IS PART OF THE FINDING, NOT A HEDGE.** Both premise-failures observed on the day
 * this was written fall in the checkable bucket — **by construction, because only a checkable
 * premise can visibly fail.** Two is not a rate. Nothing here is evidence about how often a premise
 * goes stale, and it must not be read as any.
 */
import ts from 'typescript';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { FAMILY_BY_TYPE, LIFTED_HOLDS, NVR_TEMPLATES, isHeldFromServing } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const REPO = resolve(import.meta.dirname, '..');
const APP = join(REPO, 'apps/web/app');

/** Public marketing surfaces. Signed-in surfaces carry live data and are not marketing claims. */
const PUBLIC_DIRS = [
  '11-plus', 'accessibility', 'bursary', 'faq', 'founding', 'holding',
  'how-we-teach', 'pricing', 'privacy', 'safeguarding', 'schools', 'unsubscribed',
];

/** Our own countable nouns. A number next to one of these is a claim about US, not about the world. */
const OUR_NOUNS =
  /(question[- ]type|question types|case librar|cases?|districts?|items?|templates?|word cards?|passages?|families|family|ways?|modes?)\b/i;

/**
 * Digits, and number-words from THREE up. "one" and "two" are excluded deliberately and the reason
 * is measured: in this copy they are the indefinite article ("one detective Case", "one toggle",
 * "one thing to try at home") far more often than a count, and including them added six false
 * positives and no true ones.
 */
const QUANTITY = /(?<![\w£$.\-])(\d{1,4})(?![\w%.\-])|\b(three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|twenty|thirty)\b/gi;

/**
 * NORMALISE FOR COMPARISON, and the three things here were each a false failure on the first run —
 * every one of them the INSTRUMENT rather than the copy (R173, in the check written to close R180):
 *   · case — the declaration said "five ways", the heading says "Five ways into every concept";
 *   · JSX entities — the source carries `&apos;`, the rendered page carries an apostrophe;
 *   · whitespace, because JSX wraps sentences across source lines freely.
 */
const NORM = (s: string) =>
  s.replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ').trim().toLowerCase();

function publicPageFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.tsx')) out.push(p);
    }
  };
  for (const d of PUBLIC_DIRS) walk(join(APP, d));
  out.push(join(APP, 'page.tsx'));
  return out;
}

interface Found { file: string; text: string; token: string }

/** Every quantity claim about our own content, in the rendered text of a public page. */
function findQuantityClaims(): Found[] {
  const found: Found[] = [];
  for (const file of publicPageFiles()) {
    const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node): void => {
      if (ts.isJsxText(node)) {
        const text = NORM(node.text);
        if (text) {
          for (const m of text.matchAll(QUANTITY)) {
            const after = text.slice(m.index + m[0].length, m.index + m[0].length + 45);
            if (OUR_NOUNS.test(after)) {
              found.push({ file: relative(REPO, file), text, token: m[0] });
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(src);
  }
  return found;
}

interface Claim {
  /** Where the sentence lives, so a failure points at the copy and not at this file. */
  where: string;
  /** The claim AS A READER MEETS IT — quoted, not paraphrased (R25). */
  says: string;
  /**
   * THE LITERAL COPY, when the claim IS a sentence on a page. Used two ways: it covers the scanner's
   * hits, and its ABSENCE from the page fails as ORPHANED — a declaration guarding copy that has
   * been reworded is guarding nothing (R86, in the artefact meant to close that shape).
   *
   * Omitted when the claim is a PROPERTY rather than a sentence — "the section names VR and no other
   * district" is not a quotable string, and pretending it is would orphan on every run. That
   * distinction was itself a first-run false failure.
   */
  quotes?: string;
  /**
   * Set when this is a RULING'S PREMISE rather than a sentence on a page: the register entry whose
   * reasoning rests on this fact. A premise carries no `quotes` — it is not copy, so it takes no
   * part in the public-copy scan and cannot orphan against it.
   */
  premiseFor?: string;
  /** Who may change it. Public marketing copy is David's, not mine. */
  owner: string;
  /** What would make it false. Written for the person reading the failure, not for the checker. */
  breaksWhen: string;
  /** Returns null when the claim holds, or the reason it no longer does. */
  check: () => Promise<string | null>;
}

const CLAIMS: Claim[] = [
  {
    where: 'apps/web/app/founding/page.tsx — "What\'s live today"',
    says: 'Live now: Verbal Reasoning — all 21 GL-style question types, taught five ways, free to start.',
    quotes: 'Verbal Reasoning — all 21 GL-style question types, taught',
    owner: 'David (public marketing copy)',
    breaksWhen: 'a 22nd VR question type lands, or one is retired',
    check: async () => {
      const n = await prisma.questionType.count({ where: { district: 'VR' } });
      return n === 21 ? null : `the store has ${n} VR question types, the page says 21`;
    },
  },
  {
    /**
     * A STATE CLAIM, AND IT CAN CARRY AN ASSERTION — but only in one direction, which is stated here
     * rather than left for someone to assume (R61's discipline applied to a claim's coverage).
     *
     * ASSERTED: English has at least one free-tier case. If that ever becomes false, the page is
     * telling a parent something is open that is not, which is the costly direction.
     *
     * NOT ASSERTED, AND NOT ASSERTABLE FROM THE STORE: the word "opening". A district that has
     * FINISHED opening still satisfies "at least one free case" perfectly, so this cannot tell you
     * the sentence has gone from true to merely dated. **It is the sentence most likely to be wrong
     * later, and this check only covers half of how it can be wrong.** The other half is a decision
     * David makes, and no query knows when he has made it.
     */
    where: 'apps/web/app/founding/page.tsx — "What\'s live today"',
    says: 'English comprehension is opening now, with the first cases free.',
    quotes: 'English comprehension is opening now, with the first cases',
    owner: 'David (public marketing copy)',
    breaksWhen:
      'English has no free-tier case — the page would be offering something a free child cannot '
      + 'open. It CANNOT tell you when "opening" has become "open"; that is a decision, not a row.',
    check: async () => {
      const n = await prisma.case.count({
        where: { freeTier: true, questionType: { district: 'ENGLISH' } },
      });
      return n > 0 ? null : 'no English case is free-tier; the page says the first cases are free';
    },
  },
  {
    where: 'apps/web/app/founding/page.tsx — "What do I get free?"',
    says: 'Twelve full cases across six question families.',
    quotes: 'Twelve full cases across six question families,',
    owner: 'David (public marketing copy)',
    breaksWhen:
      'a fifth English case goes free-tier, SpaG opens (a seventh family), or the free-tier floor '
      + 'changes — both numbers are derived facts today and BOTH are expected to move',
    check: async () => {
      const free = await prisma.case.findMany({ where: { freeTier: true }, select: { questionTypeId: true } });
      const families = new Set(free.map((c) => FAMILY_BY_TYPE[c.questionTypeId] ?? '?'));
      const problems: string[] = [];
      if (free.length !== 12) problems.push(`${free.length} free cases, the page says Twelve`);
      if (families.size !== 6) problems.push(`${families.size} families (${[...families].sort().join(', ')}), the page says six`);
      return problems.length ? problems.join('; ') : null;
    },
  },
  {
    where: 'apps/web/app/founding, /how-we-teach, /pricing, / — "five ways in"',
    says: 'Every question type is taught five ways.',
    quotes: 'five ways',
    owner: 'David (public marketing copy)',
    breaksWhen: 'a sixth teaching mode is added, or one is retired',
    check: async () => {
      // The modes a case actually carries — the manifest the mode shelf renders from.
      const sample = await prisma.case.findFirst({ select: { modes: true } });
      const n = Object.keys((sample?.modes ?? {}) as Record<string, unknown>).length;
      return n === 5 ? null : `cases carry ${n} mode(s), the copy says five`;
    },
  },
  {
    /**
     * THE FIRST PREMISE, AND THE INSTANCE THAT PRODUCED THE MECHANISM (R195/R196).
     *
     * ENG-028-PR-06 is a two-span comprehension item needing **30 consecutive lines** on a window
     * that holds 5 to 7 (R185). It was left in place on the afternoon of 2026-08-17 on the explicit
     * ground that *"the item is behind the paid tier already"* — TRUE at the time. Hours later R194
     * moved `case-en-04` into the free set from the other end of the system, and that sentence
     * became false of everything. **The ruling was re-made on new ground (R195) and still says
     * "stays"; a register recording only verdicts would have shown an unbroken line.**
     *
     * Written RETROSPECTIVELY and asserted in its CURRENT direction: reachable by a free child is
     * now the true state, and it is what the mechanism watches first.
     */
    /**
     * SUPERSEDED IN PLACE, 2026-08-19: R195's ground ("stays; all 26 move together") was replaced
     * by Annie's R208 hold — the third time this one item's serving state has rested on a new
     * reason. The premise now guards the HOLD: while R208 stands, the item must be in
     * SERVING_HOLDS and still PUBLISHED. It breaks if someone lifts the hold silently — the lift
     * condition is her read of the TI-05 render, which no query can see, so removal of the hold
     * without a recorded ruling is exactly what this catches.
     */
    /**
     * LIFTED 2026-08-19 by Annie's fourth return (annie-eng003-fourth-return.md, pinned): "Receipt
     * is confirmed by this document, which was the release condition. PR-06 is released." The
     * premise now guards the RECORD of the lift: the item serves again, and the lifted hold stays
     * written in LIFTED_HOLDS — a lift whose record vanished would be the silent rename's shape.
     */
    where: 'R211 — ENG-028-PR-06 released by her fourth return (premise, not copy)',
    says: 'ENG-028-PR-06 is SERVABLE again, and the lifted hold remains recorded in LIFTED_HOLDS.',
    premiseFor: 'R211',
    owner: 'Annie (the release is hers, in writing, pinned)',
    breaksWhen:
      'the item is re-held or demoted without a recorded ruling, or the LIFTED_HOLDS record of the '
      + 'R208 hold disappears',
    check: async () => {
      const item = await prisma.item.findUnique({
        where: { id: 'ENG-028-PR-06' },
        select: { status: true, pool: true },
      });
      if (!item) return 'ENG-028-PR-06 does not exist';
      if (item.status !== 'LIVE' || item.pool !== 'PRACTICE') {
        return `ENG-028-PR-06 is ${item.status}/${item.pool} — released, but not servable`;
      }
      if (isHeldFromServing('ENG-028-PR-06')) return 'ENG-028-PR-06 is back in SERVING_HOLDS with no recorded ruling here';
      return LIFTED_HOLDS.some((h) => h.itemId === 'ENG-028-PR-06') ? null
        : 'the LIFTED_HOLDS record of the R208 hold has disappeared — a lift with no record';
    },
  },
  {
    where: 'apps/web/app/admin/sitting-one/page.tsx — NVR generator sign-off',
    says: '{NVR_TEMPLATES.length} templates',
    owner: 'derived — listed so the derivation itself is asserted, not the sentence',
    breaksWhen: 'never silently: it reads the array the generator walks',
    check: async () =>
      NVR_TEMPLATES.length > 0 ? null : 'NVR_TEMPLATES is empty; the page would render "0 templates"',
  },
];

async function main(): Promise<void> {
  requirePopulation('check:expiring-claims', { 'declared claims': CLAIMS.length });

  const results = [];
  for (const claim of CLAIMS) {
    results.push({ claim, failure: await claim.check() });
  }
  const broken = results.filter((r) => r.failure !== null);

  const premises = CLAIMS.filter((c) => c.premiseFor).length;
  console.log(`check:expiring-claims: ${CLAIMS.length} declared claim(s) asserted against the store `
    + `— ${CLAIMS.length - premises} public-copy claim(s), ${premises} ruling premise(s).\n`);
  for (const { claim, failure } of results) {
    const tag = claim.premiseFor ? `PREMISE ${claim.premiseFor}` : 'COPY';
    console.log(`  ${failure === null ? 'HOLDS ' : 'BROKEN'}  [${tag}] ${claim.where}`);
    console.log(`          "${claim.says}"`);
    if (failure !== null) {
      console.log(`          -> ${failure}`);
      console.log(`          owner: ${claim.owner}`);
    } else {
      console.log(`          breaks when: ${claim.breaksWhen}`);
    }
    console.log();
  }

  /**
   * THE SCAN. Every quantity claim about our own content, in the rendered text of a public page,
   * must be covered by a declaration above. Undeclared is a FAILURE, not a note — that is what turns
   * declaring from a discipline into a property of the code.
   */
  const found = findQuantityClaims();
  const quoted = CLAIMS.map((c) => c.quotes).filter((q): q is string => typeof q === 'string').map(NORM);
  const undeclared = found.filter((f) => !quoted.some((q) => f.text.includes(q)));

  /**
   * AND THE OTHER DIRECTION: a declaration quoting copy that no longer exists guards nothing.
   *
   * **MATCHED AGAINST THE RENDERED TEXT, NEVER THE RAW FILE.** The first version read the source and
   * reported both founding claims ORPHANED while both sentences were plainly on the page — because
   * `<strong>Live now:</strong> Verbal Reasoning…` puts a TAG in the middle of the sentence, so it is
   * never a contiguous substring of the file. Concatenating the JsxText nodes per file reassembles
   * what a reader actually sees, which is the only text a copy claim can live in.
   */
  const rendered = new Map<string, string>();
  for (const file of publicPageFiles()) {
    const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const parts: string[] = [];
    const visit = (n: ts.Node): void => {
      if (ts.isJsxText(n) && n.text.trim()) parts.push(n.text);
      ts.forEachChild(n, visit);
    };
    visit(src);
    rendered.set(relative(REPO, file), NORM(parts.join(' ')));
  }
  const allRendered = [...rendered.values()].join('\n');
  const orphaned = CLAIMS.filter((c) => c.quotes !== undefined && !allRendered.includes(NORM(c.quotes)));

  console.log(`  SCAN: ${found.length} quantity claim(s) about our own content in public copy · `
    + `${found.length - undeclared.length} covered by a declaration above.`);
  for (const f of undeclared) {
    console.log(`    x UNDECLARED  ${f.file}  "${f.token}" in: ${f.text.slice(0, 90)}`);
  }
  for (const o of orphaned) {
    console.log(`    x ORPHANED    ${o.where} declares copy that is no longer on the page: "${o.says}"`);
  }
  console.log();
  console.log('  LIMIT, PRINTED EVERY RUN: the scan reads JSX TEXT on public marketing pages only.');
  console.log('  A claim in a signed-in surface, in an image, or built from string concatenation is');
  console.log('  not seen. A `{derived}` number is deliberately not seen either — it cannot rot.');

  if (broken.length || undeclared.length || orphaned.length) {
    console.log(`\n  ${broken.length} claim(s) are no longer true. Each names its owner: copy is not`);
    console.log('  repaired by whoever runs this check.');
  }
  await prisma.$disconnect();
  process.exit(broken.length === 0 && undeclared.length === 0 && orphaned.length === 0 ? 0 : 1);
}

void main();
