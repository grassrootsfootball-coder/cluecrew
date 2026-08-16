/**
 * THE BLIND MOVE PACK — `pnpm export:blind-move-pack <CLUSTER>`
 *
 * Cowork declares `moveClaimed` on a cluster's distractors WITHOUT SEEING THE TAG, so the comparison
 * afterwards tests whether an honest reading disagrees with a wrong tag — rather than whether a
 * drafter can copy a triple off a label. A declaration made with the tag visible will agree with the
 * tag, and we would have bought a confirmation (David, 2026-08-16).
 *
 * WHAT IS STRIPPED: `misconceptionId` and `misconceptionExecution`. The execution notes stay out of
 * the pack and stay in the store — their being present is what makes a disagreement READABLE
 * afterwards, against the drafter's own prose.
 *
 * WHAT IS OBSCURED: option ids are opaque (salted hash) and option order is shuffled, so a
 * declaration cannot be aligned to a stored row without deliberate effort. The salt and the mapping
 * are written to a KEY FILE THAT IS NOT DELIVERED.
 *
 * **THE BLIND IS PROCEDURAL AND CANNOT BE ENFORCED, AND THE PACK SAYS SO.** Cowork holds its own copy
 * of every item, and option text matches trivially. This raises the cost of accidental sighting and
 * does nothing against deliberate lookup. It depends on a commitment Cowork can make and neither side
 * can verify — which is worth stating plainly rather than designing around a guarantee that does not
 * exist.
 */
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { MOVE_ROLE, MOVE_WHAT } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const KEYS_DIR = resolve(import.meta.dirname, '../content/blind-keys');
const PASSAGES = resolve(import.meta.dirname, '../content/passages');

/** Deterministic given the salt, and not invertible without it. */
const opaque = (salt: string, id: string): string =>
  `opt-${createHash('sha256').update(`${salt}:${id}`).digest('hex').slice(0, 12)}`;

async function main(): Promise<void> {
  const cluster = process.argv[2];
  if (!cluster) { console.error('usage: pnpm export:blind-move-pack <ENG-002>'); process.exit(1); }

  const items = await prisma.item.findMany({
    where: { id: { startsWith: `${cluster}-` } },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: [{ clusterPosition: 'asc' }, { id: 'asc' }],
  });
  requirePopulation('export:blind-move-pack', { [`items in ${cluster}`]: items.length });

  const salt = randomBytes(16).toString('hex');
  const key: Array<{ opaqueId: string; optionId: string; itemId: string; label: string; misconceptionId: string | null }> = [];

  const passages = new Map<string, { sceneTitle?: string; numberedLines?: Array<{ n?: number | null; text?: string }> }>();
  const entries = items.map((item) => {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const ref = typeof stem.passageRef === 'string' ? stem.passageRef : null;
    if (ref && !passages.has(ref)) {
      try { passages.set(ref, JSON.parse(readFileSync(join(PASSAGES, `${ref}.json`), 'utf8'))); } catch { /* reported as absent below */ }
    }
    const cited = Array.isArray(item.lineRefs) ? (item.lineRefs as unknown[]).map(Number) : [];

    // SHUFFLED, seeded on the item id so the pack is reproducible and the order carries no signal.
    const shuffled = [...item.options].sort((a, b) =>
      createHash('sha256').update(`${salt}:${a.id}`).digest('hex')
        .localeCompare(createHash('sha256').update(`${salt}:${b.id}`).digest('hex')));

    return {
      itemId: item.id,
      questionTypeId: item.questionTypeId,
      difficultyTier: item.difficultyTier,
      stem: typeof stem.text === 'string' ? stem.text : null,
      passageRef: ref,
      citedLines: cited,
      options: shuffled.map((o) => {
        const oid = opaque(salt, o.id);
        key.push({ opaqueId: oid, optionId: o.id, itemId: item.id, label: (o.content as { label?: string })?.label ?? '', misconceptionId: o.misconceptionId });
        return {
          id: oid,
          value: (o.content as { value?: string })?.value ?? '',
          // The KEY is shown — a reader must know the right answer to say what a distractor
          // displaces. It is not the tag and carries no diagnosis.
          isCorrect: o.isCorrect,
          // Declarations are requested for the distractors only.
          declarationRequested: !o.isCorrect,
        };
      }),
    };
  });

  const requested = entries.flatMap((e) => e.options.filter((o) => o.declarationRequested)).length;

  const generatedAt = new Date().toISOString();
  const payload = {
    cluster,
    task:
      'For each option marked declarationRequested, read the stem, the cited window and the option, '
      + 'and declare the MOVE it makes: what is displaced, from which role, to which role. Then a '
      + 'confidence. Return { id, what, from, to, confidence, note? } per option, or '
      + '{ id, notDisplacement: true, reason, confidence } where the error is not a displacement.',
    blindness:
      'THE TAG AND THE EXECUTION NOTE ARE NOT IN THIS PACK, AND THAT IS THE WHOLE POINT. A '
      + 'declaration made with the tag visible will agree with the tag and proves nothing. The blind '
      + 'is PROCEDURAL: you hold your own copy of every item and option text matches trivially, so '
      + 'nothing here prevents a lookup. It depends on a commitment we cannot verify. If you cannot '
      + 'declare blind — if the tag is unavoidably in front of you — SAY SO and we design around it '
      + 'rather than pretending. That answer is worth having and costs nothing.',
    confidence:
      'CONFIDENCE IS EVIDENCE ABOUT THE BLIND, NOT ABOUT YOU — do not smooth it. A genuine blind read '
      + 'produces HESITATION: options where two triples both fit, or where the move is arguable. A '
      + 'sighted read agrees smoothly everywhere. A distribution with no low-confidence rows is itself '
      + 'a signal, so record doubt where you feel it and do not round it up. high | medium | low.',
    vocabulary: { what: MOVE_WHAT, from: MOVE_ROLE, to: MOVE_ROLE },
    vocabularyRule:
      'CLOSED LISTS. A role the list lacks is added deliberately, once, with a reason recorded — never '
      + 'written into a slot as a phrase. Filling the 68 library entries forced ZERO additions, so if '
      + 'this cluster forces one that is a finding about the vocabulary and must be reported as such.',
    counts: { items: entries.length, optionsRequested: requested },
    items: entries,
    passages: [...passages].map(([id, p]) => ({
      id, title: p.sceneTitle ?? null,
      numberedLines: (p.numberedLines ?? []).map((l) => ({ n: l.n ?? null, text: l.text ?? '' })),
    })),
  };

  const stamp = artefactStamp(payload, generatedAt, 'content',
    'a cluster\'s distractors with tags and execution notes removed, for blind move declaration',
    ['items', 'passages']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(`blind-move-pack-${cluster.toLowerCase()}`, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ ...payload, stamp }, null, 1));
  deliver(path, `blind-move-pack-${cluster.toLowerCase()}`);

  /**
   * THE CONTROLS — options whose tag is ALREADY VERIFIED CORRECT, recorded in the key and NOT marked
   * in the pack (David's ruling, from Cowork's proposal, 2026-08-16).
   *
   * They separate two zeros that otherwise look identical:
   *   · declarations AGREE on the controls  -> the vocabulary is usable, so a zero elsewhere means
   *     the cluster is clean;
   *   · declarations DISAGREE on the controls too -> the field cannot express these errors and every
   *     declaration is a shrug.
   *
   * Without them a null result cannot be told apart from an instrument that does not work, and a
   * ruling on 900 hours would rest on which of those it was.
   *
   * NOT PLANTED — known-good. These carry `en-attribute-transfer` and survived Cowork's sweep of all
   * 44 carriers against her vehicle/subject boundary, which found exactly one wrong (`WIW-14 B`, a
   * different cluster). Any option on Cowork's stated-recognition list is EXCLUDED: an option it
   * expects to recognise cannot serve as evidence that a blind reading works.
   */
  const RECOGNISED = new Set(['pp-05', 'pp-08', 'pp-11', 'pp-12', 'pp-13', 'pp-17', 'pp-19', 'pp-20', 'pp-21']);
  const VERIFIED_TAGS = new Set(['en-attribute-transfer', 'en-comparison-vehicle-misread']);
  const controls = key.filter((k) =>
    k.misconceptionId !== null
    && VERIFIED_TAGS.has(k.misconceptionId)
    && ![...RECOGNISED].some((r) => k.itemId.endsWith(r)));

  // THE KEY IS NOT DELIVERED. It is the only thing that can align a declaration to a stored row.
  mkdirSync(KEYS_DIR, { recursive: true });
  const keyPath = join(KEYS_DIR, `${cluster.toLowerCase()}-blind-key.json`);
  writeFileSync(keyPath, JSON.stringify({
    cluster, salt, generatedAt, mapping: key,
    controls: {
      note: 'Tags already verified correct against the reviewer\'s boundaries. Not marked in the pack. '
        + 'Agreement here says the vocabulary is usable; disagreement here says every declaration is a shrug.',
      basis: 'en-attribute-transfer carriers that survived the 44-carrier vehicle/subject boundary sweep '
        + '(which found one wrong, in another cluster). Options on Cowork\'s stated-recognition list excluded.',
      limit: 'ALL ON ONE TRIPLE (quality/character/character). They test whether the vocabulary can express '
        + 'THAT move, not whether it can express every move — a real limit on what agreement here proves.',
      opaqueIds: controls.map((c) => c.opaqueId),
      rows: controls.map((c) => `${c.itemId} ${c.label} ${c.misconceptionId}`),
    },
  }, null, 1));

  console.log(`\n${entries.length} items · ${requested} declarations requested · ${passages.size} passage(s) carried`);
  console.log(`  tags stripped: ${key.filter((k) => k.misconceptionId).length} misconceptionId values held back`);
  console.log(`  CONTROLS: ${controls.length} known-good option(s), recorded in the key and unmarked in the pack`);
  for (const c of controls) console.log(`      ${c.itemId} ${c.label}  ${c.misconceptionId}`);
  console.log(`  key (NOT delivered): ${keyPath}`);
  console.log(`  the key is the only way to align a declaration to a row — keep it on this side.`);
  await prisma.$disconnect();
}

void main();
