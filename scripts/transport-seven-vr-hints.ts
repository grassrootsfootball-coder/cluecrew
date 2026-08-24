/**
 * THE TRANSPORT OF THE SEVEN (David, 2026-08-24, on the desk's VR-24 diff verdict — R670).
 *
 * Seven VR library hints were AMENDED BY ANNIE in her ENG-003 seventh return and the amendments
 * took effect on one store and never where it mattered: children heard the pre-amendment texts
 * throughout. Her 121st names the register line this earns: **a ruling's effect date is its
 * serving date, not its authoring date.**
 *
 * Byte sources, all digest-verified before a single row is read:
 *  - WORDINGS: the authoring emission `vr-24-rows-for-code.json` (9fdb094f…) — NEVER the
 *    verdict's prose. Each wording is re-hashed here against its declared `wordingSha256`.
 *  - MEMBERSHIP + BEFORE-BYTES: the desk verdict `VR-24-DIFF-VERDICT.json` (17f7129d…). The
 *    current serving `childHint` must hash to the verdict's `servingSha256`, or the serving
 *    bytes have moved since the desk diffed and the transport REFUSES — a verdict is about the
 *    bytes it read (R62/R149's shape).
 *  - AUTHORITY: her seventh return, eba01cb7…, recorded on every row and every event.
 *
 * The landing artefact crosses with per-row before/after strings AND hashes, so the desk can
 * close the seven against bytes (R25: send the value, not an account of it).
 *
 * TOUCHES NOTHING on the nine (await one crossing) or the eight (with Annie): the update set is
 * exactly the seven ids, asserted against both files before any write.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const ANNIE_REVIEWER_ID = 'rev-0001';
const SEVENTH_RETURN = '75e558dd-annieeng003seventhreturn.md, sha256 eba01cb7d51f004bcd413b36102204fd1cc0e025d8cc72334c1a07fb3aed6f14';

const EMISSION_PATH = '/Users/davidb/Downloads/vr-24-rows-for-code.json';
const EMISSION_SHA256 = '9fdb094fe1b08862e15b4b7653451bca27ce38e78b7befe9be87056f82abd770';
const VERDICT_PATH = '/Users/davidb/Downloads/VR-24-DIFF-VERDICT.json';
const VERDICT_SHA256 = '17f7129d1eec946d6a9994189565cfe35a1665e9b437c774deec36c15a54be0e';

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

function readVerified(path: string, expected: string): string {
  const bytes = readFileSync(path);
  const got = sha256(bytes);
  if (got !== expected) throw new Error(`REFUSED — ${path} reads ${got}, declared ${expected}. A digest quoted is not a file held.`);
  return bytes.toString('utf8');
}

async function main() {
  const emission = JSON.parse(readVerified(EMISSION_PATH, EMISSION_SHA256)) as {
    drainRows24: { rows: Array<{ id: string; wording: string | null; wordingSha256?: string; approvalState: string; evidence: { sha256: string } | null }> };
  };
  const verdict = JSON.parse(readVerified(VERDICT_PATH, VERDICT_SHA256)) as {
    theSeven: { rows: Array<{ id: string; authoredSha256: string; servingSha256: string }> };
    theNine: { ids: string[] };
    theEight: { ids: string[] };
  };

  // Membership: the emission's AMENDED rows are the seven, and they must agree with the verdict.
  const authored = emission.drainRows24.rows.filter((r) => r.wording !== null);
  const verdictIds = verdict.theSeven.rows.map((r) => r.id).sort();
  const emissionIds = authored.map((r) => r.id).sort();
  if (authored.length !== 7 || JSON.stringify(verdictIds) !== JSON.stringify(emissionIds)) {
    throw new Error(`REFUSED — membership disagreement: emission holds [${emissionIds.join(', ')}], verdict holds [${verdictIds.join(', ')}]`);
  }
  const untouchable = new Set([...verdict.theNine.ids, ...verdict.theEight.ids]);
  for (const id of emissionIds) {
    if (untouchable.has(id)) throw new Error(`REFUSED — ${id} is on the nine or the eight; the transport must not touch it`);
  }

  const landingRows: Array<Record<string, unknown>> = [];
  for (const row of authored) {
    const v = verdict.theSeven.rows.find((r) => r.id === row.id)!;
    const wording = row.wording!;
    // The wording's own declared hash, recomputed here (a match carries what it matched on).
    const wordingHash = sha256(wording);
    if (wordingHash !== row.wordingSha256) throw new Error(`REFUSED — ${row.id}: wording hashes to ${wordingHash}, emission declares ${row.wordingSha256}`);
    if (wordingHash !== v.authoredSha256) throw new Error(`REFUSED — ${row.id}: emission wording ${wordingHash} disagrees with verdict authoredSha256 ${v.authoredSha256}`);
    if (row.evidence?.sha256 !== 'eba01cb7d51f004bcd413b36102204fd1cc0e025d8cc72334c1a07fb3aed6f14') {
      throw new Error(`REFUSED — ${row.id} cites ${row.evidence?.sha256 ?? 'nothing'} as evidence, not her seventh return`);
    }
    const gate = checkChildFacingText({ role: 'hint', label: row.id, text: wording }).filter(isBlocking);
    if (gate.length > 0) throw new Error(`REFUSED — ${row.id} fails the child-facing gate: ${gate.map((f) => f.detail).join('; ')}`);

    const db = await prisma.misconception.findUnique({ where: { id: row.id }, select: { childHint: true, status: true, textProvenance: true } });
    if (!db) throw new Error(`REFUSED — ${row.id} has no Misconception row; the population the verdict names must exist entire (requirePopulation's shape)`);
    const beforeHash = sha256(db.childHint);
    if (beforeHash !== v.servingSha256) {
      throw new Error(
        `REFUSED — ${row.id}: serving childHint hashes to ${beforeHash}, the desk diffed ${v.servingSha256}. ` +
          'The serving bytes moved since the verdict; a verdict is about the bytes it read — re-diff before transporting.',
      );
    }

    landingRows.push({
      id: row.id, status: db.status,
      before: db.childHint, beforeSha256: beforeHash,
      after: wording, afterSha256: wordingHash,
      authority: SEVENTH_RETURN,
    });

    if (APPLY) {
      await prisma.misconception.update({
        where: { id: row.id },
        data: {
          childHint: wording,
          textProvenance: {
            state: 'RECORDED',
            text: 'childHint',
            authoredBy: { kind: 'person', name: 'Annie' },
            approvedBy: { kind: 'person', name: 'Annie' },
            method: `verbatim transport from the authoring emission vr-24-rows-for-code.json (sha256 ${EMISSION_SHA256}); her wording, her file's bytes`,
            authority: SEVENTH_RETURN,
            date: '2026-08-24',
            authoredDate: 'her ENG-003 seventh return; EFFECT DATE IS SERVING DATE, 2026-08-24 (her 121st, R670)',
            previous: { childHint: db.childHint, sha256: beforeHash, replacedAt: '2026-08-24', provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: row.id, action: 'AMENDED',
          reviewerId: ANNIE_REVIEWER_ID, actor: 'Annie', recordedBy: DAVID,
          field: 'childHint',
          method: `transport of her seventh-return amendment (${SEVENTH_RETURN}); byte source the authoring emission at ${EMISSION_SHA256.slice(0, 16)}`,
          note: `before ${beforeHash} -> after ${wordingHash}; ruled in her seventh, served 2026-08-24 — the effect date is the serving date (R670)`,
        },
      });
      console.log(`  TRANSPORTED ${row.id}`);
    } else {
      console.log(`  WOULD TRANSPORT ${row.id}: ${beforeHash.slice(0, 12)} -> ${wordingHash.slice(0, 12)}`);
    }
  }

  console.log(`\n${landingRows.length} of 7 rows verified end-to-end (population: the verdict's seven, entire).`);

  if (APPLY) {
    const artefact = {
      kind: 'seven-vr-hints-landing',
      what: "The transport of the seven: Annie's seventh-return VR hint amendments, ruled long ago and never served, now landed at serving. Per-row before/after bytes and hashes so the desk closes the seven against bytes.",
      effectDateRule: "a ruling's effect date is its serving date, not its authoring date (Annie's 121st; R670)",
      byteSources: {
        wordings: { file: 'vr-24-rows-for-code.json', sha256: EMISSION_SHA256 },
        beforeBytes: { file: 'VR-24-DIFF-VERDICT.json', sha256: VERDICT_SHA256, note: 'every before-hash re-verified against the live serving row at transport time' },
        authority: SEVENTH_RETURN,
      },
      servedAt: '2026-08-24',
      untouched: { theNine: verdict.theNine.ids, theEight: verdict.theEight.ids, note: 'zero writes outside the seven; asserted before any write' },
      rows: landingRows,
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('seven-vr-hints-landing', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'seven-vr-hints-landing');
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
