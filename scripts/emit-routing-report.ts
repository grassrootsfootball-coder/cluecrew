/**
 * THE QUOTATION RULING'S OUTCOME AND THE ROUTING DEFAULT (David, 2026-08-25 — R711/R712).
 * Report only; the routing helper is the build, and this states what it can and cannot reach.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deliver, stampedName } from './lib/export-destination';
import { routeRefusals, type Refusal } from './lib/route-refusal';

const REPO = join(__dirname, '..');
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

function run() {
  // ---- The door's verdict AFTER the quotation exemption ----
  let door = '';
  try { door = execSync('pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-reissued-items.ts', { cwd: REPO, encoding: 'utf8' }); }
  catch (e) { const err = e as { stdout?: string; stderr?: string }; door = String(err.stdout ?? '') + String(err.stderr ?? ''); }
  const rr08 = door.split('\n').filter((l) => /RR-08/.test(l) || /realized/.test(l)).map((l) => l.trim());

  const quotationRuling = {
    ruled: 'spelling and stance gates do not bind declared quotations; a quotation is bound by fidelity to its source (her 154th thread, David 25 August).',
    landedWhere: [
      'packages/core/src/item-content-gate.ts — QUOTATION_FIELDS (attractorQuote, defeaterQuote), skipped by textsFrom. A FORWARD GUARD: the gate does not walk option columns today, so it changes no current verdict and means a later widening cannot silently start capping quotations.',
      'scripts/check-every-string-field.ts — these two paths were classified `undecided`, "nobody has ruled". They are now `quotation`, and the exemption PRINTS EVERY RUN so it can never quietly become unscreened-by-accident. The membership is imported from the gate, never re-listed (R57/R429).',
    ],
    THE_ANSWER_TO_THE_QUESTION_ASKED: {
      question: 'does ENG-027-RR-08 then pass on its own merits?',
      verdict: 'NO — IT IS STILL REFUSED, AND THE PREMISE NEEDS ONE CORRECTION.',
      why: 'The item carries "realized" in THREE places: options[2].attractorQuote (the declared quotation, verbatim from line 35), options[2].misconceptionExecution, and explanation.walkScript. THE DOOR FLAGGED THE WALK SCRIPT — "Line 35 says he had not realized the King had come." — which is OUR OWN PROSE paraphrasing the line and reproducing its spelling, not a declared quotation. The gate never read the attractorQuote at all: it receives options as {content, misconceptionId} and no option column reaches it.',
      consequence: 'Rewording the walk-script paraphrase does NOT touch the declared quotation and does NOT break byte-verify. So the item IS repairable after all, by Cowork, at a different string than the one the ruling protects — and the protection of that quotation is now permanent regardless.',
      doorOutputThisRun: rr08,
      standing: 'The ruling is right and lands whole; it simply does not clear this item. Four of the five remain repairable as before; the fifth is repairable at a string nobody had identified.',
    },
  };

  // ---- The routing default: demonstrated on the live refusal set ----
  const refusals: Refusal[] = [
    { subject: 'ENG-018-RB-01', fault: 'us-spelling: US spelling "favoring" (-or for -our) — UK form is -our', repairableBy: 'cowork', context: { field: 'explanation.walkScript' } },
    { subject: 'ENG-018-RB-11', fault: 'us-spelling: US spelling "traveling" (single-l past tense / agent) — UK form is double the l', repairableBy: 'cowork', context: { field: 'explanation.walkScript' } },
    { subject: 'ENG-019-BV-02', fault: 'banned-vocabulary: "quickly/quick" (no-urgency stance — barred in text addressed to the child) — found "quick"', repairableBy: 'cowork', context: { field: 'explanation.walkScript' } },
    { subject: 'ENG-023-RT-08', fault: 'us-spelling: US spelling "fibers" (-er for -re) — UK form is -re', repairableBy: 'cowork', context: { field: 'option.value' } },
    { subject: 'ENG-027-RR-08', fault: 'us-spelling: US spelling "realized" (-ize for -ise) — UK form is -ise', repairableBy: 'cowork', context: { field: 'explanation.walkScript', note: 'the walk-script PARAPHRASE, not the attractorQuote — the quotation is exempt by ruling (R711) and must not be edited' } },
  ];
  const routed = routeRefusals({ repoRoot: REPO, door: 'import-reissued-items', refusals, note: 'the reference implementation of the routing default, on the refusal set that produced the rule' });

  const printers = JSON.parse(readFileSync('/private/tmp/claude-501/-Users-davidb-ClueCrew/9a8d8aea-32f1-4537-bb18-2b54d4491646/scratchpad/printers.json', 'utf8')) as Array<{ door: string; refusalOwner: string }>;
  const cannotBeRouted = printers.filter((p) => p.refusalOwner === 'this-store');

  const artefact = {
    kind: 'refusal-routing-default',
    what: 'The quotation ruling landed and its outcome reported; the routing default built as a shared path and demonstrated; the twenty-six print-and-stop doors classified by whether a crossing is owed at all.',
    quotationRuling,
    theRoutingDefault: {
      built: 'scripts/lib/route-refusal.ts — routeRefusals({door, refusals}) emits ONE crossable artefact naming, per refusal, the SUBJECT, the gate\'s EXACT WORDS and the PARTY WHO MUST REPAIR IT. Doors call it instead of printing and stopping.',
      itRefusesToOverclaim: 'deliver() stages; arrival is the receiving store\'s to report (R255). An empty refusal set and a set owned entirely by this store both return "no crossing" WITH THEIR REASON, so a silent nothing is impossible (R61).',
      demonstratedOn: { door: 'import-reissued-items', outward: routed.outward, staged: routed.staged ? routed.staged.split('/').pop() : null, reason: routed.reason },
    },
    theTwentySix: {
      finding: 'THE TWENTY-SIX ARE NOT ONE CLASS. 13 are import doors refusing COWORK\'S OWN WORDS — every one of them owes a crossing and can take the default unchanged. 9 are checks whose faults land on authored content and can route once each names its owner per refusal. 4 CANNOT BE ROUTED OUTWARD AT ALL, and that is correct, not a gap.',
      cannotBeRoutedAndWhy: cannotBeRouted.map((c) => ({
        door: c.door,
        why: 'its refusals are about THIS STORE\'S OWN STATE — a scope declaration, a schema shape, an export\'s freshness, a decision nothing reads. The addressee is this side, so CI is the correct destination and a crossing would address a party that cannot act. Routing these outward would be the fault inverted: a refusal sent to someone with no power to repair it.',
      })),
      byOwner: { cowork: printers.filter((p) => p.refusalOwner === 'cowork').map((p) => p.door), reviewerOrCowork: printers.filter((p) => p.refusalOwner === 'reviewer-or-cowork').map((p) => p.door), thisStore: cannotBeRouted.map((p) => p.door) },
      honestLimit: 'THE DEFAULT IS BUILT AND DEMONSTRATED, NOT YET WIRED INTO ALL 22 OUTWARD DOORS. Each has its own refusal shape and its own owner-derivation, and wiring them blind would produce artefacts naming the wrong repairer — the fault this rule exists to end. The wiring is per-door work and is named as owed rather than claimed.',
    },
    theInstrumentIsNoLongerInItsOwnClass: {
      wired: 'check:import-refusals is now in CI (.github/workflows/ci.yml), beside check:reissue-completion.',
      itsOwnStance: 'it reports and does not fail — "a red build over another store\'s backlog would be switched off within a week" — which is the same correct design as the reissue check, and is exactly why the crossing leg, not the redness, is the remedy.',
    },
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('refusal-routing-default', sha256(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'refusal-routing-default');
  console.log(`\nrouted: ${routed.reason}; cannot be routed: ${cannotBeRouted.length}`);
}

run();
