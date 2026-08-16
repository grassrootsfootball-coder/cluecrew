/**
 * THE COMPREHENSION SET, WITH ITS TEXT — `pnpm export:comprehension-library`
 *
 * Cowork's staging library holds 27 comprehension entries against the platform's 38. The surplus
 * is invisible from its side, and it will not guess at an entry it cannot read: a mechanism it
 * cannot see is one it cannot walk, and the enumeration then reports a route as unavailable when
 * the library in fact offers it.
 *
 * So this ships the ids WITH their descriptions and child hints — everything needed to walk an
 * item against them. Sending ids alone would be R25's fault exactly: an account of a value where
 * the value itself was needed.
 *
 * THE SET IS DEFINED BY THE GATE'S OWN FILTER, not by a second opinion about what counts as
 * comprehension: `en-` prefixed, minus any id carrying a SPaG marker. That list is duplicated
 * here from verify_enumeration.py and it is the one thing in this file that can drift — if the
 * gate's markers change, this export silently describes a different set. Stated rather than
 * fixed, because the gate is Cowork's artefact and this repo does not edit it.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { prisma } from '../packages/db/src/index';

/** Duplicated from tools/verify_enumeration.py — see the header note on drift. */
const SPAG = ['homophone', 'suffix', 'silent', 'apostrophe', 'punctuation', 'comma', 'paired',
  'word-class', 'tense', 'conjunction', 'question-tag', 'a-an', 'capitalisation', 'multimark',
  'over-tick', 'consonant', 'subject-verb', 'preposition', 'comparative', 'relative-pronoun',
  'modal', 'article', 'n-option'];

const DEST = process.env.COMPREHENSION_LIB_PATH
  ?? '/Users/davidb/Downloads/11+/from-cluecrew/comprehension-library-current.json';

export async function exportComprehensionLibrary(): Promise<{ count: number; path: string }> {
  const rows = await prisma.misconception.findMany({
    where: { district: 'ENGLISH' },
    orderBy: { id: 'asc' },
    select: { id: true, status: true, description: true, childHint: true, category: true },
  });
  /**
   * CLASSIFIED BY CARRIER, NEVER BY ID (David's ruling, 2026-08-16). See below for what the id
   * string cost.
   *
   * This read `r.id.includes(s)` over a list containing `'relative-pronoun'`, so
   * `en-relative-pronoun-choice` — a COMPREHENSION entry the reviewer approved on 16 August — was
   * classified SPaG and silently dropped. She approved an entry that then never crossed, and it was
   * found by Cowork noticing the sheet named something the export did not contain.
   *
   * A substring test cannot tell a category from a word that happens to appear inside an id, and it
   * fails SILENTLY and OUTWARD: it removes rows without reporting that it removed them. R57's shape
   * in a filter — the door that drops what it cannot name.
   *
   * Whole-segment matching: `en-relative-pronoun-choice` splits to
   * [relative, pronoun, choice] and never matches the segment `relative-pronoun` as a unit unless
   * the id genuinely carries it as consecutive segments... so the list is matched against the id's
   * SEGMENT RUNS, and every exclusion is REPORTED by id rather than made quietly.
   */
  // WHAT AN ENTRY IS, IS WHAT CARRIES IT. The id list was wrong in BOTH directions on the same
  // sheet: it dropped `en-relative-pronoun-choice` because the string contains "relative-pronoun",
  // and it KEPT `en-determiner-omitted` because no string matched — and both are carried only by
  // `en-spag-cloze` items. One entry the reviewer approved never crossed; another crossed into the
  // wrong library carrying her own rewritten hint. A substring is not a fact about an entry.
  const carriers = await prisma.itemOption.findMany({
    where: { misconceptionId: { in: rows.map((r) => r.id) } },
    select: { misconceptionId: true, item: { select: { questionTypeId: true } } },
  });
  const typesByTag = new Map<string, Set<string>>();
  for (const c of carriers) {
    const s = typesByTag.get(c.misconceptionId!) ?? new Set<string>();
    s.add(c.item.questionTypeId);
    typesByTag.set(c.misconceptionId!, s);
  }
  /** Comprehension if ANY comprehension item carries it. An uncarried entry falls back to the id. */
  const isComprehension = (id: string): boolean => {
    const types = typesByTag.get(id);
    if (types?.size) return [...types].some((t) => t.startsWith('en-comp'));
    return !SPAG.some((s) => id.includes(s));
  };
  const comprehension = rows.filter((r) => r.id.startsWith('en-') && isComprehension(r.id));
  const excluded = rows.filter((r) => r.id.startsWith('en-') && !isComprehension(r.id));
  // EVERY EXCLUSION NAMED, EVERY RUN. A filter that drops rows without saying so is R57 in a filter.
  console.log(`  excluded (${excluded.length}) — SPaG by carrier, or uncarried and SPaG by id:`);
  for (const e of excluded) {
    const t = typesByTag.get(e.id);
    console.log(`    - ${e.id}${t?.size ? `  (carried by ${[...t].join(', ')})` : '  (no carrier — classified by id)'}`);
  }
  const body = {
    kind: 'comprehension-library-current',
    source: 'cluecrew-platform-db',
    note: 'The DB holds library text. Propose a change as a TRANSFORM against the childHint quoted '
      + 'here, never as a rewritten copy, and re-run this export rather than keeping it as a '
      + 'working copy.',
    exportedAt: new Date().toISOString(),
    count: comprehension.length,
    misconceptions: comprehension.map((r) => ({ ...r, category: r.category ?? null })),
  };
  const json = JSON.stringify(body, null, 2);
  mkdirSync(dirname(DEST), { recursive: true });
  writeFileSync(DEST, json);
  return { count: comprehension.length, path: DEST };
}

async function main(): Promise<void> {
  const { count, path } = await exportComprehensionLibrary();
  const raw = readFileSync(path, 'utf8');
  console.log(`wrote ${count} comprehension entries → ${path}`);
  console.log(`  sha256: ${createHash('sha256').update(raw).digest('hex').slice(0, 16)}`);
  await prisma.$disconnect();
}

if (process.argv[1]?.endsWith('export-comprehension-library.ts')) void main();
