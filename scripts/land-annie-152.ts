/**
 * HER 152ND + DAVID'S FOUR (2026-08-25 — R709): the units reconciliation, the group rules crossed,
 * the six unruled letter-count rows stripped, and THE REISSUE — which outranks the rest.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const SHA152 = '3d8b8e705b50e42fd48e1e3be88b646ee6a15a97ed01d56b5fe46a60ec3eb94b';
const SHARUN = 'f78e3180dc61fc73c1c4a83a08200c863ed9cda8721b7f63ef5dd690ba1d841b';
const AUTH = `annie-152-for-code.md, sha256 ${SHA152}; David's ruling that letter-count is refused full stop`;
const FIVE = ['ENG-018-RB-01', 'ENG-018-RB-11', 'ENG-019-BV-02', 'ENG-023-RT-08', 'ENG-027-RR-08'];
const SIX_UNRULED = [20, 21, 22, 23, 24, 25].map((n) => `bank-vr-02-two-odd-ones-out-${n}`);
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  if (sha256(readFileSync('/Users/davidb/Downloads/annie-152-for-code.md')) !== SHA152) throw new Error('REFUSED — 152nd digest mismatch');
  if (sha256(readFileSync('/Users/davidb/Downloads/key-sharing-run-for-code.json')) !== SHARUN) throw new Error('REFUSED — run digest mismatch');

  // ---- 1. The six unruled letter-count rows: stripped ----
  const stripped: Array<Record<string, unknown>> = [];
  for (const id of SIX_UNRULED) {
    const item = await prisma.item.findUniqueOrThrow({ where: { id }, select: { options: { select: { id: true, content: true, misconceptionId: true, drafterDeclaredPull: true, isCorrect: true } } } });
    const target = item.options.filter((o) => !o.isCorrect && /letter-count/i.test(o.drafterDeclaredPull ?? ''));
    if (target.length !== 1) throw new Error(`REFUSED — ${id}: ${target.length} letter-count options, expected exactly 1`);
    const o = target[0]!;
    const keyWords = (item.options.find((x) => x.isCorrect)!.content as { value?: unknown }).value as string[];
    const keyShares = Array.isArray(keyWords) && keyWords.length === 2 && keyWords[0]!.length === keyWords[1]!.length;
    const verdict = `REFUSED — letter-count is not a pull a child feels (Annie's 151st, ruled full stop by David on her 152nd). ${keyShares ? 'This row ALSO fails the key-sharing test: the key shares the declared property.' : 'The key does not share the property; the row is stripped on the class ruling, not on key-sharing.'} Seat EMPTY pending an authored distractor.`;
    stripped.push({ item: id, option: (o.content as { value?: unknown }).value, tagRemoved: o.misconceptionId, key: keyWords, alsoFailsKeySharing: keyShares, drafterClaim: o.drafterDeclaredPull, verdict });
    if (!APPLY) continue;
    await prisma.itemOption.update({ where: { id: o.id }, data: { misconceptionId: null, drafterDeclaredPullVerdict: verdict } });
    await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'options.misconceptionId', method: `her 151st class ruling extended by David on her 152nd (${SHA152.slice(0, 16)})`, note: `${o.misconceptionId} -> null; letter-count refused as a pull${keyShares ? '; also fails the key-sharing test' : ''}` } });
    console.log(`  STRIPPED ${id}${keyShares ? ' (also fails key-sharing)' : ''}`);
  }

  // ---- 2. The twenty-five group rules, verbatim ----
  const vr02 = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, select: { id: true, stem: true, difficultyTier: true, drafterNote: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } }, orderBy: { id: 'asc' } });
  const missingNote = vr02.filter((i) => !i.drafterNote);
  if (missingNote.length) throw new Error(`REFUSED — ${missingNote.length} vr-02 rows carry no group rule; the crossing must be all twenty-five`);
  const groupRules = vr02.map((i) => ({
    id: i.id, tier: i.difficultyTier,
    words: (i.stem as { words?: string[] }).words,
    groupRuleVerbatim: i.drafterNote,
    key: (i.options.find((o) => o.isCorrect)!.content as { value?: unknown }).value,
    distractorsAndTags: i.options.filter((o) => !o.isCorrect).map((o) => ({ value: (o.content as { value?: unknown }).value, tag: o.misconceptionId })),
  }));

  // ---- 3. THE REISSUE: what happened, from rows, events, logs and the door's own verdict ----
  const items = await prisma.item.findMany({ where: { id: { in: FIVE } }, select: { id: true } });
  const events = await prisma.attributionEvent.count({ where: { recordId: { in: FIVE } } });
  const audit = await prisma.adminAuditLog.count({ where: { targetId: { in: FIVE } } });
  const writes = await prisma.contentWriteLog.count({ where: { recordId: { in: FIVE } } });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the read (and its non-null assumption) is kept as run
  const logStart = (await prisma.contentWriteLog.findFirst({ orderBy: { at: 'asc' }, select: { at: true } }))!.at;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the read is kept as run
  const deletesLogged = await prisma.contentWriteLog.count({ where: { op: 'DELETE', tableName: 'Item' } });
  const clusters: Record<string, unknown> = {};
  for (const p of ['ENG-015', 'ENG-018', 'ENG-019', 'ENG-023', 'ENG-027']) {
    const rows = await prisma.item.findMany({ where: { id: { startsWith: p } }, select: { id: true }, orderBy: { id: 'asc' } });
    clusters[p] = { present: rows.map((r) => r.id.replace(`${p}-`, '')), count: rows.length };
  }
  let doorVerdict = '';
  try { doorVerdict = execSync('pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-reissued-items.ts', { cwd: REPO, encoding: 'utf8' }); }
  catch (e) { doorVerdict = String((e as { stdout?: string }).stdout ?? ''); }
  const heldLines = doorVerdict.split('\n').filter((l) => /HELD|REPORT ONLY|reissued/.test(l)).map((l) => l.trim());

  const reissue = {
    verdict: 'NEVER IMPORTED — HELD AT THE GATE, EACH FOR A NAMED CONTENT FAULT THAT STILL STANDS. Not imported under other ids; not imported and later removed.',
    evidenceFromTheRows: {
      itemRows: `${items.length} of 5 exist`,
      attributionEvents: events,
      adminAuditRows: audit,
      contentWriteLogRows: writes,
      clusterHoles: 'each cluster carries a HOLE exactly at the reissued slot with every sibling present — ENG-018 has RB-02..RB-10 and RB-12 (RB-01 and RB-11 absent), ENG-019 has BV-01 and BV-03..BV-12 (BV-02 absent), ENG-023 lacks only RT-08, ENG-027 lacks only RR-08. A row imported under another id would have filled the slot or duplicated a sibling; neither happened.',
      clusters,
    },
    theDoorsOwnVerdictToday: {
      method: 'import-reissued-items.ts run report-only THIS TURN — the gate re-stating its refusal, not a reconstruction',
      lines: heldLines,
      faults: {
        'ENG-018-RB-01': 'US spelling "favoring" in explanation.walkScript',
        'ENG-018-RB-11': 'US spelling "traveling" in explanation.walkScript',
        'ENG-019-BV-02': 'banned vocabulary "quick" (no-urgency stance) in explanation.walkScript',
        'ENG-023-RT-08': 'US spelling "fibers" in an option value',
        'ENG-027-RR-08': 'US spelling "realized" in explanation.walkScript',
      },
    },
    theSixth: 'ENG-015-CC-12 passed the same gate and landed 2026-08-19T21:37Z (one INSERT in the write log, no attribution events) — three days after its siblings, so its presence is the reissue path working on the one row that passed, not evidence the reissue landed.',
    theSecondDoor: 'import-reissued-six.ts CANNOT have landed them under any circumstances: its write path is UNCONDITIONALLY CUT (a bare `return` before the create transaction, under R491/R484 — a snapshot is evidence, not a source). It reports and stops.',
    limitsStatedFirst: [
      'THE WRITE LOG CANNOT SEE BEFORE 2026-08-16T11:27:29Z — a removal earlier than that would leave no trace in it. What rules removal out within its coverage: 1,400 DELETE ops on Item ARE logged and none names these five, and no INSERT for them exists at all.',
      'ABSENCE OF AN EVENT IS NOT PROOF OF ABSENCE OF AN ACT in general; here four independent stores are empty AND the gate actively refuses the rows today, which is why the reading is never-imported rather than unknown.',
    ],
    theClass: 'A REFUSAL THAT IS REPORTED BUT NOT ROUTED IS INDISTINGUISHABLE FROM A SUCCESS NOBODY CHECKED. The door did everything right — it named five faults, every run, for six days — and the reissue was believed landed because nobody read the report. This is the field-without-a-column class inverted: there the door was silent and the loss invisible; here the door spoke and no one was listening.',
  };

  const artefact = {
    kind: 'annie-152-landing',
    what: 'The units reconciliation, the twenty-five group rules crossed verbatim, the six unruled letter-count rows stripped, and the reissue traced from rows, events, logs and the door\'s own verdict.',
    authority: AUTH,
    theUnitsReconciliation: {
      statement: 'THIS SIDE\'S 13 AND COWORK\'S 16 RECONCILE EXACTLY — THE UNITS CLASS, NOT A DIVERGENCE (R690).',
      arithmetic: 'Cowork walks BANK FILES: vr02-bank.json 13 + vr02-fixes.json 3 = 16. This side walks SERVING ROWS, and vr02-fixes.json has no serving rows of its own — its three are fixes to bank rows. 13 serving + 3 file-only = 16 file-level. Same corpus, two units, both counts correct in their own unit.',
      recordedAs: 'units class — a count without its declared unit is two counts wearing one name',
      coworkRun: { file: 'key-sharing-run-for-code.json', sha256: SHARUN, agreementOnFailures: 'both stores find the same three key-sharing failures (items 15, 18, 22), independently derived — and BOTH found item 22, which no reading had named' },
    },
    theSixStripped: { ruling: 'letter-count refused as a pull FULL STOP (David on her 152nd), so the six unruled rows are in scope', membership: stripped, alsoFailingKeySharing: stripped.filter((s) => s.alsoFailsKeySharing).map((s) => s.item) },
    theGroupRulesCrossed: {
      why: 'her 152nd: everything judged in case-vr-02 was judged by RECONSTRUCTING the group rule from the five words — "the rule was sitting on the bank row the whole time, and neither the serving store nor I could see it." She will re-read the eighteen against these rather than trust the reconstructions.',
      count: groupRules.length,
      rows: groupRules,
    },
    THE_REISSUE: reissue,
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  console.log(`\nstripped: ${stripped.length}; group rules: ${groupRules.length}; reissue rows present: ${items.length}/5, events ${events}, audit ${audit}, writes ${writes}`);
  if (APPLY) {
    const name = stampedName('annie-152-landing', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'annie-152-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
