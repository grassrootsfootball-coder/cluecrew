/**
 * RE-FOUND THE SEVEN NAMED JOINS ON THE CARRIER'S OWN EVIDENCE (R881).
 *
 * The gate refuses an already-tagged option before it computes anything, which is right for landing
 * and useless for this question: **do the two joins that already landed survive being re-checked
 * against the carrier's own working, rather than the sender's?** That is the only question R880
 * left open, and it cannot be answered by re-running the gate.
 *
 * Nothing here writes. It reports what the crossed bytes support, per option, so Annie's reading
 * has the comparison in front of it.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { carrierWorking } from './lib/crossed-carrier-working';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const MINTS = '/Users/davidb/Downloads/maths-six-mints-for-code.json';

const componentsOf = (v: string): number[] | null => {
  const nums = v.replace(/[()]/g, '').split(',').map((s) => Number(s.trim().replace(/[^\d.-]/g, '')));
  return nums.every((n) => !Number.isNaN(n)) && nums.length > 0 ? nums : null;
};

function arithmeticIn(working: string): { kind: 'tuple' | 'assertion' | 'bare'; expr: string[]; asserted?: number; source: string } | null {
  const norm = working.replace(/\bx\b/g, '*').replace(/\bdivided by\b/g, '/');
  const tuple = norm.match(/\(([^)]*[+\-*/][^)]*,[^)]*)\)/);
  if (tuple) {
    const expr = tuple[1].split(',').map((c) => c.trim());
    if (expr.every((c) => /^[\d\s.+\-*/()]+$/.test(c) && c !== '')) return { kind: 'tuple', expr, source: tuple[0] };
  }
  const a = norm.match(/([\d.()][\d\s.+\-*/()]*[+\-*/][\d\s.+\-*/()]*)=\s*(-?[\d.]+)/);
  if (a && /^[\d\s.+\-*/()]+$/.test(a[1].trim())) return { kind: 'assertion', expr: [a[1].trim()], asserted: Number(a[2]), source: a[0].trim() };
  const bare = norm.match(/[\d.]+(?:\s*[+\-*/]\s*[\d.()]+)+/);
  if (bare && /^[\d\s.+\-*/()]+$/.test(bare[0])) return { kind: 'bare', expr: [bare[0].trim()], source: bare[0].trim() };
  return null;
}

function verify(working: string, optionValue: string) {
  const f = arithmeticIn(working);
  if (!f) return { ran: false, agrees: false, detail: 'the carrier states no arithmetic — it names the act in words' };
  const want = componentsOf(optionValue);
  if (!want) return { ran: false, agrees: false, detail: 'the option value has no numeric components' };
  let got: number[];
  try { got = f.expr.map((e) => Function(`"use strict";return (${e})`)() as number); } catch { return { ran: false, agrees: false, detail: 'the extracted arithmetic did not evaluate' }; }
  if (f.kind === 'assertion') {
    const holds = Math.abs(got[0] - (f.asserted as number)) < 1e-9;
    const inOption = want.some((w) => Math.abs(w - (f.asserted as number)) < 1e-9);
    return { ran: true, agrees: holds && inOption, form: 'assertion (weaker: result appears among the option components)', extracted: f.source,
      detail: `${f.expr[0]} = ${got[0]}, asserted ${f.asserted} — arithmetic ${holds ? 'holds' : 'DOES NOT HOLD'}; option ${JSON.stringify(want)} ${inOption ? 'contains' : 'DOES NOT CONTAIN'} it` };
  }
  const agrees = got.length === want.length && got.every((g, i) => Math.abs(g - want[i]) < 1e-9);
  return { ran: true, agrees, form: `${f.kind} (reproduces the option)`, extracted: f.source, detail: `${JSON.stringify(f.expr)} = ${JSON.stringify(got)}; option ${JSON.stringify(want)} — ${agrees ? 'AGREES' : 'DISAGREES'}` };
}

const SEVEN: Array<[string, string, string]> = [
  ['percentage-never-divided-by-hundred', 'MC01-FDP-03', 'C'],
  ['fraction-part-used-alone', 'MC01-FDP-08', 'C'],
  ['fraction-part-used-alone', 'MC01-FDP-08', 'D'],
  ['side-recounted-from-a-reached-corner', 'MC01-GEOM-04', 'D'],
  ['maximum-given-for-a-sum', 'MC01-STATS-01', 'D'],
  ['ordering-goal-reversed', 'MC01-NPV-03', 'C'],
  ['leading-zero-repaired-ordering-not', 'MC01-NPV-03', 'D'],
];

async function run() {
  assertFixture('refound-verify', [
    { name: 'the carrier assertion for FDP-03 C holds', input: JSON.stringify(['80 x 25 = 2000', '£2000']), mustBeCaught: true },
    { name: 'the carrier assertion for GEOM-04 D holds against a tuple option', input: JSON.stringify(['5 + 3 = 8 → (8, 4)', '(8, 4)']), mustBeCaught: true },
    { name: 'a phrase with an equals sign is not arithmetic', input: JSON.stringify(['biggest number = 7', '7']), mustBeCaught: false },
    { name: 'a comma list with no operator is not arithmetic', input: JSON.stringify(['6,4,0 = 640', '640']), mustBeCaught: false },
    { name: 'wrong arithmetic refuses', input: JSON.stringify(['80 x 25 = 1000', '1000']), mustBeCaught: false },
  ], (raw) => { const [w, v] = JSON.parse(raw) as [string, string]; const r = verify(w, v); return r.ran && r.agrees; });

  const mints = JSON.parse(readFileSync(MINTS, 'utf8')) as { entries: Array<{ id: string; behaviour: string; join?: { working?: string; optionLabel?: string }; secondCarrierCandidate?: { working?: string; optionLabel?: string } }> };
  requirePopulation('refound:joins', { 'named join(s)': SEVEN.length });

  const rows = [];
  for (const [entryId, itemId, label] of SEVEN) {
    const entry = mints.entries.find((e) => e.id === entryId)!;
    const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId }, select: { options: { select: { content: true, isCorrect: true, misconceptionId: true } } } });
    const opt = item.options.find((o) => (o.content as { label?: string }).label === label)!;
    const value = String((opt.content as { value: unknown }).value);
    const own = carrierWorking(itemId, label);
    const senders = entry.secondCarrierCandidate?.optionLabel === label ? entry.secondCarrierCandidate?.working : entry.join?.working;
    const onCarrier = own.state === 'PRESENT' ? verify(own.verbatim as string, value) : { ran: false, agrees: false, detail: `carrier evidence ${own.state}` };
    const onSender = senders ? verify(senders, value) : { ran: false, agrees: false, detail: 'no sender working' };
    rows.push({
      entryId, carrier: `${itemId} ${label}`, optionValueInStore: value,
      alreadyTagged: opt.misconceptionId ?? null,
      herEntrysBehaviour: entry.behaviour,
      THE_CARRIERS_OWN_WORKING: own.verbatim ?? null, copiesAgreeing: own.copiesHoldingTheCarrier,
      verdictOnCARRIEREvidence: onCarrier.ran ? (onCarrier.agrees ? 'VERIFIES' : 'DISAGREES') : 'NOT ARITHMETIC',
      carrierDetail: onCarrier.detail, carrierForm: (onCarrier as { form?: string }).form ?? null,
      theSendersWorking: senders ?? null,
      verdictOnSENDEREvidence: onSender.ran ? (onSender.agrees ? 'VERIFIES' : 'DISAGREES') : 'NOT ARITHMETIC',
      theTwoAgree: (onCarrier.ran && onCarrier.agrees) === (onSender.ran && onSender.agrees),
    });
  }

  const landed = rows.filter((r) => r.alreadyTagged);
  const full = {
    kind: 'joins-refounded-on-carrier-evidence',
    THE_QUESTION: 'do the two joins that already landed survive re-checking against the CARRIER\'S own working rather than the sender\'s? R880 left it open and re-running the gate cannot answer it — the gate refuses an already-tagged option before it computes.',
    NOTHING_IS_WRITTEN: 'this reports; it does not land, unwind or re-land anything.',
    THE_TWO_LANDED: {
      ids: landed.map((r) => r.carrier),
      surviveOnCarrierEvidence: landed.every((r) => r.verdictOnCARRIEREvidence === 'VERIFIES'),
      perRow: landed.map((r) => ({ carrier: r.carrier, onCarrier: r.verdictOnCARRIEREvidence, onSender: r.verdictOnSENDEREvidence, carrierWorking: r.THE_CARRIERS_OWN_WORKING })),
    },
    WHERE_THE_TWO_SOURCES_DISAGREE: rows.filter((r) => !r.theTwoAgree).map((r) => ({ carrier: r.carrier, onCarrier: r.verdictOnCARRIEREvidence, onSender: r.verdictOnSENDEREvidence })),
    rows,
  };
  const lines = rows.map((r) => `${r.carrier}\t${r.verdictOnCARRIEREvidence}\t${r.verdictOnSENDEREvidence}`);
  const d = digestOverText('one line per named join, "<carrier>\\t<carrierVerdict>\\t<senderVerdict>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['rows', 'RESULT_LINES', 'THE_TWO_LANDED']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('joins-refounded-on-carrier-evidence', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'joins-refounded-on-carrier-evidence');
  console.log('');
  for (const r of rows) console.log(`  ${r.carrier.padEnd(17)} carrier:${r.verdictOnCARRIEREvidence.padEnd(14)} sender:${r.verdictOnSENDEREvidence.padEnd(14)} ${r.alreadyTagged ? '[LANDED]' : ''}  ${JSON.stringify(r.THE_CARRIERS_OWN_WORKING)}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
