/**
 * HER 125TH AGAINST THE NINE, AND THE CLASS CLOSES (David, 2026-08-24 — R674).
 *
 * Two amendments land through the standing path (the 122nd's shape): authored strings from her
 * file, replaced strings AND her declared `replacedSha256` asserted against the live rows before
 * write, priors stamped, events on rev-0001. Seven approvals stamp, each confirmed string and
 * hash prefix asserted against its live row first — her confirmation-form rule (R672) doing its
 * work on the first batch born under it.
 *
 * The landing artefact declares the CLASS CLOSED on its face: 24 of 24 VR serving hint rows
 * governed, partition stated (7 transported + 8 under the 122nd/123rd + 9 here), and the
 * effect-date rule's second case closed on the day it opened.
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
const HER_FILE = '/Users/davidb/Downloads/annie-125-for-code.md';
const HER_SHA256 = 'ad9a87f6eb1acdf8fc86d6031f7e68688731b8e0a118bbf12f1d7a44af033ad3';
const AUTHORITY = `annie-125-for-code.md, sha256 ${HER_SHA256}`;

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  const bytes = readFileSync(HER_FILE);
  if (sha256(bytes) !== HER_SHA256) throw new Error(`REFUSED — her 125th reads ${sha256(bytes)}, declared ${HER_SHA256}`);
  const her = bytes.toString('utf8');

  const amendments = [...her.matchAll(/target: library:([a-z0-9-]+)\n\s+replaced: (.+)\n\s+replacedSha256: ([0-9a-f]{64})\n\s+authored: (.+)/g)]
    .map((m) => ({ id: m[1], replaced: m[2].trim(), replacedSha256: m[3], authored: m[4].trim() }));
  if (amendments.length !== 2 || amendments[0].id !== 'vr03-same-topic' || amendments[1].id !== 'vr01-second-word-only') {
    throw new Error(`REFUSED — expected the desk's two amendments, found: ${amendments.map((a) => a.id).join(', ')}`);
  }

  const confirmations = [...her.matchAll(/confirmed: library:([a-z0-9-]+) \| (.+) \| ([0-9a-f]{16})/g)]
    .map((m) => ({ id: m[1], confirmed: m[2].trim(), hashPrefix: m[3] }));
  if (confirmations.length !== 7) throw new Error(`REFUSED — expected seven confirmations, found ${confirmations.length}`);

  const landingRows: Array<Record<string, unknown>> = [];

  for (const a of amendments) {
    if (sha256(a.replaced) !== a.replacedSha256) {
      throw new Error(`REFUSED — ${a.id}: her replaced string hashes to ${sha256(a.replaced)}, her file declares ${a.replacedSha256} — her own form's gate disagrees with her string`);
    }
    const gate = checkChildFacingText({ role: 'hint', label: a.id, text: a.authored }).filter(isBlocking);
    if (gate.length > 0) throw new Error(`REFUSED — ${a.id} authored wording fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id: a.id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
    const liveHash = sha256(db.childHint);
    if (db.childHint !== a.replaced || liveHash !== a.replacedSha256) {
      throw new Error(`REFUSED — ${a.id}: live row (${liveHash}) does not hold her replaced bytes (${a.replacedSha256})`);
    }
    const afterHash = sha256(a.authored);
    landingRows.push({ id: a.id, act: 'AMENDED', before: db.childHint, beforeSha256: liveHash, after: a.authored, afterSha256: afterHash, authority: AUTHORITY });
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: a.id },
        data: {
          childHint: a.authored,
          approvedBy: ANNIE,
          recordedBy: DAVID,
          approvalMethod: 'written review — her 125th return, the nine read against serving bytes',
          textProvenance: {
            state: 'RECORDED', text: 'childHint',
            authoredBy: { kind: 'person', name: 'Annie' },
            approvedBy: { kind: 'person', name: 'Annie' },
            method: 'her authored replacement; replaced string and her declared replacedSha256 both asserted against the live row before write',
            authority: AUTHORITY, date: '2026-08-24',
            previous: { childHint: db.childHint, sha256: liveHash, replacedAt: '2026-08-24', approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: a.id, action: 'AMENDED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
          method: `her 125th return (${HER_SHA256.slice(0, 16)})`,
          note: `before ${liveHash} -> after ${afterHash}`,
        },
      });
      console.log(`  AMENDED  ${a.id}`);
    } else console.log(`  WOULD AMEND ${a.id}: ${liveHash.slice(0, 12)} -> ${afterHash.slice(0, 12)}`);
  }

  for (const c of confirmations) {
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id: c.id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
    const liveHash = sha256(db.childHint);
    if (db.childHint !== c.confirmed) {
      throw new Error(`REFUSED — ${c.id}: her confirmed string is not the serving byte-for-byte.\n  live:      ${JSON.stringify(db.childHint)}\n  confirmed: ${JSON.stringify(c.confirmed)}`);
    }
    if (!liveHash.startsWith(c.hashPrefix)) {
      throw new Error(`REFUSED — ${c.id}: live hash ${liveHash} does not begin her declared ${c.hashPrefix}`);
    }
    landingRows.push({ id: c.id, act: 'RE-APPROVED-AGAINST-BYTES', wording: db.childHint, wordingSha256: liveHash, priorApprovedBy: db.approvedBy, authority: AUTHORITY });
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: c.id },
        data: {
          approvedBy: ANNIE,
          recordedBy: DAVID,
          approvalMethod: 'written review — her 125th return, re-approved against serving bytes at the row hash',
          textProvenance: {
            state: 'RECORDED', text: 'childHint',
            authoredBy: (db.textProvenance as Record<string, unknown> | null)?.authoredBy ?? { state: 'UNKNOWN' },
            approvedBy: { kind: 'person', name: 'Annie' },
            method: 'approved as written — string and hash prefix from her confirmation asserted against the live row before the stamp (her confirmation-form rule, R672)',
            servingSha256: liveHash,
            authority: AUTHORITY, date: '2026-08-24',
            previous: { approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: c.id, action: 'APPROVED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
          method: `her 125th return (${HER_SHA256.slice(0, 16)}); signed against ${liveHash.slice(0, 16)}`,
          note: `wording ${liveHash}; prior approvedBy was ${db.approvedBy ?? 'null'}`,
        },
      });
      console.log(`  APPROVED ${c.id} at ${c.hashPrefix}`);
    } else console.log(`  WOULD APPROVE ${c.id} (${liveHash.slice(0, 12)}; prior approvedBy ${db.approvedBy ?? 'null'})`);
  }

  console.log(`\n${landingRows.length} of 9 rows verified end-to-end.`);

  if (APPLY) {
    const artefact = {
      kind: 'annie-125-nine-landing',
      what: "Her 125th against the nine: two amendments landed (priors stamped, events recorded), seven approvals stamped after string-and-hash assertion against the live rows. Per-row before/after hashes throughout.",
      authority: AUTHORITY,
      classClosed: {
        declaration: 'TWENTY-FOUR OF TWENTY-FOUR VR SERVING HINT ROWS GOVERNED. The class that opened as "24 unapproved VR hint wordings serve children today" closes with every row carrying a signature that resolves to a person and a byte string.',
        partition: {
          theSeven: 'transported from her seventh-return amendments (seven-vr-hints-landing-1f4217a2be4b54ec.json) — ruled long ago, served 2026-08-24',
          theEight: 'her 122nd: 2 amended + 5 approved (annie-122-eight-landing-81f0f59116f331c7.json), plus vr07-value-slip ratified at the codepoint under her 123rd',
          theNine: 'her 125th, this artefact: 2 amended + 7 re-approved against serving bytes',
          sum: '7 + 8 + 9 = 24',
        },
        effectDateRule: "the second case closed the way its first did: on the day it opened (her 125th §2). A ruling's effect date is its serving date (R670).",
      },
      rows: landingRows,
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('annie-125-nine-landing', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'annie-125-nine-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
