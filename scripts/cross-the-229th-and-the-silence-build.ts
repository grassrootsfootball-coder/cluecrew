/** Her 229th landed, the silence rule built, and one premise measured against the rows. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { loadClearances } from './lib/clearances';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

async function main() {
  const d229 = sha(readFileSync(pjoin(DL, 'annie-229-for-code.md')));
  if (!d229.startsWith('69ceb3cfaa139d61')) throw new Error(`the 229th does not verify: ${d229.slice(0, 16)}`);

  const clear = loadClearances();
  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } }, questionType: { select: { mechanic: true } } }, orderBy: { id: 'asc' } });
  requirePopulation('the-229th', { 'row(s)': items.length });
  const routing: Array<{ itemId: string; token: string; why: string }> = [];
  for (const i of items) {
    for (const f of checkItemChildFacing({ id: i.id, stem: i.stem, explanation: i.explanation, mechanic: i.questionType.mechanic, options: i.options, clearedAppropriatenessTokens: clear.get(i.id) }).filter(isBlocking)) {
      if (f.rule !== 'subject-matter') continue;
      routing.push({ itemId: i.id, token: /"([^"]+)"/.exec(f.detail)?.[1] ?? '?', why: f.detail.includes('IS THE KEY') ? 'KEY — routes every time' : 'not cleared' });
    }
  }
  const keyOf = (id: string) => {
    const it = items.find((x) => x.id === id);
    return { key: it?.options.filter((o) => o.isCorrect).map((o) => String((o.content as { value?: unknown })?.value)).join('/') ?? '?',
      distractors: it?.options.filter((o) => !o.isCorrect).map((o) => String((o.content as { value?: unknown })?.value)) ?? [] };
  };
  const herThree = ['gen-vr-13-make-a-word-06', 'gen-vr-13-make-a-word-09', 'gen-vr-13-make-a-word-22'].map((id) => ({ itemId: id, ...keyOf(id) }));

  const report = {
    kind: 'THE-229th-LANDED-AND-THE-SILENCE-RULE-BUILT',
    TO: 'Annie, and the authoring store; by relay through David',
    date: '2026-09-05',
    THE_229th: { sha256: d229, verifiedHere: true,
      andTHEPROVENANCEFIELD: 'the clearance record was written a turn early from a relay and said so. It has now been REPLACED by the verification rather than amended around it, which is what that field said would happen.' },

    ONE_HER_OVERRULE_TAKEN: {
      thisStoresReading: 'TRIP was read OUT of the flag class: bare, a journey or a stumble arrives first.',
      herText: 'DRUG and TRIP are "the class\'s true boundary" — and a boundary case is INSIDE the class.',
      whatWASdone: 'TRIP added. The reading was offered to be overruled and it was — by reading the return, not by anyone conceding.',
      andWHATSTANDS: 'the test itself, stated by her for reuse: read the row as the adult over her shoulder and ask whether the unsuitable sense would occur to that adult BEFORE the ordinary one. Not whether the word can carry it, since almost every word can.',
    },

    TWO_ONE_PREMISE_MEASURED_AGAINST_THE_ROWS: {
      herSentence: '"gen-vr-13-make-a-word-06 builds DRUG, and -09 and -22 build TRIP… the token is the answer rather than a distractor and the child writes it herself."',
      THE_ROWS: herThree,
      soTHEMEASUREMENT: 'of the three, the flagged token is the KEY on ONE. On -06 the key is DRUM and DRUG is a distractor; on -22 the key is TRAP and TRIP is a distractor. Only -09 builds TRIP.',
      whyITMATTERSPRACTICALLY: 'your standing exception reaches the KEY position only. As worded it routes -09 every time and leaves -06 and -22 cleared. **If you intended all three to route, the rule as written does not reach them** — and this store has not widened it to fit the examples.',
      andWHYITISREPORTEDRATHERTHANSMOOTHED: 'a ruling whose stated premise differs from the rows is the R94 shape — a verdict issued without the row having been read, repeated by whoever receives it. The RULING stands either way; it is the premise that is being checked, and checking it is cheaper than inheriting it.',
    },

    THREE_THE_STANDING_EXCEPTION_RUNNING: {
      positionsRoutingNOW: routing,
      count: routing.length,
      andEVERYONEISAKEY: routing.every((r) => r.why.startsWith('KEY')),
      readingIT: 'every cleared distractor passes; every flagged KEY routes. A clearance says the sense was ordinary in that row on that reading, and it does not make the word safe to teach as the answer.',
    },

    FOUR_THE_SILENCE_RULE_BUILT: {
      herRule: 'a gate reports on every run including zero, and a run producing no line is itself the reportable event.',
      whatWASWRONGBEFORE: 'the report was over FAULTS, and a report over faults cannot show an absent fault. The subject-matter screen sat at zero for three turns while inert and nothing was printed to distrust.',
      theBUILD: 'check:gate-silence reports over RULES, not faults: every rule this gate can emit gets a line every run, zeros included.',
      andTHECANARY: 'a rule at zero is either enforcing and finding nothing, or inert and finding nothing, and the corpus cannot tell them apart. So every rule is fed a string it MUST catch. A rule whose canary does not fire is REFUSED and no declaration excuses it.',
      findings: {
        rulesThisGateEmits: 8, fired: 6,
        silentAndDECLARED: ['notation — no MATHS item exists (R61); canary fires', 'us-spelling — the corpus is British; canary fires'],
        outOfScopeOWNEDBYANOTHERGATE: ['notice-standard — checkNoticeStandard', 'placeholder-tag — the misconception field checks'],
        andWHATTHATLASTLINECOST: 'the first run reported those two as SILENT AND INERT. They are neither: they belong to other gates that share the ContentFailure TYPE. **A shared type makes the rules of several gates look like the rules of one** — R1006 one level up, found by its own canary.',
        andTWOCANARIESWEREWRONGNOTTHERULES: 'four-syllable-words and unclassified-path fire on the corpus and their first canaries did not. A canary that fails against a rule firing 140 times proves the CANARY wrong, and reading it the other way would have condemned two working rules.',
      },
    },
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_HER_OVERRULE_TAKEN', 'TWO_ONE_PREMISE_MEASURED_AGAINST_THE_ROWS', 'THREE_THE_STANDING_EXCEPTION_RUNNING', 'FOUR_THE_SILENCE_RULE_BUILT'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('the-229th-and-the-silence-build', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'the-229th-and-the-silence-build').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
  console.log(`  ${routing.length} position(s) routing, all keys: ${routing.map((r) => r.itemId).join(', ')}`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
