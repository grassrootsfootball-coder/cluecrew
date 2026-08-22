/**
 * DO THE ACCESSIBLE NAMES OBEY THE RULINGS MADE ABOUT STEMS? (Annie, 2026-08-22 — R603.)
 *
 * **A ruling she made about eighteen error-spot stems survived in a group label**, because a group
 * label is an accessible name, accessible names are not in copy review, and the copy corrected in
 * the reviewed channel stayed wrong in the unreviewed one. **Not because anybody moved it there.
 * Because nothing looked there when the eighteen were fixed** (R565).
 *
 * **ONE INSTANCE FOUND MEANS THE POPULATION IS UNKNOWN RATHER THAN ONE.** The first audit screened
 * the surface against ONE ruling — *does this assert a fault exists* — and reported zero others.
 * That answer is true and it is about one ruling. **She has made many**, and a ruling applied to the
 * field it was observed on is the entry filed highest in this register.
 *
 * So this screens every accessible name, group label, button label and status string against EVERY
 * stem ruling that can be stated as a testable property of a string:
 *
 *     ASSERTS-A-FAULT   claims a mistake exists where an item may have none (R565, her fifth return)
 *     SHOUTED-CAPITAL   emphasis by capitals (her WIW-03 ruling, 2 of 36 item hints)
 *     DASH-AS-STOP      a dash ending or breaking a child-facing sentence (CLAUDE.md house rule)
 *     FIRST-PERSON      a voice on a label (R555/R557)
 *     ASSERTS-A-COUNT   a count over what the child can choose (R596, the PR-07 fault)
 *
 * **THE BOUND IS THE POINT AND IT IS PRINTED.** Only rulings expressible as a property of a string
 * are here. A ruling about whether a label is USEFUL, or whether it names the right group, is a
 * reading and is not screened — so a clean run says these five hold, and nothing more.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOTS = ['apps/web/components/crew', 'apps/web/app/crew', 'apps/web/components', 'packages/ui/src'];

interface Ruling {
  name: string;
  test: (s: string) => string | null;
  ruling: string;
}

const RULINGS: Ruling[] = [
  {
    name: 'ASSERTS-A-FAULT',
    ruling: 'R565 — a label must not tell a child a mistake exists; on an N-keyed item there is none.',
    test: (s) => {
      const m = /\b(the mistake|the error|the wrong (one|part)|which is wrong)\b/i.exec(s);
      return m && !/\bmay\b/i.test(s) ? `asserts a fault: "${m[0]}"` : null;
    },
  },
  {
    name: 'SHOUTED-CAPITAL',
    ruling: 'her WIW-03 ruling — emphasis by capitals is shouting at a child.',
    test: (s) => {
      const m = [...s.matchAll(/\b[A-Z]{2,}\b/g)].map((x) => x[0]).filter((w) => !['I', 'OK', 'UK'].includes(w));
      return m.length ? `shouted: ${m.join(', ')}` : null;
    },
  },
  {
    name: 'DASH-AS-STOP',
    ruling: 'CLAUDE.md — a dash does not end a child-facing sentence; split it into two.',
    test: (s) => (/[—–]|(\s-\s)/.test(s) ? `carries a dash: "${s.slice(0, 60)}"` : null),
  },
  {
    name: 'FIRST-PERSON',
    ruling: 'R555/R557 — first person is refused in accessible names, group labels, button labels and status text.',
    test: (s) => {
      const m = /\b(I|I'm|I'll|I've|me|my|mine|let's|we|we're|our|us)\b/i.exec(s);
      return m ? `first person: "${m[0]}"` : null;
    },
  },
  {
    name: 'ASSERTS-A-COUNT',
    ruling: 'R596 — an assertion about what the child can choose is checked against the option set.',
    test: (s) => {
      const m = /\b(one|two|three|four|both)\s+of\s+(these|them)\b/i.exec(s);
      return m ? `asserts a count: "${m[0]}"` : null;
    },
  },
];

/** Every accessible name, group label, button label and status string in the child surface. */
function strings(): Array<{ file: string; line: number; kind: string; text: string }> {
  const out: Array<{ file: string; line: number; kind: string; text: string }> = [];
  const walk = (dir: string) => {
    let names: string[];
    try { names = readdirSync(dir); } catch { return; }
    for (const n of names) {
      const p = join(dir, n);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(n)) {
        const rel = p.replace(`${REPO}/`, '');
        readFileSync(p, 'utf8').split('\n').forEach((ln, i) => {
          /**
           * **THE POPULATION IS EVERY STRING THAT REACHES A CHILD AS A NAME, and the first version
           * screened 39 where the hand-audit had covered 62.** A check narrower than the audit it
           * replaces reports a smaller clean population and reads as the same assurance — R595 in a
           * scanner. Widened to the label props this codebase actually uses.
           */
          for (const [re, kind] of [
            [/aria-label=\{?["'`]([^"'`]{3,})["'`]/g, 'accessible name'],
            [/aria-roledescription=["'`]([^"'`]{3,})["'`]/g, 'role description'],
            [/aria-description=["'`]([^"'`]{3,})["'`]/g, 'description'],
            [/\btitle=["'`]([^"'`]{3,})["'`]/g, 'title'],
            [/\b(?:label|srLabel|screenReaderLabel|announce|announcement)=\{?["'`]([^"'`]{3,})["'`]/g, 'label prop'],
            [/role="status"[^>]*>\s*\{?["'`]?([^<"'`{]{3,})/g, 'status text'],
            [/<(?:button|Button)[^>]*>\s*([A-Z][^<>{}\n]{3,60})\s*</g, 'button label'],
          ] as Array<[RegExp, string]>) {
            re.lastIndex = 0;
            for (const m of ln.matchAll(re)) {
              const text = (m[1] ?? '').trim();
              if (text && !/^\$\{/.test(text)) out.push({ file: rel, line: i + 1, kind, text });
            }
          }
        });
      }
    }
  };
  for (const r of ROOTS) walk(join(REPO, r));
  return out;
}

function main() {
  const all = strings();
  const seen = new Map<string, { file: string; line: number; kind: string; text: string }>();
  for (const s of all) if (!seen.has(`${s.file}:${s.line}:${s.text}`)) seen.set(`${s.file}:${s.line}:${s.text}`, s);
  const rows = [...seen.values()];

  requirePopulation('check:accessible-name-rulings', {
    'accessible name(s), group label(s) and status string(s)': rows.length,
    'ruling(s) expressible as a property of a string': RULINGS.length,
  });

  let hits = 0;
  for (const r of RULINGS) {
    const found = rows.map((s) => ({ s, why: r.test(s.text) })).filter((x) => x.why);
    console.log(`\n  ${r.name}: ${found.length}`);
    console.log(`      ${r.ruling}`);
    for (const f of found) {
      hits++;
      console.error(`      ${f.s.file}:${f.s.line}  (${f.s.kind})\n            "${f.s.text}"\n            ${f.why}`);
    }
  }

  console.log(
    `\n  ${rows.length} string(s) screened against ${RULINGS.length} ruling(s). ${hits} hit(s).\n`
    + '\n  THE BOUND: only rulings expressible as a PROPERTY OF A STRING are here. Whether a label is\n'
    + '  useful, or names the right group, is a reading and is not screened. **A clean run says these\n'
    + `  ${RULINGS.length} hold and nothing more** — it is not a statement that the surface obeys her rulings.\n`
    + '  One instance found is why this exists: it made the population unknown rather than one.',
  );
  if (hits > 0) process.exitCode = 1;
}

main();
