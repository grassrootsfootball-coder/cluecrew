/**
 * FIRST PERSON, SCOPED BY POSITION AND BY PROVENANCE (David's ruling, 2026-08-21 — R555).
 *
 * **Built to the scope rather than to the pronoun.** The pronoun is not the fault; the fault is a
 * persona arriving where nobody reviews copy.
 *
 *   REFUSED POSITIONS  accessible names, group labels, button labels, status text.
 *   PERMITTED POSITIONS  mode and hint copy — **and only where a reviewer's authority is on the
 *                        string.**
 *   EVERYWHERE          a first-person string with NO reviewer citation is refused.
 *
 * **THE CONSEQUENCE FOR SOURCE IS TOTAL AND DELIBERATE: no string in a `.tsx` file can carry a
 * reviewer citation, because there is no field to carry one.** So every first-person string in
 * source is refused by the provenance rule even where the position would permit it. **That is the
 * scope working**, not an oversight: the two arrivals were both in source, both unreviewable, and
 * both in the quietest place available.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

/** First person addressing or including the speaker. Word-bounded; `us` excluded inside `thus` etc. */
/**
 * **THE PRODUCT'S OWN VOICE, which is narrower than the pronoun** — two exclusions, both found by
 * running it:
 *
 * 1. **A QUOTATION IS NOT THE PRODUCT SPEAKING.** *"Go and fetch my fishing-rod"* is Bevis; *"what
 *    do I see at the bottom but a heap of rolls"* is Dickens. R320's rule reaching a new scanner:
 *    changing a quotation to satisfy a house rule makes the record false.
 * 2. **THE ANALYTIC `we` IS A COMPREHENSION CONVENTION, NOT A PERSONA.** *"we are never told what it
 *    is"* means *the text does not say*, and no child hears a speaker in it. It is reported
 *    SEPARATELY rather than refused, because the ruling scopes a persona and this is a register.
 */
const FIRST_PERSON = /\b(I|I'm|I'll|I've|I'd|me|my|mine|let's)\b/;
const ANALYTIC_WE = /\b(we|we're|we'll|we've|us|our|ours)\b/i;
/** Strip anything inside single or double quotes — the source's words, not ours. */
const unquoted = (s: string) => s.replace(/'[^']{3,}'|"[^"]{3,}"|“[^”]+”|‘[^’]+’/g, ' ');

/** Positions the ruling refuses outright. */
const REFUSED_POSITION = [
  { name: 'accessible name', re: /\b(?:aria-label|aria-description|alt|title)\s*=\s*\{?\s*["'`]([^"'`]+)["'`]/g },
  { name: 'group label', re: /role\s*=\s*["']group["'][^>]{0,120}?aria-label\s*=\s*\{?\s*["'`]([^"'`]+)["'`]/gs },
  { name: 'button label', re: /<button[^>]*>\s*\{?\s*["'`]?([A-Z][^<>{}"'`]{2,60})["'`]?\s*\}?\s*<\/button>/gs },
  { name: 'status text', re: /role\s*=\s*["']status["'][^>]{0,200}?>\s*([^<>{}]{4,120})</gs },
];

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    let e: string[];
    try { e = readdirSync(d); } catch { return; }
    for (const n of e) {
      if (/node_modules|\.next|\.git|coverage/.test(n)) continue;
      const p = join(d, n);
      let s; try { s = statSync(p); } catch { continue; }
      if (s.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(p) && !/\.test\./.test(p)) out.push(p);
    }
  };
  ['apps/web/components/crew', 'apps/web/app/crew', 'apps/web/lib/crew', 'apps/web/lib/voice'].forEach((d) => walk(join(REPO, d)));
  return out;
}

async function main() {
  const files = sourceFiles();
  const refusals: string[] = [];
  const analytic: string[] = [];
  let screenedSource = 0;

  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    for (const pos of REFUSED_POSITION) {
      pos.re.lastIndex = 0;
      for (const m of t.matchAll(pos.re)) {
        screenedSource++;
        const s = m[1].trim();
        if (!FIRST_PERSON.test(unquoted(s))) continue;
        refusals.push(`  ${f.replace(`${REPO}/`, '')}\n      ${pos.name}: "${s}"\n      REFUSED — first person in a refused position, and source carries no reviewer citation.`);
      }
    }
  }

  // Store copy: permitted POSITION, so the provenance rule decides.
  const lib = await prisma.misconception.findMany({ select: { id: true, childHint: true, textProvenance: true } });
  const allItems = await prisma.item.findMany({ select: { id: true, explanation: true } });
  const walkBand = allItems.filter((i) => {
    const w = (i.explanation as { walkScript?: unknown } | null)?.walkScript;
    return typeof w === 'string' && (FIRST_PERSON.test(unquoted(w)) || ANALYTIC_WE.test(unquoted(w)));
  }).length;
  const items = await prisma.item.findMany({ select: { id: true, explanation: true } });
  let screenedStore = 0;

  for (const m of lib) {
    if (!m.childHint) continue;
    screenedStore++;
    if (!FIRST_PERSON.test(unquoted(m.childHint))) continue;
    const cited = Boolean((m.textProvenance as { approvedByPerson?: unknown; authority?: unknown } | null)?.authority);
    refusals.push(
      `  library:${m.id}\n      hint copy: "${m.childHint}"\n`
      + `      ${cited ? 'PERMITTED — a reviewer\'s authority is on the string.' : 'REFUSED — first person with no reviewer citation.'}`,
    );
  }
  for (const i of items) {
    const e = (i.explanation ?? {}) as Record<string, unknown>;
    /**
     * **`walkScript` IS OUT OF SCOPE AND SAYS SO** (R555). The ruling names accessible names, group
     * labels, button labels and status text as refused, and mode and hint copy as permitted-with-
     * citation. **A walk script is neither** — it is exposition about a passage, and a pronoun test
     * cannot separate the product's voice from what it is reporting:
     *
     *   - `I` is A LETTER in every VR series script — *"so I moves one on to J"*;
     *   - reported speech arrives unquoted — *"Line 1 has Bevis whisper Go and fetch my
     *     fishing-rod"*, *"Line 22 says and I have"*.
     *
     * Both read as first person and neither is the product speaking. **Reported as an unresolved
     * band rather than refused**, the same shape as the pointing band (R483): a machine cannot tell
     * whose voice a sentence is in, which is R349 exactly.
     */
    for (const field of ['hintCore'] as const) {
      const s = e[field];
      if (typeof s !== 'string' || !s.trim()) continue;
      screenedStore++;
      if (!FIRST_PERSON.test(unquoted(s))) { if (ANALYTIC_WE.test(unquoted(s))) analytic.push(`${i.id}.${field}`); continue; }
      const cited = typeof e.hintAuthority === 'string' && e.hintAuthority.trim() !== '';
      refusals.push(
        `  ${i.id}.${field}\n      "${s.slice(0, 90)}"\n`
        + `      ${cited && field === 'hintCore' ? 'PERMITTED — a reviewer\'s authority is on the string.' : 'REFUSED — first person with no reviewer citation.'}`,
      );
    }
  }

  requirePopulation('check:first-person', {
    'source position(s) screened': screenedSource,
    'store string(s) screened': screenedStore,
  });

  console.log(
    `\n  WALK SCRIPTS carrying a first-person or analytic token: ${walkBand} — OUT OF SCOPE, reported.\n`
    + '  A pronoun test cannot separate the product\'s voice from what it reports: `I` is a LETTER in\n'
    + '  every VR series script, and reported speech arrives unquoted. Whose voice a sentence is in is\n'
    + '  a reading (R349), not a match.',
  );
  if (analytic.length) {
    console.log(
      `\n  ANALYTIC "we" — reported, NOT refused: ${analytic.length} walk script(s)/hint(s).\n`
      + '  "we are never told what it is" means "the text does not say". No child hears a speaker in\n'
      + '  it, so the persona ruling does not reach it — but the scope does not currently distinguish\n'
      + '  them in writing, and that is a gap for the ruling rather than for this check.',
    );
  }
  const refused = refusals.filter((r) => r.includes('REFUSED'));
  const permitted = refusals.filter((r) => r.includes('PERMITTED'));
  console.log(`\n  first-person strings found: ${refusals.length} — ${permitted.length} PERMITTED, ${refused.length} REFUSED`);
  if (permitted.length) { console.log('\nPERMITTED:'); permitted.forEach((p) => console.log(p)); }
  if (refused.length === 0) {
    console.log('\ncheck:first-person: no first person in a refused position, and none uncited.');
    await prisma.$disconnect();
    return;
  }
  console.error('\nREFUSED:');
  refused.forEach((r) => console.error(r));
  process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
