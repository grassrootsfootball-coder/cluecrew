/** What the 224th changed here, and the two reasons three of its four instructions did not run. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { FREQUENCY_SOURCE, FREQUENCY_UNMEASURED } from '../packages/core/src/frequency-signal';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function main() {
  const sha224 = sha(readFileSync(pjoin(DL, 'annie-224-for-code.md')));
  const seats = await prisma.itemOption.findMany({
    where: { misconceptionId: 'vr02-answered-the-opposite' },
    select: { id: true, itemId: true, content: true }, orderBy: { itemId: 'asc' },
  });
  requirePopulation('the-224th', { 'answered-the-opposite seat(s)': seats.length });

  const out = {
    kind: 'THE-224th-WHAT-LANDED-AND-WHAT-IS-BLOCKED',
    TO: 'the authoring store; David and Annie by relay',
    date: '2026-09-05',
    sourceReturn: { file: 'annie-224-for-code.md', sha256: sha224, verifiedHere: true },
    ONE_LANDED: {
      what: 'rows 01 and 06 take vr02-answered-the-opposite',
      andHOW: 'as a PREDICATE, not two writes. Her reasoning — both pairs join two group members and nothing else — is set membership on the stem\'s own five words, so it needed no lexicon and went into the tag-write gate.',
      predicatesAdded: ['vr02-answered-the-opposite — neither chosen word is one of the two odd ones',
        'vr02-partial-group — exactly one chosen word is odd',
        'vr02-surface-link — REFUSES on a pair lying wholly inside the group; UNDECIDED elsewhere, because whether a link rests on look or sound is a judgement'],
      screenedAcrossTheWholeBank: '25 rows, 75 seats: 59 perform their tag, 14 UNDECIDED, 2 refuse — EXACTLY the two rows she named. The applier refuses to write if that agreement fails, and her ruling wins over the rule if they ever diverge.',
      seatsNowCarryingTheEntry: seats.length,
      theRetags: seats.filter((s) => /-01$|-06$/.test(s.itemId)).map((s) => ({ itemId: s.itemId, pair: (s.content as { value?: unknown })?.value, from: 'vr02-surface-link' })),
      herGeneralisationKept: 'a tag names the ACT; the attraction explains which performance of it the child chose. The alliteration is real and it is why THOSE two group members caught her eye, not what was done with them.',
    },
    TWO_UNMEASURABLE: {
      instruction: 're-run every wordhood figure under a child-scoped lexicon; the two shape tests wait on it',
      status: FREQUENCY_UNMEASURED,
      andWHY: 'the return does not name a scale; this estate\'s only frequency scale is Zipf via SUBTLEX-UK, so that is the reading. No source is installed.',
      sourceState: { installed: FREQUENCY_SOURCE.installed, licenceState: FREQUENCY_SOURCE.licenceState,
        localPath: FREQUENCY_SOURCE.localPath, expectedDigest: FREQUENCY_SOURCE.expectedDigest, presentOnThisMachine: false },
      theFix: 'one command in data/frequency/SOURCE.md, run by a person, then the digest pinned in committed source. Not CI\'s, and not this store\'s to run unasked.',
      andWHATTHISSTOREWILLNOTDO: 'improvise a third substitute lexicon. web2 measured the wordlist (R988) and the 302-card vault scored 0 of 13 while calling LEND and GATE non-child vocabulary (R989). A third would be the same mistake a third time. The web2 figures stand as measured, labelled with their instrument, and the inference drawn from their shape stays withdrawn — which is her own ruling applied to her own reasoning.',
    },
    THREE_BLOCKED_BY_A_STANDING_RULING: {
      instruction: 'CHEAT/AIR regenerates with CHAIR/MOP and SHELF/TRAIN, searched against the constraint set at 3.0',
      theCollision: 'a search over the constraint set is GENERATION by the frequency list.',
      theStandingRuling: FREQUENCY_SOURCE.corpusFirewallRuling,
      soWHATHAPPENED: 'nothing. The three pairs stay unregenerated and their seven rows stay as they are. This store does not choose between two clear rulings by preferring the newer one; the manifesto says a deviation is surfaced, never silent.',
      theONEDECISIONNEEDED: 'David\'s: does measuring a CANDIDATE stem against a frequency cut count as the list generating content, or as it checking a stem that a search proposed? The firewall ruling never had to draw that line, because when it was written nothing was proposing stems.',
      andTHECOSTOFWAITING: 'seven of twenty-five vr-08 cut rows are unperformable at any child cut (CHAIR/MOP x3, CHEAT/AIR x2, SHELF/TRAIN x2). They are DRAFT and serve nobody, so waiting costs no child anything.',
    },
  };

  const clean = JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
  const keys = ['ONE_LANDED', 'TWO_UNMEASURABLE', 'THREE_BLOCKED_BY_A_STANDING_RULING'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('the-224th-outcome', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'the-224th-outcome').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
