/**
 * WRITES REVIEWED CONTENT UNGUARDED — a one-shot ruling-applier (R63). The values here come from a
 * HUMAN RULING, not from a derivation function, so `classifyDerivedWrites` does not apply: what it
 * needs is provenance, and recording provenance is the entire purpose of this script.
 *
 * **ANNIE'S EIGHTH RETURN, 2026-08-19 — THE JOIN IS CLOSED BY READING, NOT BY RECOGNITION.** She
 * approved all 22 under her own name on reading: eleven as written, eleven amended. Seven of the
 * as-written eleven are the third-text rows, where this store's text and Cowork's restore diverged
 * and neither side could say which was signed. Reading them settled it: THE SERVING TEXT IS HERS
 * NOW BY APPROVAL, whatever its history.
 *
 * **HER REASON IS PART OF THE RECORD, NOT A PREAMBLE TO IT.** Several of the seven read exactly
 * like her voice — and that is precisely the evidence she REFUSED to use, because fluent text
 * passing for its author is the fault this week has demonstrated twice (the six renamed entries,
 * and my own seven fabricated ids in the census an hour ago). Recognition is not provenance. A
 * record that keeps only the verdict and drops the reason would leave the next reader free to
 * close the next join by recognition, which is the thing she declined to do.
 *
 * **BOTH TEXTS GO ON THE ROW, SO THE DIVERGENCE IS DECLARED RATHER THAN LATENT** (David's
 * instruction). Cowork's restore is the record of what was SIGNED; this store's text is what
 * SERVES and is now approved. Where the restore text is not held here, the slot says so by name —
 * an unheld value is UNKNOWN, never absent (R98), and a provenance field that quietly omits the
 * other side would relaunder the same ambiguity one level down.
 */
import { prisma } from '../packages/db/src/index';

/** Her identity in the shape that resolves to a Reviewer row by id. */
const ANNIE = 'reviewer:rev-0001';

const SEVEN = [
  'nvr-wrong-mirror-axis',
  'nvr-code-row-swap',
  'nvr-count-by-glance',
  'nvr-mirror-for-rotation',
  'nvr-multi-part-tracking',
  'nvr-series-phase-slip',
  'nvr-transform-not-applied',
];

async function main() {
  const rows = await prisma.misconception.findMany({ where: { id: { in: SEVEN } }, orderBy: { id: 'asc' } });
  if (rows.length !== SEVEN.length) {
    const missing = SEVEN.filter((id) => !rows.some((r) => r.id === id));
    throw new Error(`REFUSED: ${missing.length} of the seven are not in this store: ${missing.join(', ')}. A ruling whose target moved is reported, never adapted.`);
  }

  for (const row of rows) {
    const provenance = {
      state: 'RECORDED',
      // R25 — the value, not an account of it. This is the text a child meets.
      servingText: row.childHint,
      servingTextStatus: 'SERVES, and approved as written by Annie on 2026-08-19',
      servingTextAuthoredBy: 'machine — drafted in this store; the drafter is not recoverable per-row',
      // R203: the qualifier is IN the name, because a bare "Annie" here would assert authorship
      // where the fact is approval.
      approvedByPerson: ANNIE,
      approvedByMethod: 'read the text and approved it under her own name (eighth return, 2026-08-19)',
      approvedNotByRecognition:
        'She declined to settle it by recognising her voice. Several of the seven read exactly like her, and fluent text passing for its author is the fault demonstrated twice this week — so recognition was refused as evidence and reading was used instead.',
      // The other side of the join, named rather than omitted.
      coworkRestore: {
        role: 'THE RECORD OF WHAT WAS SIGNED',
        textHeldInThisStore: false,
        state: 'UNKNOWN HERE — the restore text lives in Cowork and was never written to an artefact in this store, so it cannot be quoted from this side. Not absent: unheld.',
        supersededForServing: true,
        supersededBy: "Annie's approval-on-reading of the serving text, 2026-08-19",
      },
      divergence: 'DECLARED. Two texts existed for this id; the serving one is approved, the signed one is recorded as held elsewhere.',
      recordedAt: '2026-08-19',
    };

    await prisma.misconception.update({
      where: { id: row.id },
      data: {
        approvedBy: ANNIE,
        approvalMethod: 'approval on reading, under her own name — eighth return, 2026-08-19',
        textProvenance: provenance,
        approvalNote:
          `${row.approvalNote ?? ''} | THIRD-TEXT ROW SETTLED 2026-08-19 (Annie, eighth return): approved as written, by reading rather than by recognition. Cowork's restore is recorded as what was signed; this text is what serves.`.trim(),
      },
    });
    console.log(`  ${row.id}`);
    console.log(`      approvedBy: ${row.approvedBy ?? 'null'} → ${ANNIE}`);
  }

  console.log(`\n${rows.length} third-text rows settled. childHint UNCHANGED on all seven — she approved them as written, so no child-facing text moved.`);
  await prisma.$disconnect();
}

main();
