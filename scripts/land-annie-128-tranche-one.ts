/**
 * MATHS TRANCHE ONE LANDS — her 128th (David, 2026-08-24 — R678).
 *
 * Five amendments through the standing path: replaced strings AND her declared hashes asserted
 * against the live rows before write, priors stamped, events on rev-0001. Seven approvals
 * stamped, string and hash prefix asserted per row (her confirmation-form rule, R672).
 *
 * PARSING NOTE (David's, so nothing burns a cycle): a confirmation line may carry segments AFTER
 * the hash — her maths-08 line carries the imagery-clause reason as a fourth segment. Segments
 * after the hash are ANNOTATION: parsed, carried onto the landing row, never refused and never
 * edited. A parser that refused would be reported, not worked around by editing her line.
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
const HER_FILE = '/Users/davidb/Downloads/annie-128-for-code.md';
const HER_SHA256 = '1cb71b4f158f57197b0ae8734846037b1a0a343597efdb3bf9e65c7b1b60a5ae';
const AUTHORITY = `annie-128-for-code.md, sha256 ${HER_SHA256}`;

const AMENDED_IDS = [
  'maths-01-zero-placeholder-missing', 'maths-05-shorter-decimals-are-larger',
  'maths-06-multiplying-by-10-adds-a-zero', 'maths-09-rounding-misdirection',
  'maths-10-rounding-exact-halves',
];

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  const bytes = readFileSync(HER_FILE);
  if (sha256(bytes) !== HER_SHA256) throw new Error(`REFUSED — her 128th reads ${sha256(bytes)}, declared ${HER_SHA256}`);
  const her = bytes.toString('utf8');

  const amendments = [...her.matchAll(/target: library:([a-z0-9-]+)\n\s+replaced: (.+)\n\s+replacedSha256: ([0-9a-f]{64})\n\s+authored: (.+)/g)]
    .map((m) => ({ id: m[1], replaced: m[2].trim(), replacedSha256: m[3], authored: m[4].trim() }));
  if (amendments.length !== 5 || JSON.stringify(amendments.map((a) => a.id)) !== JSON.stringify(AMENDED_IDS)) {
    throw new Error(`REFUSED — expected the five amendments [${AMENDED_IDS.join(', ')}], found [${amendments.map((a) => a.id).join(', ')}]`);
  }

  // Segments: id | string | 16-hex hash [| annotation…]. Everything after the hash is annotation.
  const confirmations = [...her.matchAll(/confirmed: library:([a-z0-9-]+) \| (.+?) \| ([0-9a-f]{16})(?: \| (.+))?$/gm)]
    .map((m) => ({ id: m[1], confirmed: m[2].trim(), hashPrefix: m[3], annotation: m[4]?.trim() ?? null }));
  if (confirmations.length !== 7) throw new Error(`REFUSED — expected seven confirmations, found ${confirmations.length}`);

  const landingRows: Array<Record<string, unknown>> = [];

  for (const a of amendments) {
    if (sha256(a.replaced) !== a.replacedSha256) {
      throw new Error(`REFUSED — ${a.id}: her replaced string hashes to ${sha256(a.replaced)}, her file declares ${a.replacedSha256}`);
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
          approvalMethod: 'written review — her 128th return, maths tranche one',
          textProvenance: {
            state: 'RECORDED', text: 'childHint',
            authoredBy: { kind: 'person', name: 'Annie' },
            approvedBy: { kind: 'person', name: 'Annie' },
            // THE APPROVER'S-REDRAFT DECLARATION (R257): several of her redrafts are SHORTER than
            // the approved text they replace, and the client-level trim guard rightly refuses a
            // shortening write unless the caller declares, on the write itself, that the new
            // string is the approver's own — her identity as this store records it, her document
            // and its digest. This is that declaration, not a widening of the gate.
            approvedByPerson: ANNIE,
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
          method: `her 128th return (${HER_SHA256.slice(0, 16)}); maths tranche one`,
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
    landingRows.push({ id: c.id, act: 'APPROVED-AGAINST-BYTES', wording: db.childHint, wordingSha256: liveHash, priorApprovedBy: db.approvedBy, annotation: c.annotation, authority: AUTHORITY });
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: c.id },
        data: {
          approvedBy: ANNIE,
          recordedBy: DAVID,
          approvalMethod: 'written review — her 128th return, approved against serving bytes at the row hash',
          textProvenance: {
            state: 'RECORDED', text: 'childHint',
            authoredBy: (db.textProvenance as Record<string, unknown> | null)?.authoredBy ?? { state: 'UNKNOWN' },
            approvedBy: { kind: 'person', name: 'Annie' },
            method: 'approved as written — string and hash prefix from her confirmation asserted against the live row before the stamp (R672)',
            servingSha256: liveHash,
            ...(c.annotation ? { annotation: c.annotation } : {}),
            authority: AUTHORITY, date: '2026-08-24',
            previous: { approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: c.id, action: 'APPROVED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
          method: `her 128th return (${HER_SHA256.slice(0, 16)}); signed against ${liveHash.slice(0, 16)}`,
          note: `wording ${liveHash}; prior approvedBy was ${db.approvedBy ?? 'null'}${c.annotation ? `; her annotation: ${c.annotation}` : ''}`,
        },
      });
      console.log(`  APPROVED ${c.id} at ${c.hashPrefix}${c.annotation ? ' (annotated)' : ''}`);
    } else console.log(`  WOULD APPROVE ${c.id} (${liveHash.slice(0, 12)}; prior approvedBy ${db.approvedBy ?? 'null'})${c.annotation ? ' — annotation carried' : ''}`);
  }

  console.log(`\n${landingRows.length} of 12 rows verified end-to-end.`);

  if (APPLY) {
    const artefact = {
      kind: 'annie-128-tranche-one-landing',
      what: 'Maths tranche one landed: five amendments (priors stamped, events recorded), seven approvals against serving bytes. Per-row before/after hashes throughout; her maths-08 imagery-clause annotation carried on its row.',
      authority: AUTHORITY,
      tranche: '1 of 10 over the 109 ACTIVE (her 127th: ten tranches, the last of one)',
      rows: landingRows,
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('annie-128-tranche-one-landing', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'annie-128-tranche-one-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
