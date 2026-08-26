/**
 * THE DRIFT, WITH BOTH SIDES NAMED (David, 2026-08-26 — R774).
 *
 * The previous artefact said "the other file" nine times and named no file, so the thread could not
 * route — and Cowork, searching its own corpus, correctly found every id family CLEAN. **Both
 * findings were right and they were about different disks.** Every file is now named with its
 * sha256 and its mtime, and the side each belongs to is stated.
 *
 * **And the warning landed: one half is again this store's own export.** Both drifting families
 * pair `~/Downloads/11+/from-cluecrew/*` against `~/Downloads/11+/items/*`.
 */
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const PAIRS = [
  { family: 'ENG-005-BB', a: '/Users/davidb/Downloads/11+/from-cluecrew/eng005-draft.json', b: '/Users/davidb/Downloads/11+/items/eng005-draft.json' },
  { family: 'ENG-007-LP', a: '/Users/davidb/Downloads/11+/from-cluecrew/eng007-draft.json', b: '/Users/davidb/Downloads/11+/items/eng007-draft.json' },
];
const stemOf = (i: { stem?: { text?: string; prompt?: string } }) => (i.stem?.text ?? i.stem?.prompt ?? '').trim();

function describe(path: string) {
  const bytes = readFileSync(path);
  return {
    path: path.replace('/Users/davidb/Downloads/', '~/Downloads/'),
    sha256: sha(bytes),
    bytes: bytes.length,
    lastModified: statSync(path).mtime.toISOString(),
    side: path.includes('from-cluecrew') ? 'THIS STORE — the outbound directory. An export, mirroring the database.' : 'NOT PRODUCED BY THIS STORE.',
  };
}

async function run() {
  assertFixture('named-drift', [
    { name: 'a file in the outbound directory is this store\'s', input: '/x/from-cluecrew/y.json', mustBeCaught: true },
    { name: 'a nested outbound path too', input: '/a/b/from-cluecrew/c/d.json', mustBeCaught: true },
    { name: 'an authored path is not', input: '/Users/x/Downloads/11+/items/y.json', mustBeCaught: false },
    { name: 'a repo content path is not', input: '/repo/content/y.json', mustBeCaught: false },
  ], (p) => p.includes('from-cluecrew'));

  const families = PAIRS.map(({ family, a, b }) => {
    const A = (JSON.parse(readFileSync(a, 'utf8')) as { items: Array<{ itemId: string; stem?: { text?: string; prompt?: string } }> }).items;
    const B = (JSON.parse(readFileSync(b, 'utf8')) as { items: Array<{ itemId: string; stem?: { text?: string; prompt?: string } }> }).items;
    const ma = new Map(A.map((i) => [i.itemId, stemOf(i)]));
    const mb = new Map(B.map((i) => [i.itemId, stemOf(i)]));
    const setA = new Set(ma.values()); const setB = new Set(mb.values());
    const shared = [...setA].filter((s) => setB.has(s));
    const onlyA = [...setA].filter((s) => !setB.has(s));
    const onlyB = [...setB].filter((s) => !setA.has(s));
    const perId = [...new Set([...ma.keys(), ...mb.keys()])].sort().map((id) => ({
      itemId: id,
      inFileA: ma.get(id) ?? null,
      inFileB: mb.get(id) ?? null,
      sameStem: (ma.get(id) ?? null) === (mb.get(id) ?? null),
      thisStemAlsoAppearsInFileBunder: [...mb.entries()].filter(([j, s]) => s === ma.get(id) && j !== id).map(([j]) => j),
      thisStemAlsoAppearsInFileAunder: [...ma.entries()].filter(([j, s]) => s === mb.get(id) && j !== id).map(([j]) => j),
    }));
    return {
      family,
      fileA: describe(a), fileB: describe(b),
      itemsInA: A.length, itemsInB: B.length,
      sharedStems: shared.length, stemsOnlyInA: onlyA, stemsOnlyInB: onlyB,
      perId,
    };
  });

  const dbRows = await prisma.item.findMany({ where: { OR: [{ id: { startsWith: 'ENG-005-BB' } }, { id: { startsWith: 'ENG-007-LP' } }] }, select: { id: true, createdAt: true, status: true }, orderBy: { id: 'asc' } });
  requirePopulation('emit:named-drift', { 'items in the two drifting families': dbRows.length });
  const created = [...new Set(dbRows.map((r) => r.createdAt.toISOString()))];

  const payload = {
    kind: 'numbering-drift-named',
    what: 'The drifting families with BOTH FILES NAMED — path, sha256, size, mtime, and which side each belongs to.',
    WHY_THIS_SUPERSEDES_THE_LAST_ONE: 'the previous artefact said "the other file" nine times and named no file, so the thread could not route. Cowork searched its own corpus and found every id family clean — and that is CORRECT AND COMPATIBLE: there is no id fault on its disk. Both findings were true and they were about different disks.',
    AND_THE_WARNING_LANDED: 'one half is again THIS STORE\'S OWN EXPORT. Both families pair a file in ~/Downloads/11+/from-cluecrew — the outbound directory, mirroring the database — against a file in ~/Downloads/11+/items. Second time in this thread an unnamed pair turned out to have my own export as one side.',
    THE_RECLASSIFICATION: {
      whatICalledIt: 'NUMBERING DRIFT — the same question wearing a different id, nine items, seven of them a consecutive off-by-one run.',
      whatItACTUALLYIS: 'TWO REVISIONS OF THE SAME QUESTION SET. In ENG-005-BB the two files share 8 stems of 12 and differ by FOUR each way. One of the four that exists only on this store\'s side sits at position 02 — "Read lines 6 to 8. Line 8 says the bridge had \'good substantial rails\'…" — and pushes the seven shared questions below it down by one. **The run is a CONSEQUENCE of a replaced question, not an id bookkeeping error.**',
      soTHESINGLEEDIT: 'is not an insertion into a numbering. It is a revision of the SET: four questions swapped out for four others, one of which landed at position 2. Looking for one insertion immediately before BB-02 finds the SYMPTOM — that position is where the divergence first shows, and three more divergences sit below it at 09, 10 and 12.',
      andTheTENUNMATCHED: 'are the same event, exactly as the desk said. They are the FOUR-EACH-WAY tails: stems that exist on one side only, which is why they match no id anywhere. They were never a separate class and are not content faults.',
    },
    THE_DATABASE_SIDE: {
      itemsHeld: dbRows.length,
      allCreatedAt: created,
      meaning: created.length === 1 ? 'every row in both families was created in ONE transaction. The database holds one version faithfully; it did not drift. Whatever chose that version happened upstream of the import.' : 'rows were created across more than one moment.',
      andTheMTIMES: 'the outbound copy of eng005-draft.json is dated ten hours AFTER the items/ copy on the same day. Reported as the weak evidence it is — an mtime survives a copy and is not provenance — but it is the only ordering evidence either side holds.',
    },
    NOT_A_REPAIR: 'nothing was renumbered and no id was changed. Which revision is right is a content question about four replaced questions, not a numbering fix.',
    families,
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['THE_RECLASSIFICATION', 'THE_DATABASE_SIDE', 'families']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('numbering-drift-named', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'numbering-drift-named');
  for (const f of families) console.log(`${f.family}: A=${f.fileA.sha256.slice(0, 16)} B=${f.fileB.sha256.slice(0, 16)} shared ${f.sharedStems}, onlyA ${f.stemsOnlyInA.length}, onlyB ${f.stemsOnlyInB.length}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
