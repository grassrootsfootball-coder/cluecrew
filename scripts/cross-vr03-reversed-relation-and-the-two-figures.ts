/**
 * CROSS VR03-REVERSED-RELATION TO THE AUTHORING STORE (David, 2026-09-02, before his word).
 *
 * Twenty-four of its second-seat executions are held there on an entry it has never seen, and
 * its holds are CORRECT until it crosses — the refusal-to-guess her 211th endorsed. So the
 * entry crosses whole: description, childHint, attestation, each field verbatim (R25: send the
 * value), under a digest that names its spec (R759).
 *
 * AND BOTH SECOND-SEAT FIGURES, RECORDED WITH THEIR POPULATIONS — NOT RECONCILED. Different
 * populations, both honestly derived; each carries her four columns (predicate, population,
 * instrument, moment — her 211th), because two figures sharing a label and differing on any
 * column are answers to different questions.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, findingsDigest } from './lib/findings-digest';

const REPO = pjoin(__dirname, '..');

async function main() {
  const entry = await prisma.misconception.findUniqueOrThrow({
    where: { id: 'vr03-reversed-relation' },
    select: { id: true, district: true, description: true, childHint: true, status: true, approvedBy: true },
  });
  // My second-seat figure, derived from the serving rows as they stand.
  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-10-word-connections', status: 'DRAFT' },
    select: { id: true, options: { orderBy: { id: 'asc' }, select: { misconceptionId: true, misconceptionExecution: true } } } });
  requirePopulation('cross-vr03:serving-rows', { 'vr-10 DRAFT row(s)': rows.length });
  const rowsWhereEveryTaggedSeatHasExecution = rows.filter((r) => r.options.filter((o) => o.misconceptionId).every((o) => o.misconceptionExecution)).length;
  const taggedSeats = rows.reduce((n, r) => n + r.options.filter((o) => o.misconceptionId).length, 0);
  const seatsWithExec = rows.reduce((n, r) => n + r.options.filter((o) => o.misconceptionId && o.misconceptionExecution).length, 0);

  const entryDigest = createHash('sha256').update(canonicalJson(entry), 'utf8').digest('hex');
  const artefact = {
    kind: 'vr03-reversed-relation-crossed-whole-and-the-two-figures',
    TO: 'the authoring store; Annie by relay',
    date: '2026-09-02',
    WHY: 'twenty-four second-seat executions are held at the authoring store on this entry, which it has never seen. Its holds are correct until the entry crosses — the refusal-to-guess her 211th endorsed. Here are the bytes.',
    THE_ENTRY: entry,
    entrySha256: entryDigest,
    entrySha256Spec: 'sha256 over canonical JSON (sorted keys, compact separators, utf8) of THE_ENTRY exactly as it appears in this file — {id, district, description, childHint, status, approvedBy}',
    THE_TWO_SECOND_SEAT_FIGURES_NOT_RECONCILED: {
      rule: 'different populations, both honestly derived. Recorded side by side; neither corrects the other (her 211th: two figures sharing a label and differing on any column are answers to different questions).',
      theServingSide: {
        figure: `${rowsWhereEveryTaggedSeatHasExecution} of ${rows.length}`,
        predicate: 'every tagged seat on the row carries an execution, under the tags the rows wear TODAY (vr03-same-topic on twenty-four second seats, vr10-first-pair-word-returned on wet)',
        population: `the ${rows.length} vr-10 DRAFT rows serving in this store`,
        instrument: 'direct query of ItemOption.misconceptionId and .misconceptionExecution',
        moment: '2026-09-02',
        beside: `${seatsWithExec} of ${taggedSeats} tagged seats carry executions`,
      },
      theAuthoringStore: {
        figure: '1 of 25',
        predicate: 'a second-seat execution RE-AUTHORED under vr03-reversed-relation (her 209th: the destination for every directional row) stands on its shelf',
        population: 'the twenty-five second-seat re-authorings of its re-authoring pass',
        instrument: 'its own shelf count, reported by the desk',
        moment: 'as reported, 2026-09-02',
        why: 'twenty-four are HELD on this entry, which had never crossed — correct holds, resolving on this crossing',
      },
    },
  };
  const clean = JSON.parse(JSON.stringify(artefact)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['THE_ENTRY', 'THE_TWO_SECOND_SEAT_FIGURES_NOT_RECONCILED']);
  Object.assign(clean, dig);
  const out = pjoin(REPO, 'content/exports', stampedName('vr03-reversed-relation-crossed', dig.findingsSha256, 'json'));
  writeFileSync(out, JSON.stringify(clean, null, 1));
  const d = deliver(out);
  console.log(`entry: ${JSON.stringify(entry)}`);
  console.log(`entrySha256: ${entryDigest}`);
  console.log(`serving figure: ${rowsWhereEveryTaggedSeatHasExecution}/${rows.length} rows whole on executions; ${seatsWithExec}/${taggedSeats} seats`);
  console.log(`Delivered: ${d}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
