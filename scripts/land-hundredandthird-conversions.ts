/**
 * THE HUNDREDTH'S SEVEN, WITH FORM RULING TEN FOLDED (2026-08-23).
 *
 * **`sourceProse` SEEDS FROM THE LEGACY ROW'S BYTES AT LANDING** — *"an archive that passed through
 * anybody is not an archive"* (her §1). Her return carries a placeholder in the field; the landing
 * writes the legacy string itself. Where a return QUOTES a copy, it is byte-checked against the
 * legacy and a mismatch is REPORTED, never smoothed. Objects pair with legacy rows in block order
 * per passage; a pairing whose element words are absent from its legacy string refuses to her.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentFlags } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const RETURN = '/Users/davidb/Downloads/annie-hundredandthird-return.md';
const EXPECTED = '3870ca930c9ba2a5d6981e2a03f538e4aaf9b8018c2d7a85d944fef1b60599af';

const sha = createHash('sha256').update(readFileSync(RETURN)).digest('hex');
if (sha !== EXPECTED) throw new Error(`ABORTED — return digest ${sha}.`);
const body = readFileSync(RETURN, 'utf8');
const blocks = [...body.matchAll(/^\s+target: passage:([a-z0-9-]+):(contentFlags|contentScreenings)\n(?:.*\n)?\s+authored: (\{.*\})$/gm)]
  .map((m) => ({ pid: m[1] as string, kind: m[2] as string, obj: JSON.parse(m[3] as string) as Record<string, unknown> }));
if (blocks.length !== 8) throw new Error(`ABORTED — parsed ${blocks.length} of 8 (seven flags and one screening).`);

const COMPLETIONS: Record<string, { anchor: string; home: 'extract' | 'preamble'; reading: string }> = {
  "Mark's one-word answer": {
    anchor: '“Never.”', home: 'extract',
    reading: 'The one-word answer is one word: “Never.” Minimal by arithmetic. The no-distress clause stays DECLARED(absence), reported.',
  },
  "the child's reply as the joke": {
    anchor: 'It WAS TRAVELING, mother', home: 'extract',
    reading: 'The reply is the child\'s eager speech ending in the nightgowns — the bathos IS the joke. REPORTED, NOT SMOOTHED: the hushing itself is not visible in these extract bytes; the mother\'s put-down here is the journey-proud remark, and whether that satisfies the element\'s "hushes for mentioning nightgowns" is hers to read.',
  },
  'the instant decision': {
    anchor: 'And for an instant I thought what I had best do', home: 'extract',
    reading: 'The decision sentence itself, followed by the act. Minimal: the kisses are the element, the instant is the claim.',
  },
};

const readings: Array<Record<string, unknown>> = [];
const perPassage = new Map<string, Array<Record<string, unknown>>>();
/**
 * **RULING ELEVEN AT THE DOOR**: a `contentScreenings` target lands into its OWN array, never into
 * contentFlags — a clean declaration is a screening record, not a flag. Its legacy line displaces
 * from contentFlags (where the standalone declaration sat), sourceProse seeding from those bytes.
 */
const screenings = blocks.filter((b) => b.kind === 'contentScreenings');
for (const b of blocks.filter((x) => x.kind === 'contentFlags')) {
  perPassage.set(b.pid, [...(perPassage.get(b.pid) ?? []), b.obj]);
}

const results: string[] = [];
for (const [pid, objs] of perPassage) {
  const path = join(REPO, `content/passages/${pid}.json`);
  const passage = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const legacy = ((passage.contentFlags as unknown[]) ?? []).filter((f) => typeof f === 'string') as string[];
  if (legacy.length !== objs.length) {
    results.push(`${pid}: REFUSED TO HER — ${objs.length} object(s) against ${legacy.length} legacy string(s); block-order pairing needs equal counts.`);
    process.exitCode = 1;
    continue;
  }
  const flags: Array<Record<string, unknown>> = [];
  let ok = true;
  for (let n = 0; n < objs.length; n++) {
    const flag = { ...objs[n]! };
    const legacyRow = legacy[n]!;
    // The pairing guard: the object's element must share real words with its legacy row.
    const ew = String(flag.element).toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const shared = ew.filter((w) => legacyRow.toLowerCase().includes(w));
    if (shared.length < Math.min(2, ew.length)) {
      results.push(`${pid}[${n}]: REFUSED TO HER — element ${JSON.stringify(String(flag.element)).slice(0, 50)} does not sit in its block-order legacy row; pairing not confident.`);
      ok = false;
      continue;
    }
    // FORM RULING TEN: the archive seeds from the bytes.
    flag._sourceProseAsReturned = flag.sourceProse;
    flag.sourceProse = legacyRow;
    flag._sourceProseSeededBy = `VERBATIM-AT-LANDING from the legacy row's bytes, ${RETURN.split('/').pop()}, sha256 ${sha} §1 — an archive that passed through anybody is not an archive`;
    // Item 3: the rejection aside, stamped as the first member of its class.
    if (typeof flag.note === 'string' && flag.note.includes('blind-beggar')) {
      flag.rejectionAsideClass = 'FIRST MEMBER — rejection-preserved-only-in-a-comparative-aside; class pending David\'s ruling (hundredandthird return: do rejections get their own record?)';
    }
    const strike = flag.strike;
    if (typeof strike === 'string' && strike.startsWith('SPAN PENDING-BYTES')) {
      const claim = Object.keys(COMPLETIONS).find((c) => strike.includes(c));
      if (!claim) { results.push(`${pid}[${n}]: REFUSED TO HER — pending span unplaceable: ${JSON.stringify(strike).slice(0, 80)}`); ok = false; continue; }
      const c = COMPLETIONS[claim]!;
      const homeText = String(passage[c.home] ?? '');
      const at = homeText.indexOf(c.anchor);
      if (at === -1) { results.push(`${pid}[${n}]: REFUSED TO HER — anchor not in ${c.home} bytes.`); ok = false; continue; }
      const start = homeText.lastIndexOf('.', at) + 1;
      const end = homeText.indexOf('.', at);
      const span = homeText.slice(start, end === -1 ? undefined : end + 1).trim();
      const nl = (passage.numberedLines ?? []) as Array<{ n: number; text: string }>;
      const lines = c.home === 'extract'
        ? nl.filter((l) => l.text && (span.includes(l.text.trim().slice(0, 35)) || l.text.includes(span.slice(0, 35)))).map((l) => l.n)
        : undefined;
      flag.strike = c.home === 'preamble' ? { span, field: 'preamble' } : { span, lines: lines ?? [] };
      if (typeof strike === 'string' && /DECLARED\(absence\)/.test(strike)) flag.strikeNote = strike.replace(/^SPAN PENDING-BYTES:\s*/, 'completed from: ');
      readings.push({ passage: pid, claim, span, home: c.home, ...(lines ? { lines } : { address: 'field: preamble (unnumbered)' }), reading: c.reading });
    }
    flags.push(flag);
  }
  if (!ok && flags.length === 0) continue;
  const existing = new Set(((passage.contentFlags as unknown[]) ?? [])
    .filter((f) => f && typeof f === 'object').map((f) => JSON.stringify(Object.entries(f as object).sort())));
  const fresh = flags.filter((f) => !existing.has(JSON.stringify(Object.entries(f).sort())));
  if (fresh.length < flags.length) results.push(`${pid}: ${flags.length - fresh.length} ALREADY LANDED — skipped.`);
  if (fresh.length === 0) continue;
  const displaced = legacy.filter((s) => fresh.some((f) => f.sourceProse === s));
  const kept = ((passage.contentFlags as unknown[]) ?? []).filter((f) => !displaced.includes(f as string));
  const wouldBe = { ...passage, contentFlags: [...kept, ...fresh],
    _displacedLegacyFlags: { ...((passage._displacedLegacyFlags as object) ?? {}), [`hundredandthird-${Date.now() % 100000}`]: { displaced, by: `annie-hundredandthird-return.md, sha256 ${sha}` } } };
  const report = readContentFlags(wouldBe, { enforceUse: true });
  if (report.refusals.length > 0) {
    results.push(`${pid}: THE DOOR REFUSES:`);
    for (const r of report.refusals) results.push(`    ${r.code}  ${r.detail}`);
    process.exitCode = 1;
    continue;
  }
  writeFileSync(path, JSON.stringify(wouldBe, null, 1));
  results.push(`${pid}: landed ${fresh.length}, displaced ${displaced.length} legacy string(s), sourceProse seeded from bytes`);
}

for (const s of screenings) {
  const path = join(REPO, `content/passages/${s.pid}.json`);
  const passage = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const legacy = ((passage.contentFlags as unknown[]) ?? []).filter((f) => typeof f === 'string') as string[];
  const decl = String(s.obj.declaration ?? '');
  const existing = ((passage.contentScreenings as unknown[]) ?? []);
  if (existing.some((e) => String((e as Record<string, unknown>).declaration ?? '') === decl)) {
    results.push(`${s.pid}: screening ALREADY LANDED (its declaration is in contentScreenings; its legacy line was displaced by that landing).`);
    continue;
  }
  const legacyRow = legacy.find((l) => l.trim() === decl.trim() || l.includes(decl.slice(0, 40)));
  if (!legacyRow) { results.push(`${s.pid}: SCREENING REFUSED TO HER — no legacy line carries its declaration.`); process.exitCode = 1; continue; }
  const record = { ...s.obj, sourceProse: legacyRow,
    _sourceProseSeededBy: `VERBATIM-AT-LANDING from the legacy row's bytes, annie-hundredandthird-return.md, sha256 ${sha}` };
  const wouldBe = { ...passage,
    contentFlags: ((passage.contentFlags as unknown[]) ?? []).filter((f) => f !== legacyRow),
    contentScreenings: [...existing, record],
    _displacedLegacyFlags: { ...((passage._displacedLegacyFlags as object) ?? {}),
      [`hundredandthird-screening`]: { displaced: [legacyRow], by: `annie-hundredandthird-return.md, sha256 ${sha}`, note: 'displaced into the corpus\'s first screening record — ruling eleven' } } };
  const report = readContentFlags(wouldBe, { enforceUse: true });
  if (report.refusals.length > 0) {
    results.push(`${s.pid}: THE DOOR REFUSES the screening:`);
    for (const r of report.refusals) results.push(`    ${r.code}  ${r.detail}`);
    process.exitCode = 1; continue;
  }
  writeFileSync(path, JSON.stringify(wouldBe, null, 1));
  results.push(`${s.pid}: SCREENED-CLEAN record landed (${(s.obj.axes as string[]).join(', ')}) — the corpus's first recorded zero`);
}
for (const r of results) console.log(r);

const payload = { what: 'The hundredandthird landing: sourceProse seeded from legacy bytes (form ruling ten), strikes completed incl. the first preamble strike, the rejection aside stamped as first of its class.', authority: `annie-hundredandthird-return.md, sha256 ${sha}`, readings, results };
const stamp = artefactStamp(payload, new Date().toISOString(), 'content', 'hundredandthird landing readings and verdicts', ['what', 'authority', 'readings', 'results']);
const out = join(REPO, 'content/exports', stampedName('hundredandthird-landing', stamp.sourceHash, 'json'));
writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
deliver(out, 'hundredandthird-landing');
