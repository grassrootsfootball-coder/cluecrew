/**
 * DOES THE STAMP NAME WHAT WAS SHIPPED? — `pnpm check:stamp-covers-payload`
 *
 * The misconception library's identifying hash was computed over a FIVE-field projection while the
 * file delivered SEVENTEEN. Adding `approvalNote` — the reviewer's own discriminator — changed the
 * payload and left the name identical: `6d3c109008854e71` on two materially different files (R88).
 *
 * **The name is what every comparison in this repo cites.** A name that does not move when the
 * content moves is a comparison reporting agreement between two different artefacts, and every
 * record citing it becomes ambiguous about which one it verified.
 *
 * SO THE PROPERTY IS CHECKED FROM THE ARTEFACT, NOT FROM THE CODE. Reading each exporter to see
 * whether its `build*Source` projection matches its delivered payload is five hand-audits that go
 * stale on the next edit. Instead this RECOMPUTES the stamp from the artefact's own `entries` and
 * compares it to the `sourceHash` the artefact carries. If they differ, the stamp was computed over
 * something other than what shipped — which is the fault, stated as a fact about the file rather
 * than as a reading of the code.
 *
 * WHAT A MISMATCH DOES NOT MEAN. Some exports legitimately stamp a STATUS projection: a snapshot of
 * what is waiting for review is meant to change when a status changes, even if the prose does not.
 * Those declare `snapshotOf: 'status'`, and a mismatch there is reported as UNVERIFIED rather than
 * failed — the check cannot tell a deliberate status projection from an accidental one, and saying
 * so is better than picking. Only `snapshotOf: 'content'` is held to strict coverage.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { requirePopulation } from './lib/population';

const DELIVERY_DIRS = ['/Users/davidb/Downloads/11+/from-cluecrew'];

/**
 * Envelope keys — the wrapper every export writes around its payload. Whatever is left after
 * these is the payload, and the check only runs when EXACTLY ONE key is left.
 *
 * THE HEURISTIC IS DELIBERATELY TIMID, because it was twice too bold. Taking the first array
 * produced two confident MISMATCHED verdicts against artefacts with two arrays. Taking the only
 * array produced one more against `tn-teacher-held`, whose payload is `held` AND `comparators` —
 * an object and an array together. Three false accusations from three guesses at the same
 * question, which is the answer: SHAPE CANNOT TELL YOU WHAT THE PAYLOAD IS. The durable fix is a
 * declaration from the exporter (`stampedOver: 'entries'`); until that exists this screens what it
 * can prove and NAMES the rest as unscreened rather than judging them.
 */
const ENVELOPE_KEYS = new Set([
  'kind', 'generatedAt', 'sourceHash', 'snapshotOf', 'describes', 'staleness', 'note', 'exportedAt',
  'count', 'counts', 'byDistrict', 'stamp', 'source', 'reason', 'schema', 'emittedAt', 'byCluster',
  'stampedOver',
]);

/** The same canonicalisation `freshnessStamp` uses, so a recomputation is comparable. */
function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.keys(v as object).sort().map((k) => [k, canonical((v as Record<string, unknown>)[k])]),
    );
  }
  return v;
}

const hashOf = (source: unknown): string =>
  createHash('sha256').update(JSON.stringify(canonical(source))).digest('hex').slice(0, 16);

interface Row { file: string; snapshotOf: string; carried: string; recomputed: string; entries: number }

function main(): void {
  const covered: Row[] = [];
  const unverified: Row[] = [];
  const mismatched: Row[] = [];
  let scanned = 0;
  /** Stamped artefacts whose payload this check could not locate. Never silently dropped. */
  const skipped: string[] = [];

  for (const dir of DELIVERY_DIRS) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.json')) continue;
      let body: Record<string, unknown>;
      try { body = JSON.parse(readFileSync(join(dir, name), 'utf8')) as Record<string, unknown>; } catch { continue; }
      // TWO SHAPES, BOTH LIVE. Some exports nest the stamp under `stamp`; the misconception
      // library and the proposed queue spread its fields FLAT at the top level. Reading only the
      // nested shape skipped both — and skipped them INVISIBLY, because the skip list was keyed off
      // the same field that was missing. Fourth instance of a reader knowing one of two live names
      // (stem.prompt/stem.text was the third), and the first where the miss hid itself.
      const nested = body.stamp as { sourceHash?: string; snapshotOf?: string } | undefined;
      const stamp: { sourceHash?: string; snapshotOf?: string; stampedOver?: unknown } | undefined =
        nested?.sourceHash ? nested
          : typeof body.sourceHash === 'string'
            // The flat shape spreads EVERY stamp field at the top level, `stampedOver` included.
            // Reconstructing only two of them dropped the declaration and sent the artefact back
            // to the heuristic — which then read `stampedOver` itself as part of the payload.
            ? {
              sourceHash: body.sourceHash,
              snapshotOf: body.snapshotOf as string | undefined,
              stampedOver: body.stampedOver,
            }
            : undefined;
      // THE PAYLOAD IS FOUND, NOT NAMED. The first version read only a key called `entries` and
      // reported five artefacts clean — SKIPPING the misconception library, which names its array
      // `misconceptions` and is the artefact this entire check exists because of. A screen that
      // misses the case that motivated it is R60 with the paint still wet.
      // EXACTLY ONE ARRAY, or this check does not know what the payload is. The first version
      // took the FIRST array and produced two confident MISMATCHED verdicts against artefacts with
      // two arrays each — it had hashed `signedTiers` instead of `emitted`, and `comparators`
      // instead of `held`. A check that names the wrong slice and calls the artefact broken is the
      // cry-wolf failure that gets a gate switched off; an unscreenable artefact must say so
      // instead of guessing.
      // THE EXPORTER'S DECLARATION WINS. `stampedOver` names the keys the hash was computed over,
      // which is the fact no amount of shape-reading could recover — three guesses at it produced
      // three false accusations (R92). Absent, the timid heuristic below still applies, and an
      // artefact it cannot resolve is reported UNSCREENED rather than judged.
      const declared = (stamp as { stampedOver?: unknown } | undefined)?.stampedOver;
      if (Array.isArray(declared) && declared.length > 0 && declared.every((k) => typeof k === 'string')) {
        const missing = (declared as string[]).filter((k) => !(k in body));
        if (missing.length) {
          skipped.push(`${name} — declares stampedOver ${declared.join(', ')} but the body has no ${missing.join(', ')}`);
          continue;
        }
        scanned += 1;
        const source = declared.length === 1 ? body[(declared as string[])[0]!]
          : Object.fromEntries((declared as string[]).map((k) => [k, body[k]]));
        const row: Row = {
          file: name, snapshotOf: stamp!.snapshotOf ?? '(undeclared)',
          carried: stamp!.sourceHash!, recomputed: hashOf(source),
          entries: Array.isArray(source) ? source.length : 1,
        };
        if (row.carried === row.recomputed) covered.push(row);
        else if (row.snapshotOf === 'content') mismatched.push(row);
        else unverified.push(row);
        continue;
      }

      const payloadKeys = Object.keys(body).filter((k) => !ENVELOPE_KEYS.has(k));
      if (!stamp?.sourceHash && payloadKeys.length) {
        skipped.push(`${name} — carries a payload but no stamp this check can read`);
        continue;
      }
      if (payloadKeys.length !== 1 || !Array.isArray(body[payloadKeys[0]!])) {
        if (stamp?.sourceHash) {
          skipped.push(
            `${name} — payload is ${payloadKeys.length === 0 ? 'not identifiable' : `spread over ${payloadKeys.join(', ')}`}`,
          );
        }
        continue;
      }
      const entries = body[payloadKeys[0]!];
      if (!stamp?.sourceHash || !Array.isArray(entries)) {
        if (stamp?.sourceHash) skipped.push(`${name} — carries a stamp but no array payload this check can read`);
        continue;
      }
      scanned += 1;
      const row: Row = {
        file: name, snapshotOf: stamp.snapshotOf ?? '(undeclared)',
        carried: stamp.sourceHash, recomputed: hashOf(entries), entries: entries.length,
      };
      if (row.carried === row.recomputed) covered.push(row);
      else if (row.snapshotOf === 'content') mismatched.push(row);
      else unverified.push(row);
    }
  }

  requirePopulation('check:stamp-covers-payload', { 'delivered stamped artefacts': scanned });
  if (skipped.length > 0) {
    console.log(`\n  ${skipped.length} stamped artefact(s) NOT screened — the payload could not be located:`);
    for (const s of skipped) console.log(`    ? ${s}`);
    console.log('    Reported, because an unscreened artefact is not a passing one.');
  }

  console.log(`  ${covered.length} stamped over exactly what they ship`);
  for (const r of covered) console.log(`    ok ${r.carried}  ${r.entries.toString().padStart(4)} entries  ${r.file}`);

  if (unverified.length > 0) {
    console.log(`\n  ${unverified.length} UNVERIFIED — stamped over a projection, declared '${unverified[0]!.snapshotOf}':`);
    for (const r of unverified) {
      console.log(`    ? carries ${r.carried}, payload hashes ${r.recomputed}  ${r.file}`);
    }
    console.log('    A status projection is allowed to differ from the payload by design. This check');
    console.log('    cannot tell a deliberate one from an accident, so it reports rather than picks.');
  }

  if (mismatched.length > 0) {
    console.error(`\n  ${mismatched.length} MISMATCHED — declared 'content' and stamped over something else:`);
    for (const r of mismatched) {
      console.error(`    x carries ${r.carried}, payload hashes ${r.recomputed}  ${r.file}`);
    }
    console.error('\n  The name does not identify the payload. Two different files can ship under one');
    console.error('  name, and every record citing it becomes ambiguous about which it verified.');
    process.exit(1);
  }
  console.log('\n  No content artefact ships under a name computed over something else.');
}

main();
