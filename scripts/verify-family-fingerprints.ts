/**
 * HAS ANYTHING SIGNED MOVED SINCE SIGNING? — `pnpm verify:fingerprints`
 *
 * Recomputes every signed family's fingerprint and compares it to the hash recorded when the
 * reviewer signed it. Read-only: it rules on nothing. A MOVED family is a reviewer's decision
 * about whether the move was substantive (R34), never a script's.
 *
 * SOURCE, STATED BEFORE IT RUNS (R41). This does not re-derive any fingerprint. It calls the
 * districts' own functions — `mathsFamilyFingerprint` (packages/core/src/maths/fingerprint.ts)
 * and `familyFingerprint` (packages/core/src/english/spag-fingerprint.ts) — over the families
 * exported by `MATHS_FAMILIES`, `SPAG_FAMILIES` and `VOCAB_IN_CONTEXT`, against
 * `AttributionEvent.subjectHash`. Same two functions `pin:signatures` used to write the hashes.
 *
 * WHAT A MATCH DOES AND DOES NOT MEAN — the scope is the point, not a caveat.
 * Both fingerprints hash the DECLARED SURFACE the reviewer met on the sample sheet: the id, the
 * family-level shape facts, and per tier the rule, the structural parameters and the number
 * ranges. Verified empirically 2026-08-12: rewording a tier rule MOVES the hash, replacing the
 * generator body does NOT, and extending a family's bank does NOT.
 *
 * So "33 of 33 unmoved" means the surface she signed is intact. It is NOT a claim that the
 * families generate what they generated, nor that their banks are unchanged. Those need a
 * different instrument — the param sweeps assert emitted items against declared parameters, and
 * bank content has no signature-level guard at all. Do not quote this table as if it covered them.
 *
 * ENUMERATES FROM BOTH ENDS. A family-side sweep cannot see a signature whose family is not in
 * the array it walks: `en-vocab-in-context` is a SpagFamily deliberately outside `SPAG_FAMILIES`,
 * it is signed and pinned, and every sweep keyed on that array skipped it in silence.
 */
import {
  MATHS_FAMILIES,
} from '../packages/core/src/maths/families';
import { mathsFamilyFingerprint } from '../packages/core/src/maths/fingerprint';
import { SPAG_FAMILIES } from '../packages/core/src/english/spag-families';
import { VOCAB_IN_CONTEXT } from '../packages/core/src/english/vocab-context';
import { familyFingerprint } from '../packages/core/src/english/spag-fingerprint';
import { prisma } from '../packages/db/src/index';

type Verdict = 'unmoved' | 'MOVED' | 'UNPINNED' | 'UNSIGNED';

interface Row {
  id: string;
  district: 'MATHS' | 'ENGLISH';
  signed: string | null;
  now: string;
  verdict: Verdict;
}

/**
 * CANARY (R60 Q2). If a fingerprint function stopped responding to the surface it hashes, every
 * family would report `unmoved` forever and this verifier would be the most reassuring thing in
 * the repo while checking nothing. So: perturb a declared tier rule and require the hash to move,
 * once per district, before any real comparison is trusted.
 */
function fingerprintsRespond(): string[] {
  const dead: string[] = [];
  const m = MATHS_FAMILIES[0];
  if (m) {
    const moved = mathsFamilyFingerprint({ ...m, tierRule: (t) => `${m.tierRule(t)} ~probe` });
    if (moved === mathsFamilyFingerprint(m)) dead.push('mathsFamilyFingerprint');
  }
  const s = SPAG_FAMILIES[0];
  if (s) {
    const moved = familyFingerprint({ ...s, tierRule: (t) => `${s.tierRule(t)} ~probe` });
    if (moved === familyFingerprint(s)) dead.push('familyFingerprint');
  }
  return dead;
}

async function main(): Promise<void> {
  const dead = fingerprintsRespond();
  if (dead.length > 0) {
    console.error('FINGERPRINT VERIFY ABORTED — these functions no longer move when the surface moves:');
    for (const name of dead) console.error(`  ${name}`);
    console.error('Every family would report "unmoved". Fix the fingerprint before trusting any row.');
    process.exit(1);
  }

  const events = await prisma.attributionEvent.findMany({
    where: { action: 'SIGNED', recordType: { contains: 'template-family' } },
    select: { recordId: true, subjectHash: true },
  });
  const sig = new Map(events.map((e) => [e.recordId, e]));

  // Every signable family, from the code side. VOCAB_IN_CONTEXT is listed explicitly because it
  // is deliberately not in SPAG_FAMILIES — see the header.
  const families: Array<{ id: string; district: 'MATHS' | 'ENGLISH'; fp: string }> = [
    ...MATHS_FAMILIES.map((f) => ({ id: f.id, district: 'MATHS' as const, fp: mathsFamilyFingerprint(f) })),
    ...SPAG_FAMILIES.map((f) => ({ id: f.id, district: 'ENGLISH' as const, fp: familyFingerprint(f) })),
    { id: VOCAB_IN_CONTEXT.id, district: 'ENGLISH', fp: familyFingerprint(VOCAB_IN_CONTEXT) },
  ];

  if (events.length === 0 || families.length === 0) {
    console.error(
      `FINGERPRINT VERIFY ABORTED — ${events.length} signatures, ${families.length} families.\n` +
        'This gate has no legitimately-empty population: if either side is empty the query or the\n' +
        'family export is broken, not the content. Nothing was verified.',
    );
    process.exit(1);
  }

  const rows: Row[] = families.map((f) => {
    const ev = sig.get(f.id);
    const verdict: Verdict = !ev
      ? 'UNSIGNED'
      : !ev.subjectHash
        ? 'UNPINNED'
        : ev.subjectHash === f.fp
          ? 'unmoved'
          : 'MOVED';
    return { id: f.id, district: f.district, signed: ev?.subjectHash ?? null, now: f.fp, verdict };
  });

  // The other direction: a signature whose family no longer exists in code. Invisible to any
  // family-side walk, and it means the signed thing cannot be recomputed at all.
  const codeIds = new Set(families.map((f) => f.id));
  const orphans = events.filter((e) => !codeIds.has(e.recordId));

  const moved = rows.filter((r) => r.verdict === 'MOVED');
  const unpinned = rows.filter((r) => r.verdict === 'UNPINNED');
  const unsigned = rows.filter((r) => r.verdict === 'UNSIGNED');

  console.log(`Signed-family fingerprint verification — ${rows.length} families, ${events.length} signatures\n`);
  console.log('  district  family                            signed            recomputed        verdict');
  for (const r of rows) {
    console.log(
      `  ${r.district.padEnd(9)} ${r.id.padEnd(33)} ${(r.signed ?? '—').padEnd(17)} ${r.now.padEnd(17)} ${r.verdict}`,
    );
  }

  console.log(
    `\n${rows.filter((r) => r.verdict === 'unmoved').length} unmoved · ${moved.length} MOVED · ` +
      `${unpinned.length} unpinned · ${unsigned.length} unsigned · ${orphans.length} signature(s) with no family in code`,
  );
  console.log(
    'Scope: the DECLARED SURFACE only (tier rules, structural parameters, ranges). Generator\n' +
      'behaviour and bank content are NOT hashed — an unmoved fingerprint says nothing about them.',
  );

  if (orphans.length > 0) {
    console.error('\nSIGNATURES WITH NO FAMILY IN CODE — these cannot be recomputed at all:');
    for (const o of orphans) console.error(`  ${o.recordId}`);
    process.exit(1);
  }
  if (moved.length > 0) {
    console.error(`\n${moved.length} family(ies) MOVED since signing — the signature describes a surface that no longer exists:`);
    for (const r of moved) console.error(`  ${r.id}: signed ${r.signed}, now ${r.now}`);
    console.error('This needs a reviewer ruling on whether the move was substantive (R34), not a re-pin.');
    process.exit(1);
  }
  if (unpinned.length > 0) {
    console.error(`\n${unpinned.length} signed but UNPINNED — no hash to compare against:`);
    for (const r of unpinned) console.error(`  ${r.id}`);
    process.exit(1);
  }
  await prisma.$disconnect();
}

void main();
