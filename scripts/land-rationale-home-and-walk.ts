/**
 * THE RATIONALE GETS A HOME, AND THE FAULT'S CLASS WALKS THE ESTATE (David, 2026-08-25 — R707).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const BANKS = [
  { file: '/Users/davidb/Downloads/11+/items/vr-banks/vr02-bank.json', sha256: '7ce96804b4c4beb58e23ad232940300227fee619f7f4e0611836248d8de3f076', qt: 'vr-02-two-odd-ones-out' },
  { file: '/Users/davidb/Downloads/11+/items/vr-banks/vr06-bank.json', sha256: null as string | null, qt: 'vr-06-missing-word' },
];
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  const landed: Array<Record<string, unknown>> = [];
  const banksRead: Array<Record<string, unknown>> = [];

  for (const b of BANKS) {
    let bytes: Buffer;
    try { bytes = readFileSync(b.file); } catch { banksRead.push({ bank: b.qt, held: false, note: 'source not held this side — no backfill possible, stated not approximated' }); continue; }
    const digest = sha256(bytes);
    if (b.sha256 && digest !== b.sha256) throw new Error(`REFUSED — ${b.file} reads ${digest}, declared ${b.sha256}`);
    const bank = JSON.parse(bytes.toString('utf8')) as { items: Array<{ stem: { words?: string[]; frame?: string }; options: Array<{ value: unknown; misconception?: string; misconceptionId?: string }> }> };
    let withRationale = 0, matchedRows = 0, optionsSet = 0;
    for (const it of bank.items) {
      const declared = it.options.filter((o) => typeof o.misconception === 'string' && o.misconception.trim());
      if (declared.length) withRationale++;
      const items = await prisma.item.findMany({ where: { questionTypeId: b.qt }, select: { id: true, stem: true, options: { select: { id: true, content: true, drafterDeclaredPull: true } } } });
      /**
       * A SIGNATURE REFUSES WHERE IT CANNOT IDENTIFY (own fault, caught dry — R707). The first
       * matcher compared `words ?? frame`, which vr-06 rows carry NEITHER of: two undefineds
       * compared equal, so every bank row "matched" the first serving row. A match on the
       * agreement of two absences is the same nothing this whole thread is about.
       */
      const sig = (s: Record<string, unknown>) => {
        for (const k of ['words', 'frame', 'sentence']) if (s[k] !== undefined) return `${k}:${JSON.stringify(s[k])}`;
        throw new Error(`REFUSED — a stem with no words, frame or sentence cannot be identified: ${JSON.stringify(s).slice(0, 80)}`);
      };
      const wanted = sig(it.stem as Record<string, unknown>);
      const hits = items.filter((i) => sig(i.stem as Record<string, unknown>) === wanted);
      if (hits.length === 0) continue;
      if (hits.length > 1) throw new Error(`REFUSED — ${hits.length} serving rows share the signature ${wanted.slice(0, 60)}; a non-unique match writes to the wrong row`);
      const row = hits[0]!;
      matchedRows++;
      for (const o of declared) {
        const opt = row.options.find((x) => JSON.stringify((x.content as { value?: unknown }).value) === JSON.stringify(o.value));
        if (!opt) continue;
        if (opt.drafterDeclaredPull === o.misconception) continue;
        optionsSet++;
        if (APPLY) await prisma.itemOption.update({ where: { id: opt.id }, data: { drafterDeclaredPull: o.misconception } });
      }
    }
    banksRead.push({ bank: b.qt, held: true, sha256: digest, bankRowsWithDeclaredRationale: withRationale, servingRowsMatched: matchedRows, optionsGivenAHome: optionsSet });
    landed.push({ bank: b.qt, optionsGivenAHome: optionsSet });
  }

  // The rationale must NOT move wholeness: executions unchanged, doors unchanged.
  const executions = await prisma.itemOption.count({ where: { misconceptionExecution: { not: null }, item: { questionType: { district: 'VR' } } } });
  const pulls = await prisma.itemOption.count({ where: { drafterDeclaredPull: { not: null } } });

  const walk = JSON.parse(readFileSync('/private/tmp/claude-501/-Users-davidb-ClueCrew/9a8d8aea-32f1-4537-bb18-2b54d4491646/scratchpad/importer-walk.json', 'utf8'));

  const artefact = {
    kind: 'import-drop-walk-and-rationale-home',
    what: 'The import fault registered at its own door, the same shape walked across every importer as membership, and the drafter\'s rationale given a home that cannot be mistaken for an attestation.',
    theUnifiedFinding: {
      statement: 'ALL SEVEN DECLARED RATIONALES ARE LETTER-COUNT — including the four the desk lifted on associations. trumpet-balloon (seven letters), knife-thorn (five), candle-mirror (six), juice-paint (five), duck-crow (four), oval-star (four), cow-hen (three).',
      consequence: 'Her four confirmations and the three crossings are ONE QUESTION, not two: is letter-count a pull a child feels? The associations read in the words — blown, pierce, reflection, pourable — were the READER\'S, on all four rows; the drafter claimed the same mechanical rule seven times. Nothing here rules on it.',
    },
    theWalk: {
      limitsFirst: [
        'THIS WALK CANNOT SEE AN IMPORTER WHOSE SOURCE FILE THIS SIDE DOES NOT HOLD: 22 of 29 importers, reported UNDECIDABLE, never approximated. A file not held cannot be diffed.',
        'IT CANNOT DISTINGUISH CONTENT FROM METADATA: a key present in an emission\'s verification block reads the same as a dropped authored sentence. The membership below is CANDIDATES; the content judgement is a read, not a derivation.',
        'IT MATCHED ITS OWN FALSE NEGATIVES TWICE BEFORE REPORTING (R173): prisma.<model> accessors supply bare tokens that made import-vr-banks read as CLEAN of the very key it dropped, and the relation field ItemOption.misconception made a rationale with NO scalar column read as HAVING one. Both corrected; the walk then found its own instance, which is the canary this instrument needed.',
      ],
      method: 'every key at every depth of each HELD authored source, tested against the importer\'s own text with prisma accessors stripped; a key named nowhere in the door is a candidate silent drop.',
      population: { importers: 29, sourceHeld: 7, undecidable: 22 },
      membership: walk,
      sharpestClass: 'FIELDS WITH A SCALAR COLUMN THAT WAITED FOR THEM AND WERE NOT NAMED: import-reissued-six (a36Note, attractorLine, attractorQuote, misconceptionExecution, mechanismLedger, sourcedFrom, tierRationale, windowClass), import-reissued-items (attractorLine, authoredBy, lineRefs, mechanismLedger, sourcedFrom, tierRationale), import-pilot-from-cowork (twelve, though that door diffs rather than applies by design — CLAUDE.md), import-nvr-reworded-hints (description). Each is a read the desk should order, not a repair this artefact makes.',
      vrBanksProper: 'import-vr-banks: `misconception` — NO scalar column existed, so the drop was structural; nothing named it. That is the R706 class exactly, and it is closed at this door today.',
    },
    theHome: {
      column: 'ItemOption.drafterDeclaredPull (migration 20260825201437, additive; replay and invariants green)',
      whyNotTheExecutionField: 'an execution is the gated attested account the CZ-A2 discipline held an item at DRAFT for; filling it from a bank would manufacture wholeness out of a machine\'s claim. The name carries the doubt (R203): what a DRAFTER CLAIMED, never what a reviewer attested.',
      banksRead,
      wholenessUnchanged: `VR misconceptionExecution count after the backfill: ${executions} (the binding absence stands; no door moves). Options now carrying a declared pull: ${pulls}.`,
      doorFixed: 'import-vr-banks.ts declares the field, lands it, and PRINTS every key it cannot home with a row count — what a door cannot home, it names (R691), applied at the door that broke it.',
    },
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  console.log(`banks: ${JSON.stringify(banksRead)}`);
  console.log(`executions (unchanged bar): ${executions}; options with a declared pull: ${pulls}`);
  if (APPLY) {
    const name = stampedName('import-drop-walk-and-rationale-home', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'import-drop-walk-and-rationale-home');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
