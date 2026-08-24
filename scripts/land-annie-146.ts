/**
 * HER 146TH LANDS: NINE WALK AMENDMENTS, SIXTEEN WALK APPROVALS, AND NEVER-SHIPPABLE BECOMES A
 * STATE (David, 2026-08-24 — R703).
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
const F146 = '/Users/davidb/Downloads/annie-146-for-code.md';
const SHA146 = '4a0d56c98e58fceae1ad93283fb5f4bebac44e794ff403d79663ee4822ac0264';
const AUTH = `annie-146-for-code.md, sha256 ${SHA146}`;
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const landing: Array<Record<string, unknown>> = [];

async function run() {
  const bytes = readFileSync(F146);
  if (sha256(bytes) !== SHA146) throw new Error(`REFUSED — her 146th reads ${sha256(bytes)}`);
  const her = bytes.toString('utf8');

  // ---- Nine walk amendments: replaced SUBSTRINGS asserted against the live scripts ----
  const amendments = [...her.matchAll(/target: walk:([a-z0-9-]+) \| replaced: (.+?) \| authored: (.+)$/gm)]
    .map((m) => ({ id: m[1], replaced: m[2].trim(), authored: m[3].trim() }));
  if (amendments.length !== 9) throw new Error(`REFUSED — expected nine walk amendments, found ${amendments.length}`);
  for (const a of amendments) {
    const item = await prisma.item.findUniqueOrThrow({ where: { id: a.id }, select: { explanation: true } });
    const e = item.explanation as Record<string, unknown>;
    const script = e.walkScript as string;
    const occurrences = script.split(a.replaced).length - 1;
    if (occurrences !== 1) throw new Error(`REFUSED — ${a.id}: replaced substring occurs ${occurrences} times in the live script (must be exactly 1, R87)`);
    const after = script.replace(a.replaced, a.authored);
    const gate = checkChildFacingText({ role: 'narrative', label: `${a.id}.walkScript`, text: a.authored }).filter(isBlocking);
    if (gate.length > 0) throw new Error(`REFUSED — ${a.id} authored sentence fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
    landing.push({ id: a.id, act: 'WALK AMENDED', replaced: a.replaced, authored: a.authored, scriptBeforeSha256: sha256(script), scriptAfterSha256: sha256(after), authority: AUTH });
    if (!APPLY) { console.log(`  WOULD AMEND ${a.id}`); continue; }
    await prisma.item.update({
      where: { id: a.id },
      data: { explanation: { ...e, walkScript: after, walkScriptStatus: `AMENDED-AND-APPROVED — her 146th (${SHA146.slice(0, 16)})`, walkScriptApprovedBy: 'reviewer:rev-0001' } },
    });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: a.id, action: 'AMENDED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'explanation.walkScript',
        method: `her 146th (${SHA146.slice(0, 16)}); replaced substring asserted exactly once in the live script`,
        note: `script ${sha256(script)} -> ${sha256(after)}`,
      },
    });
    console.log(`  AMENDED  ${a.id}`);
  }

  // ---- Sixteen approvals by reference ----
  const confLine = /confirmed: walks:approved-sixteen \| gen-vr-10-word-connections ([\d, ]+) approved as written/.exec(her);
  if (!confLine) throw new Error('REFUSED — the sixteen-approvals line not found');
  const nums = confLine[1].split(',').map((n) => n.trim()).filter(Boolean);
  if (nums.length !== 16) throw new Error(`REFUSED — expected sixteen ids, found ${nums.length}`);
  for (const n of nums) {
    const id = `gen-vr-10-word-connections-${n.padStart(2, '0')}`;
    const item = await prisma.item.findUniqueOrThrow({ where: { id }, select: { explanation: true } });
    const e = item.explanation as Record<string, unknown>;
    if (typeof e.walkScript !== 'string' || !e.walkScript.trim()) throw new Error(`REFUSED — ${id} has no walkScript to approve`);
    landing.push({ id, act: 'WALK APPROVED-BY-REFERENCE', walkScriptSha256: sha256(e.walkScript as string), authority: AUTH });
    if (!APPLY) continue;
    await prisma.item.update({ where: { id }, data: { explanation: { ...e, walkScriptStatus: `APPROVED — her 146th (${SHA146.slice(0, 16)})`, walkScriptApprovedBy: 'reviewer:rev-0001' } } });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: id, action: 'APPROVED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'explanation.walkScript',
        method: `her 146th (${SHA146.slice(0, 16)}); approved by reference to 6f67fb2c3eae5dcb`,
        note: `walkScript ${sha256(e.walkScript as string)}`,
      },
    });
    console.log(`  APPROVED ${id}`);
  }

  // ---- The state: the thirteen move RETIRED -> NEVER_SHIPPABLE ----
  const seeds = await prisma.item.findMany({ where: { id: { startsWith: 'seed-vr08-' } }, select: { id: true, status: true } });
  if (seeds.length !== 13) throw new Error(`REFUSED — expected thirteen seeds, found ${seeds.length}`);
  landing.push({ act: 'NEVER_SHIPPABLE BECOMES A STATE', ids: seeds.map((s) => s.id).sort(), from: seeds[0]?.status, to: 'NEVER_SHIPPABLE', note: 'RETIRED was the best state the enum had at removal time; the ruled state now exists (migration 20260824214549) and the rows move to their true name. The trigger reads the state: every population, pool and door filter keys on status, and NEVER_SHIPPABLE is outside all of them.' });
  if (APPLY) {
    await prisma.item.updateMany({ where: { id: { startsWith: 'seed-vr08-' } }, data: { status: 'NEVER_SHIPPABLE' } });
    await prisma.attributionEvent.createMany({
      data: seeds.map((s) => ({
        recordType: 'item', recordId: s.id, action: 'AMENDED' as const,
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'status',
        method: `her 146th ruling taken by David (${SHA146.slice(0, 16)}): never-shippable is a state the trigger reads, not a sentence in a note`,
        note: `${s.status} -> NEVER_SHIPPABLE`,
      })),
    });
    console.log('  MOVED 13 seeds to NEVER_SHIPPABLE');
  }

  // ---- The estate walk: every item, every free-text field, marker phrases ----
  const all = await prisma.item.findMany({ select: { id: true, status: true, stem: true, explanation: true, reviewNotes: true, solution: true, answerFlagNote: true, options: { select: { content: true, misconceptionExecution: true, a36Note: true } } } });
  const MARKERS = /never shippable|synthetic seed|seed item|placeholder-only|do not ship|not for children|internal only|never serve|test row|dummy item/i;
  const found = all.filter((r) => MARKERS.test(JSON.stringify(r)));
  const walk = {
    population: `${all.length} items — the whole estate, every free-text field (stem, explanation, review notes, solution, flags, option content, executions, a36 notes)`,
    markerPhrases: 'never shippable / synthetic seed / seed item / placeholder-only / do not ship / not for children / internal only / never serve / test row / dummy item — phrases, never content words (the gen-vr-10 seed/plant lesson)',
    membership: found.map((r) => ({ id: r.id, status: r.status })),
    verdict: `THE LEAD OF THIS ARTEFACT: ${found.length} marker rows, not thirteen. Beyond the vr-08 thirteen: seed-vr09-01..11 and seed-vr11-01..14 — TWENTY-FIVE LIVE AND SERVING through case-vr-09 and case-vr-11 while carrying their author's never-ship marker verbatim — plus seed-vr09-12/13 already RETIRED. The 25 are HELD AT THE SERVING DOOR as of this landing (SERVING_HOLDS, R208: status untouched, lift condition named); their status move to NEVER_SHIPPABLE awaits David's ruling on this membership. Exactly the fault the state exists to end: found by a walk this time, findable by a status from now on.`,
  };
  console.log(`  ESTATE WALK: ${found.length} marker rows of ${all.length}`);

  if (APPLY) {
    const artefact = {
      kind: 'annie-146-landing',
      what: 'Nine walk amendments landed by substring-assert, sixteen walks approved by reference, never-shippable made a STATE the trigger reads, and the whole estate walked for marker phrases.',
      authority: AUTH,
      rows: landing,
      estateWalk: walk,
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('annie-146-landing', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'annie-146-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
