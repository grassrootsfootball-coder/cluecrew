/**
 * THE HOLD CLOSES (Annie's 123rd, David's instruction, 2026-08-24 — R672).
 *
 * Her ratification: the approval of `vr07-value-slip` attaches to the SERVING BYTES at the row's
 * declared hash — curly apostrophe and all. *"A signature is bytes, and nobody tidies bytes under
 * somebody else's name."* The stamp lands only after the live row's hash is asserted against the
 * hash she ratified — her own confirmation-form rule, applied first on the row that minted it.
 *
 * Also verified here, since her 123rd attaches them retroactively: the other seven rows' hashes
 * from her CONFIRMATIONS block — the five approvals (and value-slip) against the LIVE rows, the
 * two amendments against the PRE-amendment bytes recorded in yesterday's landing rows.
 *
 * The 122 lander's refuse-if-premise-changes guard did its job and RETIRES with the hold — that
 * script's header now says DISCHARGED.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';

const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const ANNIE = 'reviewer:rev-0001';
const HER_FILE = '/Users/davidb/Downloads/annie-123-for-code.md';
const HER_SHA256 = '9cc4e6a570b696a82ec94f18e43c3f4700dc36ae61ad65456fb1f97afa16f4f9';
const AUTHORITY = `annie-123-for-code.md, sha256 ${HER_SHA256}`;

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

// The two amendments attach beside the PRE-amendment serving hashes (the bytes she read in the
// batch); every other row's hash is the LIVE serving hash.
const PRE_AMENDMENT = new Set(['vr07-operation-slip', 'vr07-term-dropped']);
const BEFORE_HASHES: Record<string, string> = {
  // From the 122 landing artefact's before hashes.
  'vr07-operation-slip': 'c8a9a4f09842bc90',
  'vr07-term-dropped': 'f835377e54a7676a',
};

async function run() {
  const bytes = readFileSync(HER_FILE);
  if (sha256(bytes) !== HER_SHA256) throw new Error(`REFUSED — her 123rd reads ${sha256(bytes)}, declared ${HER_SHA256}`);
  const her = bytes.toString('utf8');

  const confirmations = [...her.matchAll(/confirmed: library:([a-z0-9-]+) \| (.+)/g)]
    .map((m) => ({ id: m[1], line: m[2].trim(), hashPrefix: /\b([0-9a-f]{16})\b/.exec(m[2])?.[1] }));
  if (confirmations.length !== 8) throw new Error(`REFUSED — expected eight confirmation lines, found ${confirmations.length}`);

  for (const c of confirmations) {
    if (!c.hashPrefix) throw new Error(`REFUSED — ${c.id}'s confirmation carries no hash; the hash is for the gate`);
    if (PRE_AMENDMENT.has(c.id)) {
      if (BEFORE_HASHES[c.id] !== c.hashPrefix) {
        throw new Error(`REFUSED — ${c.id}: her hash ${c.hashPrefix} disagrees with the landing record's before-hash ${BEFORE_HASHES[c.id]}`);
      }
      console.log(`  ATTACHED ${c.id} — her hash names the pre-amendment bytes, matching the landing record`);
      continue;
    }
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id: c.id }, select: { childHint: true } });
    const live = sha256(db.childHint);
    if (!live.startsWith(c.hashPrefix)) {
      throw new Error(`REFUSED — ${c.id}: live serving hash ${live} does not begin ${c.hashPrefix}; her attachment and the row disagree`);
    }
    console.log(`  ATTACHED ${c.id} — live serving bytes hash to her declared ${c.hashPrefix}`);
  }

  // The stamp itself.
  const ratification = confirmations.find((c) => c.id === 'vr07-value-slip')!;
  const row = await prisma.misconception.findUniqueOrThrow({
    where: { id: 'vr07-value-slip' },
    select: { childHint: true, approvedBy: true, textProvenance: true },
  });
  const liveHash = sha256(row.childHint);
  if (!liveHash.startsWith('523d8b502f53e243')) throw new Error(`REFUSED — vr07-value-slip live hash ${liveHash} is not the ratified 523d8b502f53e243…`);
  if (row.approvedBy !== null) throw new Error(`REFUSED — vr07-value-slip already carries approvedBy ${row.approvedBy}; the hold premise has changed`);

  if (APPLY) {
    await prisma.misconception.update({
      where: { id: 'vr07-value-slip' },
      data: {
        approvedBy: ANNIE,
        recordedBy: DAVID,
        approvalMethod: 'written review — her 123rd return, ratified against serving bytes at the row hash',
        textProvenance: {
          state: 'RECORDED',
          text: 'childHint',
          authoredBy: { state: 'UNKNOWN' },
          approvedBy: { kind: 'person', name: 'Annie' },
          method: 'ratified at the codepoint: her confirmation string had re-typeset the apostrophe; her ruling attaches the approval to the serving bytes',
          ratificationLine: `confirmed: library:vr07-value-slip | ${ratification.line}`,
          servingSha256: liveHash,
          authority: AUTHORITY,
          date: '2026-08-24',
          previous: { approvedBy: null, provenance: row.textProvenance ?? { state: 'UNKNOWN' } },
        },
      },
    });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'misconception', recordId: 'vr07-value-slip', action: 'APPROVED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
        method: `her 123rd return (${HER_SHA256.slice(0, 16)}); ratified against serving bytes at ${liveHash.slice(0, 16)}`,
        note: 'the hold closed at the codepoint: the approval attaches to the row\'s bytes (U+2019), not her keyboard\'s (U+0027); a signature is bytes',
      },
    });
    console.log('\n  STAMPED  vr07-value-slip — the hold is closed; the 122 guard retires discharged');
  } else {
    console.log(`\n  WOULD STAMP vr07-value-slip at ${liveHash.slice(0, 16)}…`);
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
