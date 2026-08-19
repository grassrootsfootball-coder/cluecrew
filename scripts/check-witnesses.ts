/**
 * PINNED WITNESSES — `pnpm check:witnesses`
 *
 * **A FILE THAT IS THE ONLY RECORD OF A STATE THAT NO LONGER EXISTS ANYWHERE IS NOT A COPY**
 * (David's ruling, 2026-08-17 — R203). The three PLATFORM-IMPORT files are the sole witnesses to
 * what Cowork's library claimed at export time: Cowork's own normalisation overwrote
 * `approvedBy: Anne` in its live library (R201/R202), so **the store that owns authored content
 * destroyed its own evidence, and the only surviving record sits on THIS side of the boundary** —
 * originally in ~/Downloads, one cleanup away from nothing.
 *
 * So each has a canonical copy in `content/evidence/` — git-tracked (every change has a commit and
 * a diff), chmod 444 at rest (a stray write gets EPERM, not a silent change) — and this check
 * asserts, in CI, that each copy exists and still matches the hash pinned in the six entries'
 * `textProvenance.declarationSources` at import time. R86 said retiring the ENG-001/002 copies
 * removed the ability to RECOMPUTE a disagreement; these files are that lesson before the loss
 * instead of after it. **A retirement sweep that removes one of these fails here, loudly, with the
 * reason** — which is what "cannot be retired" means as a mechanism rather than a request.
 *
 * THE HASHES ARE THE ONES PINNED AT IMPORT, restated here as literals ON PURPOSE: this check must
 * not read its expectation from the database, because a database that lost the pin and a file that
 * drifted would then agree with each other (R80 — the comparison clock must be independent).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { requirePopulation } from './lib/population';

const EVIDENCE = resolve(import.meta.dirname, '../content/evidence');

const WITNESSES = [
  {
    file: 'PLATFORM-IMPORT-BATCH-1.json',
    sha256Prefix: 'ee4bc48d5ce18153',
    witnessTo: "Cowork's library claiming approvedBy: Anne on 4 entries, as emitted 2026-08-16 18:04",
  },
  {
    file: 'PLATFORM-IMPORT-BATCH-2.json',
    sha256Prefix: 'dcaf4b228ff0a722',
    witnessTo: "Cowork's library claiming approvedBy: Anne on 2 entries",
  },
  {
    file: 'PLATFORM-IMPORT-english-misconceptions.json',
    sha256Prefix: '293148522d245026',
    witnessTo:
      "Cowork's library claiming approvedBy: Anne on all 7 entries (2026-08-12) — the value its own "
      + 'normalisation later erased. THE ONLY RECORD OF THAT STATE ANYWHERE (R201/R202). '
      + 'pinStatus: PERMANENT-EVIDENCE (ANNE-ANNIE-MERGE-RULING.md §4, 2026-08-19) — superseded as '
      + 'AUTHORITY by that ruling, retained as EVIDENCE without expiry. liftedBy: NOTHING. This pin '
      + 'has no lift condition by design; a restated approval outranks a recovered one, and '
      + 'outranking is not erasure.',
  },
  {
    file: 'MERGE-RULING-AMENDMENT-1.md',
    sha256Prefix: 'df6834832e6189e0',
    witnessTo:
      'amendment 1 to the merge ruling: the enumeration is Code\'s act; the mirror pin on Cowork\'s '
      + 'BATCH-1 ratified; the fourth parked value is Annie\'s to name; instrument names, never the '
      + 'bare class name, in every crossing document.',
  },
  {
    /** The ruling itself is now cited by hash on six AttributionEvents, and it sat in bare
     * ~/Downloads — R204's exact exposure, closed the same day it opened. */
    file: 'ANNE-ANNIE-MERGE-RULING.md',
    sha256Prefix: '036bdf84cac0f5c7',
    witnessTo:
      'the identity ruling: Anne and Annie are one person, canonicalReviewerName Annie. The '
      + 'authority six textProvenance resolutions and six AMENDED events cite by name and hash.',
  },
  /**
   * HER TWO RETURN DOCUMENTS, added under the same ruling one turn later. Both were found in bare
   * ~/Downloads — one level MORE exposed than the import files had been — while answering the
   * question this check's design came from ("does anything depend on a hash read from the same
   * place as the thing it verifies?"). Both hashes were already pinned in the store: the batch
   * return on NINE entries' `textProvenance.approvalArtefact`, the ENG-028 return in an
   * AttributionEvent. **Nine rows cited a document, nothing verified it, and the document sat in
   * the most cleanup-prone directory on the machine.** Pins with no reader are not protection.
   */
  {
    file: 'annie-approval-batch-return.md',
    sha256Prefix: 'f92d4bae97ea248e',
    witnessTo:
      "the reviewer's approval-batch return — the FIRST and only artefact evidencing her approvals "
      + 'of the nine English entries (pinned on all nine textProvenance.approvalArtefact rows)',
  },
  {
    file: 'annie-eng028-return.md',
    sha256Prefix: '2575946944cc0f41',
    witnessTo: "the reviewer's ENG-028 return (pinned in AttributionEvent cmsw1efta0001tmjz0a3x39tk)",
  },
];

function main(): void {
  requirePopulation('check:witnesses', { 'pinned witnesses': WITNESSES.length });
  const faults: string[] = [];
  for (const w of WITNESSES) {
    const p = join(EVIDENCE, w.file);
    if (!existsSync(p)) {
      faults.push(`${w.file}: MISSING from content/evidence. This is not a stale copy — it is the only `
        + `record of a state that no longer exists anywhere. Witness to: ${w.witnessTo}`);
      continue;
    }
    const h = createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 16);
    if (h !== w.sha256Prefix) {
      faults.push(`${w.file}: hash ${h}, pinned ${w.sha256Prefix}. The witness has been ALTERED — its whole `
        + 'value is being byte-identical to what the import door read.');
    } else {
      console.log(`  HOLDS  ${w.file}  ${h}`);
      console.log(`         witness to: ${w.witnessTo}`);
    }
  }
  if (faults.length) {
    console.error(`\n${faults.length} witness(es) missing or altered:`);
    for (const f of faults) console.error(`  x ${f}`);
    process.exit(1);
  }
  console.log('\ncheck:witnesses: all pinned witnesses present and byte-identical to their import-time hashes.');
}

main();
