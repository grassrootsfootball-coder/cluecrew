/**
 * THE HUNDRED-AND-FOURTH'S THIRTEEN, LANDED BY CONTENT (2026-08-23).
 *
 * **HER TARGET PIDS AND THIS STORE'S PASSAGES DISAGREE, AND THE BYTES DECIDE.** Three of her
 * targets name passages whose text does not carry the flag's content (grandparent-joke → her b-02,
 * content in b-01's mower story; care-home and tide → her b-04, content in b-02's coast story,
 * which also holds the lie and THE ONE SHORT SIMILE — "the way you agree with the radio"). And one
 * row of OURS was misattached: leaving-school sat on b-04 (the Reuben lost-property story) while
 * the blue-chair story it describes is b-03. **A flag landed on the wrong passage is worse than a
 * refusal**, so every entry lands where its bytes are, and the divergence table travels on the
 * landing artefact for the meet. Form ruling twelve rides in: `originalFields` declared per column,
 * the b-flags' element and reason the original judge's words, c-01's `negligible` mapped to mild
 * with the original in sourceProse.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentFlags } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const RETURN = '/Users/davidb/Downloads/annie-hundredandfourth-return.md';
const EXPECTED = '9bab87a329eb22aa65385ddd74924f25abf5a9a56372a2b48cc815ef8683415a';
const sha = createHash('sha256').update(readFileSync(RETURN)).digest('hex');
if (sha !== EXPECTED) throw new Error(`ABORTED — return digest ${sha}.`);
const AUTH = `annie-hundredandfourth-return.md, sha256 ${sha}`;

const body = readFileSync(RETURN, 'utf8');
const blocks = [...body.matchAll(/^\s+target: passage:([a-z0-9-]+):(contentFlags|contentScreenings)\n(?:.*\n)?\s+authored: (\{.*\})$/gm)]
  .map((m) => ({ herPid: m[1] as string, kind: m[2] as string, obj: JSON.parse(m[3] as string) as Record<string, unknown> }));
if (blocks.length !== 14) throw new Error(`ABORTED — parsed ${blocks.length} of 14 targets (her count line says fourteen: thirteen conversions + this digest declaration; the block carries 14 authored entries).`);

/** THE CONTENT MAP: per entry, where its bytes are, which passage's legacy row it displaces. */
const PLAN: Array<{ match: string; landPid: string; legacyPid: string; probe: string }> = [
  { match: 'wasps', landPid: 'stream-b-01', legacyPid: 'stream-b-01', probe: 'nettle' },
  { match: 'insecticide', landPid: 'stream-b-01', legacyPid: 'stream-b-01', probe: 'hum' },
  { match: 'joking about being thought old', landPid: 'stream-b-01', legacyPid: 'stream-b-01', probe: 'hip' },
  { match: 'told a parent he is somewhere else', landPid: 'stream-b-02', legacyPid: 'stream-b-02', probe: 'told Mum I was going' },
  { match: 'travels alone by bus', landPid: 'stream-b-02', legacyPid: 'stream-b-02', probe: 'The bus went as far' },
  { match: "head teacher's office", landPid: 'stream-b-03', legacyPid: 'stream-b-03', probe: 'office' },
  { match: 'butterflies are handled', landPid: 'stream-b-03', legacyPid: 'stream-b-03', probe: 'butterfl' },
  { match: 'leaving the school', landPid: 'stream-b-03', legacyPid: 'stream-b-04', probe: 'office' },
  { match: 'care home', landPid: 'stream-b-02', legacyPid: 'stream-b-02', probe: 'agree with the radio' },
  { match: 'rising tide', landPid: 'stream-b-02', legacyPid: 'stream-b-02', probe: 'toe of my boot' },
  { match: 'less well and less able', landPid: 'stream-b-05', legacyPid: 'stream-b-05', probe: 'allotment' },
  { match: 'picked last', landPid: 'stream-c-01', legacyPid: 'stream-c-01', probe: 'mum asked' },
  { match: 'single-parent-shaped', landPid: 'stream-c-01', legacyPid: 'stream-c-01', probe: 'mum asked' },
];

const COMPLETIONS: Record<string, { anchor: string; reading: string }> = {
  'the one short simile': {
    anchor: 'the way you agree with the radio',
    reading: 'The simile is one clause: "She agrees with most things now, the way you agree with the radio." Minimal: the visits and the calendar are the element.',
  },
  'he steps back and leaves in good time': {
    anchor: 'I moved back',
    reading: 'The stepping-back sentence beside the boot; the nothing-suggests-trapped clause stays DECLARED(absence), reported. NOTE FOR HER READ: "leaves in good time" completes further down the same episode; the span carries the stepping back, which is the claim\'s hinge.',
  },
};

const divergences: string[] = [];
const readings: Array<Record<string, unknown>> = [];
const results: string[] = [];
const flagEntries = blocks.filter((b) => b.kind === 'contentFlags');
const perLand = new Map<string, Array<{ obj: Record<string, unknown>; legacyPid: string; herPid: string }>>();

for (const b of flagEntries) {
  const el = String(b.obj.element ?? '');
  const plan = PLAN.find((p) => el.toLowerCase().includes(p.match.toLowerCase()));
  if (!plan) { results.push(`REFUSED TO HER — no content plan matches element ${JSON.stringify(el).slice(0, 60)}`); process.exitCode = 1; continue; }
  const landText = String((JSON.parse(readFileSync(join(REPO, `content/passages/${plan.landPid}.json`), 'utf8')) as Record<string, unknown>).text ?? '');
  if (!landText.toLowerCase().includes(plan.probe.toLowerCase())) {
    results.push(`REFUSED TO HER — ${plan.landPid}'s bytes do not carry probe ${JSON.stringify(plan.probe)} for ${JSON.stringify(el).slice(0, 50)}`);
    process.exitCode = 1; continue;
  }
  if (plan.landPid !== b.herPid) divergences.push(`her target ${b.herPid} → landed ${plan.landPid} (bytes carry it): ${JSON.stringify(el).slice(0, 70)}`);
  if (plan.legacyPid !== plan.landPid) divergences.push(`THIS STORE's legacy row for ${JSON.stringify(el).slice(0, 40)} sat on ${plan.legacyPid} (misattached) and displaces from there`);
  perLand.set(plan.landPid, [...(perLand.get(plan.landPid) ?? []), { obj: b.obj, legacyPid: plan.legacyPid, herPid: b.herPid }]);
}

const tokens = (s: string) => new Set(s.toLowerCase().split(/[^a-z']+/).filter((w) => w.length > 3));
for (const [pid, entries] of perLand) {
  const pendingDisplacements: Array<{ srcPath: string; row: unknown; key: string }> = [];
  const path = join(REPO, `content/passages/${pid}.json`);
  const passage = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const text = String(passage.text ?? '');
  const fresh: Array<Record<string, unknown>> = [];
  for (const e of entries) {
    const flag = { ...e.obj };
    // Displace the legacy row from wherever it truly sits, pairing by token overlap.
    const srcPath = join(REPO, `content/passages/${e.legacyPid}.json`);
    const src = JSON.parse(readFileSync(srcPath, 'utf8')) as Record<string, unknown>;
    const legacyRows = ((src.contentFlags ?? []) as unknown[]);
    const elTok = tokens(String(flag.element));
    let best: { row: unknown; score: number } | null = null;
    for (const row of legacyRows) {
      if (row && typeof row === 'object' && 'axis' in (row as object)) continue;
      const rowText = typeof row === 'string' ? row : JSON.stringify(row);
      const score = [...elTok].filter((w) => rowText.toLowerCase().includes(w)).length / Math.max(1, elTok.size);
      if (!best || score > best.score) best = { row, score };
    }
    if (!best || best.score < 0.4) {
      // The split's second object shares its pair's row; anything else refuses.
      if (String(flag.splitNote ?? '').includes('second object')) {
        flag.sourceProse = 'as above';
      } else {
        results.push(`${pid}: REFUSED TO HER — no legacy row on ${e.legacyPid} pairs with ${JSON.stringify(String(flag.element)).slice(0, 50)} (best ${(100 * (best?.score ?? 0)).toFixed(0)}%)`);
        process.exitCode = 1; continue;
      }
    } else {
      const rowText = typeof best.row === 'string' ? best.row : JSON.stringify(best.row);
      flag.sourceProse = rowText;
      flag._sourceProseSeededBy = `VERBATIM-AT-LANDING from ${e.legacyPid}'s legacy row bytes, ${AUTH}`;
      if (e.legacyPid !== pid) flag._movedFromPassage = `${e.legacyPid} — the legacy row was misattached there; this passage's bytes carry the content`;
      // GATE-THEN-WRITE: the displacement is queued and applied only after the door passes the
      // whole passage — the first run displaced b-02's rows and then refused its flags, leaving a
      // bare row with its record in stamps. Write-then-gate is the fault; this is the order.
      pendingDisplacements.push({ srcPath, row: best.row, key: `hundredandfourth-${String(flag.axis)}` });
    }
    const strike = flag.strike;
    if (typeof strike === 'string' && strike.startsWith('SPAN PENDING-BYTES')) {
      const claim = Object.keys(COMPLETIONS).find((c) => strike.includes(c));
      if (!claim) { results.push(`${pid}: REFUSED TO HER — pending span unplaceable: ${JSON.stringify(strike).slice(0, 70)}`); process.exitCode = 1; continue; }
      const c = COMPLETIONS[claim]!;
      const at = text.indexOf(c.anchor);
      if (at === -1) { results.push(`${pid}: REFUSED TO HER — anchor missing in bytes: ${c.anchor}`); process.exitCode = 1; continue; }
      const start = text.lastIndexOf('.', at) + 1;
      const end = text.indexOf('.', at);
      const span = text.slice(start, end === -1 ? undefined : end + 1).trim();
      const nl = (passage.numberedLines ?? []) as Array<{ n: number; text: string }>;
      const lines = nl.filter((l) => l.text && (span.includes(l.text.trim().slice(0, 30)) || l.text.includes(span.slice(0, 30)))).map((l) => l.n);
      flag.strike = { span, lines };
      readings.push({ passage: pid, claim, span, lines, reading: c.reading });
    }
    fresh.push(flag);
  }
  const current = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const existing = new Set(((current.contentFlags as unknown[]) ?? []).filter((f) => f && typeof f === 'object')
    .map((f) => JSON.stringify(Object.entries(f as object).sort())));
  const toLand = fresh.filter((f) => !existing.has(JSON.stringify(Object.entries(f).sort())));
  if (toLand.length === 0) { results.push(`${pid}: ALREADY LANDED.`); continue; }
  const wouldBe = { ...current, contentFlags: [...((current.contentFlags as unknown[]) ?? []), ...toLand] };
  const report = readContentFlags({ ...wouldBe, extract: current.text }, { enforceUse: true });
  if (report.refusals.length > 0) {
    results.push(`${pid}: THE DOOR REFUSES:`);
    for (const r of report.refusals) results.push(`    ${r.code}  ${r.detail}`);
    process.exitCode = 1; continue;
  }
  for (const pd of pendingDisplacements) {
    const src = JSON.parse(readFileSync(pd.srcPath, 'utf8')) as Record<string, unknown>;
    // Order-INSENSITIVE compare (the CLAUDE.md rule): a round-tripped object's key order differs,
    // and a stringify filter silently removes nothing — which is exactly what happened on b-02.
    const canon = (v: unknown): string => typeof v === 'object' && v !== null && !Array.isArray(v)
      ? JSON.stringify(Object.fromEntries(Object.entries(v as object).sort()))
      : JSON.stringify(v);
    src.contentFlags = ((src.contentFlags as unknown[]) ?? []).filter((r) => canon(r) !== canon(pd.row));
    const dl = (src._displacedLegacyFlags ?? {}) as Record<string, unknown>;
    dl[pd.key] = { displaced: [pd.row], by: AUTH };
    src._displacedLegacyFlags = dl;
    writeFileSync(pd.srcPath, JSON.stringify(src, null, 1));
  }
  writeFileSync(path, JSON.stringify(wouldBe, null, 1));
  results.push(`${pid}: landed ${toLand.length}`);
}

// The second screening record.
const scr = blocks.find((b) => b.kind === 'contentScreenings');
if (scr) {
  const path = join(REPO, 'content/passages/stream-b-05.json');
  const passage = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const decl = String(scr.obj.declaration ?? '');
  const existing = ((passage.contentScreenings as unknown[]) ?? []);
  if (existing.some((e) => String((e as Record<string, unknown>).declaration ?? '') === decl)) {
    results.push('stream-b-05: screening ALREADY LANDED.');
  } else {
    const legacyRow = ((passage.contentFlags as unknown[]) ?? []).find((l) => typeof l === 'string' && (l as string).includes(decl.slice(0, 40))) as string | undefined;
    if (!legacyRow) { results.push('stream-b-05: SCREENING REFUSED — no legacy line carries its declaration.'); process.exitCode = 1; }
    else {
      const record = { ...scr.obj, sourceProse: legacyRow, _sourceProseSeededBy: `VERBATIM-AT-LANDING, ${AUTH}` };
      const wouldBe = { ...passage,
        contentFlags: ((passage.contentFlags as unknown[]) ?? []).filter((f) => f !== legacyRow),
        contentScreenings: [...existing, record],
        _displacedLegacyFlags: { ...((passage._displacedLegacyFlags as object) ?? {}), 'hundredandfourth-screening': { displaced: [legacyRow], by: AUTH } } };
      const report = readContentFlags({ ...wouldBe, extract: passage.text }, { enforceUse: true });
      if (report.refusals.length > 0) { results.push('stream-b-05: DOOR REFUSES screening'); process.exitCode = 1; }
      else { writeFileSync(path, JSON.stringify(wouldBe, null, 1)); results.push('stream-b-05: SCREENED-CLEAN record landed — the second recorded zero'); }
    }
  }
}
for (const r of results) console.log(r);
console.log('\nDIVERGENCES (for the meet):');
for (const d of divergences) console.log(`  ${d}`);

const payload = { what: 'The hundred-and-fourth landing: thirteen entries landed BY CONTENT, with the pid divergence table for the meet against the authoring store.', authority: AUTH, results, divergences, readings };
const stamp = artefactStamp(payload, new Date().toISOString(), 'content', 'the final conversion landing with its divergence table', ['what', 'authority', 'results', 'divergences', 'readings']);
const out = join(REPO, 'content/exports', stampedName('hundredandfourth-landing', stamp.sourceHash, 'json'));
writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
deliver(out, 'hundredandfourth-landing');
