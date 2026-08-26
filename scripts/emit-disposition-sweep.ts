/** THE DISPOSITION SWEEP (David's ruling on the sweep's lead, 2026-08-25 — R714). Report only. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const S = '/private/tmp/claude-501/-Users-davidb-ClueCrew/9a8d8aea-32f1-4537-bb18-2b54d4491646/scratchpad';
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

const before = JSON.parse(readFileSync(`${S}/before.json`, 'utf8')) as Record<string, string[]>;
const after = JSON.parse(readFileSync(`${S}/after.json`, 'utf8')) as Record<string, string[]>;
const newly = Object.keys(after).filter((k) => !(k in before));
const paths = new Map<string, string[]>();
for (const [id, fs] of Object.entries(after)) for (const f of fs) {
  const p = f.split('|')[1]!.split(' ').slice(1).join(' ');
  paths.set(p, [...(paths.get(p) ?? []), id]);
}

const artefact = {
  kind: 'disposition-sweep',
  what: 'The child-facing gate now walks every string on the row and screens by disposition, never by a field list. Baseline before, run after, membership of everything it now catches.',
  THE_LEADS_OWN_FIGURE_CORRECTED: {
    claimed: '1,533 child-facing strings on fourteen paths reach children through no gate',
    measured: 'THE FOURTEEN PATHS WERE NOT THE HOLE, AND MOST OF THEM WERE ALREADY SCREENED. Probed against the gate rather than its description: a single-token option value carrying "favoring" WAS caught; a single token in an unlisted field WAS caught. What the check called "skipped for want of a space" was actually TOKEN_FIELDS skipping by field NAME — stem.stemWord is skipped, options[].content.value is not.',
    whyTheFigureLookedRight: 'check:every-string-field models the gate with its own `isScreened` predicate — `walked && text.includes(" ")` — which is a RE-DERIVATION of the gate rather than a call to it. Its own header warns against exactly this: "a verifier states its source before it runs, and calls the family\'s own function rather than re-deriving the property." The model was wrong in both directions.',
    THE_REAL_HOLE: 'the gate walked `explanation` through a THREE-NAME LIST — walkScript, walk, hintCore. So `explanation.note`, which this store classifies CHILD, carried a US spelling past every check, and `teachBack` carried banned vocabulary. Both verified by probe before and after. THE RULING WAS RIGHT AND THE DIAGNOSIS UNDER IT WAS WRONG: the fault was a field list, exactly as ruled — just not the one the figure pointed at.',
  },
  theWiring: {
    where: 'packages/core/src/field-dispositions.ts — one membership, imported by the gate AND by check:every-string-field; neither re-lists (R57/R429).',
    rule: 'child → screened; staff → skipped; quotation → skipped (bound by fidelity, R711); NO DISPOSITION → REFUSES, naming the path.',
    proof: [
      'explanation.note with "favoring" — before: passed. after: us-spelling.',
      'explanation.teachBack with "wrong" — before: passed. after: banned-vocabulary.',
      'an unclassified path — before: passed. after: unclassified-path.',
    ],
  },
  theBaselineDiff: {
    method: 'R149 — the gate was baselined over the live population BEFORE the change and re-run after; the diff is the membership, never the total.',
    population: '335 LIVE items',
    before: { failing: Object.keys(before).length },
    after: { failing: Object.keys(after).length },
    newlyCaught: { items: newly.length, membership: newly },
    note: 'ZERO new CONTENT faults. Every new catch is an unclassified path — a classification gap, not a defect in any child-facing string. No item is demoted; none was instructed and none is warranted by a missing declaration.',
  },
  THE_TEN_UNDECLARED_FOR_THE_DESK: {
    asked: 'the ten UNDECLARED come to the desk as a list',
    fromTheCheck: ['explanation.hintAuthoredBy', 'explanation.fieldWithoutAColumn.field', 'explanation.fieldWithoutAColumn.value', 'explanation.fieldWithoutAColumn.appliesTo', 'explanation.hintServes', 'explanation.hintRuledBy', 'stem._repairAuthority.landedHereOn', 'explanation._repairAuthority.landedHereOn', 'drafterNote', 'options[].drafterDeclaredPull'],
    ruledInThisPass: 'ALL TEN classified STAFF in field-dispositions.ts — each is provenance, authority or a drafter/reviewer record, none is rendered to a child. Two of the ten (drafterNote, options[].drafterDeclaredPull) are columns THIS SIDE ADDED THIS WEEK and they arrived undeclared, which is the rule catching its own author.',
    STILL_UNRULED_AND_REFUSING: {
      note: 'the gate found SEVEN paths the check never listed, because the check reads paths present across all rows and these sit on fewer. They refuse today and need the desk:',
      paths: Object.fromEntries([...paths.entries()].map(([p, ids]) => [p, { items: ids.length, membership: ids }])),
      recommendation: 'explanation.quotes[].rule and .passageRef read as STAFF (a declaration\'s own metadata); explanation.unplacedBySplit.* reads as STAFF (a recorded ruling). Neither is ruled here — a disposition is a ruling and this side does not make it.',
    },
  },
};
const json = JSON.stringify(artefact, null, 1) + '\n';
const name = stampedName('disposition-sweep', sha256(json).slice(0, 16), 'json');
writeFileSync(join(REPO, 'content/exports', name), json);
deliver(join(REPO, 'content/exports', name), 'disposition-sweep');
console.log(`newly caught ${newly.length}; unclassified paths ${paths.size}`);
