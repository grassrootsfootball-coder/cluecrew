/**
 * TRANCHE FOUR LANDS ON THE RATIFIED REFERENCE SHAPE; THE 130TH'S PLACEHOLDER REPAIRS (David,
 * 2026-08-24 — R681).
 *
 * Two amendments (maths-31, maths-35) with the MAP'S literal hashes asserted against her strings
 * and the live rows; ten approvals per the map — the map carries bytes, every verdict cites her
 * 131st, which rode the newly ratified reference shape (digest + row id) for the pure approvals.
 *
 * THE HOUSEKEEPING IS A PROVENANCE REPAIR, NOT A TEXT WRITE: her 130th's amendment block wrote a
 * placeholder where maths-22's replaced hash belonged; her 131st supplies the literal as her
 * authored value. maths-22's childHint is not touched — its provenance gains the literal with the
 * prior placeholder stamped, and the literal is asserted against the hash the landing already
 * recorded before anything is written.
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
const F131 = '/Users/davidb/Downloads/annie-131-for-code.md';
const SHA131 = '4b9136381ade566751836dca38037bebc171b73bb18b52ad91f4bd7cea5614d5';
const AUTH131 = `annie-131-for-code.md, sha256 ${SHA131}`;
const FMAP = '/Users/davidb/Downloads/tranche-four-expansion-for-code.json';
const SHAMAP = '9ceeef9b9685964943916d406ffb1709f5456c0fd577f62a9d3204dd74058700';
const PLACEHOLDER = "(per the crossed file's row hash)";
const M22_LITERAL = '6e34fae8e82359c15c8ebebabf57d1147e5f041ee2357bcc227c4f1f1ecd03df';

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const readVerified = (path: string, expected: string) => {
  const bytes = readFileSync(path);
  if (sha256(bytes) !== expected) throw new Error(`REFUSED — ${path} reads ${sha256(bytes)}, declared ${expected}`);
  return bytes.toString('utf8');
};

const landingRows: Array<Record<string, unknown>> = [];

async function run() {
  const her = readVerified(F131, SHA131);
  const map = JSON.parse(readVerified(FMAP, SHAMAP)) as {
    amendments: Array<{ id: string; replaced: string; replacedSha256: string; authored: string; authoredSha256: string }>;
    approvals: Array<{ id: string; wording: string; wordingSha256: string }>;
  };
  if (map.amendments.length !== 2 || map.approvals.length !== 10) throw new Error('REFUSED — map shape is not 2 amendments + 10 approvals');

  // Her strings and the map's bytes must agree before either is trusted.
  for (const a of map.amendments) {
    const block = new RegExp(`target: library:${a.id}\\n\\s+replaced: (.+)\\n\\s+replacedSha256: .+\\n\\s+authored: (.+)`).exec(her);
    if (!block) throw new Error(`REFUSED — her 131st carries no amendment block for ${a.id}`);
    if (block[1]!.trim() !== a.replaced || block[2]!.trim() !== a.authored) throw new Error(`REFUSED — her 131st's strings and the map's bytes disagree on ${a.id}`);
    if (sha256(a.replaced) !== a.replacedSha256 || sha256(a.authored) !== a.authoredSha256) throw new Error(`REFUSED — the map's ${a.id} hashes do not match its own strings`);
  }
  const confirmedIds = [...her.matchAll(/confirmed: library:([a-z0-9-]+) \| approved as written \| reference: 851cc51ae835885f id ([a-z0-9-]+)/g)]
    .map((m) => ({ full: m[1]!, short: m[2]! }));
  if (confirmedIds.length !== 10) throw new Error(`REFUSED — expected ten reference-shape confirmations, found ${confirmedIds.length}`);
  for (const c of confirmedIds) {
    if (!c.full.startsWith(c.short)) throw new Error(`REFUSED — reference id ${c.short} does not resolve to her confirmed ${c.full}`);
    if (!map.approvals.some((a) => a.id === c.full)) throw new Error(`REFUSED — her confirmation ${c.full} has no expansion in the map`);
  }

  // ---- The two amendments ----
  for (const a of map.amendments) {
    const gate = checkChildFacingText({ role: 'hint', label: a.id, text: a.authored }).filter(isBlocking);
    if (gate.length > 0) throw new Error(`REFUSED — ${a.id} fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id: a.id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
    const liveHash = sha256(db.childHint);
    if (db.childHint !== a.replaced || liveHash !== a.replacedSha256) throw new Error(`REFUSED — ${a.id}: live row (${liveHash}) does not hold the replaced bytes (${a.replacedSha256})`);
    landingRows.push({ id: a.id, act: 'AMENDED', before: db.childHint, beforeSha256: liveHash, after: a.authored, afterSha256: a.authoredSha256, authority: AUTH131 });
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: a.id },
        data: {
          childHint: a.authored, approvedBy: ANNIE, recordedBy: DAVID,
          approvalMethod: 'written review — her 131st return, maths tranche four',
          textProvenance: {
            state: 'RECORDED', text: 'childHint',
            authoredBy: { kind: 'person', name: 'Annie' },
            approvedBy: { kind: 'person', name: 'Annie' },
            approvedByPerson: ANNIE,
            method: 'her authored replacement; her strings, the map\'s literal hashes and the live row asserted against each other before write',
            authority: AUTH131, date: '2026-08-24',
            previous: { childHint: db.childHint, sha256: liveHash, replacedAt: '2026-08-24', approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: a.id, action: 'AMENDED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
          method: `her 131st return (${SHA131.slice(0, 16)}); one codepoint, the instruction-bang class`,
          note: `before ${liveHash} -> after ${a.authoredSha256}`,
        },
      });
      console.log(`  AMENDED  ${a.id}`);
    } else console.log(`  WOULD AMEND ${a.id}: ${liveHash.slice(0, 12)} -> ${a.authoredSha256.slice(0, 12)}`);
  }

  // ---- The ten approvals (reference shape, expanded by the map) ----
  for (const a of map.approvals) {
    if (sha256(a.wording) !== a.wordingSha256) throw new Error(`REFUSED — map's ${a.id} hash does not match its own wording`);
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id: a.id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
    const liveHash = sha256(db.childHint);
    if (db.childHint !== a.wording || liveHash !== a.wordingSha256) throw new Error(`REFUSED — ${a.id}: live row (${liveHash}) does not hold the map's bytes (${a.wordingSha256})`);
    landingRows.push({ id: a.id, act: 'APPROVED-BY-REFERENCE', wording: db.childHint, wordingSha256: liveHash, priorApprovedBy: db.approvedBy, authority: AUTH131 });
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: a.id },
        data: {
          approvedBy: ANNIE, recordedBy: DAVID,
          approvalMethod: 'written review — her 131st return, reference shape against the verified 851cc51a file',
          textProvenance: {
            state: 'RECORDED', text: 'childHint',
            authoredBy: (db.textProvenance as Record<string, unknown> | null)?.authoredBy ?? { state: 'UNKNOWN' },
            approvedBy: { kind: 'person', name: 'Annie' },
            method: 'approved by reference (ratified shape, her 131st §1): digest + row id against the byte-verified file; bytes expanded by the desk map and asserted against the live row here',
            servingSha256: liveHash,
            authority: AUTH131, date: '2026-08-24',
            previous: { approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: a.id, action: 'APPROVED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
          method: `her 131st return (${SHA131.slice(0, 16)}); reference shape, signed against ${liveHash.slice(0, 16)}`,
          note: `wording ${liveHash}; prior approvedBy was ${db.approvedBy ?? 'null'}`,
        },
      });
      console.log(`  APPROVED ${a.id}`);
    } else console.log(`  WOULD APPROVE ${a.id} (${liveHash.slice(0, 12)})`);
  }

  // ---- The housekeeping: a provenance repair, not a text write ----
  const m22 = await prisma.misconception.findUniqueOrThrow({ where: { id: 'maths-22-adding-numerators-and-denominators' }, select: { childHint: true, textProvenance: true } });
  const tp = m22.textProvenance as Record<string, unknown>;
  const prevSha = (tp?.previous as Record<string, unknown> | undefined)?.sha256;
  if (prevSha !== M22_LITERAL) throw new Error(`REFUSED — the landing's recorded replaced-hash (${prevSha}) disagrees with her authored literal (${M22_LITERAL})`);
  landingRows.push({
    id: 'maths-22-adding-numerators-and-denominators', act: 'PROVENANCE-REPAIR — NOT A TEXT WRITE',
    field: "her 130th amendment block's replacedSha256",
    priorPlaceholder: PLACEHOLDER,
    literal: M22_LITERAL,
    assertedAgainst: 'the replaced-hash the 129-130 landing recorded on the row (previous.sha256) — they agree',
    authority: `her 131st housekeeping entry; ${AUTH131}`,
  });
  if (APPLY) {
    await prisma.misconception.update({
      where: { id: 'maths-22-adding-numerators-and-denominators' },
      data: {
        textProvenance: {
          ...tp,
          housekeeping: {
            what: "her 130th's amendment block wrote a placeholder where the replaced hash belonged; her 131st supplies the literal as her authored value",
            field: 'replacedSha256 (her 130th amendment block)',
            previous: PLACEHOLDER,
            value: M22_LITERAL,
            herLine: 'a placeholder in a hash field is a note wearing a citation, and mine gets no exemption',
            authority: AUTH131, date: '2026-08-24',
          },
        },
      },
    });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'misconception', recordId: 'maths-22-adding-numerators-and-denominators', action: 'AMENDED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'textProvenance',
        method: `her 131st housekeeping (${SHA131.slice(0, 16)}); provenance repair, childHint untouched`,
        note: `the 130th's placeholder replacedSha256 completed with her literal ${M22_LITERAL.slice(0, 16)}; prior placeholder stamped`,
      },
    });
    console.log('  REPAIRED maths-22 provenance — the placeholder completed with her literal, childHint untouched');
  } else console.log('  WOULD REPAIR maths-22 provenance (placeholder -> her literal; childHint untouched)');

  console.log(`\n${landingRows.length} rows in the landing record (2 + 10 + 1 repair).`);

  if (APPLY) {
    const artefact = {
      kind: 'annie-131-tranche-four-landing',
      what: 'Tranche four landed on the ratified reference shape: two one-codepoint amendments, ten approvals by reference expanded through the desk map; plus the 130th-placeholder provenance repair, childHint untouched.',
      authorities: { the131st: AUTH131, expansionMap: `tranche-four-expansion-for-code.json, sha256 ${SHAMAP} — bytes, never verdicts` },
      ratifiedFence: 'reference shape (artefact digest + row id) valid for PURE APPROVALS under two conditions: the digest is declared verified in the same return, and the id resolves to exactly one row. Any verdict touching text keeps the quotation shape — an amendment must quote its replaced string with its hash, because the collision assert needs bytes to refuse on.',
      rows: landingRows,
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('annie-131-tranche-four-landing', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'annie-131-tranche-four-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
