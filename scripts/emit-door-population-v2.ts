/**
 * THE POPULATION OF RECORD, RE-EMITTED BEFORE IT CROSSES TO ANNIE (David, 2026-08-24 — R696).
 *
 * Two changes against the first cut, both ruled:
 *  - THE OPENING-DOZEN PROPOSALS ARE STRUCK. A door opens only when its WHOLE pool is signed, so
 *    a marked twelve proposed a threshold that no longer exists and marked rows in a set the
 *    reader can see.
 *  - Each section gains ONE DERIVED FIELD: the case's unsigned count remaining after that
 *    section clears — the only number she needs to know how close a door is; a fact where the
 *    proposal stood.
 * Same sections, same order, supersede with retention, new digest declared on staging.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const ASOF = new Date().toISOString();
const ELEVEN = ['case-vr-02', 'case-vr-05', 'case-vr-08', 'case-vr-10', 'case-vr-13', 'case-vr-16', 'case-vr-17', 'case-vr-18', 'case-vr-19', 'case-vr-20', 'case-vr-21'];

async function run() {
  const eleven = await prisma.case.findMany({ where: { id: { in: ELEVEN } }, select: { id: true, questionTypeId: true } });
  const rowsByCase = new Map<string, Array<Record<string, unknown>>>();
  let total = 0;
  for (const c of eleven) {
    const items = await prisma.item.findMany({
      where: { questionTypeId: c.questionTypeId, status: 'DRAFT', reviewedBy: null },
      select: {
        id: true, stem: true, explanation: true, difficultyTier: true, calibratedDifficulty: true, questionTypeId: true,
        options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true, tagStatus: true } },
      },
      orderBy: { id: 'asc' },
    });
    const rows = items.map((i) => {
      const core = {
        id: i.id, questionType: i.questionTypeId, case: c.id,
        stem: i.stem, options: i.options, hintsAndWalk: i.explanation,
        tier: i.difficultyTier, calibratedDifficulty: i.calibratedDifficulty,
        reach: { case: c.id, tier: 'PAID', caseLiveNow: 0, opensDoor: true, note: 'signing this row is a step toward opening a paid door that currently serves nothing' },
      };
      return { ...core, rowSha256: sha256(JSON.stringify(core)), asOf: ASOF };
    });
    rowsByCase.set(c.id, rows);
    total += rows.length;
  }
  if (total !== 288) throw new Error(`REFUSED — the population reads ${total}, the verified record says 288; the premise has moved, re-derive before superseding`);

  const caseOrder = [...rowsByCase.entries()].sort((a, b) => (a[1].length - b[1].length) || a[0].localeCompare(b[0]));
  const sections: Array<Record<string, unknown>> = [];
  for (const [caseId, rows] of caseOrder) {
    for (let s = 0; s * 12 < rows.length; s++) {
      const slice = rows.slice(s * 12, s * 12 + 12);
      const cleared = s * 12 + slice.length;
      sections.push({
        section: `${caseId} sitting ${s + 1}`,
        caseId, rowCount: slice.length,
        // THE FACT THAT REPLACED THE PROPOSAL (R696): how far the door is after this sitting.
        unsignedRemainingAfterThisSectionClears: rows.length - cleared,
        doorOpensOnThisSection: rows.length - cleared === 0,
        rows: slice,
      });
    }
  }
  const artefact = {
    kind: 'door-opening-population',
    what: `The population of record for the next fortnight: ${total} unsigned items behind the eleven zero-live PAID cases, sectioned into twelve-row sittings labelled by case. SECOND CUT: the opening-dozen proposals are STRUCK (a door opens only when its whole pool is signed — David's ruling; a marked twelve proposed a threshold that no longer exists), and each section carries the case's unsigned count remaining after it clears, derived.`,
    asOf: ASOF,
    publicationTrigger: 'MECHANICAL (R696): when a case\'s unsigned count reaches zero, that case is READY TO PUBLISH ON THE DESK\'S GO — never partially, never automatically. The per-section remaining field is the countdown to that trigger.',
    ordering: 'unchanged from the verified first cut: cheapest-first, ascending pool size then case id; surplus in later sections of the same case; nothing padded.',
    perRow: 'stem, options with tags and executions, hints and walk script verbatim, tier, calibrated difficulty, reach, rowSha256, asOf.',
    population: { items: total, cases: ELEVEN.length, sections: sections.length, method: 'DRAFT ∧ reviewedBy null over each case\'s question type, re-read this run and asserted equal to the verified 288' },
    sections,
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('door-opening-population', sha256(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'door-opening-population');
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
