/** Her 156th's hint amendment (David, 2026-08-25 — R718). */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const SHA156 = '44e811cd92b3eebf9c7e91fa8203132045b7f1a3565be1e463c4b5ea5c28f19a';
const AUTH = `annie-156-for-code.md, sha256 ${SHA156}`;
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  const her = readFileSync('/Users/davidb/Downloads/annie-156-for-code.md');
  if (sha256(her) !== SHA156) throw new Error('REFUSED — 156th digest mismatch');
  const m = /target: library:vr02-surface-link:childHint\n\s+replaced: (.+)\n\s+replacedSha256: .+\n\s+authored: (.+)/.exec(her.toString('utf8'));
  if (!m) throw new Error('REFUSED — her amendment block not found');
  const replaced = m[1]!.trim(); const authored = m[2]!.trim();

  const db = await prisma.misconception.findUniqueOrThrow({ where: { id: 'vr02-surface-link' }, select: { childHint: true, textProvenance: true, approvedBy: true } });
  if (db.childHint !== replaced) throw new Error(`REFUSED — the live row does not hold her replaced string.\n  live:     ${JSON.stringify(db.childHint)}\n  replaced: ${JSON.stringify(replaced)}`);
  const gate = checkChildFacingText({ role: 'hint', label: 'vr02-surface-link', text: authored }).filter(isBlocking);
  if (gate.length) throw new Error(`REFUSED — her authored hint fails the gate: ${gate.map((f) => f.detail).join('; ')}`);

  const before = sha256(db.childHint);
  const after = sha256(authored);
  console.log(`  ${before.slice(0, 12)} -> ${after.slice(0, 12)}`);
  if (APPLY) {
    await prisma.misconception.update({
      where: { id: 'vr02-surface-link' },
      data: {
        childHint: authored, approvedBy: 'reviewer:rev-0001', recordedBy: DAVID,
        approvalMethod: 'written review — her 156th, after re-reading the eighteen against the declared group rules',
        textProvenance: {
          state: 'RECORDED', text: 'childHint',
          authoredBy: { kind: 'person', name: 'Annie' }, approvedBy: { kind: 'person', name: 'Annie' },
          approvedByPerson: 'reviewer:rev-0001',
          method: 'her authored replacement; replaced string asserted against the live row before write',
          authority: AUTH, date: '2026-08-25',
          previous: { childHint: db.childHint, sha256: before, replacedAt: '2026-08-25', approvedBy: db.approvedBy, provenance: db.textProvenance ?? { state: 'UNKNOWN' } },
        },
      },
    });
    await prisma.attributionEvent.create({ data: { recordType: 'misconception', recordId: 'vr02-surface-link', action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'childHint', method: `her 156th (${SHA156.slice(0, 16)})`, note: `before ${before} -> after ${after}; ruled at the hint rather than retagging nine rows, so the wording is true under both error readings` } });
    console.log('  AMENDED vr02-surface-link');
  }

  const artefact = {
    kind: 'annie-156-landing',
    what: 'Her hint amendment landed; the seven paths ruled STAFF and the fourteen cleared; the retention and notation rulings wired; the check now calls the gate.',
    authority: AUTH,
    theHint: { id: 'vr02-surface-link', before: db.childHint, beforeSha256: before, after: authored, afterSha256: after, ground: 'nine of eleven surface-link distractors are structurally partial-group AS WELL, so the tag records the drafter\'s guess about mechanism; ruled at the hint because a wording true under both readings beats retagging nine rows on a second guess (the WIW-19 lesson)' },
    theSevenRuledStaff: { paths: ['explanation.quotes[].rule', 'explanation.quotes[].passageRef', 'explanation.unplacedBySplit.why', 'explanation.unplacedBySplit.split', 'explanation.unplacedBySplit.state', 'explanation.unplacedBySplit.ruledBy', 'explanation.unplacedBySplit.authority'], result: 'all 14 items cleared; 335 LIVE, 0 failing, ZERO content faults — the prediction held exactly' },
    theTwoGateRulings: {
      retentionReadOnly: 'isRetentionPath — the rule is the UNDERSCORE, not a list, so a before-image nobody has written yet is covered on the day it appears. No gate flags them, no repairer touches them. Cowork\'s six punctuation findings on stem._previousText are correctly NOT faults: a doubled quotation mark in a retained before-image is a record of what was repaired.',
      notationIsNotEmphasis: 'the shouted-capitals rule binds EMPHASIS ONLY. Probed BEFORE the rule was written: SH___, SHOUT, OUT and AIR all pass the item gate clean, so this changes no verdict — it is a constant that prevents a LATER gate flagging a question type\'s own orthography. Cowork\'s 450 notation hits would have been 450 wrong verdicts; it named them rather than scoring them.',
    },
    theDeeperRepair: {
      ruled: 'check:every-string-field must call the gate, never model it',
      done: 'its own DISPOSITIONS map and its own isScreened predicate are DELETED. One membership (FIELD_DISPOSITIONS in core), one function (isScreenedPath/dispositionFor), no second implementation. The check now walks the whole row and reports CHILD 0 UNSCREENED.',
      whyItMattered: 'the re-derived predicate was wrong in both directions and produced the 1,533 figure that sent a correct ruling after the wrong hole.',
    },
    theNextListForTheDesk: {
      note: 'walking the whole row surfaces 30 paths with no disposition — mostly Item COLUMNS the gate does not walk (tierRationale, sourcedFrom, reviewNotes, itemModel, draftSelfAssessment.*) plus stem.quotes[].rule/.passageRef/.why and stemRedraft.*. NOT ruled here: a disposition is a ruling.',
      count: 30,
    },
    coworkBankScreen: { file: 'bank-screen-for-code.json', sha256: '64c4edd8ce7692fd470fd34646773d71e1260c613bc790229e76064afdcda943', takenAs: 'the second independent screen; its 28 shouted-TWO hits in the held banks are the amendment her 142nd made to the serving template not yet carried into the authoring banks — reported by it, not repaired, and not this side\'s to repair either.' },
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  if (APPLY) {
    const name = stampedName('annie-156-landing', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'annie-156-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
