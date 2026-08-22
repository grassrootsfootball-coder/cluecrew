/**
 * WHEN A CHANNEL IS CREATED, ITS REVIEWER IS CREATED WITH IT — OR IT IS THE NEXT LEAK
 * (Annie, 2026-08-22 — R563). **Her forward prediction, built into the act of creating a channel.**
 *
 * **The walk panel is the evidence.** Built this fortnight; a refused persona was in its group label
 * within days — **not because anyone decided to put it there, but because it was new, and new means
 * unwatched** (R559: copy finds the least-reviewed channel the way water finds low ground).
 *
 * **A channel is any file that puts a literal sentence in front of a child.** Its reviewer is
 * declared in one line at the top:
 *
 *     // COPY-REVIEW: <who rules the strings in this file, and where that is recorded>
 *
 * **One line at the moment of building, which gets ahead of the fault rather than chasing it.**
 * Every string in this repo that reached a child unreviewed did so through a channel nobody had
 * assigned — and the assignment is only cheap before the file exists.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SURFACES = ['apps/web/components/crew', 'apps/web/app/crew', 'apps/web/lib/voice'];
/** A literal sentence a child could read or hear. */
const CHILD_STRING = /(?:aria-label|alt|title|placeholder)\s*=\s*\{?\s*["'`][^"'`]{8,}|<(?:p|h[1-6]|button)[^>]*>\s*[A-Z][^<>{}]{10,}/;
const DECLARED = /\/\/\s*COPY-REVIEW:\s*\S/;

function files(): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    let e: string[];
    try { e = readdirSync(d); } catch { return; }
    for (const n of e) {
      if (/node_modules|\.next|\.git/.test(n)) continue;
      const p = join(d, n);
      let s; try { s = statSync(p); } catch { continue; }
      if (s.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(p) && !/\.test\./.test(p)) out.push(p);
    }
  };
  SURFACES.forEach((d) => walk(join(REPO, d)));
  return out;
}

function main() {
  const all = files();
  const channels = all.filter((f) => CHILD_STRING.test(readFileSync(f, 'utf8')));
  const undeclared = channels.filter((f) => !DECLARED.test(readFileSync(f, 'utf8')));

  requirePopulation('check:channel-has-reviewer', {
    'file(s) on a child surface': all.length,
    'channel(s) — files carrying a literal child-facing sentence': channels.length,
  });

  console.log(`\n  channels with a declared reviewer: ${channels.length - undeclared.length}`);
  console.log(`  channels with NONE               : ${undeclared.length}`);
  if (undeclared.length === 0) return;
  console.log(
    '\n  UNDECLARED CHANNELS — every one is a place copy can arrive unwatched:',
  );
  undeclared.slice(0, 20).forEach((f) => console.log(`    ${f.replace(`${REPO}/`, '')}`));
  if (undeclared.length > 20) console.log(`    … and ${undeclared.length - 20} more`);
  console.log(
    '\n  REPORTS, DOES NOT FAIL — assigning a reviewer to every existing channel is a governance act\n'
    + '  and not a commit. **The rule bites on a NEW channel**: one line at the moment of building,\n'
    + '  which is the only moment it is cheap.',
  );
}

main();
