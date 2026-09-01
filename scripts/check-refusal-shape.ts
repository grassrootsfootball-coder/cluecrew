/**
 * check:refusal-shape — proves the R961 guard discriminates.
 *
 * Runs the carried fixture (R721) in `scripts/lib/refusal-shape.ts`: the three incidents that
 * would have fired — 569 of 689 absent under one reason, 183 refusals all within vr-17, 9 of 15
 * all one entry — and one irregular clean set that must NOT fire. A guard that only ever fires
 * has not been shown to discriminate; this check fails if either half stops holding.
 *
 * Then prints, as a worked demonstration a reader can compare against, what the guard says about
 * each fixture case — so the output shows not just that it discriminates but WHAT it prints at
 * the station an emitter would call it from.
 */

import { REFUSAL_SHAPE_FIXTURE, assessRefusalShape, runRefusalShapeFixture } from './lib/refusal-shape';

console.log('check:refusal-shape — the R961 guard, fixtured.');
runRefusalShapeFixture();

console.log('\nWhat the guard prints on each carried case:');
for (const c of REFUSAL_SHAPE_FIXTURE) {
  assessRefusalShape(`  [${c.name}]`, c.input);
}

console.log(
  '\ncheck:refusal-shape PASSED. The guard fires on all three incidents that produced R961 and\n' +
    'stays silent on an irregular set. Any emitter reporting refusals calls assessRefusalShape\n' +
    'with its screened rows; the hypothesis line prints whether or not anybody was suspicious.',
);
