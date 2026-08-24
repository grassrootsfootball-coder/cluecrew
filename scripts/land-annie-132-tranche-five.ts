/**
 * TRANCHE FIVE LANDS ON THE HYBRID SHAPE (David, 2026-08-24 — R682).
 *
 * Four amendments in her newly ratified HYBRID form: replaced string QUOTED (the collision assert
 * refuses on bytes), replacedSha256 as a REFERENCE into the verified 851cc51a file — the map
 * expands the reference to a literal, and the landing asserts THREE WAYS as ever: her string, the
 * map's literal hash, the live row. Eight approvals per the map; maths-49's truth-check
 * annotation carried onto its row.
 *
 * Parser note (her syntax has settled): `reference: <digest-prefix> id <short-id>` without
 * parentheses, and annotations ride MID-SEGMENT before the pipe — `approved as written;
 * <annotation> | reference: …`.
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
const ANNIE = 'reviewer:rev-0001';
const F132 = '/Users/davidb/Downloads/annie-132-for-code.md';
const SHA132 = '16e8adc4af51f7320818e2871f1c8a73469b4017644e8409c9385af17f67613a';
const AUTH132 = `annie-132-for-code.md, sha256 ${SHA132}`;
const FMAP = '/Users/davidb/Downloads/tranche-five-expansion-for-code.json';
const SHAMAP = 'def22c6d1f8d030550b5053921b681f919ab7f9d6517d19e303327c10fbd5f17';
const REF_PREFIX = '851cc51ae835885f';

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const readVerified = (path: string, expected: string) => {
  const bytes = readFileSync(path);
  if (sha256(bytes) !== expected) throw new Error(`REFUSED — ${path} reads ${sha256(bytes)}, declared ${expected}`);
  return bytes.toString('utf8');
};

const landingRows: Array<Record<string, unknown>> = [];

async function run() {
  const her = readVerified(F132, SHA132);
  const map = JSON.parse(readVerified(FMAP, SHAMAP)) as {
    amendments: Array<{ id: string; replaced: string; replacedSha256: string; authored: string; authoredSha256: string }>;
    approvals: Array<{ id: string; wording: string; wordingSha256: string; annotation: string | null }>;
  };
  if (map.amendments.length !== 4 || map.approvals.length !== 8) throw new Error('REFUSED — map shape is not 4 amendments + 8 approvals');

  // Her hybrid blocks: quoted strings, reference-shape hash field. Assert her strings == map
  // bytes, her reference names the right short id, and the map's literals match its own strings.
  for (const a of map.amendments) {
    const short = /^maths-\d+/.exec(a.id)?.[0];
    const block = new RegExp(`target: library:${a.id}\\n\\s+replaced: (.+)\\n\\s+replacedSha256: reference: ${REF_PREFIX} id (${short})\\n\\s+authored: (.+)`).exec(her);
    if (!block) throw new Error(`REFUSED — her 132nd carries no hybrid block for ${a.id} in the settled syntax`);
    if (block[1].trim() !== a.replaced || block[3].trim() !== a.authored) throw new Error(`REFUSED — her 132nd's strings and the map's bytes disagree on ${a.id}`);
    if (sha256(a.replaced) !== a.replacedSha256 || sha256(a.authored) !== a.authoredSha256) throw new Error(`REFUSED — the map's ${a.id} hashes do not match its own strings`);
  }
  const confs = [...her.matchAll(/confirmed: library:([a-z0-9-]+) \| approved as written(?:; ([^|]+?))? \| reference: 851cc51ae835885f id ([a-z0-9-]+)/g)]
    .map((m) => ({ full: m[1], annotation: m[2]?.trim() ?? null, short: m[3] }));
  if (confs.length !== 8) throw new Error(`REFUSED — expected eight reference confirmations, found ${confs.length}`);
  for (const c of confs) {
    if (!c.full.startsWith(c.short)) throw new Error(`REFUSED — reference id ${c.short} does not resolve to ${c.full}`);
    const m = map.approvals.find((a) => a.id === c.full);
    if (!m) throw new Error(`REFUSED — ${c.full} has no expansion in the map`);
    if ((m.annotation ?? null) !== c.annotation) throw new Error(`REFUSED — ${c.full}: her annotation ${JSON.stringify(c.annotation)} and the map's ${JSON.stringify(m.annotation)} disagree`);
  }

  for (const a of map.amendments) {
    const gate = checkChildFacingText({ role: 'hint', label: a.id, text: a.authored }).filter(isBlocking);
    if (gate.length > 0) throw new Error(`REFUSED — ${a.id} fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id: a.id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
    const liveHash = sha256(db.childHint);
    if (db.childHint !== a.replaced || liveHash !== a.replacedSha256) throw new Error(`REFUSED — ${a.id}: live row (${liveHash}) does not hold the replaced bytes (${a.replacedSha256})`);
    landingRows.push({ id: a.id, act: 'AMENDED (hybrid shape)', before: db.childHint, beforeSha256: liveHash, after: a.authored, afterSha256: a.authoredSha256, authority: AUTH132 });
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: a.id },
        data: {
          childHint: a.authored, approvedBy: ANNIE, recordedBy: DAVID,
          approvalMethod: 'written review — her 132nd return, maths tranche five (hybrid shape)',
          textProvenance: {
            state: 'RECORDED', text: 'childHint',
            authoredBy: { kind: 'person', name: 'Annie' },
            approvedBy: { kind: 'person', name: 'Annie' },
            approvedByPerson: ANNIE,
            method: 'her authored replacement, hybrid shape: quoted replaced string, replacedSha256 by reference into the verified file, expanded by the desk map and asserted three ways',
            authority: AUTH132, date: '2026-08-24',
            previous: { childHint: db.childHint, sha256: liveHash, replacedAt: '2026-08-24', approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: a.id, action: 'AMENDED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
          method: `her 132nd return (${SHA132.slice(0, 16)}); hybrid shape`,
          note: `before ${liveHash} -> after ${a.authoredSha256}`,
        },
      });
      console.log(`  AMENDED  ${a.id}`);
    } else console.log(`  WOULD AMEND ${a.id}: ${liveHash.slice(0, 12)} -> ${a.authoredSha256.slice(0, 12)}`);
  }

  for (const a of map.approvals) {
    if (sha256(a.wording) !== a.wordingSha256) throw new Error(`REFUSED — map's ${a.id} hash does not match its own wording`);
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id: a.id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
    const liveHash = sha256(db.childHint);
    if (db.childHint !== a.wording || liveHash !== a.wordingSha256) throw new Error(`REFUSED — ${a.id}: live row (${liveHash}) does not hold the map's bytes (${a.wordingSha256})`);
    landingRows.push({ id: a.id, act: 'APPROVED-BY-REFERENCE', wording: db.childHint, wordingSha256: liveHash, priorApprovedBy: db.approvedBy, annotation: a.annotation, authority: AUTH132 });
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: a.id },
        data: {
          approvedBy: ANNIE, recordedBy: DAVID,
          approvalMethod: 'written review — her 132nd return, reference shape against the verified 851cc51a file',
          textProvenance: {
            state: 'RECORDED', text: 'childHint',
            authoredBy: (db.textProvenance as Record<string, unknown> | null)?.authoredBy ?? { state: 'UNKNOWN' },
            approvedBy: { kind: 'person', name: 'Annie' },
            method: 'approved by reference (R681 fence): digest + row id against the byte-verified file; bytes expanded by the desk map and asserted against the live row here',
            servingSha256: liveHash,
            ...(a.annotation ? { annotation: a.annotation } : {}),
            authority: AUTH132, date: '2026-08-24',
            previous: { approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: a.id, action: 'APPROVED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
          method: `her 132nd return (${SHA132.slice(0, 16)}); reference shape, signed against ${liveHash.slice(0, 16)}`,
          note: `wording ${liveHash}; prior approvedBy was ${db.approvedBy ?? 'null'}${a.annotation ? `; her annotation: ${a.annotation}` : ''}`,
        },
      });
      console.log(`  APPROVED ${a.id}${a.annotation ? ' (annotated)' : ''}`);
    } else console.log(`  WOULD APPROVE ${a.id} (${liveHash.slice(0, 12)})${a.annotation ? ' — annotation carried' : ''}`);
  }

  console.log(`\n${landingRows.length} rows in the landing record (4 + 8).`);

  if (APPLY) {
    const artefact = {
      kind: 'annie-132-tranche-five-landing',
      what: 'Tranche five landed: four hybrid-shape amendments (quoted strings, referenced hashes expanded by the desk map, asserted three ways), eight approvals by reference; maths-49\'s truth-check annotation carried on its row.',
      authorities: { the132nd: AUTH132, expansionMap: `tranche-five-expansion-for-code.json, sha256 ${SHAMAP} — bytes, never verdicts` },
      hybridRatification: 'an amendment whose replaced string is quoted may carry its replacedSha256 as a reference under the R681 fence — the replaced field is definitionally the row\'s bytes, so the reference names exactly what the field exists to name; the quoted string stays mandatory (the collision assert refuses on bytes); hash fields stay literal wherever no verified artefact exists to reference.',
      rows: landingRows,
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('annie-132-tranche-five-landing', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'annie-132-tranche-five-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
