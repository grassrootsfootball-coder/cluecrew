/**
 * The five items of the six-item reissue that never landed (R355).
 *
 * REPORTS by default; `--apply` imports. Every item is (1) digest-verified against Cowork's own
 * declared spec, then (2) put through `checkItemChildFacing` — the one child-facing gate every door
 * calls. **An item that fails the gate is NOT imported and NOT repaired here**: repairing authored
 * content on this side is the two-way editing CLAUDE.md forbids, and it is why BV-02 has bounced at
 * the same door three times.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const SOURCE = '/Users/davidb/Downloads/REISSUESIXITEMS.json';
/**
 * **THE WRITE PATH IS CUT (R491). This reads a SNAPSHOT, and a snapshot is EVIDENCE, not a source**
 * (R484). It may report what the file names and what the store holds; it may not write from it,
 * because a file cannot say which of its rows a later ruling has settled.
 *
 * **AND THIS ADDRESSES A SMALLER RISK THAN THE ONE THAT ALREADY FIRED.** The file that overwrote her
 * `chilly` wording had NO standing reader at all — it was read by hand, in a one-off script written
 * and deleted in the same minute. **Cutting a declared reader does not reach that**, and a repair
 * that fixes the neighbouring case while reading as fixing THE case is worse than no repair. This
 * one is only safe because that sentence sits beside it.
 */
const APPLY = false; // cut: see above. Was `process.argv.includes('--apply')`.

/** Cowork's spec: sha256 over each ITEM object, `sort_keys=True separators=(',',':')`, UTF-8. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const o = value as Record<string, unknown>;
  return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(',')}}`;
}

async function main() {
  const file = JSON.parse(readFileSync(SOURCE, 'utf8')) as {
    items?: Array<{ itemId: string; sha256: string; item: Record<string, unknown> }>;
  };
  if (!Array.isArray(file.items)) {
    throw new Error(`import-reissued-items ABORTED — ${SOURCE} carries no 'items' array.`);
  }

  const present = new Set(
    (await prisma.item.findMany({ where: { id: { in: file.items.map((i) => i.itemId) } }, select: { id: true } }))
      .map((r) => r.id),
  );
  const absent = file.items.filter((i) => !present.has(i.itemId));
  console.log(`${file.items.length} reissued · ${present.size} already here · ${absent.length} absent\n`);

  const clean: typeof absent = [];
  const held: Array<{ id: string; reasons: string[] }> = [];

  for (const row of absent) {
    // DIGEST FIRST. A gate verdict on bytes that are not the bytes Cowork signed is a verdict about
    // something else, and it would be reported as a verdict about their content.
    const computed = createHash('sha256').update(canonical(row.item), 'utf8').digest('hex');
    const digestOk = computed === row.sha256;

    /**
     * **THE OPTION SHAPE MIRRORS `import-english-items.ts` EXACTLY, AND THE FIRST VERSION DID NOT.**
     *
     * The real door builds `content: { value, label? }` and puts `misconceptionId` in its own
     * column; authoring metadata — `a36Note`, `misconceptionExecution`, `attractorQuote`,
     * `windowClass` — never enters the gate. My first harness passed the WHOLE option object as
     * `content`, so `textsFrom` walked every authoring key and reported US spellings in a source
     * quotation, id leaks in `misconceptionId`, and 21-word sentences in a reviewer's note.
     *
     * **It held all five, and four of them are fine.** Every one of those failures was manufactured
     * by the harness, and each read exactly like a content defect — R149's finding, arrived at from
     * the other side: a gate reporting failures that are the instrument. A second door disagreeing
     * with the governing one is the fault this gate was centralised to end (see the comment at
     * `import-english-items.ts:265`), and I rebuilt it by hand instead of calling it the same way.
     */
    const stem = row.item.stem as Record<string, unknown> | undefined;
    const options = (row.item.options as Array<Record<string, unknown>> | undefined) ?? [];
    const optionRows = options.map((o) => ({
      content: { value: o.value, ...(o.label ? { label: o.label } : {}) },
      isCorrect: Boolean(o.isCorrect),
      misconceptionId: (o.misconceptionId as string | null) ?? null,
    }));
    const failures = checkItemChildFacing({
      id: row.itemId,
      stem: stem ?? {},
      explanation: row.item.explanation ?? {},
      mechanic: null,
      options: optionRows,
    }).filter(isBlocking);

    const reasons = [
      ...(digestOk ? [] : [`digest MISMATCH — declared ${row.sha256.slice(0, 16)}…, computed ${computed.slice(0, 16)}…`]),
      ...failures.map((f) => `${f.rule} @ ${f.where}: ${f.detail}`),
    ];

    if (reasons.length === 0) {
      clean.push(row);
      console.log(`  CLEAN   ${row.itemId}  (digest verified)`);
    } else {
      held.push({ id: row.itemId, reasons });
      console.log(`  HELD    ${row.itemId}`);
      for (const r of reasons) console.log(`            ${r}`);
    }
  }

  if (!APPLY) {
    console.log(`\nREPORT ONLY. ${clean.length} would import, ${held.length} held. Re-run with --apply.`);
    await prisma.$disconnect();
    return;
  }

  // R1034/R1038: Cowork is retired, so there is no reissue to import, and this path could never have
  // succeeded on the current schema (it set no `authoredBy`, which is required). The report-only gate
  // above is still what emit-routing-report and land-annie-152 run; --apply now refuses with the reason.
  throw new Error('import-reissued-items --apply is retired (R1034: Cowork is no longer an authoring store). Draft new content through the agent-review doors instead.');

  console.log(
    `\n${clean.length} imported as DRAFT. ${held.length} held at the door and NOT repaired here —\n` +
      '  authored content is Cowork\'s, and repairing it on this side is the two-way editing that\n' +
      '  put these items in a reissue in the first place.',
  );
  await prisma.$disconnect();
}

void main();
