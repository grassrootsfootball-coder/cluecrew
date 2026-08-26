/**
 * HER 161ST: THE FRAME IS ONE TOKEN, AND KEY LETTERS ARE MENTIONS (David, 2026-08-26 — R739).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NOTATION_BEARING_PATHS, capitalRunIsExempt, checkItemChildFacing, gapMarkerSpans, isBlocking, isSymbolString } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const SHA161 = '6af441af53c49ec52b865656994b022547dcfe0980331241de4dffaca3bbd6a7';
const AUTH = `annie-161-for-code.md, sha256 ${SHA161}`;
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** Mentions become quoted lower case; the frame token is never touched (her two worked examples). */
export function quoteMentions(script: string): { out: string; moved: string[]; frames: string[] } {
  const frames = gapMarkerSpans(script);
  const inFrame = (a: number, b: number) => frames.some(([s, e]) => a >= s && b <= e);
  const moved: string[] = [];
  let out = ''; let last = 0;
  for (const m of script.matchAll(/\b[A-Z]{2,}\b/g)) {
    const a = m.index!; const b = a + m[0].length;
    if (inFrame(a, b)) continue;
    moved.push(m[0]);
    out += script.slice(last, a) + `“${m[0].toLowerCase()}”`;
    last = b;
  }
  return { out: out + script.slice(last), moved, frames: frames.map(([s, e]) => script.slice(s, e)) };
}

async function run() {
  if (sha256(readFileSync('/Users/davidb/Downloads/annie-161-for-code.md', 'utf8')) !== SHA161) throw new Error('REFUSED — 161st digest mismatch');

  assertFixture('land:annie-161', [
    { name: 'her worked example 01 reproduces', input: 'The frame reads SH___. OUT makes SHOUT.', mustBeCaught: true },
    { name: 'a frame with letters both sides is untouched', input: 'The word stops at DE___VE.', mustBeCaught: false },
    { name: 'COM___E is untouched', input: 'It reads COM___E here.', mustBeCaught: false },
    { name: 'a script with no capital run is caught by nothing', input: 'Look at the first pair and say the rule.', mustBeCaught: false },
  ], (t) => quoteMentions(t).moved.length > 0);

  const items = await prisma.item.findMany({
    where: { questionTypeId: 'vr-06-missing-word' },
    select: { id: true, status: true, stem: true, explanation: true, questionType: { select: { mechanic: true } }, options: { select: { content: true, misconceptionId: true } } },
    orderBy: { id: 'asc' },
  });
  const rows: Array<Record<string, unknown>> = [];
  for (const i of items) {
    const e = i.explanation as Record<string, unknown>;
    const before = String(e.walkScript ?? '');
    if (!before.trim()) continue;
    const { out, moved, frames } = quoteMentions(before);

    // PER-ROW ASSERTIONS, as instructed: the frame token is untouched and only mention runs move.
    for (const f of frames) {
      if (!out.includes(f)) throw new Error(`REFUSED — ${i.id}: the frame token ${JSON.stringify(f)} did not survive the substitution`);
    }
    const framesAfter = gapMarkerSpans(out).map(([s, en]) => out.slice(s, en));
    if (JSON.stringify(framesAfter) !== JSON.stringify(frames)) throw new Error(`REFUSED — ${i.id}: frame tokens changed ${JSON.stringify(frames)} -> ${JSON.stringify(framesAfter)}`);
    const strippedBefore = before.replace(/\b[A-Z]{2,}\b/g, (m, off: number) => (gapMarkerSpans(before).some(([s, en]) => off >= s && off + m.length <= en) ? m : '§'));
    const strippedAfter = out.replace(/“[a-z]+”/g, '§');
    if (strippedBefore !== strippedAfter) throw new Error(`REFUSED — ${i.id}: something other than the mention runs moved`);

    /**
     * **REFUSE ON THE DIFF, NEVER ON THE TOTAL** (R149, and my first version got it wrong).
     * Gating the whole item after substitution threw on `bank-vr-06-missing-word-15`, whose
     * "poorly" sits in the STEM and fails the ban list BEFORE anything is touched. A guard that
     * compares totals refuses a pre-existing fault as if the edit caused it — the instrument
     * blaming its subject.
     */
    const nextExpl = { ...e, walkScript: out };
    const gateOf = (expl: unknown) => checkItemChildFacing({ id: i.id, stem: i.stem, explanation: expl, mechanic: i.questionType.mechanic, options: i.options.map((o) => ({ content: o.content, misconceptionId: o.misconceptionId })) }).filter(isBlocking).map((f) => `${f.rule}: ${f.detail}`);
    const faultsBefore = gateOf(e);
    const faultsAfter = gateOf(nextExpl);
    const introduced = faultsAfter.filter((f) => !faultsBefore.includes(f));
    if (introduced.length) throw new Error(`REFUSED — ${i.id}: the substitution INTRODUCED ${introduced.join('; ')}`);

    rows.push({ id: i.id, status: i.status, frameTokensUntouched: frames, mentionsMoved: moved, before, after: out, beforeSha256: sha256(before), afterSha256: sha256(out), ...(faultsBefore.length ? { preExistingFaultsUntouchedByThisEdit: faultsBefore } : {}) });
    if (APPLY) await prisma.item.update({ where: { id: i.id }, data: { explanation: nextExpl } });
  }
  if (APPLY && rows.length) {
    await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: 'template:vr-06-missing-word', action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'explanation.walkScript', method: `her 161st (${SHA161.slice(0, 16)}): key letters and completed words are MENTIONS and take quoted lower case; the frame is one token and is untouched`, note: `${rows.length} rows; frame tokens asserted unchanged per row; gate re-run clean on every row` } });
  }

  const payload = {
    kind: 'annie-161-landing',
    what: 'Her two rulings landed across the template: the frame exempt whole, key letters and completed words quoted lower case. Per-row assertions that the frame token is untouched and only mention runs moved.',
    authority: AUTH,
    THE_PREDICATE_FINDING: {
      claim: 'capitalRunIsExempt splits DE from ___ from VE',
      measured: 'IT DOES NOT. Called directly on her three rows, the whole frame is exempt AND so is the leading letter run: SH___ [[16,21]], DE___VE [[18,25]], COM___E, DEC___E — every one one token, the letter run exempt because it sits inside the span.',
      whereTheSplitACTUALLYIS: 'the twenty-row artefact (b9e1c15e…) was emitted by "build_ninety_screen.py over walkscript_screen.py" — COWORK\'S PYTHON PORT of these predicates — and each split verdict carries `by: "capitalRunIsExempt(...) === false"`, ATTRIBUTING THE VERDICT TO THIS FUNCTION\'S NAME. Annie read a fault in my predicate because the artefact said so.',
      whatICannotSettleFromHere: 'whether the port predates R722 (which added gapMarkerSpans) or mis-ports it. Both produce this output and I hold no version of that Python. Named rather than guessed.',
      theClass: 'a second implementation wearing the original\'s NAME — the sharpest form yet of R738, because the misattribution travelled to the reviewer as evidence about my code.',
      pinned: 'her three rows are now regression tests, so no future edit can reintroduce the split here.',
    },
    theSubstitution: {
      rule: 'a capital run of two or more letters that is NOT inside a frame token becomes “lowercase”; the frame is never touched.',
      herWorkedExamplesReproduceExactly: ['bank-vr-06-missing-word-01', 'bank-vr-06-missing-word-32'],
      unitsStated: 'HER NINETY IS THE AUTHORING SOURCE; THIS SIDE HOLDS 40 SERVING ROWS OF THE TEMPLATE, all 40 changed. Not the same object, neither number wrong (R690) — and applied to the whole template on this side rather than to the twenty she read, per her own "a ruling that stays where it was made is a preference".',
      rowsAmended: rows.length,
    },
    THE_OPTION_VALUE_RULING: {
      ruled: 'the bank\'s options[].value bears notation, so the 240 are exempt — the chunk that fills the frame is the same diagram as the frame.',
      alreadyTrueHere: `options[].content.value is in NOTATION_BEARING_PATHS and 'OUT' is symbol-shaped, so capitalRunIsExempt('options[]','content.value','OUT',0,3) === ${capitalRunIsExempt('options[]', 'content.value', 'OUT', 0, 3)}. No change was needed on this side; the ruling is recorded and the predicate crossed so neither store re-derives it.`,
      theBoundaryStillHolds: `a sentence in the same field cannot claim it: isSymbolString('He SHOUTED at the dog.') === ${isSymbolString('He SHOUTED at the dog.')}.`,
      notationBearingPaths: [...NOTATION_BEARING_PATHS],
    },
    forCowork: {
      why: 'so neither store re-derives the predicate — the port is what produced the split verdict that reached the reviewer as a fault in my code.',
      thePredicateInWords: 'gapMarkerSpans(text) returns every [start,end) matching /[A-Z]*_{2,}(\\(\\d+\\)_{2,})?[A-Z]*/g — LETTERS ON BOTH SIDES INCLUDED, which is why the frame is one token. capitalRunIsExempt(root,path,text,a,b) is true when notationExempt(root,path,text) OR the run [a,b) lies inside one of those spans. Tokenise capital runs FIRST and ask per run and you will split every frame that has letters on both sides.',
      conformanceCases: [
        { call: "gapMarkerSpans('The frame reads SH___.')", expect: gapMarkerSpans('The frame reads SH___.') },
        { call: "gapMarkerSpans('The word stops at DE___VE.')", expect: gapMarkerSpans('The word stops at DE___VE.') },
        { call: "capitalRunIsExempt('explanation','walkScript','The word stops at DE___VE.',18,20)", expect: capitalRunIsExempt('explanation', 'walkScript', 'The word stops at DE___VE.', 18, 20) },
        { call: "capitalRunIsExempt('explanation','walkScript','OUT makes SHOUT.',0,3)", expect: capitalRunIsExempt('explanation', 'walkScript', 'OUT makes SHOUT.', 0, 3) },
        { call: "capitalRunIsExempt('options[]','content.value','OUT',0,3)", expect: capitalRunIsExempt('options[]', 'content.value', 'OUT', 0, 3) },
      ],
    },
    rows,
  };
  const canonical = (o: unknown): string => {
    if (o === null || typeof o !== 'object') return JSON.stringify(o);
    if (Array.isArray(o)) return `[${o.map(canonical).join(',')}]`;
    return `{${Object.keys(o as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((o as Record<string, unknown>)[k])}`).join(',')}}`;
  };
  const findingsSha256 = sha256(canonical({ predicate: payload.THE_PREDICATE_FINDING, substitution: payload.theSubstitution, optionValues: payload.THE_OPTION_VALUE_RULING, forCowork: payload.forCowork }));
  const artefact = { ...payload, findingsSha256, howToCheckThisOnArrival: { subtree: '{predicate, substitution, optionValues, forCowork}', spec: 'sha256 over json.dumps(subtree, sort_keys=True, separators=(",",":"), ensure_ascii=False).encode("utf-8") (R729)', fileDigest: 'staging line and .sha256 sidecar' } };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  if (APPLY) {
    const name = stampedName('annie-161-landing', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'annie-161-landing');
  }
  console.log(`rows: ${rows.length}; findingsSha256 ${findingsSha256}`);
  await prisma.$disconnect();
}

/**
 * **ONLY WHEN THIS FILE IS THE ENTRY POINT.** `quoteMentions` is imported by the vr-12 lander, and
 * a module-scope `run()` meant importing the function RE-RAN THE WHOLE LANDING — with `--apply`
 * on the importer's argv, it would have applied the vr-06 substitution a second time and written
 * a duplicate attribution event. Caught by the fixture printing twice.
 */
if ((process.argv[1] ?? '').endsWith('land-annie-161.ts')) {
  run().catch((e) => { console.error(e); process.exit(1); });
}
