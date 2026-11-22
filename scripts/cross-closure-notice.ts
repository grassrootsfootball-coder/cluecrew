/**
 * A CLOSURE NOTICE — the first discharge of the duty it registers (R913).
 *
 * **A closure crosses to everyone who might reopen it, addressed like a refusal.** Registering that
 * duty and then not performing it would be the duty's own fault in its first instance, so this
 * carries her 196th's three closures to both stores in the shape a refusal takes: a recipient, the
 * reason, and the condition that would REOPEN it — because a closure is not permanent by accident
 * any more than a withdrawal is.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const RETURN_SHA = '6dfe48bdf7a8fc5f18a776390f8aaf4e0b063d89b9664ad2a24450c9d74baeed';

const CLOSURES = [
  {
    question: 'the pence gap between MC02-RP-02\'s stem (£1.50, £1.20) and its options (10p, 20p, 30p)',
    theSurfaceThatINVITESREOPENING: 'a stem in pounds and options in pence looks like an inconsistency to any consistency sweep, and will look like one again to the next reader who meets it cold',
    CLOSED_AS: 'DESIGN. The pounds-to-pence step is part of the work the item exists to ask; MC03-RP-01 runs the same crossing in the other direction.',
    andWHATREOPENINGITWOULDCOST: 'smoothing the distance does the child\'s first step for her — the supplied-retrieval fault wearing a currency',
    reopenedBy: 'a ruling that the RP family should not test conversion in this form. Nothing less.',
  },
  {
    question: 'whether the `solution` field\'s bare pence needs a sweep or a repair',
    theSurfaceThatINVITESREOPENING: 'a money field with no unit, sitting beside option values that all carry one — exactly the shape the units rule was written for',
    CLOSED_AS: 'DESIGN. It is a machine-read check line; its reader is the checker, and the checker is the one reader for whom units are noise. The child\'s-eye rule governs what a CHILD reads and does not reach a field no child meets.',
    andWHATREOPENINGITWOULDCOST: 'a sweep would put units into a field whose only consumer is arithmetic',
    reopenedBy: 'a reader other than the checker acquiring that field — at which point it is child-facing and the units rule reaches it.',
  },
  {
    question: 'whether mixed money notation across the corpus is a fault population needing a hunt',
    theSurfaceThatINVITESREOPENING: 'the phrase "mixed notation" reads as a defect class, and a not-checked line left open is a permanent invitation to somebody\'s tidy-up',
    CLOSED_AS: 'NOT A FAULT POPULATION. Where the mixing is the item\'s task it is design; the units rule governs PRESENCE of units, and presence is whole.',
    andWHATREOPENINGITWOULDCOST: 'a hunt would find every conversion item in the corpus and report the skill as the defect',
    reopenedBy: 'a voice pass cataloguing the corpus\'s money registers — which she names as possible and separate, and which is not a fault hunt.',
  },
];

async function run() {
  const bytes = readFileSync('/Users/davidb/Downloads/annie-196-for-code.md', 'utf8');
  if (sha(bytes) !== RETURN_SHA) throw new Error(`the return does not hash to ${RETURN_SHA} — refusing`);
  requirePopulation('cross:closure-notice', { 'closure(s) to carry': CLOSURES.length });

  const full = {
    kind: 'closure-notice',
    TO: 'everyone who might reopen these — the authoring store (Cowork), the desk, and any later pass over this corpus',
    FROM: 'the serving side (Code), carrying Annie\'s 196th',
    WHY_THIS_IS_ADDRESSED_AT_ALL: 'a closure crosses to everyone who might reopen it, addressed like a refusal (her duty ruling on the desk). A closure known at one store is reopened by every other party that meets the same surface, and each one redoes the reasoning from scratch.',
    THE_SHAPE_IS_A_REFUSALS: 'a recipient, the reason, and the condition that would REOPEN it. A closure is not permanent by accident any more than a withdrawal is.',
    authority: { return: 'annie-196-for-code.md', sha256: RETURN_SHA, verifiedOnArrival: true },
    closures: CLOSURES,
    andWHATISNOTCLOSED: 'MC03-CALC-07 remains AWAITING RE-DERIVATION. That is an open line and is not carried here; a closure notice that quietly included an open question would be worse than no notice.',
  };
  const lines = CLOSURES.map((c) => `${c.CLOSED_AS.split('.')[0]}\t${c.question}`);
  const d = digestOverText('one line per closure, "<verdict>\\t<question>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['closures', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('closure-notice', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'closure-notice');
  for (const c of CLOSURES) console.log(`  ${c.CLOSED_AS.split('.')[0]!.padEnd(22)} ${c.question.slice(0, 70)}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
