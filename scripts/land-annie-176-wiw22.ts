/**
 * HER 176th, AMENDMENT 1 OF 1: `item:ENG-001-WIW-22:hint` takes the AUTHORED text (R821).
 *
 * **Four of her five keep the serving text; this one does not.** Her reason: *"the authored 'list
 * the human things and the animal things, what do you notice' asks for the same work without doing
 * it for her, and listing is own-paper working, which the rough-paper rule allows. This row should
 * change, and it is the one place the authored text holds something the serving text lost."*
 *
 * **The `replacedSha256` she supplied is VERIFIED against the row before anything is written** —
 * her own rule (R164): a hash in that field asserts the row's actual prior bytes, so it is checked
 * rather than trusted.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const SHA176 = '01df9b553b5bf0ab6fc2355ac0f98f83';
const ITEM = 'ENG-001-WIW-22';
const REPLACED = 'Some things about them are human and some are animal. Notice both.';
const REPLACED_SHA = '31d655923d1071075e3f8aecf0991541bf8b1275743d578559c540b15c1b4ac6';
const AUTHORED = 'List the human things and the animal things. What do you notice?';

async function run() {
  assertFixture('annie-176-wiw22', [
    { name: 'the declared prior text hashes to her replacedSha256', input: REPLACED, mustBeCaught: true },
    { name: 'the same text with trailing space still hashes to it once trimmed', input: `${REPLACED} `, mustBeCaught: true },
    { name: 'the authored text does not', input: AUTHORED, mustBeCaught: false },
    { name: 'nor does a near miss', input: REPLACED.replace('Notice both.', 'Notice both'), mustBeCaught: false },
  ], (t) => sha(t.trim()) === REPLACED_SHA);

  const row = await prisma.item.findUnique({ where: { id: ITEM }, select: { id: true, status: true, stem: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { content: true } } } });
  requirePopulation('land:annie-176-wiw22', { 'target rows': row ? 1 : 0 });
  const exp = (row!.explanation ?? {}) as Record<string, unknown>;
  const onTheRow = String(exp.hintCore ?? '').trim();

  const verified = sha(onTheRow) === REPLACED_SHA;
  if (!verified) {
    console.error(`REFUSING: her replacedSha256 does not match this row.\n  row holds : ${onTheRow}\n  sha       : ${sha(onTheRow)}\n  she states: ${REPLACED_SHA}\n  R164 — that field asserts the row's actual prior bytes; a mismatch means one of us is describing a different row.`);
    process.exit(1);
  }

  const after = { ...exp, hintCore: AUTHORED };
  const faults = checkItemChildFacing({ id: ITEM, stem: row!.stem, explanation: after, options: row!.options });
  if (faults.length) { console.error(`GATE REFUSES: ${faults.map((f) => `${f.rule}: ${f.detail}`).join('; ')}`); process.exit(1); }

  if (APPLY) {
    await prisma.$transaction(async (tx) => {
      await tx.item.update({ where: { id: ITEM }, data: { explanation: { ...after, _previousHintCore: REPLACED, _previousHintCoreSha256: REPLACED_SHA, _previousHintCoreRule: 'her 176th, amendment 1 of 1' } as object } });
      await tx.attributionEvent.create({ data: {
        recordType: 'item', recordId: ITEM, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david',
        field: 'explanation.hintCore',
        method: `her 176th (${SHA176}): WIW-22 takes the authored text — listing is own-paper working and the rough-paper rule allows it`,
        note: `replacedSha256 ${REPLACED_SHA.slice(0, 16)}… VERIFIED against the row before writing (R164); prior text retained on the row as _previousHintCore`,
      } });
    });
  }

  const payload = {
    kind: 'annie-176-wiw22-landing',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    herReturn: { sha256: SHA176, amendments: '1 of 1' },
    THE_AMENDMENT: { target: 'item:ENG-001-WIW-22:hint', replaced: REPLACED, replacedSha256: REPLACED_SHA, authored: AUTHORED },
    THE_VERIFICATION: { rowHeld: onTheRow, rowSha256: sha(onTheRow), herReplacedSha256: REPLACED_SHA, MATCHED: verified, why: 'R164 — a replacedSha256 asserts the row\'s actual prior bytes, so it is checked before writing rather than trusted. A mismatch would mean one of us is describing a different row, and that is a stop, not a warning.' },
    THE_GATE: faults.length ? faults : 'CLEAN — checkItemChildFacing over the amended item',
    HER_REASON_VERBATIM: 'the authored "list the human things and the animal things, what do you notice" asks for the same work without doing it for her, and listing is own-paper working, which the rough-paper rule allows. This row should change, and it is the one place the authored text holds something the serving text lost.',
    ANDTHEOTHERFOUR: 'WIW-05, WIW-12, PR-01 and PR-03 keep the serving text by her confirmation. Nothing is written for them.',
    priorRetained: '_previousHintCore, _previousHintCoreSha256 and _previousHintCoreRule on the row — the actual bytes, not a reconstruction (R164).',
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['THE_AMENDMENT', 'THE_VERIFICATION', 'THE_GATE']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'annie-176-wiw22-landing' : 'annie-176-wiw22-landing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — replacedSha256 verified: ${verified}; gate ${faults.length ? 'FAULTS' : 'clean'}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
