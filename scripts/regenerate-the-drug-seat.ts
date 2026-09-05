/**
 * REGENERATE THE `DRUG` SEAT ON gen-vr-13-make-a-word-06 (her 230th; David's ruling, 2026-09-05).
 *
 * **HER CLEARANCE OF THIS ROW WITHDRAWS**, on this store's reading upheld: DRUG is in the class,
 * TRIP is not. So the seat is re-authored — **searched, never hand-picked.**
 *
 * **AND IT WAS DOUBLY WRONG.** The seat carries `vr13-not-a-word`, whose predicate requires the
 * option NOT to be a word, and DRUG is one: the tag write gate REFUSES it. So the replacement has
 * to satisfy a constraint the original never did, and the appropriateness screen is the second
 * constraint rather than the only one.
 *
 * **THE CONSTRAINT SET, AND THE FIREWALL HOLDS INSIDE IT.** Candidates are proposed from THE ROW'S
 * OWN MATERIAL — two-letter slices of DRESS joined to two-letter slices of UMBRELLA, which is the
 * task's own act performed wrongly, and it is what a child mis-assembling actually produces. The
 * lexicon and the appropriateness predicate only GATE what that material proposes (R992).
 *
 * **THE RANKING IS DECLARED, SO THE CHOICE IS NOT A PREFERENCE.** Among survivors, the one sharing
 * the longest prefix with the key ranks first — a distractor is useful in proportion to how nearly
 * it is the answer — with the alphabetically first breaking ties so the run is deterministic.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { screenForAChild } from '../packages/core/src/appropriateness';
import { loadChildLexicon } from './lib/child-lexicon';
import { deriveList } from './lib/derived-list';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const GENERATOR = pjoin(REPO, 'packages/db/prisma/generate-content.ts');
const APPLY = process.argv.includes('--apply');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const ROW = 'gen-vr-13-make-a-word-06';
const OLD_TUPLE = "['DRESS', 'UMBRELLA', 'DRUM', 'DRUG', 'UMPS']";

async function main() {
  console.log(`REGENERATE THE DRUG SEAT — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const lex = loadChildLexicon();
  const isWord = (w: string) => lex.knowsBare(w);
  const refusals: string[] = [];
  const assertions: Array<{ assertion: string; result: string; passed: boolean }> = [];
  const assert = (n: string, ok: boolean, r: string) => { assertions.push({ assertion: n, result: r, passed: ok }); if (!ok) refusals.push(`${n} — ${r}`); };

  const it = await prisma.item.findUniqueOrThrow({ where: { id: ROW },
    select: { status: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true }, orderBy: { id: 'asc' } } } });
  const st = it.stem as { words?: string[] };
  const [w1, w3] = (st.words ?? []).map(String) as [string, string];
  const key = String((it.options.find((o) => o.isCorrect)!.content as { value?: unknown }).value);
  const seat = it.options.find((o) => String((o.content as { value?: unknown }).value) === 'DRUG');
  const other = it.options.find((o) => !o.isCorrect && o !== seat);
  assert('the row still carries DRUG in the seat this ruling withdraws', !!seat, seat ? 'present' : 'ABSENT — nothing to regenerate');
  assert('the row is DRAFT and unsigned', it.status === 'DRAFT', `status ${it.status}`);
  if (!seat || !other) { console.log('  refusing: the row does not have the shape this expects'); process.exitCode = 1; return; }

  // ── THE PROPOSAL, FROM THE ROW'S OWN MATERIAL ────────────────────────────────────────────────
  const slices = (w: string) => Array.from({ length: Math.max(0, w.length - 1) }, (_, i) => w.slice(i, i + 2));
  const proposed = [...new Set(slices(w1).flatMap((a) => slices(w3).map((b) => a + b)))];
  const banned = new Set([key, 'DRUG', String((other.content as { value?: unknown }).value)]);

  /**
   * **A DISTRACTOR A CHILD COULD NOT WRITE TEACHES NOTHING.** The first run of this search ranked
   * `DRBR` first: it satisfied every stated constraint and has no vowel. The constraint set was
   * under-specified, not the ranking wrong — so the requirement is added as a STRUCTURAL property
   * (could a child produce this string at all?) rather than as a preference for any candidate.
   * A wrong answer has to be a wrong answer somebody might give.
   */
  const couldAChildWriteIt = (s: string) => /[AEIOU]/.test(s) && !/[^AEIOU]{3}/.test(s);

  const survivors = deriveList(
    { name: 'the surviving distractors for this seat', parent: `every two-letter slice of ${w1} joined to every two-letter slice of ${w3}`,
      rule: `not a word at Zipf >= ${lex.cut} (its tag vr13-not-a-word requires it), passes the appropriateness screen as a bare distractor, is writable by a child (has a vowel, no run of three consonants), and is not already on the card` },
    proposed,
    (c) => !banned.has(c) && !isWord(c) && couldAChildWriteIt(c)
      && screenForAChild(c, 'bare', 'write-gate', { role: 'distractor' }).verdict === 'PASS'
      && checkTagWrite({ stem: it.stem as Record<string, unknown>, optionValue: c, keyValue: key, misconceptionId: 'vr13-not-a-word' }, isWord).verdict === 'PERFORMS',
  );
  requirePopulation('regenerate-drug-seat', { 'candidate(s) from the row\'s own material': proposed.length });
  assert('the search returns at least one candidate that performs the tag and passes the screen',
    survivors.items.length > 0, `${survivors.items.length} of ${proposed.length} survive`);

  /** The declared ranking. Longest shared prefix with the key first; alphabetical breaks ties. */
  const sharedPrefix = (a: string, b: string) => { let n = 0; while (n < a.length && a[n] === b[n]) n += 1; return n; };
  const ranked = [...survivors.items].sort((a, b) => sharedPrefix(b, key) - sharedPrefix(a, key) || a.localeCompare(b));
  const chosen = ranked[0]!;
  assert('the choice is the search\'s ranking and not a preference',
    !!chosen, `${chosen} — shares ${sharedPrefix(chosen, key)} letter(s) with the key ${key}; ${ranked.length} candidate(s) ranked`);
  assert('the replacement performs the tag the seat carries', chosen
    ? checkTagWrite({ stem: it.stem as Record<string, unknown>, optionValue: chosen, keyValue: key, misconceptionId: 'vr13-not-a-word' }, isWord).verdict === 'PERFORMS' : false,
    'vr13-not-a-word requires a non-word; DRUG never satisfied it');
  assert('the replacement passes the appropriateness screen',
    screenForAChild(chosen, 'bare', 'write-gate', { role: 'distractor' }).verdict === 'PASS', `verdict ${screenForAChild(chosen, 'bare').verdict}`);

  const gen = readFileSync(GENERATOR, 'utf8');
  assert('the generator carries the bank tuple verbatim, so the edit cannot no-op (R87)',
    gen.split(OLD_TUPLE).length === 2, `${gen.split(OLD_TUPLE).length - 1} occurrence(s)`);

  console.log(`  assertions: ${assertions.filter((a) => a.passed).length} of ${assertions.length} pass`);
  for (const a of assertions.filter((x) => !x.passed)) console.log(`   REFUSED — ${a.assertion}: ${a.result}`);
  console.log(`  ${proposed.length} proposed from the row's material -> ${survivors.items.length} survive -> chosen ${chosen}`);
  console.log(`  ranked: ${ranked.slice(0, 8).join(', ')}${ranked.length > 8 ? ` …and ${ranked.length - 8} more` : ''}`);

  let wrote = 0;
  if (refusals.length === 0 && APPLY) {
    const NEW_TUPLE = `['DRESS', 'UMBRELLA', 'DRUM', '${chosen}', 'UMPS']`;
    const next = gen.replace(OLD_TUPLE, NEW_TUPLE);
    if (next === gen) throw new Error('the bank edit matched nothing — refusing (R87)');
    writeFileSync(GENERATOR, next);
    await prisma.$transaction(async (tx) => {
      await tx.itemOption.update({ where: { id: seat.id }, data: { content: { value: chosen } } });
      await tx.attributionEvent.create({ data: {
        recordType: 'item', recordId: ROW, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie',
        recordedBy: 'human:dbamgbade@gmail.com', field: 'options.content',
        method: 'her 230th: this store\'s reading upheld — DRUG is in the class, TRIP is not — and her clearance of this row withdraws. The seat is searched at 3.0 against the constraint set with the appropriateness predicate in it, never hand-picked.',
        note: `DRUG -> ${chosen}. The seat was doubly wrong: unsuitable subject matter AND refusing its own tag, since vr13-not-a-word requires a non-word and DRUG is one.`,
      } });
      wrote = 1;
    });
  }

  const report = {
    kind: 'THE-DRUG-SEAT-REGENERATED', TO: 'Annie and the authoring store, by relay through David',
    date: '2026-09-05', mode: APPLY ? 'APPLIED' : 'DRY RUN', outcome: refusals.length ? 'REFUSED' : (APPLY ? 'REGENERATED' : 'WOULD REGENERATE'),
    PROVENANCE: { source: 'annie-230-for-code.md', statedDigest: 'f4c265e08d0e0d086f8e6f16055a0731c575ee7311f42d5e98e50886698d959a',
      RECORDED_FROM_A_RELAY_NOT_FROM_THE_BYTES: 'no annie-230 file is on this desk. The digest is David\'s, quoted and NOT verified here. If it crosses, this field is REPLACED by the verification.' },
    ONE_THE_READING_UPHELD: { thisStoresReading: 'DRUG in the class, TRIP out — bare, a journey or a stumble arrives first for TRIP.',
      andWHATMOVED: 'TRIP removed from the class again. It was added last turn on her 229th calling the pair "the class\'s true boundary"; her 230th upholds the original reading. The list has now moved twice on TRIP and both moves were readings of the same test.',
      andWHATTHATCOSTS: 'nothing in the corpus — no row\'s verdict changes on TRIP, because every position carrying it was already cleared.' },
    TWO_THE_SEAT_WAS_DOUBLY_WRONG: {
      subjectMatter: 'DRUG is in the class and its clearance withdraws.',
      andTHETAG: 'the seat carries vr13-not-a-word, whose predicate requires a NON-word. DRUG is a word, so the tag write gate REFUSES it — the seat has never performed the entry it names, independently of anything about suitability.',
      soTHEREPLACEMENTSATISFIESACONSTRAINTTHEORIGINALNEVERDID: true,
    },
    THE_CUT_AND_ITS_INSTRUMENT: lex.provenance.THE_CUT_AND_ITS_INSTRUMENT,
    THREE_THE_SEARCH: { proposedFrom: `two-letter slices of ${w1} joined to two-letter slices of ${w3} — the task's own act performed wrongly, which is what a child mis-assembling produces`,
      derivedFrom: survivors.derivedFrom, ranking: 'longest shared prefix with the key, alphabetical breaking ties. Declared, so the choice is the search\'s and not a preference.',
      ranked, chosen, sharedPrefixWithKey: sharedPrefix(chosen, key) },
    FOUR_THE_ASSERTIONS: assertions,
    FIVE_NOTHING_ELSE_MOVES: 'the other twenty-six clearances stand. Only this row changes, and only its d1 seat.',
    andONEPRECISION: `on this row the flagged token is the DISTRACTOR: the key is ${key}, which is untouched. That is the measurement her 229th's premise differed from and which her 230th upholds.`,
    rowsWritten: wrote,
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THE_READING_UPHELD', 'TWO_THE_SEAT_WAS_DOUBLY_WRONG', 'THREE_THE_SEARCH', 'FOUR_THE_ASSERTIONS'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('the-drug-seat-regenerated', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'the-drug-seat-regenerated').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  ${report.outcome}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
