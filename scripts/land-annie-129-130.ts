/**
 * TRANCHES TWO AND THREE LAND IN STRICT ORDER, WITH THE MERGE BETWEEN THEM (David, 2026-08-24 —
 * R680).
 *
 * A — her 129th (resend; the first crossing was lost and this store's record was right): two
 *     amendments, ten approvals including maths-106's with its annotation.
 * B — the merge under David's ruling: maths-106 RETIRES into maths-09, maths-09 standing on its
 *     landed wording; the ZERO-CARRIER state is WALKED here (options counted for both ids) and
 *     confirmed on the artefact — her register line: a doubling merged before its first carrier
 *     costs one ruling; after, it costs a retag census.
 * C — her 130th via the expansion map: the map carries BYTES, never verdicts — every verdict
 *     cites her 130th; the map is the byte source her by-reference approvals expand through, and
 *     her strings, the map's strings, and the live rows are all asserted against each other.
 *
 * One landing artefact covers all three phases, per-row hashes throughout.
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

const F129 = '/Users/davidb/Downloads/annie-129-for-code-resend.md';
const SHA129 = 'ac26b59ab6204640449116e9e9168fb44b64f057e123eb2f6dab4340fc4078d3';
const AUTH129 = `annie-129-for-code-resend.md, sha256 ${SHA129}`;
const F130 = '/Users/davidb/Downloads/annie-130-for-code.md';
const SHA130 = '1f4bae994c46b42e89b958b8bafdbb46976bd00da59ab20ba8a4ea1cdcdd9683';
const AUTH130 = `annie-130-for-code.md, sha256 ${SHA130}`;
const FMAP = '/Users/davidb/Downloads/tranche-three-expansion-for-code.json';
const SHAMAP = '8aee99aed0f8881530263c9df3ef59490ae3468d7c0f5c4080686b565bd4be68';

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

function readVerified(path: string, expected: string): string {
  const bytes = readFileSync(path);
  const got = sha256(bytes);
  if (got !== expected) throw new Error(`REFUSED — ${path} reads ${got}, declared ${expected}`);
  return bytes.toString('utf8');
}

const landingRows: Array<Record<string, unknown>> = [];

async function amend(id: string, replaced: string, replacedSha256: string, authored: string, authority: string, method: string) {
  if (sha256(replaced) !== replacedSha256) throw new Error(`REFUSED — ${id}: replaced string hashes to ${sha256(replaced)}, declared ${replacedSha256}`);
  const gate = checkChildFacingText({ role: 'hint', label: id, text: authored }).filter(isBlocking);
  if (gate.length > 0) throw new Error(`REFUSED — ${id} authored wording fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
  const db = await prisma.misconception.findUniqueOrThrow({ where: { id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
  const liveHash = sha256(db.childHint);
  if (db.childHint !== replaced || liveHash !== replacedSha256) {
    throw new Error(`REFUSED — ${id}: live row (${liveHash}) does not hold the replaced bytes (${replacedSha256})`);
  }
  const afterHash = sha256(authored);
  landingRows.push({ id, act: 'AMENDED', before: db.childHint, beforeSha256: liveHash, after: authored, afterSha256: afterHash, authority });
  if (!APPLY) { console.log(`  WOULD AMEND ${id}: ${liveHash.slice(0, 12)} -> ${afterHash.slice(0, 12)}`); return; }
  await prisma.misconception.update({
    where: { id },
    data: {
      childHint: authored, approvedBy: ANNIE, recordedBy: DAVID,
      approvalMethod: method,
      textProvenance: {
        state: 'RECORDED', text: 'childHint',
        authoredBy: { kind: 'person', name: 'Annie' },
        approvedBy: { kind: 'person', name: 'Annie' },
        // R257 approver's-redraft declaration: some of her redrafts shorten approved text; the
        // trim door requires the declaration on the write itself.
        approvedByPerson: ANNIE,
        method: 'her authored replacement; replaced string and declared hash asserted against the live row before write',
        authority, date: '2026-08-24',
        previous: { childHint: db.childHint, sha256: liveHash, replacedAt: '2026-08-24', approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
      },
    },
  });
  await prisma.attributionEvent.create({
    data: {
      recordType: 'misconception', recordId: id, action: 'AMENDED',
      reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
      method, note: `before ${liveHash} -> after ${afterHash}`,
    },
  });
  console.log(`  AMENDED  ${id}`);
}

async function approve(id: string, confirmed: string, hashCheck: (live: string) => boolean, hashLabel: string, authority: string, method: string, annotation: string | null) {
  const db = await prisma.misconception.findUniqueOrThrow({ where: { id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
  const liveHash = sha256(db.childHint);
  if (db.childHint !== confirmed) {
    throw new Error(`REFUSED — ${id}: confirmed string is not the serving byte-for-byte.\n  live:      ${JSON.stringify(db.childHint)}\n  confirmed: ${JSON.stringify(confirmed)}`);
  }
  if (!hashCheck(liveHash)) throw new Error(`REFUSED — ${id}: live hash ${liveHash} disagrees with declared ${hashLabel}`);
  landingRows.push({ id, act: 'APPROVED-AGAINST-BYTES', wording: db.childHint, wordingSha256: liveHash, priorApprovedBy: db.approvedBy, annotation, authority });
  if (!APPLY) { console.log(`  WOULD APPROVE ${id} (${liveHash.slice(0, 12)})${annotation ? ' — annotated' : ''}`); return; }
  await prisma.misconception.update({
    where: { id },
    data: {
      approvedBy: ANNIE, recordedBy: DAVID, approvalMethod: method,
      textProvenance: {
        state: 'RECORDED', text: 'childHint',
        authoredBy: (db.textProvenance as Record<string, unknown> | null)?.authoredBy ?? { state: 'UNKNOWN' },
        approvedBy: { kind: 'person', name: 'Annie' },
        method: 'approved as written — string and declared hash asserted against the live row before the stamp (R672)',
        servingSha256: liveHash,
        ...(annotation ? { annotation } : {}),
        authority, date: '2026-08-24',
        previous: { approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
      },
    },
  });
  await prisma.attributionEvent.create({
    data: {
      recordType: 'misconception', recordId: id, action: 'APPROVED',
      reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
      method: `${method}; signed against ${liveHash.slice(0, 16)}`,
      note: `wording ${liveHash}; prior approvedBy was ${db.approvedBy ?? 'null'}${annotation ? `; her annotation: ${annotation}` : ''}`,
    },
  });
  console.log(`  APPROVED ${id}${annotation ? ' (annotated)' : ''}`);
}

async function run() {
  const her129 = readVerified(F129, SHA129);
  const her130 = readVerified(F130, SHA130);
  const map = JSON.parse(readVerified(FMAP, SHAMAP)) as {
    amendment: { id: string; replaced: string; replacedSha256: string; authored: string; authoredSha256: string };
    approvals: Array<{ id: string; wording: string; wordingSha256: string }>;
  };

  // ---- Phase A: her 129th ----
  console.log('— PHASE A: the 129th (tranche two) —');
  const amendments129 = [...her129.matchAll(/target: library:([a-z0-9-]+)\n\s+replaced: (.+)\n\s+replacedSha256: ([0-9a-f]{64})\n\s+authored: (.+)/g)]
    .map((m) => ({ id: m[1], replaced: m[2].trim(), replacedSha256: m[3], authored: m[4].trim() }));
  if (amendments129.length !== 2 || amendments129[0].id !== 'maths-11-commutative-subtraction' || amendments129[1].id !== 'maths-110-missing-value-equals-the-average') {
    throw new Error(`REFUSED — expected the 129th's two amendments, found [${amendments129.map((a) => a.id).join(', ')}]`);
  }
  const conf129 = [...her129.matchAll(/confirmed: library:([a-z0-9-]+) \| (.+?) \| ([0-9a-f]{16})(?: \| (.+))?$/gm)]
    .map((m) => ({ id: m[1], confirmed: m[2].trim(), hashPrefix: m[3], annotation: m[4]?.trim() ?? null }));
  if (conf129.length !== 10) throw new Error(`REFUSED — expected ten 129th confirmations, found ${conf129.length}`);
  for (const a of amendments129) await amend(a.id, a.replaced, a.replacedSha256, a.authored, AUTH129, 'written review — her 129th return (resend), maths tranche two');
  for (const c of conf129) await approve(c.id, c.confirmed, (h) => h.startsWith(c.hashPrefix), c.hashPrefix, AUTH129, 'written review — her 129th return (resend), approved against serving bytes', c.annotation);

  // ---- Phase B: the merge ----
  console.log('— PHASE B: the merge (David\'s ruling on her 129th finding) —');
  const m09 = await prisma.misconception.findUniqueOrThrow({ where: { id: 'maths-09-rounding-misdirection' }, select: { childHint: true, status: true } });
  const LANDED_09 = 'Look at the next digit along. If it is 5 or more, round up.';
  if (m09.childHint !== LANDED_09 || m09.status !== 'ACTIVE') {
    throw new Error(`REFUSED — maths-09 does not stand on its landed wording/status (holds ${JSON.stringify(m09.childHint)}, ${m09.status})`);
  }
  const carriers = await prisma.itemOption.count({ where: { misconceptionId: { in: ['maths-09-rounding-misdirection', 'maths-106-always-rounds-down'] } } });
  if (carriers !== 0) throw new Error(`REFUSED — the zero-carrier premise fails: ${carriers} option(s) reference the pair; the merge now costs a retag census, not one ruling`);
  const m106 = await prisma.misconception.findUniqueOrThrow({ where: { id: 'maths-106-always-rounds-down' }, select: { childHint: true, status: true, textProvenance: true, approvedBy: true } });
  landingRows.push({
    id: 'maths-106-always-rounds-down', act: 'RETIRED-INTO-MERGE',
    mergedInto: 'maths-09-rounding-misdirection',
    survivorWording: LANDED_09, survivorWordingSha256: sha256(LANDED_09),
    retiredWording: m106.childHint, retiredWordingSha256: sha256(m106.childHint),
    zeroCarrierWalk: 'options referencing maths-09 or maths-106: 0 of 0 — walked live at landing, not recalled',
    authority: `her 129th finding (doubling, direction: keep 09, retire 106 into it) under David's ruling; ${AUTH129}`,
  });
  if (APPLY) {
    await prisma.misconception.update({
      where: { id: 'maths-106-always-rounds-down' },
      data: {
        status: 'RETIRED',
        textProvenance: {
          ...(m106.textProvenance as Record<string, unknown> ?? { state: 'RECORDED' }),
          mergedInto: 'maths-09-rounding-misdirection',
          mergeAuthority: `her 129th finding under David's ruling; ${AUTH129}`,
          mergeDate: '2026-08-24',
          mergeNote: 'one child doing one thing under two ids; caught at zero carriers where merging costs one ruling. Her text verdict on this row stands separately: the wording was approved as text on its merits.',
        },
      },
    });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'misconception', recordId: 'maths-106-always-rounds-down', action: 'AMENDED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'status',
        method: `doubling merge, her 129th finding (${SHA129.slice(0, 16)}) under David's ruling`,
        note: 'RETIRED into maths-09-rounding-misdirection at zero carriers; text verdict (approved as text) recorded separately on the row',
      },
    });
    console.log('  RETIRED  maths-106-always-rounds-down into maths-09 (zero carriers walked: 0)');
  } else console.log('  WOULD RETIRE maths-106 into maths-09 (zero carriers walked: 0)');

  // ---- Phase C: her 130th via the expansion map ----
  console.log('— PHASE C: the 130th (tranche three) via the expansion map —');
  const her130Amend = /target: library:maths-22-adding-numerators-and-denominators\n\s+replaced: (.+)\n\s+replacedSha256: .+\n\s+authored: (.+)/.exec(her130);
  if (!her130Amend) throw new Error('REFUSED — her 130th\'s maths-22 amendment block not found');
  if (her130Amend[1].trim() !== map.amendment.replaced || her130Amend[2].trim() !== map.amendment.authored) {
    throw new Error('REFUSED — her 130th\'s strings and the expansion map\'s bytes disagree on maths-22');
  }
  if (sha256(map.amendment.authored) !== map.amendment.authoredSha256) throw new Error('REFUSED — map authoredSha256 does not match its own authored string');
  const confirmed130 = [...her130.matchAll(/confirmed: library:([a-z0-9-]+) \|/g)].map((m) => m[1]);
  const mapIds = map.approvals.map((a) => a.id).sort();
  if (JSON.stringify(confirmed130.sort()) !== JSON.stringify(mapIds)) {
    throw new Error(`REFUSED — her 130th confirms [${confirmed130.join(', ')}] but the map expands [${mapIds.join(', ')}]`);
  }
  await amend(map.amendment.id, map.amendment.replaced, map.amendment.replacedSha256, map.amendment.authored, AUTH130,
    'written review — her 130th return, maths tranche three; bytes via the desk expansion map (8aee99aed0f88815), verdict hers');
  for (const a of map.approvals) {
    await approve(a.id, a.wording, (h) => h === a.wordingSha256, a.wordingSha256, AUTH130,
      'written review — her 130th return, approved by reference to the verified file; bytes via the desk expansion map (8aee99aed0f88815), verdict hers', null);
  }

  console.log(`\n${landingRows.length} rows in the landing record (12 + merge + 12).`);

  if (APPLY) {
    const artefact = {
      kind: 'annie-129-130-landing',
      what: 'Tranches two and three landed in strict order with the doubling merge between them. Per-row before/after hashes throughout; every verdict cites her return; the expansion map carried bytes only.',
      authorities: { the129th: AUTH129, the130th: AUTH130, expansionMap: `tranche-three-expansion-for-code.json, sha256 ${SHAMAP} — bytes, never verdicts` },
      channelNote: 'the 129th landed from the RESEND; the first crossing was lost and this store\'s tranche-one-only record was right (R679 discrepancy resolved to the channel, not the record).',
      merge: {
        ruling: 'maths-106-always-rounds-down RETIRED into maths-09-rounding-misdirection under David\'s ruling on her 129th doubling finding',
        zeroCarrierWalk: 'walked at landing: 0 options reference either id; the merge cost one ruling, exactly as her register line prices it',
        survivorStandsOn: 'its landed tranche-one wording, asserted before the retire',
      },
      rows: landingRows,
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('annie-129-130-landing', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'annie-129-130-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
