/**
 * WHAT IT WOULD TAKE TO HOLD CROSSING STATE PER RECIPIENT — A REPORT. NOTHING IS BUILT (R806).
 *
 * Her crossing-is-a-pair ruling lands on the schema: **a state that varies by recipient cannot live
 * in one column.** 135 is the proof — never staged for Cowork, arrived here, and the desk's gap list
 * and this store's shelf are both right about it.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

async function run() {
  assertFixture('per-recipient-state', [
    { name: 'a per-recipient state needs a recipient key', input: 'artefact+recipient', mustBeCaught: true },
    { name: 'so does a second', input: 'digest+party', mustBeCaught: true },
    { name: 'an artefact-only key cannot hold it', input: 'artefact', mustBeCaught: false },
    { name: 'nor can a bare state column', input: 'state', mustBeCaught: false },
  ], (k) => /\+/.test(k));

  const schema = readFileSync(join(REPO, 'packages/db/prisma/schema.prisma'), 'utf8');
  const models = [...schema.matchAll(/^model (\w+) \{/gm)].map((m) => m[1]!);
  const crossingish = models.filter((m) => /artefact|crossing|delivery|manifest|dispatch/i.test(m));
  requirePopulation('emit:per-recipient-state', { 'models in the schema': models.length });

  const payload = {
    kind: 'per-recipient-crossing-state-report',
    NOTHING_IS_BUILT: 'this is a report, as instructed. No migration, no model, no column.',
    ONE_WHERE_THE_STATE_LIVES_TODAY: {
      inTheSchema: crossingish.length ? crossingish : 'NOWHERE. No model in the schema records crossing, delivery, staging or arrival — searched all ' + models.length + ' models for artefact/crossing/delivery/manifest/dispatch.',
      whereItACTUALLYLIVES: 'the filesystem and prose. An artefact is STAGED because a file sits in the outbound directory; it is CROSSED because the other store named its digest back in something it sent; it is HELD because someone said so in a return. **None of that is a record — it is an inference from a directory listing plus a reading of prose.**',
      soTHERULINGDOESNOTLANDONACOLUMN: 'there is no column to split. The finding is not "one column must become two" — it is that a state everyone reasons about has never been stored at all, and the per-recipient requirement is what makes that unavoidable rather than merely untidy.',
    },
    TWO_WHY_ONE_COLUMN_CANNOT_HOLD_IT: {
      theProof: '135. The desk never staged it for Cowork; it arrived on this disk. One artefact, two recipients, two different states at the same instant — so any single-valued field is wrong for at least one reader of it.',
      andTHEREISNOMAJORITYANSWER: 'it is not that one state is right and the others are approximations. **Each is exactly right for its own pair**, and collapsing them loses the only information the field would carry.',
    },
    THREE_WHAT_WOULD_BE_NEEDED: {
      grain: 'one row per (ARTEFACT, RECIPIENT). Not per artefact.',
      identityMustBeTheDIGEST: 'not the filename — 53 convention duplicates and 22 download duplicates on this disk mean a name is not single-valued (R803). The key is sha256 over bytes.',
      storeOBSERVATIONSderiveSTATES: {
        why: '**LATE is a function of time, not a fact about an artefact** — absent + age + a declared settling interval (R798). Storing "LATE" freezes a value that changes with the clock and will be wrong the moment nobody re-runs it. Storing "observed absent at T" stays true forever.',
        soTheRowHolds: ['artefactSha256', 'recipient', 'observation (STAGED_HERE | NAMED_BACK_BY_RECIPIENT | REPORTED_ABSENT_BY_RECIPIENT | LISTED_IN_THEIR_MANIFEST)', 'observedAt', 'evidence — the artefact or return digest that establishes it'],
        andSTATEisDERIVED: 'CROSSED = a NAMED_BACK observation exists. STAGED = staged here, nothing named back. LATE = staged here, absent there, age < interval. LOST = same, age >= interval.',
      },
      theEVIDENCEFIELDISNOTOPTIONAL: 'a state asserted without naming what established it is the thing R25 refuses — send the value, not an account of it. Every row cites the digest of the manifest, return or acknowledgement it came from.',
      whatTHISSIDECANEVERKNOWALONE: '**only STAGED.** Arrival is a fact about the other store and is knowable here only when they name the digest back. So the table is mostly a record of what others have told this store, and a row with no far-side evidence must read as UNKNOWN rather than as not-arrived.',
    },
    FOUR_WHAT_IT_WOULD_COST_AND_WHAT_IT_WOULD_NOT_FIX: {
      cost: 'one model, one unique index on (artefactSha256, recipient, observation, observedAt), and a writer at each of the three points where an observation is currently inferred — deliver(), the manifest diff, and the acknowledgement path.',
      whatItWouldNOTfix: 'it would not make arrival observable. It records what was reported, so a channel that drops silently still drops silently — **the table makes the absence VISIBLE and DATED, which is what turns a gap into a settled claim, and that is all.**',
      andTHEHONESTALTERNATIVE: 'the three manifests already do most of this by hand. The table earns its place only if the per-recipient question keeps recurring; on one instance (135) it does not yet.',
    },
    modelsSearched: models.length,
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['ONE_WHERE_THE_STATE_LIVES_TODAY', 'TWO_WHY_ONE_COLUMN_CANNOT_HOLD_IT', 'THREE_WHAT_WOULD_BE_NEEDED', 'FOUR_WHAT_IT_WOULD_COST_AND_WHAT_IT_WOULD_NOT_FIX']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('per-recipient-crossing-state-report', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'per-recipient-crossing-state-report');
  console.log(`models searched ${models.length}; crossing-related models found: ${crossingish.length}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
