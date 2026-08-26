/**
 * THE SERVING SIDE'S HALF OF THE PORT CROSSING (David, 2026-08-26 — R744).
 * Compared on the four declared string digests and no other bytes.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { capitalRunIsExempt, gapMarkerSpans, isSymbolString, notationExempt } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';

const REPO = join(__dirname, '..');
const THEIRS = '/Users/davidb/Downloads/port-crossing-cowork-half-for-code.json';
const THEIRS_SHA = '4dd8b8fc46965001c0635689192f8dd70f12ec1014aa3ad36b930d6f26d26323';
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

function run() {
  const bytes = readFileSync(THEIRS);
  if (sha256(bytes) !== THEIRS_SHA) throw new Error(`REFUSED — the port's half reads ${sha256(bytes)}, declared ${THEIRS_SHA}`);
  const theirs = JSON.parse(bytes.toString('utf8')) as {
    strings: Array<{ id: string; from: string; text: string; sha256: string; gapMarkerSpans_thisStoresPort: number[][]; frameTokenSpans_thisStoresPort: number[][]; capitalRuns: Array<{ span: [number, number]; run: string; thisStoresPort_capitalRunIsExempt: boolean }> }>;
  };

  /**
   * OFFSETS ARE DERIVED, NOT TYPED (R649) — and the fixture proved why on its first run: a
   * hand-counted `8` for a run that starts at 9 failed the must-catch case, which is the fixture
   * doing exactly its job on the author of the fixture.
   */
  const at = (text: string, run: string): [string, string, string, number, number] => {
    const i = text.indexOf(run);
    if (i < 0) throw new Error(`fixture is malformed: ${JSON.stringify(run)} is not in ${JSON.stringify(text)}`);
    return ['explanation', 'walkScript', text, i, i + run.length];
  };
  assertFixture('port-crossing-half', [
    { name: 'a run inside a frame is exempt', input: at('It reads DE___VE here.', 'DE'), mustBeCaught: true },
    { name: 'the trailing run of a frame is exempt too', input: at('It reads DE___VE here.', 'VE'), mustBeCaught: true },
    { name: 'a run adjacent to no marker is not', input: at('OUT makes SHOUT.', 'OUT'), mustBeCaught: false },
    { name: 'a stimulus word in a prompt is not', input: (() => { const s = 'Which word joins with AIR to make one?'; const i = s.indexOf('AIR'); return ['stem', 'prompt', s, i, i + 3] as [string, string, string, number, number]; })(), mustBeCaught: false },
  ], (a) => capitalRunIsExempt(a[0], a[1], a[2], a[3], a[4]));

  const strings = theirs.strings.map((s) => {
    const recomputed = sha256(Buffer.from(s.text, 'utf8'));
    if (recomputed !== s.sha256) throw new Error(`REFUSED — ${s.id}: text hashes to ${recomputed}, declared ${s.sha256}. Compare on bytes or not at all.`);
    const mySpans = gapMarkerSpans(s.text);
    const runs = s.capitalRuns.map((r) => {
      const mine = capitalRunIsExempt('explanation', 'walkScript', s.text, r.span[0], r.span[1]);
      const inMyFrame = mySpans.find(([a, b]) => r.span[0] >= a && r.span[1] <= b);
      return {
        span: r.span, run: r.run,
        thisStore_capitalRunIsExempt: mine,
        port_capitalRunIsExempt: r.thisStoresPort_capitalRunIsExempt,
        agree: mine === r.thisStoresPort_capitalRunIsExempt,
        thisStore_reason: inMyFrame
          ? `inside this side's gapMarkerSpans entry [${inMyFrame[0]}, ${inMyFrame[1]}) = ${JSON.stringify(s.text.slice(inMyFrame[0], inMyFrame[1]))}`
          : 'inside no marker span, and the string is not a symbol',
      };
    });
    return {
      id: s.id, from: s.from, text: s.text, sha256: s.sha256, digestRecomputedHere: true,
      thisStore_gapMarkerSpans: mySpans,
      port_gapMarkerSpans: s.gapMarkerSpans_thisStoresPort,
      port_frameTokenSpans: s.frameTokenSpans_thisStoresPort,
      spansAgree: JSON.stringify(mySpans) === JSON.stringify(s.gapMarkerSpans_thisStoresPort),
      isSymbolString: isSymbolString(s.text),
      notationExempt_walkScript: notationExempt('explanation', 'walkScript', s.text),
      runs,
    };
  });

  const allRuns = strings.flatMap((s) => s.runs);
  const control = strings.find((s) => s.id === 'S4')!;
  const payload = {
    kind: 'port-crossing-serving-half',
    what: "This side's capitalRunIsExempt over S1–S4, span by span, from the TypeScript. The other half of the evidence.",
    comparedOn: 'the four declared string digests and no other bytes — each recomputed here from the text before any verdict was taken.',
    theirHalf: { file: 'port-crossing-cowork-half-for-code.json', sha256: THEIRS_SHA },
    THE_CONTROL_ANSWERS_FIRST: {
      id: 'S4',
      text: control.text,
      thisStoreVerdicts: control.runs.map((r) => ({ run: r.run, exempt: r.thisStore_capitalRunIsExempt })),
      portVerdicts: control.runs.map((r) => ({ run: r.run, exempt: r.port_capitalRunIsExempt })),
      agree: control.runs.every((r) => r.agree),
      meaning: 'BOTH IMPLEMENTATIONS SAY FALSE ON THE CONTROL. They do not agree by exempting everything — this side refuses OUT and SHOUT exactly as the port does. The disagreement is therefore specific to runs ADJACENT TO A MARKER, which is the only place they differ.',
    },
    theSummary: {
      runsCompared: allRuns.length,
      agree: allRuns.filter((r) => r.agree).length,
      disagree: allRuns.filter((r) => !r.agree).length,
      everyDisagreementIsAdjacentToAMarker: allRuns.filter((r) => !r.agree).every((r) => r.thisStore_capitalRunIsExempt === true && r.port_capitalRunIsExempt === false),
    },
    THE_DIVERGENCE_IS_IN_gapMarkerSpans_NOT_IN_THE_PREDICATE: {
      finding: 'the two predicates share their logic and differ in ONE input. On S1 this side\'s gapMarkerSpans returns [[18,25]] — the whole frame, letters included — while the port\'s returns [[20,23]], the underscores alone. `DE` at [18,20) is inside the first and outside the second, and both predicates then answer their own span set correctly.',
      theTellInTheirOwnData: 'the port\'s half ALREADY CARRIES frameTokenSpans [[18,25]] beside gapMarkerSpans [[20,23]] — it computes the whole-frame span and its capitalRunIsExempt does not consult it. The two spans sit side by side in its own artefact and the predicate reads the narrower one.',
      soTheRepairIsOneLine: 'whichever store changes, the change is to what gapMarkerSpans returns, not to how exemption is decided. Stated as a diagnosis, not a repair: this side does not hold that Python and does not rule on it.',
    },
    strings,
  };
  const canonical = (o: unknown): string => {
    if (o === null || typeof o !== 'object') return JSON.stringify(o);
    if (Array.isArray(o)) return `[${o.map(canonical).join(',')}]`;
    return `{${Object.keys(o as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((o as Record<string, unknown>)[k])}`).join(',')}}`;
  };
  // R752: the subtree is named by the DOCUMENT'S OWN top-level keys; findingsDigest throws
  // if any named key is not present, so an alias fails here rather than at the far door.
  const artefact = { ...payload, ...findingsDigest(payload, ['THE_CONTROL_ANSWERS_FIRST', 'theSummary', 'THE_DIVERGENCE_IS_IN_gapMarkerSpans_NOT_IN_THE_PREDICATE', 'strings']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('port-crossing-serving-half', sha256(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'port-crossing-serving-half');
  console.log(`runs ${allRuns.length}; agree ${payload.theSummary.agree}; disagree ${payload.theSummary.disagree}; control agrees ${payload.THE_CONTROL_ANSWERS_FIRST.agree}`);
}

run();
