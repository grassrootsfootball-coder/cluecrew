/**
 * HER 122ND AGAINST THE EIGHT (David, 2026-08-24 — R671).
 *
 * **DISCHARGED — DO NOT RE-RUN.** The one hold this script maintained (vr07-value-slip, the
 * apostrophe codepoint) closed with her 123rd: the approval attaches to the serving bytes at the
 * row's hash (`scripts/close-vr07-value-slip-hold.ts`, R672). The refuse-if-premise-changes guard
 * below did its job — it held the row unstamped and unharmonised until her ratification — and is
 * retired with the hold. A re-run now would re-assert a closed hold and re-write landed rows.
 *
 * Two amendments land through the standing path (same shape as the seven's transport): her
 * authored strings read from HER FILE's AMENDMENTS block, the replaced strings asserted against
 * the LIVE rows before write, priors stamped, events recorded. Five approvals stamp after each
 * confirmed string is re-asserted byte-identical to serving. One row HOLDS: vr07-value-slip's
 * confirmation differs from the serving row by one codepoint (straight against curly apostrophe)
 * — not stamped, not harmonised; her ratification line closes it.
 *
 * THE APPROVER VALUE IS THIS STORE'S: `reviewer:rev-0001`, with her name, return and digest in
 * textProvenance (the eleven-amended precedent — a sixth string shape for one person is R256's
 * fault). Approval-as-written is NOT authorship: authoredBy stays as held (mostly UNKNOWN);
 * only the approval is recorded as hers (R98's distinction).
 *
 * Touches nothing on the nine — with Annie for re-approval on reading.
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
const HER_FILE = '/Users/davidb/Downloads/annie-122-for-code.md';
const HER_SHA256 = '87385d222d63c03918d426ee9b1df753103ad5933441bea18c6b7f14ba4f6696';
const AUTHORITY = `annie-122-for-code.md, sha256 ${HER_SHA256}`;

const THE_NINE = [
  'vr03-same-topic', 'vr03-reversed-relation', 'vr-letter-series-step-repeat', 'vr06-ignores-sentence',
  'vr15-clue-flip', 'vr04-associated-not-same', 'vr01-second-word-only', 'vr01-completes-neither',
  'vr-series-step-applied-twice',
];

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

function main() {
  const bytes = readFileSync(HER_FILE);
  const got = sha256(bytes);
  if (got !== HER_SHA256) throw new Error(`REFUSED — her 122nd reads ${got}, declared ${HER_SHA256}`);
  return bytes.toString('utf8');
}

async function run() {
  const her = main();

  // AMENDMENTS: target / replaced / authored triplets, read from the block's own lines.
  const amendments = [...her.matchAll(/target: library:([a-z0-9-]+)\n\s+replaced: (.+)\n\s+authored: (.+)/g)]
    .map((m) => ({ id: m[1]!, replaced: m[2]!.trim(), authored: m[3]!.trim() }));
  if (amendments.length !== 2 || amendments[0]!.id !== 'vr07-operation-slip' || amendments[1]!.id !== 'vr07-term-dropped') {
    throw new Error(`REFUSED — expected the two vr07 amendments, found: ${amendments.map((a) => a.id).join(', ')}`);
  }

  // CONFIRMATIONS: six confirmed strings.
  const confirmations = [...her.matchAll(/confirmed: library:([a-z0-9-]+) \| (.+)/g)]
    .map((m) => ({ id: m[1]!, confirmed: m[2]!.trim() }));
  if (confirmations.length !== 6) throw new Error(`REFUSED — expected six confirmations, found ${confirmations.length}`);
  const HELD_ID = 'vr07-value-slip';
  const toStamp = confirmations.filter((c) => c.id !== HELD_ID);
  if (toStamp.length !== 5) throw new Error('REFUSED — the five-to-stamp membership is wrong');

  for (const { id } of [...amendments, ...confirmations]) {
    if (THE_NINE.includes(id)) throw new Error(`REFUSED — ${id} is on the nine`);
  }

  const landingRows: Array<Record<string, unknown>> = [];

  // ---- The two amendments ----
  for (const a of amendments) {
    const gate = checkChildFacingText({ role: 'hint', label: a.id, text: a.authored }).filter(isBlocking);
    if (gate.length > 0) throw new Error(`REFUSED — ${a.id} authored wording fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id: a.id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
    if (db.childHint !== a.replaced) {
      throw new Error(`REFUSED — ${a.id}: live row does not hold her replaced string.\n  live:     ${JSON.stringify(db.childHint)}\n  replaced: ${JSON.stringify(a.replaced)}`);
    }
    const beforeHash = sha256(db.childHint);
    const afterHash = sha256(a.authored);
    landingRows.push({ id: a.id, act: 'AMENDED', before: db.childHint, beforeSha256: beforeHash, after: a.authored, afterSha256: afterHash, authority: AUTHORITY });
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: a.id },
        data: {
          childHint: a.authored,
          approvedBy: ANNIE,
          recordedBy: DAVID,
          approvalMethod: 'written review — her 122nd return, the vr-drain batch',
          textProvenance: {
            state: 'RECORDED',
            text: 'childHint',
            authoredBy: { kind: 'person', name: 'Annie' },
            approvedBy: { kind: 'person', name: 'Annie' },
            method: 'her authored replacement, read verbatim from her return; replaced string asserted against the live row before write',
            authority: AUTHORITY,
            date: '2026-08-24',
            previous: { childHint: db.childHint, sha256: beforeHash, replacedAt: '2026-08-24', approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: a.id, action: 'AMENDED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
          method: `her 122nd return (${HER_SHA256.slice(0, 16)}); rough-paper rule — the act must survive every channel`,
          note: `before ${beforeHash} -> after ${afterHash}`,
        },
      });
      console.log(`  AMENDED  ${a.id}`);
    } else console.log(`  WOULD AMEND ${a.id}: ${beforeHash.slice(0, 12)} -> ${afterHash.slice(0, 12)}`);
  }

  // ---- The five approvals ----
  for (const c of toStamp) {
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id: c.id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
    if (db.childHint !== c.confirmed) {
      throw new Error(`REFUSED — ${c.id}: her confirmed string is not the serving byte-for-byte.\n  live:      ${JSON.stringify(db.childHint)}\n  confirmed: ${JSON.stringify(c.confirmed)}`);
    }
    const hash = sha256(db.childHint);
    landingRows.push({ id: c.id, act: 'APPROVED-AS-WRITTEN', wording: db.childHint, wordingSha256: hash, priorApprovedBy: db.approvedBy, authority: AUTHORITY });
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: c.id },
        data: {
          approvedBy: ANNIE,
          recordedBy: DAVID,
          approvalMethod: 'written review — her 122nd return, the vr-drain batch',
          textProvenance: {
            state: 'RECORDED',
            text: 'childHint',
            // Approved AS WRITTEN: the words are not hers, and the record must not say they are (R98).
            authoredBy: (db.textProvenance as Record<string, unknown> | null)?.authoredBy ?? { state: 'UNKNOWN' },
            approvedBy: { kind: 'person', name: 'Annie' },
            method: 'approved as written — byte-matched at the desk, re-asserted against the live row at landing',
            authority: AUTHORITY,
            date: '2026-08-24',
            previous: { approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: c.id, action: 'APPROVED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
          method: `her 122nd return (${HER_SHA256.slice(0, 16)}); approved as written`,
          note: `wording ${hash}; prior approvedBy was ${db.approvedBy ?? 'null'}`,
        },
      });
      console.log(`  APPROVED ${c.id}`);
    } else console.log(`  WOULD APPROVE ${c.id} (${hash.slice(0, 12)}; prior approvedBy ${db.approvedBy ?? 'null'})`);
  }

  // ---- The hold ----
  const heldConfirmation = confirmations.find((c) => c.id === HELD_ID)!;
  const held = await prisma.misconception.findUniqueOrThrow({ where: { id: HELD_ID }, select: { childHint: true, approvedBy: true } });
  if (held.childHint === heldConfirmation.confirmed) {
    throw new Error('REFUSED — vr07-value-slip now byte-matches her confirmation; the hold premise has changed, re-read before acting');
  }
  landingRows.push({
    id: HELD_ID, act: 'HELD — NOT STAMPED, NOT HARMONISED',
    serving: held.childHint, servingSha256: sha256(held.childHint),
    herConfirmation: heldConfirmation.confirmed, confirmationSha256: sha256(heldConfirmation.confirmed),
    difference: "one codepoint: the serving row's apostrophe in letter’s is U+2019 (curly); her confirmation carries U+0027 (straight)",
    closes: 'her ratification line',
  });
  console.log(`  HELD     ${HELD_ID} — one codepoint apart (U+2019 vs U+0027); awaiting her ratification line`);

  console.log(`\n${landingRows.length} rows in the landing record (2 amended, 5 approved, 1 held). The nine untouched.`);

  if (APPLY) {
    const artefact = {
      kind: 'annie-122-eight-landing',
      what: "Her 122nd against the eight: two amendments landed (priors stamped, events recorded), five approvals stamped after byte re-assertion, one held on a one-codepoint apostrophe difference awaiting her ratification line. The nine untouched, with Annie for re-approval on reading.",
      authority: AUTHORITY,
      roughPaperRule: 'a hint may instruct the child’s own working on her own paper and may not instruct marking the stimulus; act availability beside object availability (her 122nd, ruled before the verdicts that use it)',
      untouched: { theNine: THE_NINE },
      rows: landingRows,
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('annie-122-eight-landing', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'annie-122-eight-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
