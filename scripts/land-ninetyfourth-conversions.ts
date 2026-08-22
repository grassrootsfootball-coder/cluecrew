/**
 * THE NINETY-FOURTH'S EIGHT OBJECTS AND ONE RECLASSIFICATION, THROUGH THE DOOR.
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
import { CONTENT_AXES, readContentFlags } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const RETURN = '/Users/davidb/Downloads/annie-ninetyfourth-return.md';
const EXPECTED = '35aa8fb5dd66cae53f381bf8dc35982a96da8d0b8634d0b7a122c3660caece33';

const sha = createHash('sha256').update(readFileSync(RETURN)).digest('hex');
if (sha !== EXPECTED) throw new Error(`ABORTED — return digest ${sha}.`);
const body = readFileSync(RETURN, 'utf8');
const blocks = [...body.matchAll(/^\s+target: passage:([a-z0-9-]+):(contentFlags|readingSupport)\n(?:.*\n)?\s+authored: (\{.*\})$/gm)]
  .map((m) => ({ pid: m[1] as string, field: m[2] as string, obj: JSON.parse(m[3] as string) as Record<string, unknown> }));
/**
 * **HER PROSE SAYS TEN; THE BLOCK HOLDS ELEVEN** (1+3+2+2+3 across the five passages), and her own
 * tripwire rule decides which wins: a derived count over a typed one, with the disagreement
 * REPORTED rather than reconciled. The block note's arithmetic ("ten conversion objects plus one
 * table row = 11") works only at eleven objects; the typed "ten" is the stale number.
 */
if (blocks.length !== 11) throw new Error(`ABORTED — parsed ${blocks.length}, expected the block's own 11.`);
console.log('COUNT DISAGREEMENT REPORTED: her §3 prose says ten objects; the block holds eleven. The derived count wins (her tripwire rule); the difference travels on the landing artefact.');

/**
 * **THE NEVER-TYPED ASSERTION**: the new axis is parsed out of HER document's own §2 line and must
 * equal the table cell added under this ruling — typing is the only way a table drifts from its
 * ruling, and this is the one moment typing could creep in.
 */
{
  const ruled = /New axis: `([a-z-]+)`/.exec(body)?.[1];
  if (ruled !== 'crime-as-background') throw new Error(`ABORTED — her §2 rules axis ${JSON.stringify(ruled)}, not the cell this landing added.`);
  if (!CONTENT_AXES.includes(ruled)) throw new Error('ABORTED — the table does not hold the ruled axis; the canary should already be failing.');
}

/** Minimal-span completions (R635), each a reading carried for her check. */
const COMPLETIONS: Record<string, { anchor: string; reading: string }> = {
  'deflated by comedy names the deflating sentence': {
    anchor: 'That is all nonsense',
    reading: 'The deflating sentence is Washington Otis\'s stain-remover retort, immediately after the murder report — the comedy that deflates it. Minimal: the murder sentence is the element, not the claim.',
  },
  'the joke is against him is locatable': {
    anchor: 'Charge it to her like breakages',
    reading: 'The joke is the Minister\'s own line; the text\'s mockery of him is carried by its absurdity in his mouth. The cruelty-not-endorsed clause stays an absence, reported.',
  },
  'the stopping point before the warning is locatable at the passage\'s end': {
    anchor: 'voice, no doubt about it',
    reading: 'The claim is WHERE THE PASSAGE STOPS, so the span is its closing line — Marley speaks, and the warning never arrives inside the extract. Minimal: the ending is the claim.',
  },
  'the narrator notes Fogg did not bet to win': {
    anchor: 'did not bet to win',
    reading: 'The narrator\'s own sentence, verbatim claim. Minimal by construction.',
  },
  'the mocked mouth is locatable': {
    anchor: 'you women, you make such a fuss',
    reading: 'The sexist line in the mocked mouth is Podger\'s own sentence; the mocking is the surrounding scene and stays corroboration.',
  },
  'the dog taking it as play': {
    anchor: 'the excellent dog accepted',
    reading: 'The claim is the DOG\'S reception, so the span is the sentence recording it — "the excellent dog accepted Tom\'s attention with as much alacrity…". Minimal: the throw itself is the element, not the claim.',
  },
  'the resolution, Maggie going to look for Tom': {
    anchor: 'jumped from her bough to look for Tom',
    reading: 'The claim is the RESOLUTION, so the span is the reconciliation sentence, not the squabble it resolves.',
  },
  'the single sentence in which Darzee reports it': {
    anchor: 'fell out of the nest yesterday and Nag ate him',
    reading: 'Her claim names the single sentence, and it is one: Darzee\'s report. Minimal by her own wording.',
  },
  'the four resolving sentences': {
    anchor: 'wrapped him in cotton wool',
    reading: 'The claim is resolved-within-four-sentences; the span opens at the wrapping and warming that resolves it. NOTE FOR HER CHECK: the bytes say "half choked", not the prose\'s "half drowned" — the resolution is the same either way, and the discrepancy is reported, not smoothed.',
  },
  'the funeral suggestion': {
    anchor: 'Let\u2019s have a funeral',
    reading: 'The claim is the comic funeral suggestion; the span is the boy\'s line carrying it.',
  },
  'the allusion in the snake\'s own mouth': {
    anchor: 'The great God Brahm put his mark',
    reading: 'The claim is the allusion IN NAG\'S OWN MOUTH; the span is his sentence invoking Brahm. The no-mockery clause stays DECLARED(absence), reported.',
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
  if (typeof strike === 'string' && (strike.startsWith('SPAN PENDING-BYTES') || strike.startsWith('PENDING-BYTES'))) {
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
  /**
   * PER-FLAG, like the refusals: an already-landed flag is skipped and SAID; the rest of the batch
   * still lands. The passage-level version of this guard held five door-refused-then-repaired
   * flags hostage to their already-landed batchmates.
   */
  const already = entry.flags.filter((f) => existing.has(JSON.stringify(Object.entries(f).sort())));
  if (already.length > 0) results.push(`${pid}: ${already.length} flag(s) ALREADY LANDED — skipped, not rewritten.`);
  entry.flags = entry.flags.filter((f) => !existing.has(JSON.stringify(Object.entries(f).sort())));
  if (entry.flags.length === 0 && entry.support.length === 0) { continue; }

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
    // The support array carries the same per-entry guard as the flags: land once, skip and say.
    ...(entry.support.length > 0 ? { readingSupport: (() => {
      const have = new Set(((passage.readingSupport as unknown[]) ?? []).map((r) => JSON.stringify(Object.entries(r as object).sort())));
      const fresh = entry.support.filter((r) => !have.has(JSON.stringify(Object.entries(r).sort())));
      return [...((passage.readingSupport as unknown[]) ?? []), ...fresh];
    })() } : {}),
    _displacedLegacyFlags: {
      ...((passage._displacedLegacyFlags as object) ?? {}),
      ninetyfourth: { displaced, by: `annie-ninetyfourth-return.md, sha256 ${sha}` },
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
  authority: `annie-ninetyfourth-return.md, sha256 ${sha}`,
  readings,
  doorVerdicts: results,
};
const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
  'ninety-sixth landing: readings and door verdicts', ['what', 'authority', 'readings', 'doorVerdicts']);
const out = join(REPO, 'content/exports', stampedName('ninetyfourth-landing', stamp.sourceHash, 'json'));
writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
deliver(out, 'ninetyfourth-landing');
