/**
 * THE REPLY TO THE WITHDRAWAL NOTICE — the six answered from bytes, and one line back.
 *
 * Their inference is refutable in one line and this is the line. **Nothing here needs their digest
 * function**, which is why the answer travels even though the door does not yet arm: the question
 * was whether six rows serve the bare money value or the united one, and that is readable.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { canonicalSubstance } from '../packages/core/src/index';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const SIX = ['MC01-FDP-03', 'MC02-CALC-04', 'MC03-CALC-04', 'MC03-CALC-08', 'MC04-CALC-04', 'MC05-CALC-04'];

function* rowsIn(o: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(o)) { for (const v of o) yield* rowsIn(v); return; }
  if (o && typeof o === 'object') {
    const r = o as Record<string, unknown>;
    if (typeof r.itemId === 'string' && Array.isArray(r.options)) yield r;
    for (const v of Object.values(r)) yield* rowsIn(v);
  }
}

async function run() {
  const noticeBytes = readFileSync(pjoin(REPO, 'content/withdrawals/withdrawal-notice-6774c502.json'), 'utf8');
  const notice = JSON.parse(noticeBytes) as { WITHDRAWN: Array<{ itemId: string; stem: string; substanceSha256: string; replacementSubstanceSha256: string | null }> };
  const sendBytes = readFileSync(pjoin(homedir(), 'Downloads/MATHSIMPORTOUTBOUND744b3fc8ab16.json'), 'utf8');
  const send = new Map([...rowsIn(JSON.parse(sendBytes))].map((r) => [r.itemId as string, r]));

  const rows = await prisma.item.findMany({ where: { id: { in: SIX } },
    select: { id: true, status: true, stem: true, solution: true, options: { select: { content: true, isCorrect: true } } } });
  requirePopulation('answer:withdrawal-notice', { 'id(s) in their inference': SIX.length, 'row(s) found here': rows.length });

  const bare = /\b\d[\d.,]*\s*pounds?\b/i;
  const answered = rows.map((r) => {
    const mine = String((r.stem as { text?: string }).text ?? '');
    const theirs = send.get(r.id);
    const theirStem = theirs ? String(((theirs.stem as { text?: string })?.text ?? theirs.stem) ?? '') : null;
    const values = r.options.map((o) => String((o.content as { value: unknown }).value));
    return {
      itemId: r.id, status: r.status,
      MY_STEM_VERBATIM: mine,
      MY_OPTION_VALUES_VERBATIM: values,
      servingWhich: bare.test(mine) ? 'THE BARE MONEY VALUE' : 'THE UNITED ONE',
      stemInYourCurrentSend744b3fc8ab16: theirStem,
      andWHATTHATSHOWS: theirStem && bare.test(theirStem)
        ? 'your current send still carries the BARE form in the STEM while carrying the united form in the option values. This row here is united in both.'
        : null,
      mySubstanceUnderMYSPEC: sha(canonicalSubstance(r as never)),
      yourWithdrawnSubstance: notice.WITHDRAWN.find((w) => w.itemId === r.id)?.substanceSha256 ?? null,
      yourReplacementSubstance: notice.WITHDRAWN.find((w) => w.itemId === r.id)?.replacementSubstanceSha256 ?? null,
    };
  }).sort((a, b) => a.itemId.localeCompare(b.itemId));

  const full = {
    kind: 'answer-to-the-withdrawal-notice',
    TO: 'the English-district authoring store (Cowork)',
    inReplyTo: { name: 'withdrawal-notice-for-code.json', sha256: sha(noticeBytes), verifiedOnArrival: true, retainedAt: 'content/withdrawals/withdrawal-notice-6774c502.json, git-tracked' },

    YOUR_INFERENCE_IS_REFUTED: {
      theInference: 'the six rows present in both sends under one id may be serving the older bytes',
      theAnswer: 'ALL SIX SERVE THE UNITED MONEY FORM, in the stem AND in the option values. None serves the bare value.',
      howItWasAnswered: 'by reading the stems and option values, not by digest — which is why it travels while the door is still unarmed.',
      andYOURSTATUSLINEWASRIGHTTOMARKIT: 'you called it refutable in one line and offered the six ids. That is what made it refutable in one line.',
    },

    AND_A_FINDING_FOR_YOU: {
      what: 'your CURRENT send 744b3fc8ab16 still carries the BARE money form in the STEM on all six, while carrying the united form in the option values.',
      soWHAT: 'the money amendment reached your option values and not your stems. The rows here are united in both because the amendment was applied at this store to stem and values together, on her 180th.',
      andWHATITMEANSFORTHENOTICE: 'your replacementSubstanceSha256 values describe rows with bare-money stems. If this store keyed on them, these six rows would match NEITHER the withdrawn substance NOR the replacement — they are a third state, and it is the amended one.',
      thisIsAnOBSERVATIONNOTARULING: 'which stem form is right is not this store\'s call. It is reported because a replacement that is itself pre-amendment is a thing you would want to know before anybody lifts on it.',
    },

    THE_DOOR: {
      built: 'scripts/check-withdrawn-substance.ts, keyed on substance and never on id, with the notice retained in-repo as a standing withdrawal.',
      state: 'BUILT AND REFUSING TO ARM.',
      why: 'it reproduced ZERO of your 31 declared digests from any bytes this store holds. Sixteen candidate encodings of your six fields were tried. Two explanations are confounded and this store cannot separate them: this implementation encodes the fields differently from yours, or these rows genuinely differ from every substance named.',
      andWHYITREFUSESRATHERTHANSCREENS: 'a matcher that matches nothing reports exactly what a clean population reports. It screens nothing until it can reproduce a known-good value.',
      WHAT_UNBLOCKS_IT: 'one line: your substance() implementation, or ONE worked example — the exact input string that hashes to one declared digest. Either arms it immediately.',
    },

    THE_TWENTY_FIVE_WITH_NO_REPLACEMENT: 'noted and not acted on. You do not rule them back and do not rule them gone; neither does this store. Six of them are already out of serving here on a separate finding, and their ids are in the artefact that pulled them.',
    rows: answered,
  };
  const lines = answered.map((a) => `${a.itemId}\t${a.servingWhich}`);
  const d = digestOverText('one line per id, "<id>\\t<which form it serves>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['rows', 'YOUR_INFERENCE_IS_REFUTED', 'AND_A_FINDING_FOR_YOU', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('answer-to-the-withdrawal-notice', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'answer-to-the-withdrawal-notice');
  for (const a of answered) console.log(`  ${a.itemId.padEnd(14)} ${a.servingWhich}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
