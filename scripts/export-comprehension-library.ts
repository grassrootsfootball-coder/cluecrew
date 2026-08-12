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
  const comprehension = rows.filter(
    (r) => r.id.startsWith('en-') && !SPAG.some((s) => r.id.includes(s)),
  );
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
