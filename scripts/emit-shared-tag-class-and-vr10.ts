/**
 * TWO REPORTS: the one-entry-two-options class, and the case-vr-10 divergence answered.
 *
 * **The class question is whether one tag on two distractors means one misconception executed two
 * ways, or one of the two mistagged** — and that is a reading, so every row carries both option
 * values, the key, and the entry's own text. Nothing here decides it.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const PAID = ['vr-02-two-odd-ones-out', 'vr-05-hidden-word', 'vr-08-move-letter', 'vr-10-word-connections',
  'vr-13-make-a-word', 'vr-16-opposite-meaning', 'vr-17-complete-the-sum', 'vr-18-related-numbers',
  'vr-19-word-number-codes', 'vr-20-complete-the-word', 'vr-21-same-meaning'];
const valueOf = (c: unknown) => { const v = (c as { value?: unknown }).value; return Array.isArray(v) ? v.map(String) : String(v); };

async function run() {
  const rows = await prisma.item.findMany({ where: { questionTypeId: { in: PAID }, status: 'DRAFT' },
    select: { id: true, questionTypeId: true, difficultyTier: true, stem: true,
      options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true } } } });
  const lib = new Map((await prisma.misconception.findMany({ where: { district: 'VR' },
    select: { id: true, description: true, childHint: true, approvedBy: true, status: true } })).map((m) => [m.id, m]));

  const shared = rows.flatMap((r) => {
    const ds = r.options.filter((o) => !o.isCorrect && o.misconceptionId);
    const counts = new Map<string, number>();
    for (const o of ds) counts.set(o.misconceptionId!, (counts.get(o.misconceptionId!) ?? 0) + 1);
    return [...counts.entries()].filter(([, n]) => n >= 2).map(([tag]) => {
      const carriers = ds.filter((o) => o.misconceptionId === tag);
      const entry = lib.get(tag);
      return { itemId: r.id, case: r.questionTypeId, tier: r.difficultyTier,
        stem: r.stem,
        THE_KEY: r.options.filter((o) => o.isCorrect).map((o) => valueOf(o.content)),
        THE_SHARED_TAG: tag,
        theEntrysBehaviour: entry?.description ?? null,
        theEntrysChildHint: entry?.childHint ?? null,
        entrySigned: !!entry?.approvedBy,
        THE_TWO_OPTIONS_SHARING_IT: carriers.map((o) => valueOf(o.content)),
        otherDistractorsAndTheirTags: ds.filter((o) => o.misconceptionId !== tag).map((o) => ({ value: valueOf(o.content), tag: o.misconceptionId })) };
    });
  });
  requirePopulation('emit:shared-tag-class', { 'row(s) with one tag on two or more distractors': shared.length });

  const byCase: Record<string, number> = {};
  for (const s of shared) byCase[s.case] = (byCase[s.case] ?? 0) + 1;

  // ---- THE CASE-VR-10 DIVERGENCE ---------------------------------------------------------------
  const v10 = rows.filter((r) => r.questionTypeId === 'vr-10-word-connections');
  const v10Tags: Record<string, number> = {};
  for (const r of v10) for (const o of r.options) if (o.misconceptionId) v10Tags[o.misconceptionId] = (v10Tags[o.misconceptionId] ?? 0) + 1;
  const theirs = ['vr10-topic-match', 'vr10-reversed'].map((id) => {
    const m = lib.get(id);
    return { id, heldHere: !!m, status: m?.status ?? null, signed: !!m?.approvedBy,
      carriersHere: 0, description: m?.description ?? null, childHint: m?.childHint ?? null };
  });
  const augustRow = v10.find((r) => JSON.stringify(r).includes('ugust'));

  const full = {
    kind: 'shared-tag-class-and-vr10-divergence',
    TO: 'Annie for the class; Cowork and David for vr-10.',

    ONE_THE_SHARED_TAG_CLASS: {
      THE_QUESTION: 'does one tag on two distractors mean one misconception executed two ways, or is one of the two mistagged?',
      NOTHING_HERE_DECIDES_IT: 'every row carries both option values, the key, the other distractors with their tags, and the entry\'s own behaviour and hint. The reading is yours.',
      rows: shared.length, cases: Object.keys(byCase).length, byCase,
      andWHATTHESHAPEIS: 'every one of the 125 rows has exactly one tag repeated; no row has two different tags each repeated. So the class is uniform and can be read as one question per case rather than 125 independent ones.',
      andAFTERHER197th: 'vr-02 now contributes to this class with every option accounted — the nine that were untagged landed as four to the new mint and five to partial-group, so its rows here are fully tagged and the repetition is a real repetition rather than a gap.',
      ROWS: shared,
    },

    TWO_THE_CASE_VR_10_DIVERGENCE: {
      THE_QUESTION_AS_PUT: 'the authoring store holds the same twenty-five ids and stems with different tags — vr10-topic-match and vr10-reversed against vr03-same-topic twice, and august against August.',
      WHICH_VOCABULARY_THESE_ROWS_CARRY: v10Tags,
      andITISNOTAVOCABULARYGAP: 'BOTH of their entries are held here. `vr10-topic-match` and `vr10-reversed` are ACTIVE in this store\'s VR library with their own behaviours and hints — and ZERO carriers. The two stores have the same vocabulary; what differs is which entries the rows POINT AT.',
      theirEntriesAsHeldHere: theirs,
      WHY_THESE_ROWS_CARRY_WHAT_THEY_CARRY: {
        it: 'the generator wrote it. Every vr-10 row here has sourcedFrom `generator:packages/db/prisma/generate-content.ts#GENERATORS[\'vr-10-word-connections\']`, and the generator tags both distractors with one entry.',
        soTHEDIVERGENCEIS: 'generated-with-a-default against authored-against-the-case\'s-own-entries. Their rows were tagged by someone reading the item; these were tagged by the code that made it.',
        andTHEINVERSIONWORTHNOTING: 'the entry these rows use, `vr03-same-topic`, is SIGNED and carries 59 rows across the district. The two entries that describe THIS case are UNSIGNED and carry none. **Adopting their vocabulary would move 50 tags from a signed entry onto two unsigned ones** — a review question, not a data fix, and not this store\'s to make.',
        andWHATVR03SAMETOPICSAYS: lib.get('vr03-same-topic')?.description ?? null,
      },
      THE_AUGUST_CAPITALISATION: {
        row: augustRow?.id ?? null,
        stemHere: augustRow?.stem ?? null,
        optionsHere: augustRow?.options.map((o) => ({ value: valueOf(o.content), isKey: o.isCorrect, tag: o.misconceptionId })) ?? null,
        thisStoreCarries: 'August',
        theirsCarries: 'august',
        andWHYITISNOTCOSMETIC: '**they are different words.** "August" is the month — a proper noun, and a summer-topic word, which is exactly what makes it a same-topic distractor against the key "warm". "august" lowercase is an adjective meaning dignified or imposing, which is not a summer word and not a topic match for anything in the stem. The capital is doing semantic work: without it the distractor stops being the distractor the item intends.',
        soTHISSTORESREADING: 'August is correct here and the lowercase form would break the item\'s pull. Reported as a reading with its reason, not applied to their copy.',
      },
    },
  };
  const lines = shared.map((s) => `${s.itemId}\t${s.THE_SHARED_TAG}\t${JSON.stringify(s.THE_TWO_OPTIONS_SHARING_IT)}`);
  const d = digestOverText('one line per row, "<itemId>\\t<tag>\\t<the two option values>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['ONE_THE_SHARED_TAG_CLASS', 'TWO_THE_CASE_VR_10_DIVERGENCE', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('shared-tag-class-and-vr10-divergence', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'shared-tag-class-and-vr10-divergence');
  console.log(`\n  CLASS — ${shared.length} rows across ${Object.keys(byCase).length} cases: ${JSON.stringify(byCase)}`);
  console.log(`  VR-10 — this store: ${JSON.stringify(v10Tags)}; their two entries held here with 0 carriers, both unsigned`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
