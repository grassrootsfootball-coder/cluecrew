/**
 * THE FOUR LAND FROM THE AUTHORED SOURCE, NOT FROM THE STALE REISSUE (David, 2026-08-25 — R713).
 * And her eighty-row rewrite lands in the rationale field the tag serves, never in the drafter's
 * verbatim claim.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const SRC = '/Users/davidb/Downloads/repaired-four-for-code.json';
const SRC_SHA = '9f8abd7ed204b1a4dbae65bd642792c3205b380de8589e57d23842d7b7667055';
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const canonical = (o: unknown): string => {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return `[${o.map(canonical).join(',')}]`;
  return `{${Object.keys(o as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((o as Record<string, unknown>)[k])}`).join(',')}}`;
};

async function run() {
  const bytes = readFileSync(SRC);
  if (sha256(bytes) !== SRC_SHA) throw new Error(`REFUSED — the re-cross reads ${sha256(bytes)}, declared ${SRC_SHA}`);
  const src = JSON.parse(bytes.toString('utf8')) as { theRecross: { rows: Record<string, { rowSha256: string; sourceFile: string; item: Record<string, unknown> }> } };
  const rows = Object.entries(src.theRecross.rows);
  const landed: Array<Record<string, unknown>> = [];

  for (const [id, row] of rows) {
    const it = row.item;
    // Its declared per-row digest, recomputed under its declared spec before anything is trusted.
    const recomputed = sha256(Buffer.from(canonical(it), 'utf8'));
    if (recomputed !== row.rowSha256) throw new Error(`REFUSED — ${id}: row digest ${recomputed} vs declared ${row.rowSha256}`);
    const qt = await prisma.questionType.findUnique({ where: { id: String(it.questionTypeId) }, select: { mechanic: true } });
    if (!qt) throw new Error(`REFUSED — ${id}: questionType ${it.questionTypeId} does not exist`);
    const options = (it.options as Array<Record<string, unknown>>) ?? [];
    const faults = checkItemChildFacing({
      id, stem: it.stem, explanation: it.explanation ?? {}, mechanic: qt.mechanic,
      options: options.map((o) => ({ content: { label: o.label, value: o.value }, misconceptionId: o.misconceptionId ?? null })),
    }).filter(isBlocking);
    const exists = await prisma.item.findUnique({ where: { id } });
    landed.push({ id, sourceFile: row.sourceFile, rowSha256: row.rowSha256, gate: faults.length ? faults.map((f) => `${f.rule}: ${f.detail}`) : 'PASSES', alreadyPresent: Boolean(exists) });
    if (faults.length) { console.log(`  HELD    ${id}: ${faults.map((f) => f.detail.slice(0, 60)).join('; ')}`); continue; }
    if (exists) { console.log(`  PRESENT ${id}`); continue; }
    if (!APPLY) { console.log(`  WOULD LAND ${id}`); continue; }
    await prisma.item.create({
      data: {
        id, questionTypeId: String(it.questionTypeId), difficultyTier: Number(it.difficultyTier),
        stem: it.stem as object, explanation: (it.explanation ?? {}) as object,
        status: 'DRAFT', pool: 'PRACTICE', authoredBy: String(it.authoredBy ?? 'ai-draft:cowork-okafor-v1'),
        tierRationale: (it.tierRationale as string) || null,
        lineRefs: (it.lineRefs ?? undefined) as object | undefined,
        sourcedFrom: (it.sourcedFrom as string) || null,
        mechanismLedger: (it.mechanismLedger ?? undefined) as object | undefined,
        options: {
          create: options.map((o) => ({
            content: { label: o.label, value: o.value },
            isCorrect: Boolean(o.isCorrect),
            misconceptionId: (o.misconceptionId as string) ?? null,
            misconceptionExecution: (o.misconceptionExecution as string) ?? null,
            attractorLine: (o.attractorLine as number) ?? null,
            attractorQuote: (o.attractorQuote as string) ?? null,
            windowClass: (o.windowClass as string) ?? null,
            a36Note: (o.a36Note as string) ?? null,
          })),
        },
      },
    });
    await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AUTHORED', reviewerId: null, actor: 'Cowork', recordedBy: DAVID, field: 'item', method: `landed from the authored source re-cross (repaired-four-for-code.json, ${SRC_SHA.slice(0, 16)}), NOT from the stale reissue`, note: `row digest ${row.rowSha256.slice(0, 16)} recomputed here; gate passed` } });
    console.log(`  LANDED  ${id}`);
  }

  // ---- Her eighty-row rewrite: into the rationale the TAG serves, never the drafter's claim ----
  const eighty = await prisma.itemOption.findMany({
    where: { drafterDeclaredPull: { startsWith: 'Made a real word' } },
    select: { id: true, drafterDeclaredPull: true, misconceptionExecution: true, itemId: true },
  });
  let rewritten = 0;
  const REW: Array<Record<string, unknown>> = [];
  for (const o of eighty) {
    const w = /Made a real word \(([^)]+)\)/.exec(o.drafterDeclaredPull!);
    if (!w) throw new Error(`REFUSED — ${o.itemId}: the drafter's claim does not carry a (WORD) to substitute`);
    const authored = `Does not fit the sentence, although it makes a real word (${w[1]}).`;
    REW.push({ item: o.itemId, drafterClaimUNTOUCHED: o.drafterDeclaredPull, executionBefore: o.misconceptionExecution, executionAfter: authored });
    if (!APPLY) continue;
    await prisma.itemOption.update({ where: { id: o.id }, data: { misconceptionExecution: authored } });
    rewritten++;
  }
  if (APPLY && rewritten) {
    await prisma.attributionEvent.create({ data: { recordType: 'misconception', recordId: 'vr06-ignores-sentence', action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'options.misconceptionExecution', method: 'her 154th: PASS on substance, REWRITE on emphasis — one template substitution across the class', note: `${rewritten} rows; the claim leads and the setting follows; drafterDeclaredPull untouched (the drafter's verbatim claim)` } });
  }

  const artefact = {
    kind: 'repaired-four-landing',
    what: 'The four landed from Cowork\'s authored source (not the stale reissue), and her eighty-row rewrite landed in the rationale the tag serves.',
    source: { file: 'repaired-four-for-code.json', sha256: SRC_SHA, note: 'each row\'s declared digest recomputed here under its declared spec before the gate ran' },
    theStaleness: 'Cowork\'s finding, taken: the refusals were correct against the strings they were given, and those strings were out of date. Three items were refused for faults already repaired days earlier; BV-02 was refused for a word already correctly declared as a quotation.',
    rows: landed,
    theEightyRewrite: {
      ruledBy: 'her 154th — PASS on substance, REWRITE on emphasis: "Does not fit the sentence, although it makes a real word (WORD)."',
      landedIn: 'ItemOption.misconceptionExecution — the rationale the tag serves',
      neverIn: 'drafterDeclaredPull, which keeps the drafter\'s claim VERBATIM; the claim and the reviewer\'s rewrite now sit side by side and neither impersonates the other',
      count: REW.length,
      CONSEQUENCE_STATED: 'these 80 options previously held NO execution. Filling them moves 80 rows toward the R701 wholeness bar (tags attested ∧ executions landed ∧ walkScript). That is a real effect of a real reviewer ruling, not a machine filling a field — but it is named here rather than discovered later in a census.',
      sample: REW.slice(0, 2),
    },
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  console.log(`\nfour: ${landed.filter((l) => l.gate === 'PASSES').length}/4 pass the gate; eighty rewrite rows: ${REW.length}`);
  if (APPLY) {
    const name = stampedName('repaired-four-landing', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'repaired-four-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
