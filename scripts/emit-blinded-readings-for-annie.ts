/**
 * THE TWO READINGS, BLINDED, FOR HER RULED METHOD (David, 2026-08-26 — R768).
 *
 * **She has asked not to know which reading is which**, and the reason is not delicacy: a label
 * that leaks is a shortcut she cannot unsee. So no file path, no store name, and NO SERVING ROW —
 * the serving row was in the previous artefact as a stated non-vote, and it identifies the
 * database's reading exactly. **Its honesty label does not make it unreadable.**
 *
 * Reading order is fixed by the SHA of the reading's own content, so it is deterministic,
 * reproducible, and uncorrelated with provenance. The unblinding map is written to the repo and is
 * NOT staged.
 *
 * **NOTHING IS STRIPPED.** Both stems and all options cross in full, which is what her method
 * needs: per item, from stem and options alone, three outcomes, REFUSE where the stem determines
 * neither or both.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const SEARCH = [join(REPO, 'content'), '/Users/davidb/Downloads/11+'];
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

interface Authored { itemId: string; stem: unknown; options: Array<{ label?: string; content: string; isCorrect?: boolean }> }
const byFile = new Map<string, Map<string, Authored>>();

function walkJson(dir: string, depth = 0): string[] {
  if (depth > 4) return [];
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walkJson(join(dir, e.name), depth + 1) : (e.name.endsWith('.json') ? [join(dir, e.name)] : []));
  } catch { return []; }
}

for (const file of SEARCH.flatMap((d) => walkJson(d))) {
  let parsed: unknown;
  try { parsed = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
  const items = (parsed as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0) continue;
  if (!items.every((i) => i && typeof i === 'object' && 'itemId' in i && Array.isArray((i as { options?: unknown }).options))) continue;
  const m = new Map<string, Authored>();
  for (const it of items as Authored[]) {
    if (!it.options.every((o) => typeof o?.content === 'string')) continue;
    m.set(it.itemId, it);
  }
  if (m.size) byFile.set(file, m);
}

/** Mechanical classification from stem and options alone — the thing her method would otherwise do by hand. */
function classify(a: Authored, b: Authored) {
  const stemSame = canonicalJson(a.stem) === canonicalJson(b.stem);
  const setA = new Set(a.options.map((o) => o.content));
  const setB = new Set(b.options.map((o) => o.content));
  const sameSet = setA.size === setB.size && [...setA].every((x) => setB.has(x));
  const keyA = new Set(a.options.filter((o) => o.isCorrect).map((o) => o.content));
  const keyB = new Set(b.options.filter((o) => o.isCorrect).map((o) => o.content));
  const sameKeyText = keyA.size === keyB.size && [...keyA].every((x) => keyB.has(x));
  if (!stemSame) return { class: 'DIFFERENT QUESTION', why: 'the two readings carry DIFFERENT STEMS. Each key is correct for its own stem, so there is no disagreement about an answer — there are two questions sharing one id. Her method cannot be applied: it reads one stem, and there are two.' };
  if (!sameSet) return { class: 'OPTION-SET DIVERGENCE', why: 'one stem, but the readings offer different options. Ruled a separate class: this is not a dispute about which answer is right, it is a dispute about what the item asks the child to choose between.' };
  if (sameKeyText) return { class: 'RELABELLING ONLY', why: 'the same option TEXT is keyed in both; only the letter it sits under differs. Nothing about the answer is in dispute.' };
  return { class: 'KEY DISPUTE', why: 'same stem, same options, different answer. This is the class her three-outcome method is for.' };
}

async function run() {
  assertFixture('blinded-readings', [
    { name: 'differing stems classify as DIFFERENT QUESTION', input: JSON.stringify([{ itemId: 'x', stem: { text: 'A?' }, options: [{ content: 'p', isCorrect: true }] }, { itemId: 'x', stem: { text: 'B?' }, options: [{ content: 'p', isCorrect: true }] }]), mustBeCaught: true },
    { name: 'same stem with different options classifies as OPTION-SET DIVERGENCE', input: JSON.stringify([{ itemId: 'x', stem: { text: 'A?' }, options: [{ content: 'p', isCorrect: true }] }, { itemId: 'x', stem: { text: 'A?' }, options: [{ content: 'q', isCorrect: true }] }]), mustBeCaught: true },
    { name: 'a true key dispute is NOT one of those two', input: JSON.stringify([{ itemId: 'x', stem: { text: 'A?' }, options: [{ content: 'p', isCorrect: true }, { content: 'q' }] }, { itemId: 'x', stem: { text: 'A?' }, options: [{ content: 'p' }, { content: 'q', isCorrect: true }] }]), mustBeCaught: false },
    { name: 'identical readings are not either', input: JSON.stringify([{ itemId: 'x', stem: { text: 'A?' }, options: [{ content: 'p', isCorrect: true }] }, { itemId: 'x', stem: { text: 'A?' }, options: [{ content: 'p', isCorrect: true }] }]), mustBeCaught: false },
  ], (raw) => { const [a, b] = JSON.parse(raw) as Authored[]; const c = classify(a!, b!).class; return c === 'DIFFERENT QUESTION' || c === 'OPTION-SET DIVERGENCE'; });

  // every item carried by two or more files, where the readings differ at all
  const itemFiles = new Map<string, string[]>();
  for (const [file, items] of byFile) for (const id of items.keys()) itemFiles.set(id, [...(itemFiles.get(id) ?? []), file]);
  const contested = [...itemFiles.entries()].filter(([id, fs]) => {
    if (fs.length < 2) return false;
    const shapes = new Set(fs.map((f) => canonicalJson({ stem: byFile.get(f)!.get(id)!.stem, options: byFile.get(f)!.get(id)!.options })));
    return shapes.size > 1;
  }).sort(([a], [b]) => a.localeCompare(b));
  requirePopulation('emit:blinded-readings', { 'items whose readings differ': contested.length });

  const unblind: Array<Record<string, string>> = [];
  const rows = contested.map(([itemId, fs]) => {
    const readings = fs.map((f) => ({ file: f, item: byFile.get(f)!.get(itemId)! }));
    // ORDER BY CONTENT HASH — deterministic, reproducible, and uncorrelated with which store made it.
    readings.sort((x, y) => sha(canonicalJson(x.item)).localeCompare(sha(canonicalJson(y.item))));
    readings.forEach((r, i) => unblind.push({ itemId, [`reading ${i + 1}`]: r.file }));
    const verdict = readings.length === 2 ? classify(readings[0]!.item, readings[1]!.item) : { class: 'MORE THAN TWO READINGS', why: 'this item is carried by more than two files.' };
    const row = {
      itemId,
      MECHANICAL_CLASS: verdict.class,
      whyThatClass: verdict.why,
      HER_QUESTION: verdict.class === 'KEY DISPUTE'
        ? 'from the stem and options alone, which reading\'s key is right — or REFUSE if the stem determines neither or both.'
        : 'no key ruling is asked for on this row. It is here so the classification can be overruled, not so it can be answered.',
      readings: readings.map((r, i) => ({
        reading: `reading ${i + 1}`,
        stem: r.item.stem,
        options: r.item.options.map((o) => ({ label: o.label ?? null, text: o.content, thisReadingCallsItCorrect: o.isCorrect === true })),
      })),
    };
    const digest = digestOverText('this row as canonical JSON — keys sorted at EVERY level, separators (",",":"), ensure_ascii false — with the rowSha256 and rowSha256Spec fields absent', canonicalJson(row));
    return { ...row, rowSha256: digest.value, rowSha256Spec: digest.spec };
  });

  const counts = rows.reduce<Record<string, number>>((a, r) => { a[r.MECHANICAL_CLASS] = (a[r.MECHANICAL_CLASS] ?? 0) + 1; return a; }, {});
  const keyDisputes = rows.filter((r) => r.MECHANICAL_CLASS === 'KEY DISPUTE');

  const payload = {
    kind: 'blinded-readings-for-annie',
    what: 'Every item whose two readings differ, both readings in full — stem and options — with no identity attached to either.',
    THE_BLINDING: {
      whatWasRemoved: 'file paths, directory names, store names, and THE SERVING ROW. The serving row was carried in the previous artefact labelled NOT_A_VOTE; that label is honest and does not make it unreadable — it identifies the database\'s reading exactly, which is the shortcut she asked not to be given.',
      whatWasNOTremoved: 'nothing else. Both stems and every option cross in full, which is what ruling from stem and options alone requires.',
      howTheOrderWasCHOSEN: 'readings are sorted by the sha256 of their own canonical JSON. Deterministic and reproducible, and uncorrelated with which store produced them — an order that followed provenance would leak it on every row.',
      theUnblindingMAP: 'held on the emitting side at content/blinded-readings-unblinding.json. NOT staged and not crossed.',
    },
    HER_METHOD_AS_RULED: 'per item, from stem and options alone: three outcomes, with REFUSE where the stem determines neither or both.',
    AND_WHAT_THE_CLASSIFICATION_FOUND: {
      counts,
      THE_KEY_DISPUTE_CLASS_IS_EMPTY: keyDisputes.length === 0,
      soWHAT: keyDisputes.length === 0
        ? 'NOT ONE of these items is a case where the same stem, offering the same options, is given a different answer. Every one resolves from stem and options without a judgement: the stems differ, or the options differ, or only the LETTER differs while the same text is keyed in both. **The batch her three-outcome method is for is empty.** That is a finding about the population and not a refusal to send it — the rows are all here, with the classification exposed so she can overrule any of it.'
        : `${keyDisputes.length} rows are genuine key disputes and carry HER_QUESTION.`,
      theBIGGESTclass: 'DIFFERENT QUESTION — readings that carry different stems. Two questions sharing one id is not a disagreement about an answer, and her method cannot be applied to it: the method reads one stem, and there are two.',
      andTheRELABELLINGS: 'the same option text is keyed in both readings and only the letter differs. Nothing about the answer is in dispute on those rows.',
    },
    THE_OPTION_SET_DIVERGENCES_ARE_MARKED_APART: 'as she ruled. MECHANICAL_CLASS is OPTION-SET DIVERGENCE on those rows: one stem, different options — a dispute about what the child is asked to choose between, not about which answer is right.',
    NOTHING_LANDED: 'this script writes nothing to any store. The nineteen executions stay reversed and RE-DERIVE from whichever key she settles rather than being un-reversed.',
    ROWS: rows,
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['AND_WHAT_THE_CLASSIFICATION_FOUND', 'ROWS']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('blinded-readings-for-annie', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  writeFileSync(join(REPO, 'content/blinded-readings-unblinding.json'), `${JSON.stringify({ note: 'HELD THIS SIDE. Never staged — crossing it would undo the blinding.', map: unblind }, null, 1)}\n`);
  deliver(join(REPO, 'content/exports', name), 'blinded-readings-for-annie');
  console.log(`items ${rows.length} | ${JSON.stringify(counts)} | key disputes ${keyDisputes.length}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
