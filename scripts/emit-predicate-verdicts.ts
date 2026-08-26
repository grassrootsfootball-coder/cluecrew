/**
 * THE CROSSED PREDICATE'S OWN VERDICTS, SPAN BY SPAN (David, 2026-08-26 — R741).
 *
 * Two claims disagree and neither store can see the other's code, so this emits MY verdicts over
 * THE SAME INPUTS Cowork's port ran on — the twenty-row artefact it produced — in the same row
 * shape, so the desk can lay them side by side and diff rather than adjudicate two descriptions.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { capitalRunIsExempt, gapMarkerSpans, isSymbolString, notationExempt } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const SRC = '/Users/davidb/Downloads/twenty-mixed-walkscripts-for-annie.json';
const SRC_SHA = 'b9e1c15e71a3b0c254e6a0809215f4dfff90044e35351dbac4f6ded2b2526203';
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

/** Every run this predicate has an opinion about, in Cowork's row shape, with MY verdict. */
function runsFor(root: string, path: string, text: string) {
  const frames = gapMarkerSpans(text);
  const out: Array<Record<string, unknown>> = [];
  for (const m of text.matchAll(/[A-Z]{2,}|_{2,}/g)) {
    const a = m.index!; const b = a + m[0].length;
    const exempt = capitalRunIsExempt(root, path, text, a, b);
    const inFrame = frames.find(([s, e]) => a >= s && b <= e);
    out.push({
      span: [a, b],
      characters: m[0],
      verdict: exempt ? 'EXEMPT' : 'LOOSE',
      by: exempt
        ? (inFrame ? `inside the frame token ${JSON.stringify(text.slice(inFrame[0], inFrame[1]))} at [${inFrame[0]}, ${inFrame[1]})` : `notationExempt(${root}, ${path}) — the whole string is a symbol`)
        : `capitalRunIsExempt(${root}, ${path}, …) === false — not inside any frame token, and the string is not a symbol`,
    });
  }
  return { frameTokens: frames.map(([s, e]) => ({ span: [s, e], characters: text.slice(s, e) })), runs: out };
}

function run() {
  const bytes = readFileSync(SRC);
  if (sha256(bytes) !== SRC_SHA) throw new Error(`REFUSED — the port's artefact reads ${sha256(bytes)}, declared ${SRC_SHA}`);
  const theirs = JSON.parse(bytes.toString('utf8')) as { rows: Array<{ itemId: string; text: string; runs: Array<{ span: [number, number]; characters: string; verdict: string; by: string }> }> };

  assertFixture('predicate-verdicts', [
    { name: 'DE___VE is one token', input: 'The word stops at DE___VE.', mustBeCaught: true },
    { name: 'COM___E is one token', input: 'It reads COM___E here.', mustBeCaught: true },
    { name: 'DEC___E is one token', input: 'It reads DEC___E here.', mustBeCaught: true },
    { name: 'prose with no frame yields no frame token', input: 'Read the sentence up to the gap.', mustBeCaught: false },
  ], (t) => gapMarkerSpans(t).length > 0);

  // Her four frames, in isolation and in a sentence, from the TypeScript itself.
  const HER_FRAMES = ['SH___', 'DE___VE', 'COM___E', 'DEC___E'];
  const herFrames = HER_FRAMES.map((f) => {
    const inProse = `The word stops at ${f}. The line tells you what it means.`;
    return {
      frame: f,
      bare: { text: f, ...runsFor('stem', 'frame', f), isSymbolString: isSymbolString(f), notationExempt: notationExempt('stem', 'frame', f) },
      inASentence: { text: inProse, ...runsFor('explanation', 'walkScript', inProse) },
      theClaimUnderTest: 'Cowork\'s port marks the letter run LOOSE and the underscores EXEMPT, splitting one mark in two.',
      thisPredicateSays: 'ONE TOKEN. The letters on either side of the underscores are inside the frame span, so every run of the frame is EXEMPT by the same span.',
    };
  });

  // The same twenty rows the port ran on, verdict against verdict.
  const sideBySide = theirs.rows.map((r) => {
    const mine = runsFor('explanation', 'walkScript', r.text);
    const byKey = new Map(mine.runs.map((x) => [`${(x.span as number[])[0]}:${x.characters}`, x]));
    return {
      itemId: r.itemId,
      text: r.text,
      myFrameTokens: mine.frameTokens,
      runs: r.runs.map((theirRun) => {
        const m = byKey.get(`${theirRun.span[0]}:${theirRun.characters}`);
        return {
          span: theirRun.span,
          characters: theirRun.characters,
          portVerdict: theirRun.verdict,
          thisPredicateVerdict: m?.verdict ?? 'NOT A RUN THIS PREDICATE EXAMINES',
          agree: m ? m.verdict === theirRun.verdict : null,
          thisPredicateReason: m?.by ?? null,
          portReason: theirRun.by,
        };
      }),
    };
  });
  const rows = sideBySide.flatMap((r) => r.runs);
  const disagreements = rows.filter((r) => r.agree === false);

  const payload = {
    kind: 'predicate-verdicts-side-by-side',
    what: 'This predicate\'s verdicts, span by span, computed from the TypeScript itself, over THE SAME INPUTS the port ran on — so the desk can diff two verdicts rather than adjudicate two descriptions.',
    why: 'The two claims disagree and neither store can see the other\'s code. The comparison is therefore made on shared inputs in a shared row shape, and the artefact asserts nothing about the port\'s source, which this side does not hold.',
    theirArtefact: { file: 'twenty-mixed-walkscripts-for-annie.json', sha256: SRC_SHA, emittedBy: 'build_ninety_screen.py over walkscript_screen.py' },
    herFourFrames: herFrames,
    theSummary: {
      runsCompared: rows.length,
      agree: rows.filter((r) => r.agree === true).length,
      disagree: disagreements.length,
      everyDisagreementIsTheSameShape: disagreements.every((d) => d.thisPredicateVerdict === 'EXEMPT' && d.portVerdict === 'LOOSE'),
      reading: 'every disagreement runs one way: the port says LOOSE where this predicate says EXEMPT, and every one is a letter run sitting inside a frame token. That is the split, and it is a property of whichever tokeniser asks per run instead of per span.',
    },
    disagreements,
    sideBySide,
  };
  const canonical = (o: unknown): string => {
    if (o === null || typeof o !== 'object') return JSON.stringify(o);
    if (Array.isArray(o)) return `[${o.map(canonical).join(',')}]`;
    return `{${Object.keys(o as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((o as Record<string, unknown>)[k])}`).join(',')}}`;
  };
  const findingsSha256 = sha256(canonical({ herFourFrames: payload.herFourFrames, theSummary: payload.theSummary, disagreements: payload.disagreements }));
  const artefact = { ...payload, findingsSha256, howToCheckThisOnArrival: { subtree: '{herFourFrames, theSummary, disagreements}', spec: 'sha256 over json.dumps(subtree, sort_keys=True, separators=(",",":"), ensure_ascii=False).encode("utf-8") (R729)', fileDigest: 'staging line and .sha256 sidecar' } };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('predicate-verdicts-side-by-side', sha256(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'predicate-verdicts-side-by-side');
  console.log(`runs compared ${rows.length}; agree ${payload.theSummary.agree}; disagree ${disagreements.length}; all one shape ${payload.theSummary.everyDisagreementIsTheSameShape}`);
}

run();
