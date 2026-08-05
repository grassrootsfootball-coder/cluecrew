/**
 * THE RETURN PATH — `pnpm import:review-decisions <decisions.json>`
 *
 * Takes the reviewer's marked-up pack, typed into the decisions file the
 * export produced, and applies it:
 *   (a) item amendments they specified;
 *   (b) misconception approvals and rejections, through the EXISTING
 *       verbal/written recording path in packages/db — the same function the
 *       admin CMS calls, not a second copy of it;
 *   (c) child-hint rewrites and walk scripts they wrote themselves.
 *
 * (c) is copy coming back, not a decision, so it takes the same identity
 * discipline for a different reason: the words are the reviewer's and the
 * record has to say so, or the next person reads them as ours. It is applied
 * VERBATIM — never edited on the way in — and every replacement is screened
 * by the child-facing gates first. A rewrite that fails is reported back
 * unapplied rather than quietly amended: the manifesto's rule is that a
 * scanner hit gets reworded by whoever owns the words, and that is them.
 *
 * "Never set approvedBy from a script as if they had clicked." That rule is
 * enforced three deep and this script cannot get round any of it:
 *   · it must name BOTH identities, and they must differ;
 *   · the named approver must be a real REVIEWER account;
 *   · the database CHECK constraints refuse a row where the two are equal or
 *     where a method is missing.
 * A recorded decision therefore always reads as what it is — the reviewer's
 * judgement, someone else's typing — and never as a click that did not happen.
 *
 * `--dry-run` prints exactly what would change and writes nothing.
 */
import { readFileSync } from 'node:fs';
import { checkChildFacingText, spansPresentIn } from '@cluecrew/core';
import {
  prisma,
  recordMisconceptionApprovals,
  recordMisconceptionRejections,
  type RecordedApproval,
} from '../packages/db/src/index';

const DRY = process.argv.includes('--dry-run');

interface DecisionsFile {
  kind: string;
  district?: string;
  reviewer: string;
  recordedBy: string;
  method: string;
  note: string;
  misconceptions?: { approve?: string[]; reject?: Array<{ id: string; note: string }> };
  itemAmendments?: Array<{ itemId: string; note: string; stem?: string }>;
  /**
   * Child hints reworded, replacing the previous copy verbatim. Authored by
   * the file's `reviewer` unless the entry names its own `writtenBy` — see
   * the note on that field below.
   */
  hintRewrites?: Array<{ id: string; hint: string; writtenBy?: string }>;
  /** Walk scripts the reviewer wrote, replacing the drafted ones verbatim. */
  walkScripts?: Array<{ itemId: string; walkScript: string }>;
  rulings?: Array<{ question: string; answer: string }>;
}

/**
 * A walk script is spoken to the child in the same register as a hint, so it
 * takes the hint rules. Quotations the item already declares are passed
 * through — a script pointing at the passage's own words quotes them, and a
 * quotation has been outside both reading-age checks since the 2026-08-02
 * ruling.
 */
function itemQuotes(stem: unknown): string[] {
  const quotes = (stem as { quotes?: Array<{ text?: string }> })?.quotes;
  return Array.isArray(quotes) ? quotes.map((quote) => quote.text ?? '').filter(Boolean) : [];
}

/**
 * WHO WROTE THIS HINT — and why copy is not an approval.
 *
 * An approval recorded by its own author would launder an admin's decision
 * into a reviewer's name, which is why `assertRecordable` refuses it. Copy is
 * a different act. Someone writing a hint and entering it themselves is the
 * ordinary case, not a laundered one; what would be dishonest is recording it
 * under a name that did not write it.
 *
 * So a rewrite may name its own author. Default: the file's reviewer, because
 * that is what a returned pack contains. Named `writtenBy`: whoever actually
 * wrote those words — including the person entering them, which is recorded
 * as direct authorship rather than dressed up as a return.
 */
const IDENTITY = /^human:[^\s@]+@[^\s@]+$/;

function authorshipOf(
  writtenBy: string,
  record: RecordedApproval,
): { writtenBy: string; authorship: 'returned by reviewer' | 'direct'; method: string } {
  const direct = writtenBy === record.recordedBy;
  return {
    writtenBy,
    authorship: direct ? 'direct' : 'returned by reviewer',
    method: direct ? `written directly, ${record.method.replace(/^written review,?\s*/i, '')}` : record.method,
  };
}

async function main(): Promise<void> {
  const path = process.argv.find((arg) => arg.endsWith('.json'));
  if (!path) {
    console.error('usage: … <decisions.json> [--dry-run]');
    process.exit(1);
  }
  const file = JSON.parse(readFileSync(path, 'utf8')) as DecisionsFile;
  if (file.kind !== 'review-decisions') {
    console.error(`not a review-decisions file (kind: ${file.kind})`);
    process.exit(1);
  }
  if (file.reviewer.includes('REPLACE') || file.recordedBy.includes('REPLACE')) {
    console.error('reviewer and recordedBy still hold the template placeholder — fill them in first.');
    process.exit(1);
  }

  const record: RecordedApproval = {
    approvedBy: file.reviewer,
    recordedBy: file.recordedBy,
    method: file.method,
    note: file.note,
  };

  const approve = file.misconceptions?.approve ?? [];
  const reject = file.misconceptions?.reject ?? [];
  const amendments = file.itemAmendments ?? [];
  const hintRewrites = file.hintRewrites ?? [];
  const walkScripts = file.walkScripts ?? [];

  console.log(`Decisions from ${path}`);
  console.log(`  decided by : ${record.approvedBy}`);
  console.log(`  entered by : ${record.recordedBy}`);
  console.log(`  method     : ${record.method}`);
  console.log(`  approve ${approve.length} · reject ${reject.length} · amend ${amendments.length} item(s)`);
  console.log(`  reviewer copy: ${hintRewrites.length} hint(s) · ${walkScripts.length} walk script(s)`);

  // The gates run BEFORE anything is written, so a dry run and a real run
  // report the same verdict on the same words.
  const hintChecks = await Promise.all(
    hintRewrites.map(async (entry) => ({
      entry,
      exists: Boolean(await prisma.misconception.findUnique({ where: { id: entry.id } })),
      author: authorshipOf(entry.writtenBy ?? record.approvedBy, record),
      faults: [
        ...(entry.writtenBy && !IDENTITY.test(entry.writtenBy)
          ? [{ where: entry.id, rule: 'internal-id-leak' as const, detail: 'writtenBy must be human:<email>' }]
          : []),
        ...checkChildFacingText({ role: 'hint', label: `misconception:${entry.id} childHint`, text: entry.hint }),
      ],
    })),
  );
  const scriptChecks = await Promise.all(
    walkScripts.map(async (entry) => {
      const item = await prisma.item.findUnique({ where: { id: entry.itemId } });
      return {
        entry,
        item,
        faults: item
          ? checkChildFacingText({
              role: 'hint',
              label: `item:${entry.itemId} explanation.walkScript`,
              text: entry.walkScript,
              quotedSpans: spansPresentIn(entry.walkScript, itemQuotes(item.stem)),
            })
          : [],
      };
    }),
  );

  const blocked = [
    ...hintChecks.filter((check) => check.faults.length > 0 || !check.exists),
    ...scriptChecks.filter((check) => check.faults.length > 0 || !check.item),
  ];
  if (blocked.length > 0) {
    console.log(`\nREVIEWER COPY HELD BACK (${blocked.length}) — not amended, returned as-is:`);
    for (const check of hintChecks) {
      if (!check.exists) console.log(`  ✗ ${check.entry.id}: no such misconception`);
      for (const fault of check.faults) console.log(`  ✗ ${check.entry.id}: ${fault.detail}`);
    }
    for (const check of scriptChecks) {
      if (!check.item) console.log(`  ✗ ${check.entry.itemId}: no such item`);
      for (const fault of check.faults) console.log(`  ✗ ${check.entry.itemId}: ${fault.detail}`);
    }
  }

  if (DRY) {
    console.log('\n--dry-run: nothing written.');
    for (const id of approve) console.log(`  would approve  ${id}`);
    for (const entry of reject) console.log(`  would reject   ${entry.id} (${entry.note})`);
    for (const entry of amendments) console.log(`  would amend    ${entry.itemId}`);
    for (const check of hintChecks) {
      if (check.exists && check.faults.length === 0) {
        console.log(`  would reword   ${check.entry.id} (${check.author.authorship}: ${check.author.writtenBy})`);
      }
    }
    for (const check of scriptChecks) {
      if (check.item && check.faults.length === 0) console.log(`  would rescript ${check.entry.itemId}`);
    }
    await prisma.$disconnect();
    return;
  }

  // A system actor id: the audit log's actor column is who OPERATED the
  // machinery, and for a script that is the script. The reviewer's identity
  // travels in the detail, where it cannot be mistaken for a click.
  const operator = await prisma.parentAccount.findUnique({
    where: { email: record.recordedBy.replace(/^human:/, '') },
    select: { id: true },
  });
  if (!operator) {
    console.error(`cannot record: ${record.recordedBy} is not an account on this system.`);
    process.exit(1);
  }
  const audit = async (id: string, detail: Record<string, unknown>) => {
    await prisma.adminAuditLog.create({
      data: {
        actorId: operator.id,
        action: 'misconception.approve_recorded',
        targetKind: 'Misconception',
        targetId: id,
        detail: { ...detail, via: 'offline review pack' },
      },
    });
  };

  // (a) Item amendments the reviewer specified. An amended item returns to
  // DRAFT with their note attached: an edit invalidates a prior review (P3),
  // and the note is what the next person needs.
  let amended = 0;
  for (const entry of amendments) {
    const item = await prisma.item.findUnique({ where: { id: entry.itemId } });
    if (!item) {
      console.warn(`  ! ${entry.itemId}: no such item, skipped`);
      continue;
    }
    await prisma.item.update({
      where: { id: entry.itemId },
      data: {
        ...(entry.stem ? { stem: { ...(item.stem as object), prompt: entry.stem } } : {}),
        status: 'DRAFT',
        reviewedBy: null,
        reviewNotes: `${entry.note} [${record.method}; reviewer ${record.approvedBy}, entered by ${record.recordedBy}]`,
      },
    });
    await prisma.adminAuditLog.create({
      data: {
        actorId: operator.id,
        action: 'item.amend_recorded',
        targetKind: 'Item',
        targetId: entry.itemId,
        detail: { reviewedBy: record.approvedBy, recordedBy: record.recordedBy, method: record.method, note: entry.note },
      },
    });
    amended += 1;
  }

  // (c) The reviewer's own copy, verbatim. The previous wording is kept in
  // the audit detail: replacing a hint that a child may already have met is
  // a change to serving content, and "what did it say before" is the first
  // question anyone asks about it later.
  let reworded = 0;
  for (const check of hintChecks) {
    if (!check.exists || check.faults.length > 0) continue;
    const before = await prisma.misconception.findUnique({ where: { id: check.entry.id } });
    await prisma.misconception.update({
      where: { id: check.entry.id },
      data: { childHint: check.entry.hint },
    });
    await prisma.adminAuditLog.create({
      data: {
        actorId: operator.id,
        action: 'misconception.hint_rewrite_recorded',
        targetKind: 'Misconception',
        targetId: check.entry.id,
        detail: {
          // Not `approvedBy`: nothing was approved here. These are WORDS, and
          // authorship is its own claim — see authorshipOf above.
          ...check.author,
          recordedBy: record.recordedBy,
          previousHint: before?.childHint ?? null,
          newHint: check.entry.hint,
        },
      },
    });
    reworded += 1;
  }

  let rescripted = 0;
  for (const check of scriptChecks) {
    if (!check.item || check.faults.length > 0) continue;
    const explanation = (check.item.explanation ?? {}) as Record<string, unknown>;
    await prisma.item.update({
      where: { id: check.entry.itemId },
      data: {
        explanation: {
          ...explanation,
          walkScript: check.entry.walkScript,
          // Provenance on the asset itself. A script written by the reviewer
          // is not a draft awaiting the rewrite pass, and the pass needs to
          // be able to tell which is which.
          walkScriptBy: record.approvedBy,
          walkScriptMethod: record.method,
        },
      },
    });
    await prisma.adminAuditLog.create({
      data: {
        actorId: operator.id,
        action: 'item.walkscript_recorded',
        targetKind: 'Item',
        targetId: check.entry.itemId,
        detail: {
          writtenBy: record.approvedBy,
          recordedBy: record.recordedBy,
          method: record.method,
          previousWalkScript: (explanation.walkScript as string) ?? null,
          newWalkScript: check.entry.walkScript,
        },
      },
    });
    rescripted += 1;
  }

  // (b) The approvals and rejections, through the shared recording path.
  const approved = approve.length
    ? await recordMisconceptionApprovals({ ids: approve, record, audit })
    : { recorded: [], skipped: [] };
  const rejected = reject.length
    ? await recordMisconceptionRejections({ decisions: reject, record, audit })
    : { recorded: [], skipped: [] };

  console.log(`\nApplied:`);
  console.log(`  items amended        : ${amended}`);
  console.log(`  hints reworded       : ${reworded}/${hintRewrites.length}`);
  console.log(`  walk scripts recorded: ${rescripted}/${walkScripts.length}`);
  console.log(`  misconceptions approved: ${approved.recorded.length}`);
  console.log(`  misconceptions rejected: ${rejected.recorded.length}`);
  for (const skip of [...approved.skipped, ...rejected.skipped]) {
    console.log(`  skipped ${skip.id}: ${skip.reason}`);
  }

  if (file.rulings?.some((ruling) => ruling.answer.trim())) {
    console.log(`\nRulings answered — transcribe these into docs/corpus-decisions.md:`);
    for (const ruling of file.rulings) {
      if (ruling.answer.trim()) console.log(`  · ${ruling.question}\n      ${ruling.answer}`);
    }
  }
  await prisma.$disconnect();
}

void main();
