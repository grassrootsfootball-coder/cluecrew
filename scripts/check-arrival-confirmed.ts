/**
 * HAS ANY STAGED ARTEFACT EVER BEEN CONFIRMED ARRIVED BY DIGEST? (David, 2026-08-22 — R583.)
 *
 * **R255 says STAGED is not ARRIVED and only the receiver can report arrival. It never said how the
 * report would be recognised** — so arrival has been assumed from silence for a fortnight, which is
 * the weakest possible evidence and the same evidence a total channel failure produces.
 *
 * **She has been supplying the proof all along and nothing was reading it.** Her returns open with
 * *"Artefacts read, full digests computed here over the bytes"*, and quote the filename and a sha256.
 * **That is a receiver-side confirmation over the actual bytes** — stronger than a delivery receipt,
 * because it proves she read the same file that was staged rather than that something was written.
 *
 * So this joins the two sides: every file in the outbound directory, hashed here, against every
 * 64-hex digest appearing in any of her returns.
 *
 *   CONFIRMED      a return quotes a digest equal to this file's bytes. She read THIS file.
 *   NOT CONFIRMED  no return quotes it. **This does NOT mean it did not arrive** — she confirms by
 *                  digest only when she opens a return with one, and most turns she does not.
 *   UNMATCHED      a digest in a return matching no staged file. She read something this store
 *                  cannot identify, which is the more interesting direction and the one nobody asked.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { requirePopulation } from './lib/population';

const OUTBOUND = '/Users/davidb/Downloads/11+/from-cluecrew';
const RETURNS = '/Users/davidb/Downloads';

function main() {
  const returnFiles = readdirSync(RETURNS).filter((f) => /^annie-.*return.*\.md$/.test(f));
  const quoted = new Map<string, string[]>();
  for (const f of returnFiles) {
    for (const m of readFileSync(join(RETURNS, f), 'utf8').matchAll(/\b[0-9a-f]{64}\b/g)) {
      quoted.set(m[0], [...(quoted.get(m[0]) ?? []), f]);
    }
  }

  const staged = readdirSync(OUTBOUND).filter((f) => !f.endsWith('.sha256'));
  requirePopulation('check:arrival-confirmed', {
    'staged artefact(s) in the outbound directory': staged.length,
    'return file(s) searched for digests': returnFiles.length,
    'distinct digest(s) she has quoted': quoted.size,
  });

  const confirmed: Array<{ file: string; where: string[]; when: Date }> = [];
  const notConfirmed: Array<{ file: string; when: Date }> = [];
  const stagedDigests = new Set<string>();

  for (const f of staged) {
    const path = join(OUTBOUND, f);
    let digest: string;
    let when: Date;
    try {
      digest = createHash('sha256').update(readFileSync(path)).digest('hex');
      when = statSync(path).mtime;
    } catch { continue; }
    stagedDigests.add(digest);
    const where = quoted.get(digest);
    if (where) confirmed.push({ file: f, where: [...new Set(where)], when });
    else notConfirmed.push({ file: f, when });
  }

  const unmatched = [...quoted].filter(([d]) => !stagedDigests.has(d));

  console.log(`\n  CONFIRMED BY DIGEST: ${confirmed.length} of ${staged.length} staged artefact(s).`);
  for (const c of confirmed.sort((a, b) => +b.when - +a.when)) {
    console.log(`      ${c.file}\n            quoted in ${c.where.join(', ')}`);
  }

  const recent = notConfirmed.sort((a, b) => +b.when - +a.when).slice(0, 8);
  console.log(
    `\n  NOT CONFIRMED: ${notConfirmed.length}. **This is not evidence of non-arrival.** She confirms\n`
    + '  by digest only when she opens a return with one, and most turns she does not. Most recent:',
  );
  for (const n of recent) console.log(`      ${n.when.toISOString().slice(0, 16).replace('T', ' ')}  ${n.file}`);

  console.log(
    `\n  UNMATCHED — a digest in a return matching NO staged file: ${unmatched.length}.\n`
    + '  She read something this store cannot identify: a superseded copy, a file staged and later\n'
    + '  pruned, or an artefact that never came from here at all. Each is a different fact and this\n'
    + '  cannot tell them apart; it reports the count so the direction is not silent.',
  );

  console.log(
    '\n  WHAT THIS CANNOT DO. It cannot report non-arrival, only unconfirmed-arrival, and the two are\n'
    + '  not the same claim. Confirmation is a thing SHE does; the absence of it is a fact about her\n'
    + '  returns, never about the channel. **Silence remains silence — the point is that it is now\n'
    + '  counted rather than read as delivery.**',
  );
}

main();
