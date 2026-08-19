/**
 * NO REVIEW FURNITURE ON A SERVED SURFACE — stated in writing, and asserted.
 *
 * **ANNIE'S LINE, 2026-08-19: "the ruled-note banner must not exist on the served surface."** She
 * asked for it in writing after the N badge, and writing is where it has stopped twice: the N badge
 * and the orange banner were both caught by a reviewer looking at a render, not by anything that
 * could catch them again.
 *
 * **WHAT REVIEW FURNITURE IS.** Anything on the card that exists for a reviewer rather than for the
 * child: a ruling note, an item id, a status pill, a "ruled" or "signed" marker, a debug banner.
 * Harmless on a harness page and never acceptable on the surface a child meets — a child who sees a
 * badge she cannot act on learns that some marks on the card are not for her, which is the exact
 * habit an exam surface must not teach.
 *
 * **THE SCOPE IS THE CHILD'S IMPORT CLOSURE, NOT A FOLDER** (R243). `app/crew` is the child's route
 * group, but a component under `components/crew` can be imported by a debug page and a debug page
 * can import a crew component — the folder does not settle which surface a string reaches. The
 * closure from the child's own entry points does, and it is derived rather than listed.
 *
 * **AND THE CONTROL IS THE DEBUG PAGE.** `debug/vr-hint` legitimately carries reviewer furniture.
 * If the matcher finds none there, it has gone blind and this check fails rather than reporting a
 * clean child surface (R60 question 2).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { importClosure } from './lib/import-closure';
import { requirePopulation } from './lib/population';

const REPO = resolve(import.meta.dirname, '..');
const WEB = join(REPO, 'apps/web');
const PACKAGE_ROOTS = {
  '@/': WEB,
  '@cluecrew/core': join(REPO, 'packages/core/src'),
  '@cluecrew/db': join(REPO, 'packages/db/src'),
  '@cluecrew/ui': join(REPO, 'packages/ui/src'),
};

function entriesUnder(dir: string, match: RegExp): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (match.test(name)) out.push(full);
    }
  };
  walk(dir);
  return out;
}

/**
 * Markers of review furniture. **MATCHED IN RENDERED TEXT ONLY**, which is the whole difficulty.
 *
 * The first version of this matcher searched raw source across the closure and reported six
 * "faults", every one of them a DATA FIELD NAME OR AN ENUM VALUE in server code — `ruled:` in a
 * const, `action: 'SIGNED'` in a Prisma query. **None of them renders anything.** Matching source
 * text where the property is about rendered output is the same fault as counting a comment as a
 * reader (R243) and clearing a mode kind on a collision with ordinary English (R229): three
 * versions of one mistake in three days, which makes it the thing to design against rather than
 * to fix again.
 *
 * So: `.tsx` only — a `.ts` module renders nothing — and only the two places text reaches a child,
 * a JSX text node (`>…<`) or a rendering attribute (`aria-label`, `title`, `alt`, `placeholder`).
 */
const FURNITURE = [
  { name: 'ruled-note banner', re: /\b(ruled note|ruled-note|this item is ruled|ruling:)/i },
  { name: 'signature or status pill', re: /\b(SIGNED|UNSIGNED|DRAFT ITEM|PROPOSED|RETIRED)\b/ },
  { name: 'reviewer-only badge', re: /\breviewer(-| )?(badge|banner|note|view|only)\b/i },
  { name: 'internal item id on the card', re: /\b(ENG|VR|NVR)-\d{3}-[A-Z]/ },
];

/** The two places a string in a component becomes something a child reads. */
function renderedText(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/>\s*([^<>{}\n][^<>{}]*?)\s*</g)) out.push(m[1]!);
  for (const m of src.matchAll(/\b(?:aria-label|title|alt|placeholder)\s*=\s*["']([^"']+)["']/g)) out.push(m[1]!);
  return out.filter((t) => /[a-z]/i.test(t));
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function furnitureIn(files: string[]): { file: string; line: number; marker: string; text: string }[] {
  const hits: { file: string; line: number; marker: string; text: string }[] = [];
  for (const file of files.filter((f) => f.endsWith('.tsx'))) {
    const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
    lines.forEach((line, i) => {
      for (const text of renderedText(line)) {
        for (const f of FURNITURE) {
          if (f.re.test(text)) hits.push({ file: relative(REPO, file), line: i + 1, marker: f.name, text });
        }
      }
    });
  }
  return hits;
}

/**
 * THE CONTROL IS A SAMPLE, NOT A PAGE. The debug renders had their banner REMOVED on Annie's
 * instruction, so there is no longer any live furniture to prove the matcher can see — and a
 * control that depends on the fault still existing somewhere disappears the moment the codebase
 * gets it right. A synthetic sample through the identical matcher does not.
 */
const CONTROL_SAMPLE = [
  '<p aria-label="Reviewer note">x</p>',
  '<span>RULING: pinned last</span>',
  '<div>ENG-003-A-CZ-A2</div>',
].join('\n');

function controlFires(): string[] {
  const found: string[] = [];
  for (const line of CONTROL_SAMPLE.split('\n')) {
    for (const text of renderedText(line)) {
      for (const f of FURNITURE) if (f.re.test(text)) found.push(f.name);
    }
  }
  return [...new Set(found)];
}

async function main() {
  const childRoots = [
    ...entriesUnder(join(WEB, 'app/crew'), /^(page|layout|template)\.tsx?$/),
    ...entriesUnder(join(WEB, 'app/api/story'), /^route\.ts$/),
    ...entriesUnder(join(WEB, 'app/api/crew'), /^route\.ts$/),
  ];
  const debugRoots = entriesUnder(join(WEB, 'app/debug'), /^page\.tsx?$/);
  const child = importClosure(childRoots, PACKAGE_ROOTS);
  const debug = importClosure(debugRoots, PACKAGE_ROOTS);
  requirePopulation('review furniture', {
    'child entry points': childRoots.length,
    'files in the child closure': child.files.length,
    'debug entry points': debugRoots.length,
  });

  const childHits = furnitureIn(child.files);
  const childRel = new Set(child.files);
  const debugOnly = debug.files.filter((f) => !childRel.has(f));
  const debugHits = furnitureIn(debugOnly);
  const control = controlFires();

  console.log('review furniture on the served surface');
  console.log(`  child closure: ${child.files.length} files from ${childRoots.length} entry points`);
  console.log(`  CONTROL — markers the matcher fires on, against a synthetic sample: ${control.length} of ${FURNITURE.length}`);
  for (const c of control) console.log(`      ${c}`);
  console.log(`  debug-only pages (furniture is legitimate there): ${debugHits.length} hit(s)`);
  console.log(`  CLAIM   — furniture found on the child's path: ${childHits.length}`);

  const faults: string[] = [];
  if (control.length < 3) {
    faults.push(`CONTROL FAILED: the matcher fired on only ${control.length} of its own sample markers. It is blind and the child-side result carries no information.`);
  }
  for (const h of childHits) {
    faults.push(`REVIEW FURNITURE ON A SERVED SURFACE: ${h.file}:${h.line} (${h.marker}) — ${h.text}`);
  }

  if (faults.length > 0) {
    console.error('\nFAULTS');
    for (const f of faults) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("\n  No ruled-note banner, status pill or reviewer badge exists on any surface a child can reach.");
}

main();
