/**
 * THE COMPARISON RE-RUN UNDER THE TEXT PREDICATE, PLUS THE THREE CLASSES IT SEPARATES
 * (Annie, 2026-08-26 — R769/R770/R771).
 *
 * **Key identity is TEXT identity of the keyed option, never label.** Under that predicate the
 * estate splits cleanly, and most of what has been travelling as a content disagreement is not one.
 * The option-set divergences cross blinded and in full — stem and options, both readings — because
 * the previous batch's stems were absent from the artefact she was reading.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const SEARCH = [join(REPO, 'content'), '/Users/davidb/Downloads/11+'];
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

interface Authored { itemId: string; stem?: { text?: string; prompt?: string }; options: Array<{ label?: string; content: string; isCorrect?: boolean }> }
const files = new Map<string, Map<string, Authored>>();
const walk = (dir: string, d = 0): string[] => d > 4 ? [] : (() => {
  try { return readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(dir, e.name), d + 1) : (e.name.endsWith('.json') ? [join(dir, e.name)] : [])); } catch { return []; }
})();
for (const f of SEARCH.flatMap((s) => walk(s))) {
  let parsed: unknown; try { parsed = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
  const items = (parsed as { items?: unknown })?.items;
  if (!Array.isArray(items) || !items.length) continue;
  if (!items.every((i) => i && typeof i === 'object' && 'itemId' in i && Array.isArray((i as { options?: unknown }).options))) continue;
  const m = new Map<string, Authored>();
  for (const it of items as Authored[]) if (it.options.every((o) => typeof o?.content === 'string')) m.set(it.itemId, it);
  if (m.size) files.set(f, m);
}
const stemText = (i: Authored) => (i.stem?.text ?? i.stem?.prompt ?? '').trim();
const keyTexts = (i: Authored) => new Set(i.options.filter((o) => o.isCorrect).map((o) => o.content));
const optTexts = (i: Authored) => new Set(i.options.map((o) => o.content));
const eqSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));

async function run() {
  assertFixture('text-predicate', [
    { name: 'same keyed TEXT under different letters agrees', input: JSON.stringify([{ options: [{ label: 'A', content: 'p', isCorrect: true }, { label: 'B', content: 'q' }] }, { options: [{ label: 'B', content: 'p', isCorrect: true }, { label: 'A', content: 'q' }] }]), mustBeCaught: true },
    { name: 'identical readings agree', input: JSON.stringify([{ options: [{ label: 'A', content: 'p', isCorrect: true }] }, { options: [{ label: 'A', content: 'p', isCorrect: true }] }]), mustBeCaught: true },
    { name: 'different keyed TEXT does not agree', input: JSON.stringify([{ options: [{ content: 'p', isCorrect: true }, { content: 'q' }] }, { options: [{ content: 'p' }, { content: 'q', isCorrect: true }] }]), mustBeCaught: false },
    { name: 'same letter keyed but different text does not agree', input: JSON.stringify([{ options: [{ label: 'A', content: 'p', isCorrect: true }] }, { options: [{ label: 'A', content: 'z', isCorrect: true }] }]), mustBeCaught: false },
  ], (raw) => { const [a, b] = JSON.parse(raw) as Authored[]; return eqSet(keyTexts(a!), keyTexts(b!)); });

  const byItem = new Map<string, Array<[string, Authored]>>();
  for (const [f, m] of files) for (const [id, it] of m) byItem.set(id, [...(byItem.get(id) ?? []), [f, it]]);
  const multi = [...byItem.entries()].filter(([, e]) => e.length > 1).sort(([a], [b]) => a.localeCompare(b));
  requirePopulation('emit:text-predicate', { 'items carried by two or more files': multi.length });

  const counts: Record<string, number> = {};
  const bump = (k: string) => { counts[k] = (counts[k] ?? 0) + 1; };
  const optionSetRows: Array<Record<string, unknown>> = [];
  const driftRows: Array<Record<string, unknown>> = [];
  const unmatchedStems: string[] = [];
  const unblind: Array<Record<string, string>> = [];

  for (const [itemId, entries] of multi) {
    const stems = new Set(entries.map(([, i]) => stemText(i)));
    const sameOpts = entries.every(([, i]) => eqSet(optTexts(i), optTexts(entries[0]![1])));
    const sameKey = entries.every(([, i]) => eqSet(keyTexts(i), keyTexts(entries[0]![1])));

    if (stems.size === 1 && sameOpts && sameKey) {
      bump(entries.every(([, i]) => canonicalJson(i) === canonicalJson(entries[0]![1])) ? 'BYTE-IDENTICAL' : 'LABEL PERMUTATION ONLY — identical under the text predicate');
      continue;
    }
    if (stems.size > 1) {
      // does this stem appear under a DIFFERENT id in one of the other files?
      const moved = new Set<string>();
      for (const [fa, ia] of entries) for (const [fb] of entries) {
        if (fb === fa) continue;
        for (const [jid, jt] of files.get(fb)!) if (jid !== itemId && stemText(jt) === stemText(ia)) moved.add(jid);
      }
      if (moved.size) {
        bump('NUMBERING DRIFT — the same stem wears a different id in the other file');
        driftRows.push({ itemId, sameStemAlsoAppearsAs: [...moved].sort(), stemsSeen: [...stems] });
      } else { bump('STEM UNMATCHED — differs, and appears under no other id in the compared file'); unmatchedStems.push(itemId); }
      continue;
    }
    if (!sameOpts) {
      bump('OPTION-SET DIVERGENCE — one stem, different options');
      /**
       * **THE ORDER IS SALTED WITH THE ITEM ID, WHICH REMOVES A CROSS-ROW CORRELATION.** Sorting on
       * the reading's content hash alone is uncorrelated with provenance PER ROW but not ACROSS
       * rows: measured on the first run, reading 1 was the same store on 7 of 8 rows. On eight rows
       * that is chance, and it is still a thread — deduce one row and the rest lean the same way.
       * Salting with the item id makes each row's order independent of every other's, while staying
       * fully deterministic and reproducible.
       */
      const readings = entries.map(([f, i]) => ({ f, i })).sort((x, y) => sha(itemId + canonicalJson(x.i)).localeCompare(sha(itemId + canonicalJson(y.i))));
      readings.forEach((r, n) => unblind.push({ itemId, [`reading ${n + 1}`]: r.f }));
      const row = {
        itemId,
        CLASS: 'OPTION-SET DIVERGENCE',
        HER_QUESTION: 'from the stem and options alone: which reading\'s option set is right — or REFUSE where the stem determines neither or both.',
        theStemBOTHreadingsSHARE: stemText(entries[0]![1]),
        readings: readings.map((r, n) => ({
          reading: `reading ${n + 1}`,
          stem: r.i.stem ?? null,
          options: r.i.options.map((o) => ({ label: o.label ?? null, text: o.content, thisReadingCallsItCorrect: o.isCorrect === true })),
        })),
      };
      const dg = digestOverText('this row as canonical JSON — keys sorted at EVERY level, separators (",",":"), ensure_ascii false — with the rowSha256 and rowSha256Spec fields absent', canonicalJson(row));
      optionSetRows.push({ ...row, rowSha256: dg.value, rowSha256Spec: dg.spec });
      continue;
    }
    bump('KEY TEXT DIFFERS — a real answer dispute');
  }

  // ---- attempts ---------------------------------------------------------------
  const attemptsTotal = await prisma.attempt.count();
  const withChoice = await prisma.attempt.count({ where: { chosenOptionId: { not: null } } });
  const chosen = await prisma.attempt.findMany({ where: { chosenOptionId: { not: null } }, select: { itemId: true, chosenOptionId: true } });
  const liveOptionIds = new Set((await prisma.itemOption.findMany({ select: { id: true } })).map((o) => o.id));
  const dangling = chosen.filter((a) => !liveOptionIds.has(a.chosenOptionId!));

  const attempts = {
    THE_QUESTION: 'do any recorded attempts predate an option permutation — and do attempts store a letter or the text?',
    THE_ANSWER_IS_NEITHER: 'Attempt.chosenOptionId stores the ItemOption ROW ID — a cuid. Not a letter, and not the text. So a permutation that only reassigns LETTERS over the same rows leaves every attempt meaning exactly what it meant.',
    ANDTHATISNOTTHEENDOFIT: 'chosenOptionId carries NO FOREIGN KEY — it is a bare String? with no relation and no cascade. SIX writers delete and recreate an item\'s options rather than updating them, including the CMS edit path (apps/web/lib/actions/admin-items.ts:126), generate-content.ts, import-vr-banks.ts and three vr deploy scripts. Any of those silently re-mints the ids, and every attempt on that item is left pointing at a row that no longer exists. Nothing reports it, because nothing can: there is no constraint to violate.',
    THE_MEMBERSHIP_TODAY: { attemptsRecorded: attemptsTotal, carryingAChosenOption: withChoice, chosenOptionIdsThatNoLongerRESOLVE: dangling.length, itemsAffected: [...new Set(dangling.map((d) => d.itemId))].length },
    SO_THE_EXPOSURE_IS: attemptsTotal === 0
      ? 'nil, because no attempt has ever been recorded.'
      : `nil TODAY — ${dangling.length} of ${withChoice} chosen ids fail to resolve. But ${attemptsTotal} attempts is a pre-production population, so this is a measurement of how little has happened yet and NOT evidence that the mechanism is safe. The window to fix it cheaply is now, while the table is this small.`,
    whatWouldFIXit: 'a foreign key on chosenOptionId, or an update-in-place path for options instead of delete-and-recreate. Not built; this is a report.',
  };

  const payload = {
    kind: 'text-predicate-recross',
    what: 'The estate-wide comparison re-run under the ruled predicate, its three separated classes, the attempts check, and the option-set divergences blinded and in full.',
    THE_RULED_PREDICATE: 'key identity is TEXT identity of the keyed option, never label.',
    A_WHAT_SURVIVES: {
      itemsCarriedByTwoOrMoreFiles: multi.length,
      counts,
      THE_ANSWER_DISPUTE_CLASS: (counts['KEY TEXT DIFFERS — a real answer dispute'] ?? 0) === 0
        ? 'EMPTY. Estate-wide, not one item has two readings that offer the same options under the same stem and key different TEXT. Every apparent answer dispute so far has been a label permutation, a numbering drift, or an option-set divergence.'
        : `${counts['KEY TEXT DIFFERS — a real answer dispute']} items.`,
      andTHECOUNT: `the desk named six option-set divergences; this run finds ${optionSetRows.length}, estate-wide rather than within the earlier 24. All ${optionSetRows.length} cross below. If six is the intended set, the two extra are named here rather than dropped to make the numbers agree.`,
      optionSetDivergenceIds: optionSetRows.map((r) => r.itemId),
    },
    B_THE_NUMBERING_DRIFT_CLASS: {
      why: 'reported as its own class BEFORE any of it is read as a content fault, because it is not one: the content agrees and the ID moved.',
      count: driftRows.length,
      THE_SHAPE: 'ENG-005-BB-02 through BB-08 form an OFF-BY-ONE CHAIN — each item\'s stem appears one position over in the other file, seven consecutive items shifted as a run. ENG-007-LP-07 and LP-09 are a straight swap: the folded-paper question ("What did Reuben do with the folded paper from his pocket? (lines 34 to 36)") is LP-07 in one file and LP-09 in the other.',
      rows: driftRows,
      andTheUNMATCHED: { count: unmatchedStems.length, ids: unmatchedStems, meaning: 'the stem differs AND appears under no other id in the compared file. That is consistent with a genuinely different question OR with the tail of a shift whose counterpart is absent from the file compared — the BB run ends right where these begin. Reported UNKNOWN rather than assigned to either (R98).' },
    },
    C_THE_ATTEMPTS_CHECK: attempts,
    D_THE_BLINDING: {
      whatWasRemoved: 'file paths, directory names, store names, and the serving row.',
      whatWasNOTremoved: 'nothing. Every row carries BOTH readings in full — stem and every option — which the previous batch did not: the artefact she was reading (key-disagreements-for-annie) carried options without stems. The later blinded batch did carry them, so this may be two artefacts rather than one omission.',
      order: 'readings sorted by sha256(itemId + the reading\'s own canonical JSON) — deterministic and reproducible, uncorrelated with provenance, and SALTED PER ITEM so the orders do not correlate across rows. Sorting on content alone left reading 1 on the same side for 7 of 8 rows: chance at that size, and still a thread worth cutting.',
      map: 'held at content/text-predicate-unblinding.json. Not staged.',
    },
    OPTION_SET_DIVERGENCES: optionSetRows,
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['A_WHAT_SURVIVES', 'B_THE_NUMBERING_DRIFT_CLASS', 'C_THE_ATTEMPTS_CHECK', 'OPTION_SET_DIVERGENCES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('text-predicate-recross', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  writeFileSync(join(REPO, 'content/text-predicate-unblinding.json'), `${JSON.stringify({ note: 'HELD THIS SIDE. Never staged.', map: unblind }, null, 1)}\n`);
  deliver(join(REPO, 'content/exports', name), 'text-predicate-recross');
  console.log(`items ${multi.length} | ${JSON.stringify(counts)}`);
  console.log(`option-set divergences crossed: ${optionSetRows.length} | drift ${driftRows.length} | attempts ${attemptsTotal}, dangling ${dangling.length}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
