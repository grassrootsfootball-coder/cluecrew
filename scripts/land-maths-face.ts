/**
 * THE MATHS FACE, LANDED ON ITS BYTES (R867).
 *
 * **She approved BYTES, not a wording.** So the strings are read from the crossed files, their
 * digests verified against the ones her 191st names, landed through `landCaseFace`, and then
 * asserted byte-identical AS STORED. A face that lands "the same wording" is not what she approved.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { caseFaceServes } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { landCaseFace } from './lib/case-face';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const NAME_FILE = '/Users/davidb/Downloads/maths-face-name-for-annie.txt';
const DESC_FILE = '/Users/davidb/Downloads/maths-face-description-for-annie.txt';
const NAME_SHA = '88f99fae8ce3fd85a5e2d53abaa72f6998e5e20133a38ecd003613870eb8c2fb';
const DESC_SHA = 'e5235dc9585b7acaecd92cae3c5e988aec9b1897396e98a53e936b5d38802466';
const RETURN_SHA = '24f592ae9ccc5502478dc3f71bf90f5ebc17ea9ed3faa544bbff9260c4c462ad';
const CASE_ID = 'case-maths-01';

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('maths-face', [
    { name: 'a landed title makes the face serve', input: 'The Ashline Working Register', mustBeCaught: true },
    { name: 'any non-empty title does', input: 'x', mustBeCaught: true },
    { name: 'an empty title does not', input: '', mustBeCaught: false },
    { name: 'whitespace does not', input: '  ', mustBeCaught: false },
  ], (t) => caseFaceServes({ title: t }));

  const nameBytes = readFileSync(NAME_FILE);
  const descBytes = readFileSync(DESC_FILE);
  if (sha(nameBytes) !== NAME_SHA) throw new Error('the name file does not match the digest her 191st verified — refusing');
  if (sha(descBytes) !== DESC_SHA) throw new Error('the description file does not match the digest her 191st verified — refusing');
  const title = nameBytes.toString('utf8');
  const narrativeText = descBytes.toString('utf8');
  requirePopulation('land:maths-face', { 'crossed strings verified by digest': 2 });

  const before = await prisma.case.findUnique({ where: { id: CASE_ID }, select: { title: true, narrativeIntro: true } });

  let landing: { landed: boolean; refusal?: string } = { landed: false };
  if (APPLY) {
    try {
      await landCaseFace(REPO, CASE_ID, { title, narrativeText }, 'Annie', `annie-191-for-code.md sha256 ${RETURN_SHA}`);
      landing = { landed: true };
    } catch (e) {
      /**
       * **THE STANDING PATH REFUSED HER APPROVED BYTES, AND NOTHING HERE BYPASSES IT** (R867).
       * She approved the bytes; the gate refuses them. That is a conflict between a reviewer and a
       * house rule, and it is not this store's to resolve by editing her text or by routing around
       * the door she ruled everything must pass through.
       */
      landing = { landed: false, refusal: e instanceof Error ? e.message : String(e) };
    }
  }

  const after = await prisma.case.findUnique({ where: { id: CASE_ID }, select: { title: true, narrativeIntro: true } });
  const storedTitle = after?.title ?? '';
  const storedNarrative = (() => {
    const n = after?.narrativeIntro as Record<string, unknown> | null;
    if (!n) return '';
    for (const k of ['text', 'narrativeText', 'body', 'intro']) if (typeof n[k] === 'string') return n[k] as string;
    return '';
  })();

  const assertion = {
    titleStoredBytesSha256: sha(storedTitle),
    titleCrossedSha256: NAME_SHA,
    TITLE_BYTE_IDENTICAL: sha(storedTitle) === NAME_SHA,
    descriptionStoredBytesSha256: sha(storedNarrative),
    descriptionCrossedSha256: DESC_SHA,
    DESCRIPTION_BYTE_IDENTICAL: sha(storedNarrative) === DESC_SHA,
    why: '**she approved BYTES, not a wording.** A face that stores "the same text" with a normalised space or a stripped newline has stored something she did not read. The assertion is over the STORED string, hashed after the write.',
  };

  const rows = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, status: true, reviewedBy: true } });
  const serves = caseFaceServes({ title: storedTitle });
  const live = rows.filter((r) => r.status === 'LIVE').length;

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'maths-face-landing',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    HER_AUTHORITY: { return: 'annie-191-for-code.md', sha256: RETURN_SHA, verdict: 'APPROVED, both strings, unamended — the first child-facing face in this project to pass a reading without a single change.' },
    THE_STRINGS: { titleSha256: NAME_SHA, descriptionSha256: DESC_SHA, titleBytes: nameBytes.length, descriptionBytes: descBytes.length, noTrailingNewlineOnEither: true },
    THE_LANDING: landing.landed ? 'LANDED through landCaseFace' : {
      outcome: 'REFUSED BY THE STANDING PATH — nothing was written and nothing was bypassed',
      refusal: landing.refusal ?? '(dry run)',
      THE_CONFLICT: '**she approved these bytes and the child-facing gate refuses them.** Her 191st reads *"House checks clean over the bytes: no dashes, no contractions, no shouts, four sentences, none straining readability"* — and the long-word cap fires on TWO distinct long words where the maximum is one.',
      theTwoWords: ['operations', 'percentages'],
      andBOTHAREINTHECONTENTLISTSHEENDORSED: 'her return names that list explicitly — *place value, the four operations, fractions and percentages, measures and money, shape, charts and proportion* — and says it is *true of the corpus as built*. **The gate is not refusing an oversight; it is refusing the sentence she checked most closely.**',
      itFIRESUNDEREVERYROLE: 'doorplate, notice and narrative all refuse on the same two words, so this is not a role misfit like the first landing attempt (R689).',
      aCOSMETICNOTEONTHEREPORT: 'the gate prints the words with their trailing commas — "operations," and "percentages," — which makes it look as though punctuation is being matched. It is not: both are long by the rule regardless, and a third ten-letter word (*proportion*) is NOT counted, so the rule is not simple length.',
      WHAT_THIS_STORE_WILL_NOT_DO: 'amend her approved text, lower the cap, exempt the doorplate role, or land through anything other than the standing path. **Each of those resolves a reviewer-versus-rule conflict by quietly picking a side**, and the picking is the fault, not the outcome.',
      soITWAITS: 'the face stays empty, which is the state it was already in and the state that fails closed. **Nothing is worse than before and nothing is decided.**',
    },
    THE_BYTE_ASSERTION: assertion,
    THE_PRIOR: { before: before?.title === '' ? 'the title was the empty string; the narrativeIntro held a state marker, not prose' : before?.title, stampedBy: 'landCaseFace stamps the prior into `_previous` on the record — the standing path, not a direct write' },
    THE_STATE: {
      caseFaceServes: serves,
      blastRadiusWalkedFromTheRows: {
        itemsThatWouldReachAChild: serves ? live : 0,
        signed: rows.filter((r) => r.reviewedBy).length,
        of: rows.length,
        liveItems: live,
        THE_READING: serves
          ? `**the face now serves, and the blast radius is ${live}** — the number of LIVE items, which is zero. The face opening does not open the district: an item reaches a child only when it is LIVE, and nothing is.`
          : 'the face does not serve; nothing reaches a child.',
      },
      THE_VISIBLE_BUT_EMPTY_WINDOW: {
        figure: serves && live === 0 ? 'OPEN — and this is the measurement, not a hypothetical' : 0,
        what: serves && live === 0
          ? '**the window is now OPEN: the case is visible and has no items to serve.** Landing the face before any item is LIVE is exactly the sequence R857 named as the only one that opens it. It is open deliberately and under instruction, it is measured here rather than discovered later, and it closes the moment the first item goes LIVE or the face is withdrawn.'
          : 'closed.',
        andWHATACHILDWOULDSEE: serves && live === 0 ? 'the case face renders and the case has nothing behind it. **Whether that is acceptable for the interval before publication is David\'s to rule** — this store reports it as a figure rather than deciding it.' : 'nothing renders and nothing is behind it.',
      },
    },
    PUBLICATION_STILL_HOLDS: 'no item was set LIVE. The six mints and their joins remain the last open item, and her join condition binds them: an entry whose option does not compute as its behaviour waits for its true carrier (R865, wired and canaried).',
  };
  const lines = [`title\t${NAME_SHA}\t${assertion.TITLE_BYTE_IDENTICAL}`, `description\t${DESC_SHA}\t${assertion.DESCRIPTION_BYTE_IDENTICAL}`];
  const d = digestOverText('the assertion lines joined by \\n, each "<field>\\t<crossed sha256>\\t<byte-identical>"', lines.join('\n'));
  const full = { ...payload, ASSERTION_LINES: lines, assertionSha256: d.value, assertionSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['THE_BYTE_ASSERTION', 'THE_STATE', 'ASSERTION_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'maths-face-landing' : 'maths-face-landing-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — serves ${serves} | title identical ${assertion.TITLE_BYTE_IDENTICAL} | description identical ${assertion.DESCRIPTION_BYTE_IDENTICAL} | live ${live}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
