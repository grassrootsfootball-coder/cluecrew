/**
 * THREE CROSSINGS IN ONE ACT: the signed VR library as bytes, the nine untagged vr-02 distractors,
 * and an id-level reconciliation.
 *
 * **The authoring store holds no VR library at all and cannot author a single execution without
 * these bytes.** That is the arc's only blocker, so the entries cross whole — id, description,
 * childHint, a digest per entry and one over the set — and not as a count or a list of names.
 *
 * **THE RECONCILIATION IS ON IDS BECAUSE THE COUNTS CANNOT MEET.** Cowork reports 19 ids and 355
 * tagged "bank-rows"; this store's `bank-vr-` population is 105 rows across three question types.
 * The word names different populations in the two stores, which is why it declined to reconcile on
 * the mismatch and was right to. Counts agreeing would have been the worry, not the reassurance.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const PAID = ['vr-02-two-odd-ones-out', 'vr-05-hidden-word', 'vr-08-move-letter', 'vr-10-word-connections',
  'vr-13-make-a-word', 'vr-16-opposite-meaning', 'vr-17-complete-the-sum', 'vr-18-related-numbers',
  'vr-19-word-number-codes', 'vr-20-complete-the-word', 'vr-21-same-meaning'];
const valueOf = (c: unknown) => { const v = (c as { value?: unknown }).value; return Array.isArray(v) ? v.map(String) : String(v); };

async function run() {
  assertFixture('entry-digest', [
    { name: 'a digest is over id+description+childHint together', input: JSON.stringify({ a: { id: 'x', description: 'd', childHint: 'h' }, b: { id: 'x', description: 'd', childHint: 'h' } }), mustBeCaught: true },
    { name: 'a changed childHint moves the digest', input: JSON.stringify({ a: { id: 'x', description: 'd', childHint: 'h' }, b: { id: 'x', description: 'd', childHint: 'H' } }), mustBeCaught: false },
    { name: 'a changed id moves the digest', input: JSON.stringify({ a: { id: 'x', description: 'd', childHint: 'h' }, b: { id: 'y', description: 'd', childHint: 'h' } }), mustBeCaught: false },
  ], (raw) => { const { a, b } = JSON.parse(raw); return sha(canonicalJson(a)) === sha(canonicalJson(b)); });

  const lib = await prisma.misconception.findMany({ where: { district: 'VR' },
    select: { id: true, status: true, approvedBy: true, description: true, childHint: true, category: true, textProvenance: true } });
  const signedIds = new Set(lib.filter((m) => m.approvedBy).map((m) => m.id));

  const elevenOpts = await prisma.itemOption.findMany({ where: { item: { questionTypeId: { in: PAID } } },
    select: { misconceptionId: true, item: { select: { id: true, status: true } } } });
  const inUseEleven = [...new Set(elevenOpts.map((o) => o.misconceptionId).filter((v): v is string => !!v))].sort();
  const inUseDraft = [...new Set(elevenOpts.filter((o) => o.item.status === 'DRAFT').map((o) => o.misconceptionId).filter((v): v is string => !!v))].sort();

  const allVrOpts = await prisma.itemOption.findMany({ where: { item: { questionType: { district: 'VR' } } },
    select: { misconceptionId: true, item: { select: { id: true } } } });
  const inUseAllVr = [...new Set(allVrOpts.map((o) => o.misconceptionId).filter((v): v is string => !!v))].sort();
  const bankRows = await prisma.item.findMany({ where: { questionType: { district: 'VR' }, id: { startsWith: 'bank-vr-' } },
    select: { id: true, questionTypeId: true, options: { orderBy: { id: 'asc' }, select: { misconceptionId: true } } } });

  requirePopulation('cross:vr-library', {
    'VR library entry/entries': lib.length,
    'signed entry/entries': signedIds.size,
    'entry ids in use across the eleven cases': inUseEleven.length,
  });

  // ---- ONE: THE ENTRIES THE ARC NEEDS, AS BYTES ------------------------------------------------
  const entries = inUseEleven.map((id) => {
    const m = lib.find((x) => x.id === id)!;
    const body = { id: m.id, description: m.description, childHint: m.childHint };
    return { ...body, status: m.status, category: m.category ?? null, signed: signedIds.has(id),
      approvedBy: m.approvedBy ?? null,
      textProvenance: m.textProvenance ?? { state: 'UNKNOWN' },
      entrySha256: sha(canonicalJson(body)),
      entrySha256Spec: 'sha256 over canonical JSON of {childHint, description, id} — keys sorted, compact separators (R729)' };
  });
  const setDigest = digestOverText('the entry digests joined by \\n in id order', entries.map((e) => e.entrySha256).join('\n'));

  // ---- TWO: THE NINE UNTAGGED vr-02 DISTRACTORS ------------------------------------------------
  const vr02 = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out', status: 'DRAFT' },
    select: { id: true, difficultyTier: true, stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true } } } });
  const untagged = vr02.filter((r) => r.options.some((o) => !o.isCorrect && !o.misconceptionId)).map((r) => ({
    itemId: r.id, tier: r.difficultyTier,
    stem: r.stem,
    THE_UNTAGGED_OPTIONS: r.options.filter((o) => !o.isCorrect && !o.misconceptionId).map((o) => valueOf(o.content)),
    theKey: r.options.filter((o) => o.isCorrect).map((o) => valueOf(o.content)),
    theSiblingsAndTheirTags: r.options.filter((o) => !o.isCorrect).map((o) => ({ value: valueOf(o.content), tag: o.misconceptionId ?? null })),
    theEntriesThisCaseUses: [...new Set(vr02.flatMap((x) => x.options.map((o) => o.misconceptionId)).filter(Boolean))].sort(),
  })).sort((a, b) => a.itemId.localeCompare(b.itemId));

  const full = {
    kind: 'vr-library-crossing-and-reconciliation',
    TO: 'the authoring store (Cowork) for the library; Annie for the nine',

    ONE_THE_SIGNED_ENTRIES_AS_BYTES: {
      whyItIsTheBlocker: 'the authoring store holds no VR library at all and cannot author a single execution without these. This is the arc\'s only blocker and it crosses whole rather than as names.',
      count: entries.length,
      allSigned: entries.every((e) => e.signed),
      thePopulationTHESEARE: 'every library entry in use across the ELEVEN paid VR cases, at ALL item statuses (288 rows). 22 of them appear on the 275 DRAFT rows; the 23rd, vr-move-letter-both-invalid, appears only on the 13 NEVER_SHIPPABLE vr-08 rows — which is why the figure is 23 and not 22, and it is named rather than left to be rediscovered.',
      setSha256: setDigest.value, setSha256Spec: setDigest.spec,
      entries,
    },

    TWO_THE_NINE_UNTAGGED_AS_THEIR_OWN_CLASS: {
      forAnnie: true,
      count: untagged.length,
      whyTheyAreACLASSANDNOTNINEGAPS: 'all nine are vr-02-two-odd-ones-out and every one is a two-word odd-pair option. The case uses three entries and the nine sit outside all three, so this is one question about what vr-02 needs, asked nine times — not nine independent tagging decisions.',
      andWHATISNOTASSERTED: 'that a new entry is required. Two of the three existing vr-02 entries may cover them; that is your reading and this store has not made it.',
      rows: untagged,
    },

    THREE_THE_RECONCILIATION_ON_IDS: {
      whyNotOnCounts: 'you reported 19 ids and 355 tagged bank-rows and declined to reconcile against 641 on the mismatch. That was right, and the reason is now measurable: "bank-row" names different populations in the two stores.',
      thisStoresPopulations: {
        'library entries, VR, total': lib.length,
        'library entries signed': signedIds.size,
        'ids in use across the eleven paid cases (288 rows)': inUseEleven.length,
        'ids in use across the 275 DRAFT rows': inUseDraft.length,
        'ids in use across ALL VR rows (660)': inUseAllVr.length,
        'tagged options across the 275': 641,
        'rows whose id starts bank-vr-': bankRows.length,
        'and those bank rows span': [...new Set(bankRows.map((r) => r.questionTypeId))].sort(),
      },
      THE_MISMATCH_NAMED: `your 355 tagged bank-rows cannot be this store's bank-vr- population, which is ${bankRows.length} rows across three question types — vr-06 (40), vr-04 (40), vr-02 (25). Of the eleven paid cases only vr-02 carries bank- ids; the other ten are gen-vr. So the word is not shared, and no count comparison between us means anything until the populations are named.`,
      THE_IDS_THIS_STORE_HOLDS: {
        acrossTheElevenCases: inUseEleven,
        acrossAllVrRows: inUseAllVr,
        signedButUnused: [...signedIds].filter((i) => !inUseAllVr.includes(i)).sort(),
        usedButUnsigned: inUseAllVr.filter((i) => !signedIds.has(i)).sort(),
      },
      WHAT_THIS_STORE_CANNOT_DO: 'complete the intersection. Your nineteen ids have not crossed, so the id sets are published here and the intersection is one operation on your side — or ours jointly the moment your list arrives. Guessing which nineteen would be the count comparison again, wearing ids.',
    },
  };
  const lines = entries.map((e) => `${e.id}\t${e.entrySha256}`);
  const d = digestOverText('one line per entry, "<id>\\t<entrySha256>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['ONE_THE_SIGNED_ENTRIES_AS_BYTES', 'TWO_THE_NINE_UNTAGGED_AS_THEIR_OWN_CLASS', 'THREE_THE_RECONCILIATION_ON_IDS', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('vr-library-crossing-and-reconciliation', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'vr-library-crossing-and-reconciliation');
  console.log(`\n  ONE — ${entries.length} entries as bytes, all signed: ${entries.every((e) => e.signed)}; set digest ${setDigest.value.slice(0, 16)}`);
  console.log(`  TWO — ${untagged.length} untagged vr-02 distractors as one class`);
  console.log(`  THREE — bank-vr- here is ${bankRows.length} rows across ${[...new Set(bankRows.map((r) => r.questionTypeId))].length} types; ids published, intersection needs their nineteen`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
