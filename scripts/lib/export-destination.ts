/**
 * WHERE AN EXPORT ACTUALLY GOES (David's ruling, 2026-08-02).
 *
 * Three named exports in a row failed to reach authoring. The cause was not
 * the folder — it was that delivery was a SEPARATE, MANUAL step I took after
 * generating the file, and a manual step taken at the end of a long task is a
 * step that gets missed. Copying to Downloads was never part of any export
 * command; it was something I remembered to do, twice out of five times.
 *
 * So delivery is part of the export now. Every export writes its working copy
 * to /content/exports (the local record, gitignored) and then delivers to the
 * outbound folder Cowork has connected. A script that generates a file and
 * does not deliver it has not finished.
 *
 * The outbound folder is separate from the rest of the 11+ project on purpose:
 * what this repo SENDS is never mixed with what authoring sends back, so a
 * batch file and its review pack can never be confused for one another.
 */
import { createHash } from 'node:crypto';
import { assertDeclaredDigestsRecompute, assertDigestsNameTheirSpec } from './findings-digest';
import { renameSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Confirmed with David, 2026-08-02: Cowork reads the ~/Downloads/11+/ tree. */
export const OUTBOUND_DIR = '/Users/davidb/Downloads/11+/from-cluecrew';
const RETENTION_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../content/retention');

/**
 * RETIRE A DROP TREE NOTHING WRITES TO ANY MORE.
 *
 * A delivery folder no export still targets is the worst kind of stale: every file in it reads
 * as current, nothing updates it, and nobody can tell by looking. `~/Downloads/reviewer-latest`
 * was one — a fixed-filename-era tree that stopped receiving deliveries when everything moved to
 * OUTBOUND_DIR, leaving twenty-one files still captioned "latest" by their own README.
 *
 * REFUSES RATHER THAN ASSUMES, which is the point. A file is removed only when it is ACCOUNTED
 * FOR, one of three ways:
 *   DUPLICATE   — byte-identical to a same-named file in the live outbound folder.
 *   SUPERSEDED  — outbound holds a same-family file carrying a different content hash.
 *   REGENERABLE — the caller names the command that rebuilds it.
 * Anything else is KEPT and reported. Deleting a file nobody can reproduce is not tidying, and a
 * cleanup that cannot say why each file went is the same unattributable change R47 closed.
 */
export function retireDropTree(
  dir: string,
  regenerable: Record<string, string> = {},
): { removed: Array<{ name: string; why: string }>; kept: Array<{ name: string; why: string }> } {
  if (resolve(dir) === resolve(OUTBOUND_DIR)) {
    throw new Error('retireDropTree refuses to clear the LIVE outbound folder.');
  }
  const removed: Array<{ name: string; why: string }> = [];
  const kept: Array<{ name: string; why: string }> = [];
  const outbound = readdirSync(OUTBOUND_DIR);

  const walk = (current: string, prefix: string): void => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const label = prefix ? `${prefix}/${entry}` : entry;
      if (statSync(full).isDirectory()) {
        walk(full, label);
        if (readdirSync(full).length === 0) {
          rmSync(full, { recursive: true });
          removed.push({ name: `${label}/`, why: 'directory emptied' });
        }
        continue;
      }
      const twin = join(OUTBOUND_DIR, entry);
      if (existsSync(twin) && readFileSync(twin).equals(readFileSync(full))) {
        rmSync(full);
        removed.push({ name: label, why: 'DUPLICATE — byte-identical copy live in outbound' });
        continue;
      }
      // Same family (the name with its 16-hex hash and extension stripped), different hash.
      const family = entry.replace(/-[0-9a-f]{16}(?=[.-]|$)/, '').replace(/\.[^.]+$/, '');
      const newer = outbound.find(
        (o) => o !== entry && o.startsWith(`${family}-`) && /[0-9a-f]{16}/.test(o),
      );
      if (newer) {
        rmSync(full);
        removed.push({ name: label, why: `SUPERSEDED — outbound holds ${newer}` });
        continue;
      }
      if (regenerable[entry]) {
        rmSync(full);
        removed.push({ name: label, why: `REGENERABLE — rebuild with \`${regenerable[entry]}\`` });
        continue;
      }
      kept.push({ name: label, why: 'UNACCOUNTED — no outbound copy, nothing supersedes it, no rebuild command' });
    }
  };
  walk(dir, '');
  return { removed, kept };
}

/**
 * The content hash goes IN the filename (David's ruling, 2026-08-02), so copies
 * self-identify and versions stop colliding on one date-stamped name. Same
 * content → same name (a re-run overwrites, no pileup); changed content → new
 * name, and the old one is superseded (see `deliver`).
 *
 *   vr-free-ten-c17a98c9d7c439cf.json
 */
export function stampedName(base: string, sourceHash: string, ext: string): string {
  return `${base}-${sourceHash}.${ext}`;
}

/**
 * Copies a generated file to the outbound folder — **the only STAGING path.**
 *
 * **IT DOES NOT DELIVER AND IT NO LONGER SAYS THAT IT DOES** (2026-08-19 — R255). This function
 * described itself as "the ONLY delivery path" and printed `delivered → …`, and for months that
 * line was read — by me, every day — as arrival. **267 files had accumulated in that folder and
 * Cowork had received one of them, ever.** Six NVR rows went unsigned and a milestone was withdrawn
 * because a file this function reported as delivered had never crossed.
 *
 * What it guarantees is real and is only half: one current version per family, superseded copies
 * pruned, throws rather than warns. **The last hop is a human upload, which no code here can see.**
 *
 * **STAGED is a fact about this machine. ARRIVED is a fact about the other store, and only the
 * other store can report it** — via an inbound artefact naming the file, which is what
 * `acknowledgedFiles()` reads. Nothing in this module may print a word that reads as arrival.
 *
 * `family` is the base name without the hash (e.g. "vr-free-ten"). When given,
 * every same-family outbound file whose CONTENT HASH differs from this file's —
 * an older hash, or a legacy date-stamped name with no hash — is removed, so
 * the folder holds exactly one current version and no superseded copy can be
 * read by mistake. Files sharing this file's hash (a pack's .html/.pdf/
 * -decisions.json siblings) are KEPT: they are the current set, not stale.
 */

/**
 * **EVERY FIGURE FROM AN UNFIXTURED INSTRUMENT CROSSES SAYING SO** (Annie's clause, David's
 * ruling, 2026-08-25 — R726).
 *
 * Her clause and his wiring instruction together: the mark goes **into the emission, not into the
 * covering message**, because *a mark that depends on someone remembering to write it is the
 * class we just closed*. So it is applied HERE, at the one door every artefact passes, and it is
 * applied BEFORE the bytes are copied — so the mark is inside the file the digest is taken over
 * and cannot be separated from the figures it qualifies.
 *
 * The emitting script is read from `process.argv[1]`, and "fixtured" means that script calls
 * `assertFixture` — the carried-fixture path (R721). **It deliberately OVER-MARKS**: a membership
 * crossing is not a check's figure, but marking it costs a reader one honest line while missing a
 * genuine unfixtured figure costs them a wrong belief.
 *
 * Idempotent: a file already carrying the key is left alone.
 */
function markIfUnfixtured(sourcePath: string): void {
  if (!sourcePath.endsWith('.json')) return; // html/pdf siblings carry the JSON's mark by pairing
  const emitter = process.argv[1] ?? '';
  let emitterSource = '';
  try { emitterSource = readFileSync(emitter, 'utf8'); } catch { /* not a readable script */ }
  const fixtured = /assertFixture\(/.test(emitterSource);
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(readFileSync(sourcePath, 'utf8')) as Record<string, unknown>; }
  catch { return; } // not an object artefact; nothing to mark
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return;
  if ('instrumentProvenance' in parsed) return;
  parsed.instrumentProvenance = fixtured
    ? {
      emittedBy: basename(emitter),
      carriedFixture: true,
      meaning: 'the emitting instrument proved itself against carried cases — including at least one clean case caught by nothing — before it produced these figures (R721).',
    }
    : {
      emittedBy: basename(emitter),
      carriedFixture: false,
      MARK: 'FROM AN UNFIXTURED INSTRUMENT',
      meaning: 'this emitter carries no fixture, so nothing in this run proves it can find what it claims to find or stay silent on what is clean. Read its figures accordingly (Annie\'s clause, R726).',
      remedy: 'the emitter earns a carried fixture before its next emission crosses (R725).',
    };
  writeFileSync(sourcePath, `${JSON.stringify(parsed, null, 1)}\n`);
}


/**
 * Re-derives a stamped name from the file's ACTUAL bytes, renaming if the mark changed them.
 *
 * **THE PREFIX COMES FROM THE FILENAME, NEVER FROM THE FAMILY LABEL** (R754). The first version
 * built its pattern out of `family` and returned the path UNCHANGED AND SILENT when the two
 * disagreed — so `deliver(…, 'boundary-conformance-cases')` on a file named
 * `boundary-conformance-cases-for-cowork-<hash>.json` skipped the restamp, and the artefact
 * staged under a name claiming a hash its bytes did not have. That is exactly the R731 fault this
 * function exists to prevent, re-entering through the function itself, by the R87 route: an
 * operation that is correct, a report that is true, and neither saying that nothing happened.
 * A stamped-looking name is now restamped on its OWN prefix whatever the label says, and a label
 * that does not match its file is reported rather than obeyed.
 */
function restampToContent(sourcePath: string, family?: string): string {
  if (!sourcePath.endsWith('.json')) return sourcePath;
  const current = basename(sourcePath);
  const stamped = /^(.*)-([0-9a-f]{16})\.json$/.exec(current);
  if (!stamped) return sourcePath;
  const [, prefix, claimed] = stamped;
  if (family && prefix !== family) {
    console.log(`  note: staged name's prefix is "${prefix}" while deliver() was told the family is "${family}". Restamping on the NAME's prefix; the retention match uses the family (R754).`);
  }
  const actual = createHash('sha256').update(readFileSync(sourcePath)).digest('hex').slice(0, 16);
  if (actual === claimed) return sourcePath;
  const renamed = join(dirname(sourcePath), `${prefix}-${actual}.json`);
  renameSync(sourcePath, renamed);
  console.log(`  restamped → ${basename(renamed)} (the mark changed the bytes; the name now agrees with them)`);
  return renamed;
}

export function deliver(sourcePathIn: string, family?: string): string {
  let sourcePath = sourcePathIn;
  mkdirSync(OUTBOUND_DIR, { recursive: true });
  let name = basename(sourcePath);
  let target = join(OUTBOUND_DIR, name);
  if (family) {
    // The 16-hex content hash this delivery belongs to (absent for a legacy
    // date-named file, in which case nothing is kept as "same version").
    const hash = name.match(/-([0-9a-f]{16})(?:[.-]|$)/)?.[1];
    for (const existing of readdirSync(OUTBOUND_DIR)) {
      if (existing === name) continue;
      // `family-<hash>.ext` is the stamped form; `family.ext` is the LEGACY unstamped one an
      // export wrote before it came through this door. Matching only on `family-` let those
      // legacy files survive every supersede, so a fixed-name copy sat alongside the stamped
      // one indefinitely — the stale file this function exists to remove (2026-08-12).
      /**
       * **A SUPERSEDED VERSION IS `family-<hash>.ext`. A BATCH IS A DIFFERENT FAMILY (R602).**
       *
       * Matching on the bare prefix `family-` made every `unread-item-hints-for-annie-batch-N-<hash>`
       * look like a stale copy of `unread-item-hints-for-annie`, **and the door deleted all four
       * batches out of her directory the next time the unbatched file was delivered.** She reported
       * batches three and four as never arriving; they arrived and were then removed by this
       * function, which printed `superseded → removed stale` and was believed.
       *
       * **A batch is not an older version of the whole — it is a different slice of the same
       * population**, and the two are indistinguishable to a prefix test. So the segment after
       * `family-` must BE a content hash, which is what a superseded version always has and what a
       * batch name never has in that position.
       */
      const supersedesStamped = new RegExp(`^${family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-[0-9a-f]{16}(?:[.-]|$)`).test(existing);
      const supersedesLegacy = existing.startsWith(`${family}.`);
      if (!supersedesStamped && !supersedesLegacy) continue;
      if (hash && existing.includes(hash)) continue; // a sibling of the current version
      /**
       * **RETENTION, RULED (David, 2026-08-23 — R658): superseded artefacts are RETAINED IN A
       * TRACKED STORE.** The first moratorium marked them aside inside gitignored directories —
       * *"a retention store that git ignores is a retention store one clean away from being the
       * fault again."* Superseded files now MOVE to `content/retention/`, which is git-tracked:
       * every retirement gets a commit, and the quotable line an era's prose rested on survives
       * both the family-glob and the clean.
       */
      const retained = join(RETENTION_DIR, `${existing}.superseded`);
      mkdirSync(RETENTION_DIR, { recursive: true });
      renameSync(join(OUTBOUND_DIR, existing), retained);
      console.log(`  superseded → RETAINED (tracked) content/retention/${existing}.superseded`);
    }
  }
  /**
   * THE MARK GOES IN BEFORE THE STAMP IS TRUE OF THE BYTES (R726, corrected on its first run).
   * Marking rewrote the file AFTER `stampedName` had hashed it, so the name claimed a content
   * hash the bytes no longer had — R88's rule broken by the mechanism built to honour a different
   * one. The stamp is therefore RE-DERIVED from the marked bytes and the file renamed to match,
   * here, automatically: a name that disagrees with its own content is exactly the fault this
   * store keeps closing.
   */
  markIfUnfixtured(sourcePath);
  // R759: a digest that names no spec never leaves this door.
  if (sourcePath.endsWith('.json')) {
    try {
      const parsed = JSON.parse(readFileSync(sourcePath, 'utf8')) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        assertDigestsNameTheirSpec(parsed as Record<string, unknown>, basename(sourcePath));
        // R767: naming is checkable at the door; honouring is only checkable by recomputing.
        for (const line of assertDeclaredDigestsRecompute(parsed as Record<string, unknown>, basename(sourcePath))) {
          console.log(`  ${line}`);
        }
      }
    } catch (e) { if (e instanceof Error && /R759|R767/.test(e.message)) throw e; }
  }
  const marked = restampToContent(sourcePath, family);
  if (marked !== sourcePath) { sourcePath = marked; name = basename(sourcePath); target = join(OUTBOUND_DIR, name); }
  copyFileSync(sourcePath, target);
  /*
   * **A SENDING REPORT SAYS STAGED WITH A HASH; THE RECEIVING STORE REPORTS ARRIVAL BY NAMING THE
   * HASH IT HOLDS** (Annie's operational ruling, 2026-08-19 — R255). Anything else is a record
   * running ahead of an act.
   *
   * The hash printed here is the sha256 OF THE FILE AS STAGED — not the stamp's truncated
   * projection digest (R256), which cannot serve this purpose because a file cannot contain its
   * own digest. This is the value the other store quotes back, and the two stores agree on a
   * delivery only when the same 64 characters appear on both sides.
   */
  /*
   * **THE BYTE DIGEST IS WRITTEN, NOT ONLY PRINTED** (Cowork's flag closed, 2026-08-19 — R265).
   *
   * `hashSpec.fileDigest` names the sidecar rather than sitting null — a file cannot contain its
   * own digest, but a null leaves the crossing bare where a pointer arms it (David, 2026-08-23) — and the
   * honest declaration of that left a real gap: a projection digest **cannot detect a file that
   * arrived truncated or re-encoded**, because it is computed from rows before the bytes exist.
   * Cowork was computing its own on receipt and neither side carried one to compare.
   *
   * So the digest is taken over the BYTES OF THE STAGED FILE, after it is closed, and written to a
   * SIDECAR beside it. A sidecar is the only shape that works: it is outside the file, so it can
   * describe the file completely. The receiving store hashes what it holds and compares two
   * numbers, and a truncated or re-encoded arrival stops being invisible.
   */
  const fileDigest = createHash('sha256').update(readFileSync(target)).digest('hex');
  writeFileSync(`${target}.sha256`, `${fileDigest}  ${name}\n`);
  const queued = readdirSync(OUTBOUND_DIR).filter((f) => !f.endsWith('.sha256')).length;
  console.log(`  STAGED  ${basename(target)}`);
  console.log(`  sha256  ${fileDigest}  (over the FILE BYTES; also written to ${basename(target)}.sha256)`);
  console.log(`  path    ${target}`);
  console.log(`  ${queued} file(s) staged. ARRIVAL IS NOT A FACT THIS SIDE CAN REPORT — it is confirmed`);
  console.log('  only when the other store names this sha256 in something it sends back.');
  return target;
}

/**
 * THE ACKNOWLEDGEMENT LEDGER — the only thing that can turn STAGED into ARRIVED.
 *
 * A staged file that has never been acknowledged is a QUEUE, and its length is a number nobody was
 * keeping. This reads the INBOUND artefacts — the files the other store sends us — and collects
 * every outbound filename they name. **Only the receiving store can say a file arrived**, so the
 * evidence has to come from something it wrote, never from anything on this side.
 *
 * A name appearing anywhere in an inbound artefact counts. That is generous on purpose: the risk
 * worth engineering against is a file believed delivered that never crossed, and a false
 * ACKNOWLEDGED reads as "we are done" while a false UNACKNOWLEDGED merely asks someone to check.
 */
export function acknowledgedFiles(inboundDirs: readonly string[]): Set<string> {
  const named = new Set<string>();
  for (const dir of inboundDirs) {
    let entries: string[];
    try { entries = readdirSync(dir); } catch { continue; }
    for (const entry of entries) {
      const full = join(dir, entry);
      let text: string;
      try {
        if (!statSync(full).isFile()) continue;
        text = readFileSync(full, 'utf8');
      } catch { continue; }
      for (const m of text.matchAll(/[A-Za-z0-9._-]+\.(?:json|md|html|csv|pdf)\b/g)) named.add(m[0]);
    }
  }
  return named;
}

/** Every file staged for the other store, with whether anything it sent back names it. */
export function stagingQueue(inboundDirs: readonly string[]): {
  staged: string[]; acknowledged: string[]; unacknowledged: string[];
} {
  const acked = acknowledgedFiles(inboundDirs);
  const staged = readdirSync(OUTBOUND_DIR).filter((f) => !f.startsWith('.')).sort();
  return {
    staged,
    acknowledged: staged.filter((f) => acked.has(f)),
    unacknowledged: staged.filter((f) => !acked.has(f)),
  };
}


/**
 * FRESHNESS STAMP (David's ruling, 2026-08-02 — four runs stalled on stale
 * exports). Every delivered export carries when it was built and a hash of the
 * exact source content it was built from, so a consumer can tell stale from
 * current: re-run the export and compare `sourceHash`. Same hash → the source
 * has not changed and the file is current; different → the file is stale.
 *
 * The hash is over the SOURCE rows, canonicalised (sorted keys), not over the
 * rendered file — so cosmetic changes to layout do not read as a content
 * change, and a real change to the items always does.
 *
 * `generatedAt` must be passed in (the workflow runtime forbids clock reads in
 * some contexts); pass `new Date().toISOString()` from the script entry point.
 */
export interface FreshnessStamp {
  generatedAt: string;
  sourceHash: string;
  /**
   * WHAT `sourceHash` ACTUALLY IS, CARRIED BESIDE IT (Cowork's flag, 2026-08-19 — R256).
   *
   * A field named `sourceHash` holding sixteen hex characters **will be read as a sha256 of the
   * file**, and a receiving store cannot tell from the value whether it is one. Ours is a sha256
   * and is neither of the two things that name suggests: it is TRUNCATED to 16 characters, and it
   * is taken over the DECLARED PROJECTION rather than over the file bytes.
   *
   * **A file cannot contain its own digest**, so `fileDigest` is null by construction and says so
   * rather than being absent — the receiving store computes that itself if it wants one.
   */
  hashSpec: {
    algorithm: 'sha256';
    digestChars: number;
    over: string;
    /**
     * A file cannot contain its own digest, but `null` left the crossing bare (David, 2026-08-23
     * — R660): this names WHERE the file digest lives instead. The declared value is the sidecar
     * and the STAGED line, both computed over the file bytes at delivery.
     */
    fileDigest: string;
  };
}

/**
 * WHAT THE ARTEFACT IS A SNAPSHOT OF (annie's ruling, 2026-08-08 — the tenth
 * delivery failure, and the finding underneath it).
 *
 * Her distinction, which the freshness stamp alone does not capture:
 *
 *   CONTENT ages VISIBLY. A passage export, a batch of items, a sample sheet —
 *   these stay true until the content itself changes, and a reader comparing
 *   them against the live thing can see the difference.
 *
 *   STATUS ages INVISIBLY. A queue of what is PROPOSED, a table of what is
 *   still to build, a list of hints that still need rewording — every one of
 *   these is stale the MOMENT the status changes, and nothing in the document
 *   says so. It goes on looking like a valid queue.
 *
 * The fourteen-entry proposed queue was dangerous rather than merely out of
 * date for exactly this reason: one entry had been ratified between export and
 * reading, and the file gave the reviewer no way to know. A content export
 * that loses a race is a stale copy; a status export that loses a race is a
 * WRONG INSTRUCTION about what to work on.
 *
 * So every export declares its kind here. `status` and `mixed` artefacts are
 * held to the stricter rule: they must carry the stamp IN the document a human
 * opens (see `stampHeader`), not only in a JSON sidecar, and they must have a
 * builder registered in `check-export-freshness` so staleness is DETECTABLE
 * rather than merely recorded.
 */
export type SnapshotOf = 'content' | 'status' | 'mixed';

export interface ArtefactStamp extends FreshnessStamp {
  /** What the reader is looking at a snapshot of. */
  snapshotOf: SnapshotOf;
  /** Plain-English name of the thing described, for the human-readable header. */
  describes: string;
  /**
   * WHICH TOP-LEVEL KEY (or keys) THE `sourceHash` WAS COMPUTED OVER.
   *
   * `check:stamp-covers-payload` recomputes the hash from the artefact and compares. It cannot
   * infer which part of the body is the payload, and three attempts to guess from SHAPE produced
   * three false accusations: the first array, the only array, and one artefact whose payload is an
   * object AND an array together. Shape cannot tell you; the exporter can.
   *
   * Optional so the 38 artefacts that predate it stay readable, and their absence is reported as
   * UNSCREENED rather than as a pass — an undeclared artefact is one nothing can verify.
   */
  stampedOver?: readonly string[];
}

/**
 * The stamp as a line a human reads, for .md and .html artefacts.
 *
 * The reviewer-status pair is why this exists: the stamp lived in the .json
 * sidecar while the reviewer read the .md, so the guard was on a file nobody
 * opened. A status artefact states its own staleness risk in its first lines
 * or the guard is decorative.
 */
export function stampHeader(stamp: ArtefactStamp, format: 'md' | 'html'): string {
  const when = stamp.generatedAt.slice(0, 16).replace('T', ' ');
  const warn =
    stamp.snapshotOf === 'content'
      ? 'Content snapshot — stays true until the content changes.'
      : `SNAPSHOT OF STATUS, ${when} UTC. Status may have moved since; this document cannot tell you that it has. Verify with \`pnpm check:export-freshness\` before working from it.`;
  const line = `Generated ${when} · describes ${stamp.describes} · source hash \`${stamp.sourceHash}\``;
  return format === 'md'
    ? `> ${warn}\n>\n> ${line}\n`
    : `<div class="stamp"><strong>${warn}</strong><br>${line}</div>`;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

const HASH_CHARS = 16;

export function freshnessStamp(source: unknown, generatedAt: string): FreshnessStamp {
  const hash = createHash('sha256').update(JSON.stringify(canonical(source)))
    .digest('hex').slice(0, HASH_CHARS);
  return {
    generatedAt,
    sourceHash: hash,
    hashSpec: {
      algorithm: 'sha256',
      digestChars: HASH_CHARS,
      over: 'the canonicalised declared projection named in stampedOver — NOT the file bytes',
      fileDigest: 'DECLARED AT CROSSING: the .sha256 sidecar beside this file and the STAGED line, both computed over the file bytes at delivery — a file cannot contain its own digest, and null left the crossing bare',
    },
  };
}

/** A freshness stamp that also declares what it is a snapshot of (see `SnapshotOf`). */
export function artefactStamp(
  source: unknown,
  generatedAt: string,
  snapshotOf: SnapshotOf,
  describes: string,
  stampedOver?: readonly string[],
): ArtefactStamp {
  return {
    ...freshnessStamp(source, generatedAt), snapshotOf, describes,
    ...(stampedOver ? { stampedOver } : {}),
  };
}
