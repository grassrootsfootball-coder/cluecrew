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
const RETURN = '/Users/davidb/Downloads/annie-hundredth-return (1).md';
const EXPECTED = '5d1f1d21098eee0d22be1dcc96a8809b1bb1e49fc82513c05709e20b732cefcb';

const sha = createHash('sha256').update(readFileSync(RETURN)).digest('hex');
if (sha !== EXPECTED) throw new Error(`ABORTED — return digest ${sha}.`);
const body = readFileSync(RETURN, 'utf8');
const blocks = [...body.matchAll(/^\s+target: passage:([a-z0-9-]+):contentFlags\n(?:.*\n)?\s+authored: (\{.*\})$/gm)]
  .map((m) => ({ pid: m[1] as string, obj: JSON.parse(m[2] as string) as Record<string, unknown> }));
if (blocks.length !== 7) throw new Error(`ABORTED — parsed ${blocks.length} of 7.`);

const COMPLETIONS: Record<string, { anchor: string; home: 'extract' | 'preamble'; reading: string }> = {
  "the mother's correction within the extract": {
    anchor: 'begin again tomorrow', home: 'extract',
    reading: 'The correction is the mother\'s own counsel closing the quarrel; the narrator-does-not-endorse clause stays DECLARED(absence).',
  },
  "the narrator's refusal to vouch": {
    anchor: "I won’t vouch for the fact", home: 'extract',
    reading: 'The refusal is inside the reporting sentence itself — "It is said—I won\'t vouch for the fact—". Minimal: the oath-as-dash is the element.',
  },
  'the ending, the one thing she cared about returned': {
    anchor: 'she found her old straw hat', home: 'extract',
    reading: 'The ending sentence: the hat under the counterpane, snatched up with delight. Minimal: the fit and the tidying are the element.',
  },
  'the preamble naming her as Heidi': {
    anchor: 'Heidi has been brought from her mountain home', home: 'preamble',
    reading: 'THE FIRST PREAMBLE STRIKE: the met-claim\'s channel is the preamble, which is unnumbered — the span carries field:"preamble" as its address where numbered spans carry lines.',
  },
};

const readings: Array<Record<string, unknown>> = [];
const perPassage = new Map<string, Array<Record<string, unknown>>>();
for (const b of blocks) perPassage.set(b.pid, [...(perPassage.get(b.pid) ?? []), b.obj]);

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
      flag.rejectionAsideClass = 'FIRST MEMBER — rejection-preserved-only-in-a-comparative-aside; class pending David\'s ruling (hundredth return: do rejections get their own record?)';
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
    _displacedLegacyFlags: { ...((passage._displacedLegacyFlags as object) ?? {}), [`hundredth-${Date.now() % 100000}`]: { displaced, by: `annie-hundredth-return.md, sha256 ${sha}` } } };
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
for (const r of results) console.log(r);

const payload = { what: 'The hundredth landing: sourceProse seeded from legacy bytes (form ruling ten), strikes completed incl. the first preamble strike, the rejection aside stamped as first of its class.', authority: `annie-hundredth-return.md, sha256 ${sha}`, readings, results };
const stamp = artefactStamp(payload, new Date().toISOString(), 'content', 'hundredth landing readings and verdicts', ['what', 'authority', 'readings', 'results']);
const out = join(REPO, 'content/exports', stampedName('hundredth-landing', stamp.sourceHash, 'json'));
writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
deliver(out, 'hundredth-landing');
