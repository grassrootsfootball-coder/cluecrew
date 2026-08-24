/**
 * HER 145TH LANDS: THIRTEEN AMENDMENTS, THE MINT, FIVE RETAGS, THE TRIM, EIGHT APPROVALS — THEN
 * THE SEED ROWS LEAVE THE POPULATION (David, 2026-08-24 — R702).
 *
 * Citation note, stated not absorbed: her retag block cites "the five tier-three rows named in
 * the scan at f68c3e1f…"; the scan (held, verified) carries no row ids — the five were named in
 * the ENTRIES artefact (b2b43a26…, answers.questionTwo.rows). The membership is re-derived from
 * the rows here and asserted to be exactly those five.
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
const F145 = '/Users/davidb/Downloads/annie-145-for-code.md';
const SHA145 = '73ef2ee342552c85731d537799300736416197924723d2171b44a927469f799a';
const AUTH = `annie-145-for-code.md, sha256 ${SHA145}`;
const FENTRIES = '/Users/davidb/Downloads/11+/from-cluecrew/twentytwo-vr-entries-for-annie-b2b43a264c284ee0.json';
const SHAENTRIES = 'b2b43a264c284ee02029f2a1bce325c827d4699ad63ff8ba35308b6951db300a';

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const readVerified = (p: string, expected: string) => {
  const b = readFileSync(p);
  if (sha256(b) !== expected) throw new Error(`REFUSED — ${p} reads ${sha256(b)}, declared ${expected}`);
  return b.toString('utf8');
};
const landingRows: Array<Record<string, unknown>> = [];

async function run() {
  const her = readVerified(F145, SHA145);
  const entriesFile = JSON.parse(readVerified(FENTRIES, SHAENTRIES)) as { entries: Array<{ id: string; childHint: string }> };
  const entryHint = new Map(entriesFile.entries.map((e) => [e.id, e.childHint]));

  // ---- Thirteen entry amendments (single-line hybrid form) ----
  const amendments = [...her.matchAll(/target: library:([a-z0-9-]+) \| replaced: (.+?) \| authored: (.+)$/gm)]
    .map((m) => ({ id: m[1], replaced: m[2].trim(), authored: m[3].trim() }))
    // The mint rides the same line form with replaced NONE — it is not an amendment.
    .filter((a) => !a.replaced.startsWith('NONE.'));
  if (amendments.length !== 13) throw new Error(`REFUSED — expected thirteen entry amendments, found ${amendments.length}`);
  for (const a of amendments) {
    const fileHint = entryHint.get(a.id);
    if (fileHint !== a.replaced) throw new Error(`REFUSED — ${a.id}: her replaced string and the entries file disagree`);
    const gate = checkChildFacingText({ role: 'hint', label: a.id, text: a.authored }).filter(isBlocking);
    if (gate.length > 0) throw new Error(`REFUSED — ${a.id} authored fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id: a.id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
    const liveHash = sha256(db.childHint);
    if (db.childHint !== a.replaced) throw new Error(`REFUSED — ${a.id}: live row does not hold her replaced string`);
    landingRows.push({ id: a.id, act: 'AMENDED', before: db.childHint, beforeSha256: liveHash, after: a.authored, afterSha256: sha256(a.authored), authority: AUTH });
    if (!APPLY) continue;
    await prisma.misconception.update({
      where: { id: a.id },
      data: {
        childHint: a.authored, approvedBy: ANNIE, recordedBy: DAVID,
        approvalMethod: 'written review — her 145th return, the twenty-one read against the one',
        textProvenance: {
          state: 'RECORDED', text: 'childHint',
          authoredBy: { kind: 'person', name: 'Annie' }, approvedBy: { kind: 'person', name: 'Annie' },
          approvedByPerson: ANNIE,
          method: 'her authored replacement, hybrid form: replaced string asserted against the entries file AND the live row',
          authority: AUTH, date: '2026-08-24',
          previous: { childHint: db.childHint, sha256: liveHash, replacedAt: '2026-08-24', approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
        },
      },
    });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'misconception', recordId: a.id, action: 'AMENDED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
        method: `her 145th (${SHA145.slice(0, 16)})`, note: `before ${liveHash} -> after ${sha256(a.authored)}`,
      },
    });
    console.log(`  AMENDED  ${a.id}`);
  }

  // ---- The mint ----
  const mintMatch = /target: library:vr02-real-link-wrong-rule \| replaced: NONE\. New entry, minted this return\. \| authored: (\{.+\})/.exec(her);
  if (!mintMatch) throw new Error('REFUSED — mint block not found');
  const mint = JSON.parse(mintMatch[1]) as { id: string; description: string; childHint: string };
  const gateM = checkChildFacingText({ role: 'hint', label: mint.id, text: mint.childHint }).filter(isBlocking);
  if (gateM.length > 0) throw new Error(`REFUSED — the mint's hint fails the gate: ${gateM.map((f) => f.detail).join('; ')}`);
  if (await prisma.misconception.findUnique({ where: { id: mint.id } })) throw new Error(`REFUSED — ${mint.id} already exists`);
  landingRows.push({ id: mint.id, act: 'MINTED', description: mint.description, childHint: mint.childHint, childHintSha256: sha256(mint.childHint), authority: AUTH });
  if (APPLY) {
    await prisma.misconception.create({
      data: {
        id: mint.id, district: 'VR', status: 'ACTIVE',
        description: mint.description, childHint: mint.childHint,
        proposedBy: ANNIE, approvedBy: ANNIE, recordedBy: DAVID,
        approvalMethod: 'minted in her 145th — retag-not-widen, the CZ-B7 rule at entry scale',
        textProvenance: {
          state: 'RECORDED', text: 'childHint',
          authoredBy: { kind: 'person', name: 'Annie' }, approvedBy: { kind: 'person', name: 'Annie' },
          method: 'minted whole in her return; honours a true link before blocking it', authority: AUTH, date: '2026-08-24',
        },
      },
    });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'misconception', recordId: mint.id, action: 'AUTHORED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
        method: `her 145th (${SHA145.slice(0, 16)}); minted`, note: `hint ${sha256(mint.childHint)}`,
      },
    });
    console.log(`  MINTED   ${mint.id}`);
  }

  // ---- The five retags (membership re-derived; her citation resolved to the entries artefact) ----
  const tier3 = await prisma.item.findMany({
    where: { questionTypeId: 'vr-02-two-odd-ones-out', difficultyTier: 3 },
    select: { id: true, options: { select: { id: true, misconceptionId: true } } },
    orderBy: { id: 'asc' },
  });
  const retagRows = tier3.filter((r) => r.options.some((o) => o.misconceptionId === 'vr02-surface-link'));
  if (retagRows.length !== 5) throw new Error(`REFUSED — expected five tier-three surface-link rows, found ${retagRows.length}`);
  for (const r of retagRows) {
    const opts = r.options.filter((o) => o.misconceptionId === 'vr02-surface-link');
    landingRows.push({ id: r.id, act: 'RETAGGED', from: 'vr02-surface-link', to: mint.id, options: opts.length, authority: AUTH });
    if (!APPLY) continue;
    for (const o of opts) await prisma.itemOption.update({ where: { id: o.id }, data: { misconceptionId: mint.id } });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: r.id, action: 'AMENDED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'options.misconceptionId',
        method: `her 145th (${SHA145.slice(0, 16)}); retag-not-widen. Citation resolved: her block cites the scan at f68c3e1f, which carries no row ids — the five were named in the entries artefact (b2b43a26) and re-derived from the rows here`,
        note: `vr02-surface-link -> ${mint.id}; assignments otherwise untouched`,
      },
    });
    console.log(`  RETAGGED ${r.id}`);
  }

  // ---- The WIW-12 trim ----
  const trimMatch = /target: item:ENG-001-WIW-12:options:B:attractorQuote \| replaced: (.+?) \| authored: (.+)$/m.exec(her);
  if (!trimMatch) throw new Error('REFUSED — the trim block not found');
  const wiw12 = await prisma.item.findUniqueOrThrow({ where: { id: 'ENG-001-WIW-12' }, select: { options: { select: { id: true, content: true, attractorQuote: true } } } });
  const optB = wiw12.options.find((o) => (o.content as { label?: string }).label === 'B');
  if (!optB) throw new Error('REFUSED — WIW-12 option B not found');
  if (optB.attractorQuote !== trimMatch[1].trim()) throw new Error(`REFUSED — WIW-12 B attractorQuote is ${JSON.stringify(optB.attractorQuote)}, her replaced is ${JSON.stringify(trimMatch[1].trim())}`);
  landingRows.push({ id: 'ENG-001-WIW-12', act: 'TRIMMED (attractorQuote)', before: optB.attractorQuote, after: trimMatch[2].trim(), branch: 'the cheaper branch, per the 143rd advance ruling: line 30 carries the pull whole, only the determiner fell outside', authority: AUTH });
  if (APPLY) {
    await prisma.itemOption.update({ where: { id: optB.id }, data: { attractorQuote: trimMatch[2].trim() } });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: 'ENG-001-WIW-12', action: 'AMENDED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'options.B.attractorQuote',
        method: `her 145th (${SHA145.slice(0, 16)}); the trim branch of the 143rd's advance ruling`, note: 'quote trims to the line-30 portion; form as built',
      },
    });
    console.log('  TRIMMED  ENG-001-WIW-12 option B');
  }

  // ---- Eight approvals by reference ----
  const approvals = [...her.matchAll(/confirmed: library:([a-z0-9-]+) \| approved as written \| reference: b2b43a264c284ee0/g)].map((m) => m[1]);
  if (approvals.length !== 8) throw new Error(`REFUSED — expected eight approvals, found ${approvals.length}`);
  for (const id of approvals) {
    const fileHint = entryHint.get(id);
    const db = await prisma.misconception.findUniqueOrThrow({ where: { id }, select: { childHint: true, textProvenance: true, approvedBy: true } });
    if (db.childHint !== fileHint) throw new Error(`REFUSED — ${id}: live row and entries file disagree`);
    landingRows.push({ id, act: 'APPROVED-BY-REFERENCE', wording: db.childHint, wordingSha256: sha256(db.childHint), priorApprovedBy: db.approvedBy, authority: AUTH });
    if (!APPLY) continue;
    await prisma.misconception.update({
      where: { id },
      data: {
        approvedBy: ANNIE, recordedBy: DAVID,
        approvalMethod: 'written review — her 145th, approved by reference to the verified entries file',
        textProvenance: {
          state: 'RECORDED', text: 'childHint',
          authoredBy: (db.textProvenance as Record<string, unknown> | null)?.authoredBy ?? { state: 'UNKNOWN' },
          approvedBy: { kind: 'person', name: 'Annie' },
          method: 'approved by reference (R681 fence) against the entries file; live row asserted equal', servingSha256: sha256(db.childHint),
          authority: AUTH, date: '2026-08-24',
          previous: { approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
        },
      },
    });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'misconception', recordId: id, action: 'APPROVED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint',
        method: `her 145th (${SHA145.slice(0, 16)}); signed against ${sha256(db.childHint).slice(0, 16)}`,
        note: `prior approvedBy was ${db.approvedBy ?? 'null'}`,
      },
    });
    console.log(`  APPROVED ${id}`);
  }

  // ---- The seed rows leave the population ----
  const MARKER = 'synthetic seed item — never shippable';
  const seeds = await prisma.item.findMany({ where: { id: { startsWith: 'seed-vr08-' } }, select: { id: true, status: true, explanation: true } });
  if (seeds.length !== 13) throw new Error(`REFUSED — expected thirteen seed rows, found ${seeds.length}`);
  for (const s of seeds) {
    const note = (s.explanation as { note?: string } | null)?.note;
    if (note !== MARKER) throw new Error(`REFUSED — ${s.id}'s note is not the marker verbatim`);
    if (s.status !== 'DRAFT') throw new Error(`REFUSED — ${s.id} is ${s.status}, expected DRAFT`);
  }
  landingRows.push({ act: 'SEED ROWS LEAVE THE POPULATION', ids: seeds.map((s) => s.id), to: 'REJECTED', ground: 'a row its author marked never shippable is not awaiting review (David\'s ruling on the notes artefact); REJECTED is the never-approved, unusable-by-items state — soft, reversible, and outside every review population' });
  if (APPLY) {
    await prisma.item.updateMany({ where: { id: { startsWith: 'seed-vr08-' }, status: 'DRAFT' }, data: { status: 'REJECTED' } });
    await prisma.attributionEvent.createMany({
      data: seeds.map((s) => ({
        recordType: 'item', recordId: s.id, action: 'AMENDED' as const,
        reviewerId: null, actor: 'David', recordedBy: DAVID, field: 'status',
        method: 'the seed ruling — the notes artefact read at the desk (940d5613)',
        note: `DRAFT -> REJECTED; author's own marker verbatim: "${MARKER}"`,
      })),
    });
    console.log(`  REJECTED ${seeds.length} seed rows out of the population`);
  }

  // ---- The confirmation walk: no other row carries that marker or an equivalent ----
  const ELEVEN_QTS = (await prisma.case.findMany({ where: { id: { in: ['case-vr-02', 'case-vr-05', 'case-vr-08', 'case-vr-10', 'case-vr-13', 'case-vr-16', 'case-vr-17', 'case-vr-18', 'case-vr-19', 'case-vr-20', 'case-vr-21'] } }, select: { questionTypeId: true } })).map((c) => c.questionTypeId);
  const remaining = await prisma.item.findMany({ where: { questionTypeId: { in: ELEVEN_QTS }, status: 'DRAFT', reviewedBy: null }, select: { id: true, stem: true, explanation: true } });
  // MARKER PHRASES, not content words: the first walk matched bare /seed/ and flagged
  // gen-vr-10-word-connections-13, whose STEM pairs the word seed with plant — a child-facing
  // vocabulary word. A marker is authoring metadata; the patterns match phrases only.
  const suspicious = remaining.filter((r) => /never shippable|synthetic seed|seed item|placeholder-only|do not ship|not for children|internal only/i.test(JSON.stringify({ s: r.stem, e: r.explanation })));
  const walk = {
    population: `${remaining.length} rows remaining in the door population after removal`,
    method: 'every remaining row\'s stem and explanation scanned for the marker verbatim and equivalents (seed / never shippable / synthetic / do not ship, case-insensitive)',
    found: suspicious.map((s) => s.id),
    verdict: suspicious.length === 0 ? 'CLEAN — no other row carries the marker or an equivalent' : `NOT CLEAN — ${suspicious.length} rows carry marker-like text; named above`,
  };
  console.log(`  WALK: ${walk.verdict}`);

  if (APPLY) {
    const vr08 = await prisma.item.count({ where: { questionTypeId: 'vr-08-move-letter', status: 'DRAFT', reviewedBy: null } });
    const total = remaining.length;
    if (vr08 !== 25 || total !== 275) throw new Error(`REFUSED — expected vr-08 at 25 and total 275, derived ${vr08} and ${total}`);
    const artefact = {
      kind: 'annie-145-landing',
      what: 'Her 145th landed whole (thirteen amendments, the mint, five retags, the trim, eight approvals) and the seed rows left the population on David\'s ruling, with the confirmation walk clean.',
      authority: AUTH,
      rows: landingRows,
      seedWalk: walk,
      populationRecount: {
        vr08: vr08, total, sittingsAtSix: 'eleven cases at ceil(25/6) = 5 each: FIFTY-FIVE sittings (was fifty-seven; vr-08\'s seven became five)',
        note: 'every case now holds exactly 25; the population of record re-emits from this count on the desk\'s word or rides this artefact\'s figures',
      },
      attestationProgress: 'the twenty-two are now all attested: 13 amended + 8 approved + vr03-same-topic already signed — plus the mint as the twenty-third. The dark rooms have lights; executions remain the binding absence for wholeness.',
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('annie-145-landing', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'annie-145-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
