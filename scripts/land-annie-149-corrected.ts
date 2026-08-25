/**
 * HER 149TH, LANDED ON A CORRECTED PREMISE (David, 2026-08-24 — R706).
 *
 * THE CORRECTION OUTRANKS THE INSTRUCTION IT ARRIVED WITH. R704 answered "the generator names a
 * position, not a pull" from oddOnesOut() — the WRONG BUILDER: that template built the removed
 * gen-* items, and the serving bank-vr-02-* rows came through import-vr-banks.ts from the
 * AUTHORED bank vr02-bank.json (provenance ai-draft:cowork-vocab-banks), where the drafter
 * DECLARED a pull per option — and the import dropped the rationale silently (no column; the
 * field-without-a-column class, this time unnamed at the door).
 *
 * The 147th's own rule selects the branch: "if the generator names a pull, it crosses to her per
 * row; if it does not, or the pull it names is one she has already ruled out, the options
 * re-author." The drafter names LETTER-COUNT — a pull she has NOT ruled out — so THE DECLARATIONS
 * CROSS PER ROW and the tag-strip does NOT execute. Rows 11–14's stands are recorded as David
 * lifted them (pulls findable in the words, awaiting her per-row confirmation).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const SHA149 = 'ffd2771021f19b1ec85012bd909008d22c36f394a9cef46df99703525fd9a1bb';
const AUTH = `annie-149-for-code.md, sha256 ${SHA149}, executed on the corrected premise below`;
const FBANK = '/Users/davidb/Downloads/11+/items/vr-banks/vr02-bank.json';
const SHABANK = '7ce96804b4c4beb58e23ad232940300227fee619f7f4e0611836248d8de3f076';
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  if (sha256(readFileSync('/Users/davidb/Downloads/annie-149-for-code.md')) !== SHA149) throw new Error('REFUSED — 149th digest mismatch');
  const bankBytes = readFileSync(FBANK);
  if (sha256(bankBytes) !== SHABANK) throw new Error('REFUSED — bank digest mismatch');
  const bank = JSON.parse(bankBytes.toString('utf8')) as { items: Array<{ tier: number; stem: { words: string[] }; note: string; options: Array<{ value: unknown; isKey: boolean; misconceptionId?: string; misconception?: string }> }> };

  const THREE = [
    { id: 'bank-vr-02-two-odd-ones-out-15', match: 'duck' },
    { id: 'bank-vr-02-two-odd-ones-out-17', match: 'oval' },
    { id: 'bank-vr-02-two-odd-ones-out-18', match: 'hen' },
  ];
  const crossRows = [];
  for (const t of THREE) {
    const db = await prisma.item.findUniqueOrThrow({ where: { id: t.id }, select: { stem: true, difficultyTier: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } } });
    const words = (db.stem as { words: string[] }).words;
    const bankItem = bank.items.find((b) => JSON.stringify(b.stem.words) === JSON.stringify(words));
    if (!bankItem) throw new Error(`REFUSED — ${t.id}'s words not found in the bank`);
    const surfaceOpt = bankItem.options.find((o) => o.misconceptionId === 'vr02-surface-link');
    if (!surfaceOpt?.misconception) throw new Error(`REFUSED — ${t.id}: no declared rationale in the bank after all`);
    crossRows.push({
      id: t.id, tier: db.difficultyTier,
      stemVerbatim: db.stem,
      groupRuleFromTheBank: bankItem.note,
      servingOptions: db.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect, misconceptionId: o.misconceptionId })),
      theDraftersDeclaredPull: { optionValue: surfaceOpt.value, declaredTag: surfaceOpt.misconceptionId, rationaleVerbatim: surfaceOpt.misconception },
    });
  }

  // Rows 11–14: the stands, recorded as lifted.
  const stands = [];
  for (const n of [11, 12, 13, 14]) {
    const id = `bank-vr-02-two-odd-ones-out-${n}`;
    const db = await prisma.item.findUniqueOrThrow({ where: { id }, select: { stem: true, options: { select: { misconceptionId: true } } } });
    const words = (db.stem as { words: string[] }).words;
    const bankItem = bank.items.find((b) => JSON.stringify(b.stem.words) === JSON.stringify(words));
    const surfaceOpt = bankItem?.options.find((o) => o.misconceptionId === 'vr02-surface-link');
    stands.push({ id, state: 'RETAG STANDS ON ITS PULL (David lifted the suspension per this side\'s findings), awaiting her per-row confirmation', theDraftersOwnRationale: surfaceOpt?.misconception ?? 'not found in the bank', note: 'the drafter\'s declaration now also crosses for these four — her confirmation reads the pull in the words AND the drafter\'s claim side by side' });
    if (APPLY) {
      await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', reviewerId: null, actor: 'David', recordedBy: DAVID, field: 'options.D.misconceptionId', method: `suspension lifted per Code's word-findings (${SHA149.slice(0, 16)})`, note: 'retag stands on its pull, conditional on her per-row confirmation; the drafter\'s bank rationale crosses beside it' } });
    }
  }
  console.log('  4 stands recorded; 3 declarations found and crossing; NO tag stripped');

  if (APPLY) {
    const artefact = {
      kind: 'vr02-pulls-found-and-crossing',
      what: 'THE PREMISE CORRECTION FIRST: the serving bank-vr-02 rows were built from the AUTHORED bank vr02-bank.json, not from oddOnesOut() — R704\'s "position, not a pull" was the right answer about the wrong builder (the R173 class: the agreement was the camouflage; the CATEGORIES words not matching is what broke it open). The drafter DECLARED a pull per option and the import dropped the rationale silently — no column held it. The declarations cross here, per row, verbatim.',
      authority: AUTH,
      bankSource: { file: 'vr02-bank.json (11+/items/vr-banks)', sha256: SHABANK, provenance: 'ai-draft:cowork-vocab-banks', importedBy: 'scripts/import-vr-banks.ts, which carried misconceptionId and DROPPED the misconception rationale field — the field-without-a-column class, unnamed at the door this time (against R691\'s rule)' },
      theBranchThatFires: 'the 147th\'s rule, on the corrected premise: the drafter names LETTER-COUNT — a look-class pull she has NOT ruled out — so the declarations CROSS TO HER PER ROW. The tag-strip and re-authoring branch does NOT fire; whether letter-count is a pull a child actually feels is HER ruling, now made with the drafter\'s claim in front of her.',
      theThree: crossRows,
      theFourStands: stands,
      forCowork: 'the same three rows with group rules and full option sets — the blocker Cowork named (no bank-vr-02 content to read) clears with this artefact; the bank file is its own store\'s authoring returned to it.',
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('vr02-pulls-found-and-crossing', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'vr02-pulls-found-and-crossing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
