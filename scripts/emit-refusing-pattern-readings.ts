/**
 * ONE ARTEFACT PER REFUSING PATTERN (Annie's 199th) — entry, three sample carriers, the generator's
 * account. **And nothing else.** Fourteen readings at the pattern grain, not three hundred and fifty
 * at the option grain.
 *
 * Plus the vr-02 collision, reported and not resolved.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

/** What the generator ACTUALLY did, quoted from `packages/db/prisma/generate-content.ts`. */
const ACCOUNT: Record<string, { how: string; theCode: string; andWHATTHATMEANS: string }> = {
  'vr19-shared-letter-miss': {
    how: 'DERIVED FROM THE KEY BY ARITHMETIC.',
    theCode: "{ content: { value: answer.slice(0, -1) + ((Number(answer.at(-1)) + 1) % 10) }, isCorrect: false, m: 1 }",
    andWHATTHATMEANS: 'the carrier is the key with its LAST DIGIT INCREMENTED BY ONE. Nothing in that derivation touches repeated letters, and the coded words the generator picks (TAP, and its siblings) contain none — so the act the entry names is not merely unperformed, it is unperformable on every carrier. This is the only refusing pattern that is pure derivation, and it is the only one that refuses 25 of 25.',
  },
  'vr13-not-a-word': {
    how: 'TAKEN FROM A STATIC BANK COLUMN; THE TAG IS ASSIGNED BY POSITION.',
    theCode: "{ content: { value: entry[3] }, isCorrect: false, m: 1 }   // m indexes MISCONCEPTIONS['vr-13-make-a-word']",
    andWHATTHATMEANS: '`m: 1` is an INDEX into a per-type array, so every row in column 3 of the bank receives `vr13-not-a-word` whatever it is. Whether a carrier performs depends entirely on how that bank column was written, row by row — which is why this pattern refuses 22 of 25 rather than all or none.',
  },
  'vr05-almost-letters': {
    how: 'TAKEN FROM A STATIC BANK COLUMN; THE TAG IS ASSIGNED BY POSITION.',
    theCode: "{ content: { value: entry[2] }, isCorrect: false, m: 1 }   // m indexes MISCONCEPTIONS['vr-05-hidden-word']",
    andWHATTHATMEANS: 'column 2 of the HIDDEN_WORDS bank receives `vr05-almost-letters` by position. 11 of 25 carriers appear contiguously in their sentence, which is the opposite of the act the entry names.',
  },
  'vr05-single-word-only': {
    how: 'TAKEN FROM A STATIC BANK COLUMN; THE TAG IS ASSIGNED BY POSITION.',
    theCode: "{ content: { value: entry[3] }, isCorrect: false, m: 0 }   // m indexes MISCONCEPTIONS['vr-05-hidden-word']",
    andWHATTHATMEANS: 'column 3 receives `vr05-single-word-only` by position. 21 of 25 carriers sit inside no single word of their sentence, so the search the entry describes did not happen.',
  },
  'vr-move-letter-first-word-invalid': {
    how: 'TAKEN FROM A STATIC BANK COLUMN; THE TAG IS ASSIGNED BY POSITION.',
    theCode: "{ content: { value: entry[3] }, isCorrect: false, m: 0 }   // m indexes MISCONCEPTIONS['vr-08-move-letter']",
    andWHATTHATMEANS: 'column 3 of MOVE_LETTER_EXTRA receives `first-word-invalid` by position. On 14 of 25, removing that letter from word1 leaves a REAL word — the entry says it should not.',
  },
  'vr-move-letter-second-word-invalid': {
    how: 'TAKEN FROM A STATIC BANK COLUMN; THE TAG IS ASSIGNED BY POSITION.',
    theCode: "{ content: { value: entry[4] }, isCorrect: false, m: 1 }   // m indexes MISCONCEPTIONS['vr-08-move-letter']",
    andWHATTHATMEANS: 'column 4 receives `second-word-invalid` by position. On 14 of 25, some insertion of that letter into word2 DOES make a real word — the entry says none can.',
  },
};

const valueOf = (c: unknown) => { const v = (c as { value?: unknown }).value; return Array.isArray(v) ? v.map(String) : String(v); };

async function run() {
  const census = JSON.parse(readFileSync(
    readdirSync(pjoin(REPO, 'content/exports')).filter((f: string) => f.startsWith('carrier-performs-entry-census')).sort().pop()!
      .replace(/^/, pjoin(REPO, 'content/exports') + '/'), 'utf8')) as { THE_REFUSING_MEMBERSHIP: Array<{ itemId: string; tag: string; optionValue: string; key: string; why: string; entryBehaviour: string }> };
  const byTag = new Map<string, typeof census.THE_REFUSING_MEMBERSHIP>();
  for (const r of census.THE_REFUSING_MEMBERSHIP) byTag.set(r.tag, [...(byTag.get(r.tag) ?? []), r]);
  requirePopulation('emit:refusing-pattern-readings', { 'refusing pattern(s)': byTag.size });

  const lib = new Map((await prisma.misconception.findMany({ where: { id: { in: [...byTag.keys()] } },
    select: { id: true, description: true, childHint: true, approvedBy: true } })).map((m) => [m.id, m]));

  const emitted: string[] = [];
  for (const [tag, refusing] of [...byTag.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const entry = lib.get(tag)!;
    const rows = await prisma.item.findMany({ where: { id: { in: refusing.slice(0, 3).map((r) => r.itemId) } },
      select: { id: true, stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } } });
    const body = {
      kind: 'refusing-pattern-reading',
      THE_ENTRY: { id: tag, behaviour: entry.description, childHint: entry.childHint, signed: !!entry.approvedBy },
      carriersRefusing: refusing.length, ofCarriers: 25,
      THREE_SAMPLE_CARRIERS: refusing.slice(0, 3).map((r) => {
        const row = rows.find((x) => x.id === r.itemId)!;
        return { itemId: r.itemId, stem: row.stem, key: r.key,
          THE_CARRIER: r.optionValue, whyItRefuses: r.why,
          siblings: row.options.filter((o) => !o.isCorrect).map((o) => ({ value: valueOf(o.content), tag: o.misconceptionId })) };
      }),
      THE_GENERATORS_ACCOUNT: ACCOUNT[tag] ?? { how: 'NOT ESTABLISHED', theCode: null, andWHATTHATMEANS: 'the generator path for this pattern was not identified; reported as unknown rather than guessed' },
      THE_FORK: 'regenerate, retag, or mint. The default is REGENERATE — the attested layer outranks the generated one (her 199th). Nothing here chooses.',
    };
    const json = JSON.stringify({ ...body, ...findingsDigest(body, ['THE_ENTRY', 'THREE_SAMPLE_CARRIERS', 'THE_GENERATORS_ACCOUNT']) }, null, 1) + '\n';
    const name = stampedName(`refusing-pattern-${tag}`, sha(json).slice(0, 16), 'json');
    writeFileSync(pjoin(REPO, 'content/exports', name), json);
    deliver(pjoin(REPO, 'content/exports', name), `refusing-pattern-${tag}`);
    emitted.push(`${tag} (${refusing.length}/25)`);
  }

  // ---- THE COLLISION, REPORTED AND NOT RESOLVED -------------------------------------------------
  const FIVE = [['oval', 'star'], ['hen', 'dog'], ['soft', 'cold'], ['net', 'run'], ['tuna', 'seal']];
  const v02 = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out', status: 'DRAFT' },
    select: { id: true, stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } } });
  const collisions = FIVE.map((pair) => {
    const row = v02.find((r) => r.options.some((o) => !o.isCorrect && JSON.stringify(valueOf(o.content)) === JSON.stringify(pair)))!;
    const key = valueOf(row.options.find((o) => o.isCorrect)!.content) as string[];
    const oddOf = (v: string[]) => v.filter((w) => key.includes(w));
    return { itemId: row.id, words: (row.stem as { words: string[] }).words, key,
      HER_197th_OPTION: pair, itsOddWord: oddOf(pair),
      THE_CARRIER_ALREADY_IN_THE_ROW_SHARING_THAT_ODD_WORD: row.options.filter((o) => !o.isCorrect
        && JSON.stringify(valueOf(o.content)) !== JSON.stringify(pair)
        && oddOf(valueOf(o.content) as string[]).some((w) => oddOf(pair).includes(w)))
        .map((o) => valueOf(o.content)),
      allThreePartialGroupOptions: row.options.filter((o) => o.misconceptionId === 'vr02-partial-group').map((o) => ({ value: valueOf(o.content), odd: oddOf(valueOf(o.content) as string[]) })) };
  });
  const collisionBody = {
    kind: 'vr02-partial-group-collision',
    REPORTED_NOT_RESOLVED: 'this store does not resolve it.',
    THE_COLLISION: 'your 198th accounts for partial-group as a SYMMETRIC error: executed from the first odd word it gives one pair, from the second odd word the other, and both are the entry working. That yields TWO executions per row. These five rows carry THREE partial-group options, so the third necessarily re-uses an odd word another carrier already ran from.',
    andWHICHTHIRD: 'in every one of the five it is the option you ruled to partial-group in your 197th — oval, dog, cold, net, tuna each already run from by a carrier that was in the row before.',
    andWHATISNOTCLAIMED: 'that your 197th ruling was wrong. Both options are honest partial-group pairings on the face of it; what collides is the per-option execution grain of your 198th with three carriers and two odd words. This store cannot tell whether the third seat is a third execution, a duplicate, or a different act.',
    rows: collisions,
  };
  const cjson = JSON.stringify({ ...collisionBody, ...findingsDigest(collisionBody, ['rows', 'THE_COLLISION']) }, null, 1) + '\n';
  const cname = stampedName('vr02-partial-group-collision', sha(cjson).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', cname), cjson);
  deliver(pjoin(REPO, 'content/exports', cname), 'vr02-partial-group-collision');

  console.log(`\n  ${emitted.length} pattern artefacts: ${emitted.join(', ')}`);
  console.log(`  collision reported on ${collisions.length} rows`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
