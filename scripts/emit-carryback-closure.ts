/** THE CARRY-BACK CLOSES: a no-op at the authoring store, and the staleness I measured was my own (R791). */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const LOCAL = ['~/Downloads/11+/from-cluecrew/', '~/Downloads/11+/items/'];

async function run() {
  assertFixture('carryback-closure', [
    { name: 'an outbound path is this machine', input: '~/Downloads/11+/from-cluecrew/eng007-draft.json', mustBeCaught: true },
    { name: 'a local items path is this machine too', input: '~/Downloads/11+/items/eng007-draft.json', mustBeCaught: true },
    { name: 'a repo path is not a claim about the authoring store', input: 'content/exports/x.json', mustBeCaught: false },
    { name: 'an empty path is not', input: '', mustBeCaught: false },
  ], (p) => LOCAL.some((l) => p.startsWith(l)));

  const supersedes = 'quotes-corrections-return-b4bc29e39dfdf0da.json';
  requirePopulation('emit:carryback-closure', { 'artefacts closed': 1 });

  const payload = {
    kind: 'carryback-closure',
    CLOSES: { artefact: supersedes, fileSha256: 'b4bc29e39dfdf0da1d3b74d858b7dd941033623494cfbb2f4a9597ffd370994b', status: 'WITHDRAWN — no action is asked of the authoring store.' },
    THE_AUTHORING_STORES_ANSWER: 'all four corrections are already in its files. The carry-back is a no-op there.',
    AND_MY_COUNT_WAS_ABOUT_A_DIFFERENT_POPULATION: {
      whatIReported: '8 stale file copies across 4 corrections, 0 carried.',
      whatIACTUALLYMEASURED: 'four items across TWO LOCAL FILES on this machine — ~/Downloads/11+/from-cluecrew (this store\'s own outbound) and ~/Downloads/11+/items. **Neither is the authoring store.** I have no route to the authoring store and never read it.',
      soBOTHCOUNTSARERIGHT: 'the authoring store is not stale, and the copies on this machine are. Both statements are true about their own populations, and mine was labelled as though it were about the other one.',
      THE_FAULT_IN_ONE_LINE: 'I CALLED A LOCAL COPY "THE SOURCE". Not an unnamed file this time — a NAMED one, named wrongly. R776 was the side I did not have to fetch reading as the baseline; this is the same asymmetry one step further on, where a directory I did fetch was assumed to BE the other store because it was not mine.',
      whatWOULDHAVECAUGHTIT: 'asking what makes a path the authoring store rather than a copy of it. Nothing on this disk answers that, which is itself the answer: a claim about another store cannot be evidenced from files on this one.',
    },
    THE_LP06_LP14_CORRECTION: {
      whatIClaimed: 'ENG-007-LP-06 is the source of the held position ENG-007-LP-14, carrying an uncorrected quotes declaration.',
      theAnswer: 'the authoring store holds neither row. **The id-join crossed two different questions** — the same fault this thread already registered twice (R771 numbering drift, R774 replaced questions) recurring inside the artefact reporting on it.',
      soTHEHELDPOSITIONSTANDSONITSOWN: 'ENG-007-LP-14 is still held, and the reason is unchanged: the version she chose declares a span that is not literally in its stem. What is withdrawn is my claim about WHERE that item lives and who must fix it.',
    },
    THE_PRECEDENT_STANDS: 'declare the shortest span that appears LITERALLY in the stem. That is the rule the four corrections encode and it is unaffected by any of the above — it was never a claim about a store, it is a property of a declaration.',
    WHAT_REMAINS_TRUE: 'four rows on this store carry a corrected stem.quotes with _previousQuotes retained, and the local copies on this machine hold the pre-correction value. That is a fact about this machine and is worth keeping only so a future import from those copies is not trusted.',
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['CLOSES', 'AND_MY_COUNT_WAS_ABOUT_A_DIFFERENT_POPULATION', 'THE_LP06_LP14_CORRECTION']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('carryback-closure', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'quotes-corrections-return');
  console.log(`closed ${supersedes}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
