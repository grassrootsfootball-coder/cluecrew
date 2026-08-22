/**
 * IS A RETURN MISSING? (Annie, 2026-08-22 — R579.)
 *
 * **A machine-readable record that nobody reads is a prose record with extra formatting** — hers,
 * and the amendment block's own failure mode arriving on the amendment block. **The block solved a
 * PARSING problem. It does not solve a CROSSING problem**, and it had been treated as though it did.
 *
 * Three of her wordings — `WIW-10`, `WIW-12`, `WIW-13` — sat in a correctly-formed block in her
 * sixty-fifth return for two turns while I reported them missing. **The block was never the fault.**
 * `annie-sixtyfifth-return.md` is not on this disk, and neither are the sixty-third, sixty-fourth or
 * sixty-sixth. **Four consecutive returns never crossed, and nothing anywhere could have said so**,
 * because every reader here iterates the files that ARE present. An absent return is not read as
 * absent; it is not read at all, which is R568's null-from-a-renamed-field one level up.
 *
 * **THE RETURNS ARE NUMBERED, SO THE GAP IS COMPUTABLE.** That is the whole guard: parse the ordinal
 * in each filename, and report every number between the lowest and the highest that has no file.
 * `check:register` has done exactly this for rule numbers since R1; nothing was doing it for the
 * channel the rules arrive through.
 *
 * **A gap is reported, never repaired.** Only she can send a return, and only she can say whether a
 * number was ever used.
 */
import { readdirSync } from 'node:fs';
import { requirePopulation } from './lib/population';

const RETURNS = '/Users/davidb/Downloads';

const UNITS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];
const TEENS = ['tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth',
  'seventeenth', 'eighteenth', 'nineteenth'];
const TENS_ORDINAL: Record<number, string> = {
  20: 'twentieth', 30: 'thirtieth', 40: 'fortieth', 50: 'fiftieth', 60: 'sixtieth', 70: 'seventieth',
};
const TENS_PREFIX: Record<number, string> = {
  20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy',
};

/** number -> the exact word this project's filenames use. Built, never hand-listed (R57). */
function ordinals(): Map<string, number> {
  const m = new Map<string, number>();
  for (let n = 1; n <= 9; n++) m.set(UNITS[n] as string, n);
  for (let n = 10; n <= 19; n++) m.set(TEENS[n - 10] as string, n);
  for (const tens of [20, 30, 40, 50, 60, 70]) {
    m.set(TENS_ORDINAL[tens] as string, tens);
    for (let u = 1; u <= 9; u++) m.set(`${TENS_PREFIX[tens]}${UNITS[u]}`, tens + u);
  }
  return m;
}

function main() {
  const words = ordinals();
  const files = readdirSync(RETURNS).filter((f) => /^annie-.*return.*\.md$/.test(f));

  const numbered = new Map<number, string>();
  const unnumbered: string[] = [];
  for (const f of files) {
    const stem = f.replace(/^annie-/, '').replace(/-return.*$/, '').replace(/\s*\(\d+\)$/, '');
    const n = words.get(stem);
    if (n === undefined) unnumbered.push(f);
    else numbered.set(n, f);
  }

  requirePopulation('check:return-sequence', {
    'return file(s) on disk': files.length,
    'carrying a numbered ordinal': numbered.size,
  });

  const seen = [...numbered.keys()].sort((a, b) => a - b);
  const lowest = seen[0] as number;
  const highest = seen[seen.length - 1] as number;
  const missing: number[] = [];
  for (let n = lowest; n <= highest; n++) if (!numbered.has(n)) missing.push(n);

  console.log(
    `\n  ${numbered.size} numbered return(s) on disk, ${lowest} to ${highest}.\n`
    + `  ${unnumbered.length} unnumbered (a named series rather than the main sequence): `
    + `${unnumbered.map((f) => f.replace(/^annie-|-return.*$/g, '')).join(', ')}\n`
    + `  Below ${lowest}: not reported. Nothing says the sequence starts at 1, and inventing a floor\n`
    + '  would manufacture gaps that were never sent.',
  );

  if (missing.length === 0) {
    console.log(
      `\ncheck:return-sequence: no gap between ${lowest} and ${highest}.\n`
      + '  This says every NUMBER has a file. It does not say the file is the one she sent — only\n'
      + '  she can say that, exactly as only the receiving store can report arrival (R255).',
    );
    return;
  }

  console.error(`\n  MISSING — a number between two returns that are here, with no file: ${missing.length}`);
  for (const n of missing) {
    const before = [...numbered.keys()].filter((k) => k < n).sort((a, b) => b - a)[0];
    const after = [...numbered.keys()].filter((k) => k > n).sort((a, b) => a - b)[0];
    console.error(`      return ${n} — absent, between ${before} and ${after}, both present`);
  }
  console.error(
    '\n  **A RULING IN A RETURN THAT DID NOT CROSS IS NOT LATE. IT IS INVISIBLE.** Every reader here\n'
    + '  iterates the files present, so an absent return is never reported absent — it is never\n'
    + '  reported. Three authored wordings sat in return 65 for two turns while they were reported\n'
    + '  missing, in a correctly-formed block that parses. The block was not the fault.\n'
    + '  Reported, never repaired: only she can send a return, and only she can say whether a number\n'
    + '  was ever used.',
  );
  process.exitCode = 1;
}

main();
