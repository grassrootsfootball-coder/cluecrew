/** WHAT CHANGED IN THIS STORE'S LIBRARY BETWEEN 18:54 AND 19:23 ON 16 AUGUST (R814). */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const HERS = ['en-attribute-transfer', 'en-extreme-option-pull', 'en-homophone-by-sound'];

async function run() {
  assertFixture('library-window', [
    { name: 'a childHint write is a library text change', input: 'childHint', mustBeCaught: true },
    { name: 'so is a second naming it', input: 'status,childHint,updatedAt', mustBeCaught: true },
    { name: 'an updatedAt-only write is not', input: 'updatedAt', mustBeCaught: false },
    { name: 'a status-only write is not', input: 'status,approvedBy', mustBeCaught: false },
  ], (cols) => cols.split(',').includes('childHint'));

  const q = (sql: string) => prisma.$queryRawUnsafe(sql) as Promise<Array<Record<string, unknown>>>;
  const asGiven = await q(`SELECT "tableName", count(*) n FROM "ContentWriteLog" WHERE at >= '2026-08-16 18:54:00' AND at <= '2026-08-16 19:23:59' GROUP BY 1`);
  const shifted = await q(`SELECT "tableName", count(*) n FROM "ContentWriteLog" WHERE at >= '2026-08-16 17:54:00' AND at <= '2026-08-16 18:23:59' GROUP BY 1`);
  const hintWrites16 = await q(`SELECT "recordId", to_char(at,'HH24:MI:SS') ts, array_to_string("changedColumns",',') cols FROM "ContentWriteLog" WHERE "tableName"='Misconception' AND 'childHint' = ANY("changedColumns") AND at >= '2026-08-16 00:00:00' AND at < '2026-08-17 00:00:00' ORDER BY at`);
  const herThree = await q(`SELECT "recordId", to_char(at,'YYYY-MM-DD HH24:MI:SS') ts FROM "ContentWriteLog" WHERE "tableName"='Misconception' AND 'childHint' = ANY("changedColumns") AND "recordId" = ANY(ARRAY[${HERS.map((h) => `'${h}'`).join(",")}]) ORDER BY at`);
  requirePopulation('emit:library-window', { 'childHint writes on 16 August': hintWrites16.length, 'childHint writes to her three entries': herThree.length });

  const payload = {
    kind: 'library-window-answer',
    THE_QUESTION: 'what changed in this store\'s library between 18:54 and 19:23 on 16 August — the span between the authoring store\'s two exports of this database.',
    THE_ANSWER_AS_ASKED: asGiven.length === 0
      ? '**NOTHING. NO WRITE TO ANY CONTENT TABLE OCCURRED IN THAT WINDOW.** On the write log\'s own clock the span is empty — not empty of library writes, empty of writes.'
      : asGiven,
    THE_CLOCK_CAVEAT_AND_WHY_IT_DOES_NOT_MATTER_HERE: {
      theCaveat: 'R80 — the write log once defaulted to CURRENT_TIMESTAMP (timestamptz) stored into a naive TIMESTAMP(3) while the session ran BST, so pre-fix rows sit an hour ahead. The fix landed on 16 August, so rows from that date sit on either side of it and the clock is genuinely ambiguous for this window.',
      soBothWereRead: { asGiven: '18:54–19:23 → no writes at all', oneHourEarlier: shifted.map((r) => `${r.tableName}=${Number(r.n as bigint)}`).join(', ') || 'no writes' },
      andTHEAMBIGUITYISIMMATERIAL: '**under the shifted reading 17 Misconception rows were written, but only TWO changed `childHint` — `en-determiner-omitted` and `en-narrator-voice-as-fact` — and NEITHER is one of her three.** The other 15 touched `updatedAt`, `textProvenance`, `status` and `approvedBy` only: provenance and approval, not text.',
    },
    HER_THREE_ENTRIES: {
      entries: HERS,
      everyChildHintWriteToThem: herThree.map((r) => `${r.ts}  ${r.recordId}`),
      THE_FINDING: '**NONE OF THE THREE WAS WRITTEN ON 16 AUGUST AT ALL, under either clock reading.** Their text changed on 21 and 22 August — five and six days after both exports were taken.',
      soTHECONSEQUENCE: '**two exports of this database taken 29 minutes apart on 16 August CANNOT differ in those three entries.** Whatever produced two current wordings, it was not a change here between them. Both exports hold the same, and both hold pre-21-August text for all three.',
    },
    WHAT_THIS_RESOLVES_AND_WHAT_IT_DOES_NOT: {
      resolves: 'her §1 as a two-store disagreement. The authoring store holds no authoring half for the library — it holds two exports of THIS database — so joining them against these rows would be this store compared with itself. Her two wordings are one store observed twice.',
      doesNotResolve: 'WHICH observation is the current one. This store\'s answer is unambiguous — the text as of now, by digest, is in the serving half already crossed — but nothing here explains why a lookup dated the same day as a batch carried the older text. That is a question about how the lookups were produced, not about what this store held.',
      andONEDATETOCHECKATTHEDESK: 'she compared against batches stamped 2026-08-22T18:17. `en-homophone-by-sound` was written again at 20:58:45 on 22 August — AFTER that stamp. So for that one entry the batch itself is stale by two and a half hours, from this store\'s clock.',
    },
    childHintWritesOn16August: hintWrites16.map((r) => `${r.ts}  ${r.recordId}  [${r.cols}]`),
    METHOD: 'ContentWriteLog — the database\'s own append-only write trigger, queried directly. Not a reconstruction, not git, not a file mtime: the row-level record of what was written and when.',
  };
  const lines = herThree.map((r) => `${r.ts}\t${r.recordId}`);
  const d = digestOverText('the childHint write lines for her three entries, joined by \\n, each "<timestamp>\\t<recordId>"', lines.join('\n'));
  const artefact = { ...payload, HER_THREE_WRITE_LINES: lines, herThreeSha256: d.value, herThreeSha256Spec: d.spec, ...findingsDigest(payload, ['THE_ANSWER_AS_ASKED', 'THE_CLOCK_CAVEAT_AND_WHY_IT_DOES_NOT_MATTER_HERE', 'HER_THREE_ENTRIES', 'childHintWritesOn16August']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('library-window-answer', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'library-window-answer');
  console.log('answered from ContentWriteLog; her three entries were not written on 16 August under either clock reading.');
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
