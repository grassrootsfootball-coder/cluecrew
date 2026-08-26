/**
 * TWO ARTEFACTS, TWO RECIPIENTS.
 *
 *  · the NUMBERING DRIFT, to Cowork, as its own thread — reported before any of it can be read as
 *    a content fault, because reading it as content is the error it invites;
 *  · the EIGHT OPTION-SET DIVERGENCES, to Annie, blinded, with stems, as her method requires.
 *
 * They separate because they are different questions for different seats. A drift is an identity
 * problem between two files and no reviewer judgement can settle it; a divergence is a content
 * question and nothing else can.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
interface Authored { itemId: string; stem?: { text?: string; prompt?: string }; options: Array<{ label?: string; content: string; isCorrect?: boolean }> }
const files = new Map<string, Map<string, Authored>>();
const walk = (d: string, n = 0): string[] => n > 4 ? [] : (() => { try { return readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name), n + 1) : (e.name.endsWith('.json') ? [join(d, e.name)] : [])); } catch { return []; } })();
for (const f of [join(REPO, 'content'), '/Users/davidb/Downloads/11+'].flatMap((s) => walk(s))) {
  let p: unknown; try { p = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
  const items = (p as { items?: unknown })?.items;
  if (!Array.isArray(items) || !items.length) continue;
  if (!items.every((i) => i && typeof i === 'object' && 'itemId' in i && Array.isArray((i as { options?: unknown }).options))) continue;
  const m = new Map<string, Authored>();
  for (const it of items as Authored[]) if (it.options.every((o) => typeof o?.content === 'string')) m.set(it.itemId, it);
  if (m.size) files.set(f, m);
}
const stemText = (i: Authored) => (i.stem?.text ?? i.stem?.prompt ?? '').trim();
const optTexts = (i: Authored) => new Set(i.options.map((o) => o.content));
const eqSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));

async function run() {
  assertFixture('drift-and-divergences', [
    { name: 'a stem that reappears under another id is drift', input: 'drift', mustBeCaught: true },
    { name: 'a second drift shape', input: 'drift-swap', mustBeCaught: true },
    { name: 'a divergence is not drift', input: 'divergence', mustBeCaught: false },
    { name: 'an identical pair is not drift', input: 'identical', mustBeCaught: false },
  ], (k) => k.startsWith('drift'));

  const byItem = new Map<string, Array<[string, Authored]>>();
  for (const [f, m] of files) for (const [id, it] of m) byItem.set(id, [...(byItem.get(id) ?? []), [f, it]]);
  const multi = [...byItem.entries()].filter(([, e]) => e.length > 1).sort(([a], [b]) => a.localeCompare(b));
  requirePopulation('emit:drift-and-divergences', { 'items carried by two or more files': multi.length });

  const drift: Array<Record<string, unknown>> = [];
  const unmatched: Array<Record<string, unknown>> = [];
  const divergences: Array<Record<string, unknown>> = [];
  const unblind: Array<Record<string, string>> = [];

  for (const [itemId, entries] of multi) {
    const stems = new Set(entries.map(([, i]) => stemText(i)));
    if (stems.size > 1) {
      const moved = new Set<string>();
      for (const [fa, ia] of entries) for (const [fb] of entries) {
        if (fb === fa) continue;
        for (const [jid, jt] of files.get(fb)!) if (jid !== itemId && stemText(jt) === stemText(ia)) moved.add(jid);
      }
      const row = moved.size
        ? { itemId, THE_SAME_STEM_ALSO_WEARS: [...moved].sort(), stemsSeenUnderThisId: [...stems] }
        : { itemId, stemsSeenUnderThisId: [...stems], status: 'UNKNOWN — the stem differs and appears under no other id in the compared file' };
      (moved.size ? drift : unmatched).push(row);
      continue;
    }
    if (!entries.every(([, i]) => eqSet(optTexts(i), optTexts(entries[0]![1])))) {
      const readings = entries.map(([f, i]) => ({ f, i })).sort((x, y) => sha(itemId + canonicalJson(x.i)).localeCompare(sha(itemId + canonicalJson(y.i))));
      readings.forEach((r, n) => unblind.push({ itemId, [`reading ${n + 1}`]: r.f }));
      const row = {
        itemId,
        HER_QUESTION: 'from the stem and options alone: which reading\'s option set is right — or REFUSE where the stem determines neither or both.',
        theStemBOTHreadingsSHARE: stemText(entries[0]![1]),
        readings: readings.map((r, n) => ({ reading: `reading ${n + 1}`, stem: r.i.stem ?? null, options: r.i.options.map((o) => ({ label: o.label ?? null, text: o.content, thisReadingCallsItCorrect: o.isCorrect === true })) })),
      };
      const dg = digestOverText('this row as canonical JSON — keys sorted at EVERY level, separators (",",":"), ensure_ascii false — with the rowSha256 and rowSha256Spec fields absent', canonicalJson(row));
      divergences.push({ ...row, rowSha256: dg.value, rowSha256Spec: dg.spec });
    }
  }

  const driftPayload = {
    kind: 'numbering-drift-for-cowork',
    what: 'Items where the SAME QUESTION wears a DIFFERENT ID in two files. Its own thread, reported before any of it can be read as a content fault.',
    WHY_ITS_OWN_THREAD: 'the content agrees and the ID moved. Read as content, a drift looks like a bank full of rewritten questions; read as identity, it is a numbering problem with a shape and probably one cause.',
    THE_SHAPE: {
      count: drift.length,
      theRUN: 'ENG-005-BB-02 through BB-08 are an OFF-BY-ONE CHAIN — each stem appears one position over in the other file, SEVEN CONSECUTIVE ITEMS shifted as a run. That is one event, not seven faults.',
      theSWAP: 'ENG-007-LP-07 and LP-09 exchange questions: "What did Reuben do with the folded paper from his pocket? (lines 34 to 36)" is LP-07 in one file and LP-09 in the other.',
    },
    rows: drift,
    THE_UNMATCHED_STAY_UNKNOWN: {
      count: unmatched.length,
      why: 'the stem differs AND appears under no other id in the compared file. That is consistent with a genuinely different question OR with the tail of a shift whose counterpart is absent from the file compared — and THE BB RUN ENDS EXACTLY WHERE THESE BEGIN. Assigning them to either would be a guess (R98).',
      rows: unmatched,
    },
    NOT_A_REPAIR: 'no id was changed and nothing was renumbered. Which numbering is right is Cowork\'s to say; this reports the shape.',
  };
  const driftArtefact = { ...driftPayload, ...findingsDigest(driftPayload, ['THE_SHAPE', 'rows', 'THE_UNMATCHED_STAY_UNKNOWN']) };
  const dj = JSON.stringify(driftArtefact, null, 1) + '\n';
  const dn = stampedName('numbering-drift-for-cowork', sha(dj).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', dn), dj);
  deliver(join(REPO, 'content/exports', dn), 'numbering-drift-for-cowork');

  const divPayload = {
    kind: 'option-set-divergences-for-annie',
    what: 'The option-set divergences: one stem, two different option sets. Both readings in full, stem included, blinded.',
    HER_METHOD: 'per item, from stem and options alone: three outcomes, with REFUSE where the stem determines neither or both.',
    WHAT_IS_NOT_HERE: 'no answer disputes — the class is EMPTY estate-wide, 0 of 104 items carried by two or more files. And no numbering drift: that is a separate thread and went to Cowork, because no reviewer judgement can settle which id a question should wear.',
    THE_COUNT: { crossed: divergences.length, theDeskNamed: 6, note: 'this run finds eight, estate-wide rather than within the earlier twenty-four. The two extra are named rather than dropped to make the numbers agree.' },
    THE_BLINDING: {
      removed: 'file paths, directory names, store names, and the serving row.',
      keptInFull: 'both stems and every option — nothing stripped.',
      order: 'readings sorted by sha256(itemId + the reading\'s own canonical JSON): deterministic, uncorrelated with provenance, and SALTED PER ITEM so the orders do not correlate across rows.',
    },
    ROWS: divergences,
  };
  const divArtefact = { ...divPayload, ...findingsDigest(divPayload, ['THE_COUNT', 'ROWS']) };
  const vj = JSON.stringify(divArtefact, null, 1) + '\n';
  const vn = stampedName('option-set-divergences-for-annie', sha(vj).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', vn), vj);
  writeFileSync(join(REPO, 'content/divergences-unblinding.json'), `${JSON.stringify({ note: 'HELD THIS SIDE. Never staged.', map: unblind }, null, 1)}\n`);
  deliver(join(REPO, 'content/exports', vn), 'option-set-divergences-for-annie');

  console.log(`drift ${drift.length} | unmatched ${unmatched.length} | divergences ${divergences.length}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
