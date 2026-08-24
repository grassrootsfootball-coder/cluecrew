/**
 * THE CLASS CLOSES IN ONE RUN (David, 2026-08-24 — R684): the 133rd, then the 134th's
 * thirty-seven, then the two merges, one artefact back.
 *
 * STRICT ORDER:
 *  1. The 133rd (sitting six, from the RESEND — the first crossing was lost, this store's record
 *     was right again). Its reference-shape rows CURE against the 134th's head declaration,
 *     QUOTED FROM HER ACTUAL TEXT at landing (R683: a cure quoted is not a cure held — here the
 *     text is held, extracted from the verified 134th's bytes). Byte source for its approvals:
 *     the 851cc51a file ITSELF, held here and verified whole before a single row is read.
 *  2. The 134th's ten amendments and twenty-seven approvals via the remainder map. Settled
 *     syntax: under the head declaration, per-line references reduce to bare `id <short-id>`;
 *     uniqueness asserted per line.
 *  3. The two merges under the map's rulings (David, on her routed directions), zero-carrier
 *     walks on both faces; maths-91's second act recorded UNENTERED on the retirement.
 *  4. The closure, DERIVED: expected 106 standing, 106 governed; the run REFUSES to declare
 *     closure on any other numbers. The 106-merge record is restated on the artefact's face,
 *     answering her 133rd §1 (retired-into, by-whose-ruling, when, fate of the text approval).
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

const F133 = '/Users/davidb/Downloads/annie-133-for-code-resend.md';
const SHA133 = '836e3eb3ae3b3fd95c67b069ed2559ed68c92072d25ef0f45f2f17624bd83c0b';
const AUTH133 = `annie-133-for-code-resend.md, sha256 ${SHA133}`;
const F134 = '/Users/davidb/Downloads/annie-134-for-code.md';
const SHA134 = 'de974b5a1349b5ff95d9a7de1b36298298db1c78924e5afdf26324bcbe299278';
const AUTH134 = `annie-134-for-code.md, sha256 ${SHA134}`;
const FMAP = '/Users/davidb/Downloads/remainder-expansion-for-code.json';
const SHAMAP = 'b2fdf5642fd94021ae171f7fe8b30bc7edfa96e38bcb04848bb28512b9de14f0';
const FREF = '/Users/davidb/Downloads/maths-tranches-three-to-ten-for-annie.json';
const SHAREF = '851cc51ae835885f369500d8ac2f1b3a4768c618a420a9ed9a47008e6bccb051';

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const readVerified = (path: string, expected: string) => {
  const bytes = readFileSync(path);
  if (sha256(bytes) !== expected) throw new Error(`REFUSED — ${path} reads ${sha256(bytes)}, declared ${expected}`);
  return bytes.toString('utf8');
};

const landingRows: Array<Record<string, unknown>> = [];

async function landAmend(id: string, replaced: string, replacedSha256: string, authored: string, authoredSha256: string, authority: string, method: string, cure?: string) {
  const gate = checkChildFacingText({ role: 'hint', label: id, text: authored }).filter(isBlocking);
  if (gate.length > 0) throw new Error(`REFUSED — ${id} fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
  if (sha256(replaced) !== replacedSha256 || sha256(authored) !== authoredSha256) throw new Error(`REFUSED — ${id}: declared hashes do not match the strings`);
  const db = await prisma.misconception.findUniqueOrThrow({ where: { id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
  const liveHash = sha256(db.childHint);
  if (db.childHint !== replaced || liveHash !== replacedSha256) throw new Error(`REFUSED — ${id}: live row (${liveHash}) does not hold the replaced bytes (${replacedSha256})`);
  landingRows.push({ id, act: 'AMENDED', before: db.childHint, beforeSha256: liveHash, after: authored, afterSha256: authoredSha256, authority });
  if (!APPLY) { console.log(`  WOULD AMEND ${id}`); return; }
  await prisma.misconception.update({
    where: { id },
    data: {
      childHint: authored, approvedBy: ANNIE, recordedBy: DAVID, approvalMethod: method,
      textProvenance: {
        state: 'RECORDED', text: 'childHint',
        authoredBy: { kind: 'person', name: 'Annie' },
        approvedBy: { kind: 'person', name: 'Annie' },
        approvedByPerson: ANNIE,
        method: 'her authored replacement; strings and hashes asserted three ways before write',
        ...(cure ? { fenceCure: cure } : {}),
        authority, date: '2026-08-24',
        previous: { childHint: db.childHint, sha256: liveHash, replacedAt: '2026-08-24', approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
      },
    },
  });
  await prisma.attributionEvent.create({
    data: {
      recordType: 'misconception', recordId: id, action: 'AMENDED',
      reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
      method, note: `before ${liveHash} -> after ${authoredSha256}`,
    },
  });
  console.log(`  AMENDED  ${id}`);
}

async function landApprove(id: string, wording: string, wordingSha256: string, annotation: string | null, authority: string, method: string, cure?: string) {
  if (sha256(wording) !== wordingSha256) throw new Error(`REFUSED — ${id}: declared hash does not match the wording`);
  const db = await prisma.misconception.findUniqueOrThrow({ where: { id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
  const liveHash = sha256(db.childHint);
  if (db.childHint !== wording || liveHash !== wordingSha256) throw new Error(`REFUSED — ${id}: live row (${liveHash}) does not hold the declared bytes (${wordingSha256})`);
  landingRows.push({ id, act: 'APPROVED-BY-REFERENCE', wording: db.childHint, wordingSha256: liveHash, priorApprovedBy: db.approvedBy, annotation, authority });
  if (!APPLY) { console.log(`  WOULD APPROVE ${id}${annotation ? ' — annotated' : ''}`); return; }
  await prisma.misconception.update({
    where: { id },
    data: {
      approvedBy: ANNIE, recordedBy: DAVID, approvalMethod: method,
      textProvenance: {
        state: 'RECORDED', text: 'childHint',
        authoredBy: (db.textProvenance as Record<string, unknown> | null)?.authoredBy ?? { state: 'UNKNOWN' },
        approvedBy: { kind: 'person', name: 'Annie' },
        method: 'approved by reference (R681 fence): bytes from the verified artefact asserted against the live row here',
        servingSha256: liveHash,
        ...(annotation ? { annotation } : {}),
        ...(cure ? { fenceCure: cure } : {}),
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
  const her133 = readVerified(F133, SHA133);
  const her134 = readVerified(F134, SHA134);
  const map = JSON.parse(readVerified(FMAP, SHAMAP)) as {
    amendments: Array<{ id: string; replaced: string; replacedSha256: string; authored: string; authoredSha256: string }>;
    approvals: Array<{ id: string; wording: string; wordingSha256: string; annotation: string | null }>;
    mergeRulings: { authority: string; two: { retire: string; into: string[]; reason: string }; three: { retire: string; into: string; reason: string } };
  };
  const ref = JSON.parse(readVerified(FREF, SHAREF)) as { tranches: Array<{ rows: Array<{ id: string; wordingVerbatim: string; wordingSha256: string }> }> };
  const refRows = new Map(ref.tranches.flatMap((t) => t.rows).map((r) => [r.id, r]));

  // The cure, quoted from her actual text (extracted from the verified 134th, never composed).
  const cureMatch = /\*\*All references herein are against the file at\n`851cc51a[^`]+`, verified whole at first\nreceipt\.\*\* That sentence also cures the 132nd and 133rd retroactively, per David's ruling\./.exec(her134);
  if (!cureMatch) throw new Error("REFUSED — the 134th's head declaration is not where expected; the cure cannot be quoted");
  const CURE = cureMatch[0].replace(/\*\*/g, '').replace(/\n/g, ' ');

  // ---- Phase 1: the 133rd (sitting six) ----
  console.log('— PHASE 1: the 133rd (sitting six), cured by the head declaration —');
  const amend133 = [...her133.matchAll(/target: library:([a-z0-9-]+)\n\s+replaced: (.+)\n\s+replacedSha256: reference: 851cc51ae835885f id ([a-z0-9-]+)\n\s+authored: (.+)/g)]
    .map((m) => ({ id: m[1], replaced: m[2].trim(), short: m[3], authored: m[4].trim() }));
  if (amend133.length !== 4) throw new Error(`REFUSED — expected four 133rd amendments, found ${amend133.length}`);
  const conf133 = [...her133.matchAll(/confirmed: library:([a-z0-9-]+) \| approved as written(?:; ([^|]+?))? \| reference: 851cc51ae835885f id ([a-z0-9-]+)/g)]
    .map((m) => ({ id: m[1], annotation: m[2]?.trim() ?? null, short: m[3] }));
  if (conf133.length !== 8) throw new Error(`REFUSED — expected eight 133rd confirmations, found ${conf133.length}`);
  for (const a of amend133) {
    if (!a.id.startsWith(a.short)) throw new Error(`REFUSED — ${a.id}: reference short id ${a.short} does not resolve`);
    const row = refRows.get(a.id);
    if (!row) throw new Error(`REFUSED — ${a.id} not in the verified file`);
    if (row.wordingVerbatim !== a.replaced) throw new Error(`REFUSED — ${a.id}: her replaced string and the verified file's bytes disagree`);
    await landAmend(a.id, a.replaced, row.wordingSha256, a.authored, sha256(a.authored), AUTH133,
      'written review — her 133rd return (resend), maths sitting six; fence cured by the 134th head declaration', CURE);
  }
  for (const c of conf133) {
    if (!c.id.startsWith(c.short)) throw new Error(`REFUSED — ${c.id}: reference short id does not resolve`);
    const row = refRows.get(c.id);
    if (!row) throw new Error(`REFUSED — ${c.id} not in the verified file`);
    await landApprove(c.id, row.wordingVerbatim, row.wordingSha256, c.annotation, AUTH133,
      'written review — her 133rd return (resend), approved by reference; fence cured by the 134th head declaration', CURE);
  }

  // ---- Phase 2: the 134th's thirty-seven via the map ----
  console.log('— PHASE 2: the 134th (sittings seven to ten) via the remainder map —');
  if (map.amendments.length !== 10 || map.approvals.length !== 27) throw new Error('REFUSED — map shape is not 10 + 27');
  const amend134 = [...her134.matchAll(/target: library:([a-z0-9-]+)\n\s+replaced: (.+)\n\s+replacedSha256: reference: 851cc51ae835885f id ([a-z0-9-]+)\n\s+authored: (.+)/g)]
    .map((m) => ({ id: m[1], replaced: m[2].trim(), authored: m[4].trim() }));
  if (amend134.length !== 10) throw new Error(`REFUSED — expected ten 134th amendment blocks, found ${amend134.length}`);
  const conf134 = [...her134.matchAll(/confirmed: library:([a-z0-9-]+) \| ((?:approved as written|text approved)[^|]*?) \| id ([a-z0-9-]+)$/gm)]
    .map((m) => {
      const seg = m[2].trim();
      const semi = seg.indexOf(';');
      return { id: m[1], annotation: semi === -1 ? null : seg.slice(semi + 1).trim(), short: m[3] };
    });
  if (conf134.length !== 27) throw new Error(`REFUSED — expected twenty-seven 134th confirmations, found ${conf134.length}`);
  for (const a of map.amendments) {
    const hers = amend134.find((x) => x.id === a.id);
    if (!hers) throw new Error(`REFUSED — map amendment ${a.id} has no block in her 134th`);
    if (hers.replaced !== a.replaced || hers.authored !== a.authored) throw new Error(`REFUSED — ${a.id}: her strings and the map's bytes disagree`);
    await landAmend(a.id, a.replaced, a.replacedSha256, a.authored, a.authoredSha256, AUTH134,
      'written review — her 134th return, sittings seven to ten under the head declaration');
  }
  for (const a of map.approvals) {
    const hers = conf134.find((x) => x.id === a.id);
    if (!hers) throw new Error(`REFUSED — map approval ${a.id} has no confirmation in her 134th`);
    if (!hers.id.startsWith(hers.short)) throw new Error(`REFUSED — ${a.id}: bare id ${hers.short} does not resolve`);
    // The map's annotation field carries the FULL verdict segment; her line's annotation is the
    // post-semicolon clause. Normalise both to the clause before comparing (normalise where you
    // COMPARE, never where you read — R568/R570).
    const clause = (s: string | null) => s === null ? null : s.replace(/^(approved as written|text approved);\s*/, '').trim() || null;
    if (clause(a.annotation ?? null) !== clause(hers.annotation)) throw new Error(`REFUSED — ${a.id}: her annotation ${JSON.stringify(hers.annotation)} and the map's ${JSON.stringify(a.annotation)} disagree`);
    await landApprove(a.id, a.wording, a.wordingSha256, a.annotation, AUTH134,
      'written review — her 134th return, approved by reference under the head declaration');
  }

  // ---- Phase 3: the two merges ----
  console.log('— PHASE 3: the two merges (David, on her routed directions) —');
  const mergePairs: Array<{ retire: string; into: string[]; reason: string; extra?: Record<string, unknown> }> = [
    { retire: map.mergeRulings.two.retire, into: map.mergeRulings.two.into, reason: map.mergeRulings.two.reason },
    { retire: map.mergeRulings.three.retire, into: [map.mergeRulings.three.into], reason: map.mergeRulings.three.reason,
      extra: { secondAct: 'UNENTERED — the read slip beyond reversal earns its own entry only when a carrier exists' } },
  ];
  for (const m of mergePairs) {
    const walkIds = [m.retire, ...m.into];
    const carriers = await prisma.itemOption.count({ where: { misconceptionId: { in: walkIds } } });
    if (carriers !== 0) throw new Error(`REFUSED — zero-carrier premise fails for ${m.retire}: ${carriers} option(s) reference the set`);
    for (const s of m.into) {
      const surv = await prisma.misconception.findUniqueOrThrow({ where: { id: s }, select: { status: true, approvedBy: true } });
      if (surv.status !== 'ACTIVE' || surv.approvedBy !== ANNIE) throw new Error(`REFUSED — survivor ${s} is not ACTIVE and governed`);
    }
    const retiree = await prisma.misconception.findUniqueOrThrow({ where: { id: m.retire }, select: { childHint: true, status: true, textProvenance: true } });
    landingRows.push({
      id: m.retire, act: 'RETIRED-INTO-MERGE', mergedInto: m.into, reason: m.reason, ...(m.extra ?? {}),
      retiredWording: retiree.childHint, retiredWordingSha256: sha256(retiree.childHint),
      zeroCarrierWalk: `options referencing {${walkIds.join(', ')}}: 0 — walked live at landing`,
      textApproval: 'stands on the retired row (her text verdict is separate from the entry verdict)',
      authority: map.mergeRulings.authority,
    });
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: m.retire },
        data: {
          status: 'RETIRED',
          textProvenance: {
            ...(retiree.textProvenance as Record<string, unknown> ?? { state: 'RECORDED' }),
            mergedInto: m.into.length === 1 ? m.into[0] : m.into,
            mergeAuthority: `${map.mergeRulings.authority}; her 134th routed directions (${SHA134.slice(0, 16)})`,
            mergeDate: '2026-08-24', mergeReason: m.reason, ...(m.extra ?? {}),
          },
        },
      });
      await prisma.attributionEvent.create({
        data: {
          recordType: 'misconception', recordId: m.retire, action: 'AMENDED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'status',
          method: `doubling merge, her 134th routed direction under David's ruling (${SHA134.slice(0, 16)})`,
          note: `RETIRED into ${m.into.join(' + ')} at zero carriers; text approval stands on the row${m.extra ? '; second act UNENTERED' : ''}`,
        },
      });
      console.log(`  RETIRED  ${m.retire} into ${m.into.join(' + ')}`);
    } else console.log(`  WOULD RETIRE ${m.retire} into ${m.into.join(' + ')} (carriers walked: 0)`);
  }

  // ---- Phase 4: the closure, derived ----
  const standing = await prisma.misconception.count({ where: { district: 'MATHS', status: 'ACTIVE' } });
  const governed = await prisma.misconception.count({ where: { district: 'MATHS', status: 'ACTIVE', approvedBy: ANNIE } });
  const retired = await prisma.misconception.count({ where: { district: 'MATHS', status: 'RETIRED' } });
  console.log(`\nderived: ${standing} standing, ${governed} governed, ${retired} retired`);
  if (APPLY && (standing !== 106 || governed !== 106)) {
    throw new Error(`REFUSED — closure declared at 106/106 but derivation reads ${standing}/${governed}; the artefact will not carry a composed figure`);
  }

  if (APPLY) {
    const artefact = {
      kind: 'maths-class-closure-landing',
      what: 'The 133rd and 134th landed in one run with the two merges; the maths class closes. Every figure below is derived from the live rows after the run, never composed.',
      authorities: { the133rd: AUTH133, the134th: AUTH134, remainderMap: `remainder-expansion-for-code.json, sha256 ${SHAMAP} — bytes, never verdicts`, referencedFile: `maths-tranches-three-to-ten-for-annie.json, sha256 ${SHAREF}, held and verified here` },
      headDeclarationCure: { quotedFromHerText: CURE, applies: 'the 132nd and 133rd retroactively, per David\'s ruling (R683)' },
      classClosure: {
        standing, governed, retired,
        declaration: `${standing} STANDING, ${governed} GOVERNED — every ACTIVE maths row carries approvedBy reviewer:rev-0001 and RECORDED provenance; the class that began with ninety-five unresolvable approvals and fourteen nulls ends with none of either.`,
        partition: {
          sittings: 'ten sittings: 12 (128th) + 12 (129th) + 12 (130th) + 12 (131st) + 12 (132nd) + 12 (133rd) + 12+12+12+1 (134th, sittings seven to ten) = 109 rows ruled',
          merges: 'three doublings retired at zero carriers: maths-106 into maths-09 (129th finding, David\'s ruling); maths-87 into the 38/39 pair; maths-91 into maths-46 (134th routed directions, David\'s ruling). 109 − 3 = 106.',
          effectDate: 'per R670, every wording\'s effect date is its serving date: 2026-08-24 for the entire class.',
        },
      },
      the106MergeRecord: {
        answeringHer133rd: 'retired-into: maths-09-rounding-misdirection; by-whose-ruling: David, on her 129th doubling finding and proposed direction; when: 2026-08-24 (the 129-130 landing, sha256 7a261cb9f794ed84d0743a38140278cc95bf33a07ef9f1b92976a7afd6ce6edc); fate of the text approval: it STANDS on the retired row — her text verdict was recorded separately from the entry verdict, in the row\'s provenance and its event.',
      },
      rows: landingRows,
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('maths-class-closure-landing', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'maths-class-closure-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
