/**
 * THE NINETY-SIXTH'S EIGHT OBJECTS AND ONE RECLASSIFICATION, THROUGH THE DOOR.
 *
 * Standing precedent throughout: objects parsed from her block's own JSON; displaced legacy strings
 * byte-guarded against `sourceProse`; SPAN completions cut minimal from THIS store's bytes (R635)
 * with the reading carried; declarations land with their kind; the ALREADY-LANDED guard (R631);
 * **and the door itself rules on the axis the table does not hold** — a refusal is a report to her,
 * never a workaround.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentFlags } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const RETURN = '/Users/davidb/Downloads/annie-ninetysixth-return.md';
const EXPECTED = '583e61414cff67d44397f8713d34e9c8edd5fa6c7dd4d5e0b66ed55f6cac22e4';

const sha = createHash('sha256').update(readFileSync(RETURN)).digest('hex');
if (sha !== EXPECTED) throw new Error(`ABORTED — return digest ${sha}.`);
const body = readFileSync(RETURN, 'utf8');
const blocks = [...body.matchAll(/^\s+target: passage:([a-z0-9-]+):(contentFlags|readingSupport)\n(?:.*\n)?\s+authored: (\{.*\})$/gm)]
  .map((m) => ({ pid: m[1] as string, field: m[2] as string, obj: JSON.parse(m[3] as string) as Record<string, unknown> }));
if (blocks.length !== 9) throw new Error(`ABORTED — parsed ${blocks.length} of 9 authored entries.`);

/** Minimal-span completions (R635), each a reading carried for her check. */
const COMPLETIONS: Record<string, { anchor: string; reading: string }> = {
  'she states plainly that she feels no fear': {
    anchor: 'not at all afraid',
    reading: 'Her claim is the girl\'s own statement of composure; the span is the sentence where she states it. Minimal: the surrounding courtesy is corroboration, not the claim.',
  },
  'Elizabeth turning it into a funny story': {
    anchor: 'told the story',
    reading: 'The claim is the turning-into-a-story, so the span is the sentence recording the telling with great spirit. Minimal: the snub itself is the element, not the claim.',
  },
};

const readings: Array<Record<string, unknown>> = [];
const perPassage = new Map<string, { flags: Array<Record<string, unknown>>; support: Array<Record<string, unknown>> }>();
/* eslint-disable prefer-const */

for (const b of blocks) {
  const entry = perPassage.get(b.pid) ?? { flags: [], support: [] };
  if (b.field === 'readingSupport') { entry.support.push(b.obj); perPassage.set(b.pid, entry); continue; }
  const flag = { ...b.obj };
  const strike = flag.strike;
  if (typeof strike === 'string' && strike.startsWith('SPAN PENDING-BYTES')) {
    const claim = Object.keys(COMPLETIONS).find((c) => strike.includes(c));
    if (!claim) throw new Error(`REFUSED TO HER — pending span carries no claim this lander can place: ${JSON.stringify(strike)}.`);
    const p = JSON.parse(readFileSync(join(REPO, `content/passages/${b.pid}.json`), 'utf8')) as { extract: string; numberedLines?: Array<{ n: number; text: string }> };
    const c = COMPLETIONS[claim]!;
    const at = p.extract.indexOf(c.anchor);
    if (at === -1) {
      const cand = (p.numberedLines ?? []).filter((l) => /afraid|fear|story|laugh|spirit/i.test(l.text)).slice(0, 6);
      throw new Error(`REFUSED TO HER — cannot place "${claim}" in ${b.pid}. Candidates:\n${cand.map((l) => `  line ${l.n}: ${l.text}`).join('\n')}`);
    }
    const start = p.extract.lastIndexOf('.', at) + 1;
    const end = p.extract.indexOf('.', at);
    const span = p.extract.slice(start, end === -1 ? undefined : end + 1).trim();
    const lines = (p.numberedLines ?? []).filter((l) => l.text && span.includes(l.text.trim().slice(0, 40))).map((l) => l.n).filter((n) => n != null);
    // The absence sub-clause her strike string names stays declared and reported.
    const declaredNote = /DECLARED\(absence\)/.test(strike) ? ' The strike string\'s absence sub-clause stays DECLARED(absence) via the flag note.' : '';
    flag.strike = { span, lines };
    if (declaredNote) flag.strikeNote = `${strike.replace(/^SPAN PENDING-BYTES:\s*/, 'completed from: ')}`;
    readings.push({ passage: b.pid, claim, completedAs: 'MINIMAL SPAN', span, lines, reading: c.reading + declaredNote });
  }
  entry.flags.push(flag);
  perPassage.set(b.pid, entry);
}

const results: string[] = [];
for (const [pid, entry] of perPassage) {
  const path = join(REPO, `content/passages/${pid}.json`);
  const passage = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const existing = new Set(((passage.contentFlags as unknown[]) ?? [])
    .filter((f) => f && typeof f === 'object')
    .map((f) => JSON.stringify(Object.entries(f as object).sort())));
  const already = entry.flags.filter((f) => existing.has(JSON.stringify(Object.entries(f).sort())));
  if (already.length > 0) { results.push(`${pid}: ALREADY LANDED (${already.length}) — nothing written.`); continue; }

  /**
   * **THE REFUSAL IS PER-FLAG, NOT PER-PASSAGE.** The convict flag carries an axis whose creating
   * ruling has not crossed (the table shows no crime-as-background; her block calls it the second
   * member on its first day — the first member and the ruling are in an uncrossed return). Refusing
   * the whole passage for it would hold her two valid judgements hostage to a crossing gap. Each
   * flag is screened alone; a refused flag stays OUT with its legacy string UNDISPLACED, and the
   * refusal goes to her.
   */
  const admissible: Array<Record<string, unknown>> = [];
  for (const f of entry.flags) {
    const ex = (passage as { extract?: unknown }).extract;
    const solo = readContentFlags({ id: pid, contentFlags: [f], extract: typeof ex === 'string' ? ex : undefined }, { enforceUse: true });
    if (solo.refusals.length > 0) {
      for (const r of solo.refusals) results.push(`${pid}: FLAG REFUSED TO HER (${String(f.axis)}) — ${r.code}: ${r.detail}`);
      continue;
    }
    admissible.push(f);
  }
  entry.flags = admissible;
  if (admissible.length === 0 && entry.support.length === 0) { results.push(`${pid}: nothing admissible; nothing written.`); continue; }

  const legacy = ((passage.contentFlags as unknown[]) ?? []).filter((f) => typeof f === 'string');
  const proses = [...entry.flags, ...entry.support].map((f) => String(f.sourceProse));
  const displaced: unknown[] = legacy.filter((s) => proses.includes(String(s)));
  const kept = ((passage.contentFlags as unknown[]) ?? []).filter((f) => !displaced.includes(f));
  const wouldBe: Record<string, unknown> = {
    ...passage,
    contentFlags: [...kept, ...entry.flags],
    ...(entry.support.length > 0 ? { readingSupport: [...((passage.readingSupport as unknown[]) ?? []), ...entry.support] } : {}),
    _displacedLegacyFlags: {
      ...((passage._displacedLegacyFlags as object) ?? {}),
      ninetysixth: { displaced, by: `annie-ninetysixth-return.md, sha256 ${sha}` },
    },
  };
  const report = readContentFlags(wouldBe, { enforceUse: true });
  if (report.refusals.length > 0) {
    results.push(`${pid}: THE DOOR REFUSES — nothing written on this passage:`);
    for (const r of report.refusals) results.push(`    ${r.code}  ${r.detail}`);
    process.exitCode = 1;
    continue;
  }
  writeFileSync(path, JSON.stringify(wouldBe, null, 1));
  results.push(`${pid}: landed ${entry.flags.length} flag(s)${entry.support.length ? ` + ${entry.support.length} reading-support note(s)` : ''}, displaced ${displaced.length} legacy string(s)`);
}
for (const r of results) console.log(r);

const payload = {
  what: 'Strike readings and door verdicts at the ninety-sixth landing, for her check.',
  authority: `annie-ninetysixth-return.md, sha256 ${sha}`,
  readings,
  doorVerdicts: results,
};
const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
  'ninety-sixth landing: readings and door verdicts', ['what', 'authority', 'readings', 'doorVerdicts']);
const out = join(REPO, 'content/exports', stampedName('ninetysixth-landing', stamp.sourceHash, 'json'));
writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
deliver(out, 'ninetysixth-landing');
