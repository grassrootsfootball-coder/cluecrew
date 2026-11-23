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

/** Reusable: an apply script calls this directly rather than duplicating the export. */
export async function exportApprovalBatch(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    select: { id: true, options: { orderBy: { id: 'asc' }, select: { misconceptionId: true } } },
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
}

// Run directly (`pnpm export:approval-batch`) but NOT when imported by an apply script, which owns
// the connection and calls the function as its final step.
if (process.argv[1]?.endsWith('export-approval-batch.ts')) {
  void exportApprovalBatch().then(() => prisma.$disconnect());
}

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
  L.push('**READ ALL NINE AS NEW.** An earlier version of this sheet marked two entries — 209 of the');
  L.push('215 items — as your own wording, so that you could confirm them rather than review them.');
  L.push('We could not support that claim: the text matches a document the drafting side wrote TO');
  L.push('you, and the only evidence it was yours was one ambiguous sentence in another agent\'s');
  L.push('metadata. Both are now marked AUTHORSHIP UNKNOWN. **This is more work than the sheet you');
  L.push('were promised, and it is the only honest version.**');
  L.push('');
  L.push('**Nothing on this sheet is marked as yours.** Two are AUTHORSHIP UNKNOWN, four are ours,');
  L.push('three have no provenance recorded at all. Across the whole library exactly one entry is');
  L.push('marked as your wording — `en-vocab-dominant-sense` — because we hold your ENG-028 return');
  L.push('carrying that sentence. It is already approved and is not on this sheet.');
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
    L.push(`**${e.itemsCarryingThisTag} ${e.itemsCarryingThisTag === 1 ? 'item carries' : 'items carry'} this tag.**`
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
      const un = String(prov.note ?? 'No provenance recorded on this row.').replace(/\.?$/, '.');
      const unSentence = un.charAt(0).toUpperCase() + un.slice(1);
      L.push(`> **Who wrote this text: UNKNOWN.** ${unSentence} `
        + 'Not "nobody" and not "us" — unrecorded. If either field below is already in your words, '
        + 'say so and it will be recorded as yours.');
    } else if (prov) {
      // THREE STATES, AND ONLY ONE OF THEM MAY SAY "YOURS" (David's ruling, 2026-08-16 — R108).
      // This sheet told her in bold that 209 of 215 items rested on her own wording, on the strength
      // of one ambiguous sentence in another agent's metadata. Nothing is marked as hers now unless
      // an authored artefact of hers exists carrying the text — today that is one entry.
      const kind = prov.hintAuthorKind;
      if (kind === 'PERSON') {
        L.push('> **The hint below is recorded as YOUR OWN WORDS** — authored by '
          + `${String(prov.hintAuthoredBy)}, ${String(prov.hintSource ?? 'source not stated')}. `
          + 'We hold the document it came from, so this is a confirmation of your own sentence '
          + 'rather than a review of ours.');
      } else if (kind === 'UNKNOWN' && prov.hintAuthorshipNote) {
        // The stored note opens with its own label; printing both gave "AUTHORSHIP UNKNOWN.
        // AUTHORSHIP UNKNOWN." on the page. The field is the value and is not edited — the
        // DUPLICATED LABEL is dropped for the heading, never the sentence.
        const note = String(prov.hintAuthorshipNote).replace(/^AUTHORSHIP UNKNOWN\.\s*/, '');
        L.push(`> **AUTHORSHIP UNKNOWN.** ${note}`);
        L.push('>');
        L.push('> **So read this hint as new.** We previously recorded it as yours and we could not '
          + 'support that. If you recognise the sentence as your own, one line saying so settles it '
          + 'and nobody else can supply that line.');
      } else {
        L.push(`> **The hint below is OURS** — written by ${String(prov.hintAuthoredBy ?? 'the drafting side')} `
          + `(${String(prov.hintAuthorKind ?? 'kind not stated')}), ${String(prov.hintSource ?? 'source not stated')}. `
          + 'Review it as ours.');
      }
      L.push('>');
      // THE APPROVAL CLAIM GETS THE SAME TREATMENT AS AUTHORSHIP AND NOT THE SAME VERDICT (R110).
      // Authorship went UNKNOWN because nothing supports it. Approval is MARKED unknown and NOT
      // withdrawn, because withdrawing a record of her approval on an absence is the delivery-58
      // error running the other way. The sheet must not tell her six entries carry her approval
      // when nothing shows she gave it, and must not tell her they are unapproved either.
      if (prov.approvalAuthorKind === 'UNKNOWN') {
        // WHICH SIDE RECORDS IT. The claim is on the AUTHORING side; this store has approvedBy
        // null. Writing "you are on record here" would be a second unsupported claim in the act of
        // marking the first, which is the whole fault this sheet is correcting.
        L.push('> **Recorded as approved by you on the authoring side — no artefact found. Please '
          + 'confirm or correct.** The drafting side records this entry as approved by you, and that '
          + 'record STANDS; we have not withdrawn it. Two things we cannot show: this store holds no '
          + 'approval for it at all (see below), and neither side holds a document of yours recording '
          + 'one — the claim traces to a single sentence in the drafting side\'s own metadata. **We '
          + 'are not saying it is unapproved.** We are saying we cannot evidence it, and one line from '
          + 'you settles it either way.');
        L.push('>');
      }
      L.push(`> **Approval on record here: ${String(prov.approvalKind ?? 'not stated')}.** `
        + String(prov.approvalNote ?? ''));
      // Anything already rendered above is excluded, or it prints a second time. The authorship
      // note ran to a full paragraph and appeared THREE times on one page before these were added.
      const shown = new Set(['state', 'hintAuthorKind', 'hintAuthoredBy', 'hintSource', 'approvalKind',
        'approvalNote', 'declarationSources', 'declaredBy', 'recordedOn', 'approvedBy',
        'hintAuthorshipNote', 'hintAuthorshipRuledOn', 'hintAuthorKindWasClaimedAs', 'hintAuthoredByWasClaimedAs',
        'approvalAuthorKind', 'approvalAuthorshipNote', 'approvalAuthorshipRuledOn']);
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
  L.push(`Approving all nine releases **${itemsAffected} items** from the tag route — 96% of the 224`);
  L.push('English items that would refuse a verdict today. It does NOT make them signed, and it is');
  L.push('not everything standing in the way. Measured against the store: eleven items sit on a');
  L.push('RETIRED tag, which is a retagging job on our side and not yours, and four are held on');
  L.push('child-facing copy. Six items are on both a tag you release and a fault we fix, so neither');
  L.push('of us clears them alone.');
  L.push('');
  L.push('**It also settles seventeen retags.** Thirty-six options in the bank have been moved from');
  L.push('one diagnosis to another. Nineteen landed on an approved entry and are clear. The other');
  L.push('seventeen landed on one of the entries on this sheet — so they were moved off a tag that');
  L.push('blocked them and onto a tag that blocks them, and were reported as released. Your nine');
  L.push('signatures are what actually discharges them. Nothing else on this sheet depends on that');
  L.push('and you do not need to check it: it is recorded here so the word "retagged" is not read as');
  L.push('"resolved" a second time.');
  L.push('');
  L.push('**Status:** ______________________________________________');
  L.push('');
  return L.join('\n');
}
