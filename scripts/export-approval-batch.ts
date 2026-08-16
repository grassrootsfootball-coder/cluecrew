/**
 * THE APPROVAL BATCH — `pnpm export:approval-batch`
 *
 * Nine PROPOSED entries carry 172 English items between them. Approving the nine stops 172 items
 * carrying a tag nobody has approved — which is the provenance claim, not a rendering detail.
 *
 * VERBATIM PER R25: when a value carries a signature, send the value and not an account of it. The
 * description and childHint here are the stored fields, character for character; a ratification is
 * made against those strings. Nothing is summarised or truncated.
 *
 * ITEM COUNT PER ENTRY, so the size of each decision is on the page rather than looked up.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'approval-batch-english';

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    select: { id: true, options: { select: { misconceptionId: true } } },
  });
  const proposed = await prisma.misconception.findMany({
    where: { status: 'PROPOSED', district: 'ENGLISH' },
    orderBy: { id: 'asc' },
  });

  const entries = proposed.map((m) => {
    const carrying = items.filter((i) => i.options.some((o) => o.misconceptionId === m.id));
    return {
      id: m.id,
      status: m.status,
      // VERBATIM. Approve or reject against these exact strings.
      description: m.description,
      childHint: m.childHint,
      proposedBy: m.proposedBy,
      category: m.category,
      sourcePattern: m.sourcePattern,
      // WHO WROTE THE HINT, separately from who would approve it (R98). UNKNOWN, never absent.
      textProvenance: m.textProvenance ?? { state: 'UNKNOWN', note: 'no provenance recorded on this row' },
      itemsCarryingThisTag: carrying.length,
      itemIds: carrying.map((i) => i.id).sort(),
    };
  }).filter((e) => e.itemsCarryingThisTag > 0)
    .sort((a, b) => b.itemsCarryingThisTag - a.itemsCarryingThisTag);

  requirePopulation('export:approval-batch', { 'PROPOSED English entries carrying items': entries.length });

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(
    entries, generatedAt, 'content',
    'every PROPOSED English misconception carrying live items, with its description and childHint verbatim',
    ['entries'],
  );
  const itemsAffected = new Set(entries.flatMap((e) => e.itemIds)).size;
  const body = {
    kind: FAMILY,
    // THE COUNT IS COMPUTED, NOT WRITTEN. This sentence read "Nine entries, 172 items" as a literal
    // for as long as the export existed, while the code beside it measured 215 — the artefact's own
    // prose contradicting the artefact's own data, and the prose is the half a reader believes.
    // 172 is what the defect sheet asserts and what she was told she was being asked to approve.
    note:
      `${entries.length} entries, ${itemsAffected} items. Every item carrying one of these is tagged `
      + 'against a misconception nobody has approved. Description and childHint are the stored fields '
      + 'verbatim (R25) — a ratification is made against these strings, not against an account of them.',
    generatedAt,
    stamp,
    count: entries.length,
    itemsAffected,
    entries,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify(body, null, 2));
  deliver(path, FAMILY);

  // THE PAPER RENDERING, FROM THE SAME `entries` AND UNDER THE SAME STAMP (R88). She reviews on
  // paper and never signs in, so the JSON is not a delivery to her — it is a delivery about her
  // decision. Two files, one projection, one hash: the fault R88 names is a stamp computed from
  // something other than what shipped, which put two materially different files under one name.
  const paper = renderPaper(entries, itemsAffected, generatedAt, stamp.sourceHash);
  const paperPath = join(OUT_DIR, stampedName(`${FAMILY}-paper`, stamp.sourceHash, 'md'));
  writeFileSync(paperPath, paper);
  deliver(paperPath, `${FAMILY}-paper`);

  console.log(`${entries.length} entries · ${itemsAffected} items affected`);
  for (const e of entries) console.log(`  ${String(e.itemsCarryingThisTag).padStart(3)}  ${e.id}`);
  await prisma.$disconnect();
}

void main();

/**
 * THE PAPER SHEET. Same nine entries, same order, same strings — a rendering, never a re-derivation.
 *
 * SHAPE TAKEN FROM WHAT WORKED. Her ENG-028 return came back on a document with an explicit
 * AUTHORED FIELD and a status line, and that is the shape this uses: the stored text is quoted in
 * full and the box beside it is hers to write in. Anything she writes over a quoted string replaces
 * it character for character (`compare_stored_hint.py`), and nothing on this side retypes it.
 *
 * WHY THE ITEM COUNT SITS BESIDE EVERY ENTRY: approving `en-within-span-wrong-element` releases 174
 * items and approving `en-determiner-omitted` releases one. Those are not the same decision and a
 * list that does not say so invites them to be made at the same speed.
 */
function renderPaper(
  entries: Array<{
    id: string; description: string | null; childHint: string | null; proposedBy: string | null;
    category: string | null; sourcePattern: string | null; textProvenance: unknown;
    itemsCarryingThisTag: number; itemIds: string[];
  }>,
  itemsAffected: number,
  generatedAt: string,
  sourceHash: string,
): string {
  const L: string[] = [];
  L.push('# English misconception library — approval batch');
  L.push('');
  L.push('**For Annie. Defect sheet row 8.** These are the entries every unapproved tag in the');
  L.push('English bank resolves to. Nothing is wrong with the items; they are queued behind you.');
  L.push('');
  L.push(`**${entries.length} entries. ${itemsAffected} items.** THE SHEET YOU WERE SENT SAYS 172 AND THAT`);
  L.push('NUMBER IS WRONG. It was asserted, not measured; this one is counted from the store, entry by');
  L.push('entry, and the per-entry figures below add up to it. The nine entries are the same nine.');
  L.push('');
  L.push('**The two fields under each entry are the stored text, character for character.** You are');
  L.push('approving these strings, not an account of them. Write over either one and what you write');
  L.push('is what enters the library — it will not be retyped, normalised or tidied on our side.');
  L.push('');
  L.push(`*Generated ${generatedAt} · artefact ${sourceHash} · ordered by how many items each releases.*`);
  L.push('');
  L.push('---');
  L.push('');
  L.push('## At a glance');
  L.push('');
  L.push('| | entry | items released | your ruling |');
  L.push('|---|---|---|---|');
  entries.forEach((e, i) => {
    L.push(`| ${i + 1} | \`${e.id}\` | **${e.itemsCarryingThisTag}** | |`);
  });
  L.push('');
  L.push('---');
  L.push('');

  entries.forEach((e, i) => {
    L.push(`## ${i + 1}. \`${e.id}\``);
    L.push('');
    L.push(`**${e.itemsCarryingThisTag} item${e.itemsCarryingThisTag === 1 ? '' : 's'} carry this tag.**`
      + (e.category ? ` Category: ${e.category}.` : '')
      + (e.proposedBy ? ` Proposed by ${e.proposedBy}.` : ''));
    L.push('');
    // R98: a row with nothing recorded says UNKNOWN, never nothing. Cowork corrected a TRUE record
    // of her approval to false by finding nothing on its own disk and reading silence as evidence.
    // PROSE, NOT A JSON BLOB. The first version of this sheet printed the provenance object raw,
    // which on paper buried the one fact that changes the decision: `hintAuthorKind: PERSON` with
    // `hintAuthoredBy: Annie` means SHE WROTE THE HINT ALREADY and is being asked to approve her
    // own sentence. A reviewer skimming a serialised object will not find that, and R98 exists
    // because reading provenance wrongly is what turned a true record of her approval into a false
    // one. Anything the shape does not cover still prints, so nothing is dropped for not fitting.
    const prov = e.textProvenance as Record<string, unknown> | null;
    if (prov?.state === 'UNKNOWN') {
      L.push(`> **Who wrote this text: UNKNOWN.** ${String(prov.note ?? 'No provenance recorded on this row.')} `
        + 'Not "nobody" and not "us" — unrecorded. If either field below is already in your words, '
        + 'say so and it will be recorded as yours.');
    } else if (prov) {
      const person = prov.hintAuthorKind === 'PERSON';
      L.push(person
        ? `> **The hint below is recorded as YOUR OWN WORDS** — authored by ${String(prov.hintAuthoredBy)}, `
          + `${String(prov.hintSource ?? 'source not stated')}. If that is right, you are being asked to `
          + 'confirm your own sentence, not to review ours. If it is not right, say so — a hint we wrote '
          + 'and you approved unchanged looks identical to one you wrote, and only you can tell them apart.'
        : `> **The hint below was written by ${String(prov.hintAuthoredBy ?? 'an agent')}** `
          + `(${String(prov.hintAuthorKind ?? 'kind not stated')}), ${String(prov.hintSource ?? 'source not stated')}.`);
      L.push('>');
      L.push(`> **Approval on record here: ${String(prov.approvalKind ?? 'not stated')}.** `
        + String(prov.approvalNote ?? ''));
      const shown = new Set(['state', 'hintAuthorKind', 'hintAuthoredBy', 'hintSource', 'approvalKind', 'approvalNote', 'declarationSources', 'declaredBy', 'recordedOn', 'approvedBy']);
      const rest = Object.entries(prov).filter(([k]) => !shown.has(k));
      if (rest.length) L.push(`>\n> *Also recorded:* ${rest.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('; ')}`);
      const src = prov.declarationSources as Array<{ file: string; sha256: string }> | undefined;
      if (src?.length) {
        L.push('>');
        L.push(`> *Declared in ${src.map((s) => `${s.file} (${s.sha256})`).join(', ')}; `
          + `recorded ${String(prov.recordedOn ?? 'date not stated')} from ${String(prov.declaredBy ?? 'source not stated')}.*`);
      }
    } else {
      L.push('> **No provenance field at all on this row.**');
    }
    L.push('');
    if (e.sourcePattern) { L.push(`*Source pattern:* ${e.sourcePattern}`); L.push(''); }
    L.push('### description (authored field)');
    L.push('');
    L.push(e.description ?? '*(nothing stored)*');
    L.push('');
    L.push('### childHint (authored field) — this is what a child reads, word for word');
    L.push('');
    L.push(e.childHint ?? '*(nothing stored)*');
    L.push('');
    L.push('**Your ruling:** APPROVE AS WRITTEN / APPROVE AS I HAVE REWRITTEN IT / REJECT');
    L.push('');
    L.push('> ______________________________________________________________');
    L.push('');
    L.push('<details><summary>The items this releases</summary>');
    L.push('');
    L.push(e.itemIds.join(', '));
    L.push('');
    L.push('</details>');
    L.push('');
    L.push('---');
    L.push('');
  });

  L.push('## What approving all nine does, and what it does not');
  L.push('');
  L.push(`Approving all nine releases **${itemsAffected} items** from the tag route. It does NOT make`);
  L.push('them signed, and it is not everything standing in the way — `pnpm check:verdict-refusals`');
  L.push('measures the rest against the store, including eleven items on a RETIRED tag, which is a');
  L.push('retagging job on our side and not yours, and four held on child-facing copy.');
  L.push('');
  L.push('**Status:** ______________________________________________');
  L.push('');
  return L.join('\n');
}
