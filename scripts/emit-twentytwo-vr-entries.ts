/**
 * PHASE TWO SUPPLIES FROM THIS SIDE (David on her 143rd, 2026-08-24 — R700): the VR library is
 * the serving store's, so the twenty-one unattested entries cross for Annie's reading — with
 * vr03-same-topic as the twenty-second, marked attested, a known member to judge against.
 *
 * The two questions her sitting two made urgent are answered ON THE ARTEFACT from the entries
 * and rows this store holds — both halves, one desk.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const FIDS = '/Users/davidb/Downloads/twenty-one-tag-ids-for-code.json';
const SHAIDS = 'ae988f654f6beece1690af1b6d11322ea47c83b87e292feab980ac2ee9f3b2a3';
const AUTH = 'annie-143-for-code.md, sha256 f52bff35dab9f023e85971931af15ae390bad2801953e4a944f03b6d8e156fa4; ids from twenty-one-tag-ids-for-code.json';

async function run() {
  const bytes = readFileSync(FIDS);
  if (sha256(bytes) !== SHAIDS) throw new Error(`REFUSED — the id file reads ${sha256(bytes)}, declared ${SHAIDS}`);
  const idFile = JSON.parse(bytes.toString('utf8')) as { tagIds: string[]; theAttestedOne: string };
  const allIds = [...idFile.tagIds, idFile.theAttestedOne];
  if (allIds.length !== 22) throw new Error(`REFUSED — expected 22 ids, found ${allIds.length}`);

  const entries = await prisma.misconception.findMany({
    where: { id: { in: allIds } },
    select: { id: true, description: true, childHint: true, status: true, approvedBy: true, textProvenance: true },
    orderBy: { id: 'asc' },
  });
  if (entries.length !== 22) {
    const held = new Set(entries.map((e) => e.id));
    throw new Error(`REFUSED — ${allIds.filter((i) => !held.has(i)).join(', ')} resolve to no entry here; the desk finding said all 22 exist`);
  }
  // Carriage: the DRAFT unsigned rows carrying each tag, by id.
  const carriers = await prisma.item.findMany({
    where: { status: 'DRAFT', reviewedBy: null, options: { some: { misconceptionId: { in: allIds } } } },
    select: { id: true, options: { select: { misconceptionId: true } } },
    orderBy: { id: 'asc' },
  });
  const rowsByTag = new Map<string, string[]>();
  for (const c of carriers) for (const o of c.options) {
    if (o.misconceptionId && allIds.includes(o.misconceptionId)) {
      const list = rowsByTag.get(o.misconceptionId) ?? [];
      if (!list.includes(c.id)) list.push(c.id);
      rowsByTag.set(o.misconceptionId, list);
    }
  }

  const entryRows = entries.map((e) => ({
    id: e.id,
    attested: e.id === idFile.theAttestedOne
      ? 'ATTESTED — the known member: signed in the VR drain (reviewer:rev-0001), read beside the twenty-one'
      : 'UNATTESTED — text never read by the reviewer',
    approvalState: { status: e.status, approvedBy: e.approvedBy, provenance: (e.textProvenance as Record<string, unknown> | null)?.state ?? 'UNKNOWN' },
    description: e.description,
    childHint: e.childHint,
    rowsCarrying: rowsByTag.get(e.id) ?? [],
    carrierCount: (rowsByTag.get(e.id) ?? []).length,
  }));

  // ---- The two questions, answered from the entries and rows ----
  const surfaceLink = entries.find((e) => e.id === 'vr02-surface-link')!;
  const tier3 = await prisma.item.findMany({
    where: { questionTypeId: 'vr-02-two-odd-ones-out', difficultyTier: 3 },
    select: { id: true, stem: true, options: { select: { content: true, misconceptionId: true } } },
    orderBy: { id: 'asc' },
  });
  const tier3SurfaceRows = tier3.map((r) => ({
    id: r.id,
    words: (r.stem as { words?: string[] }).words,
    surfaceLinkOption: r.options.filter((o) => o.misconceptionId === 'vr02-surface-link').map((o) => (o.content as { value?: unknown }).value),
  })).filter((r) => r.surfaceLinkOption.length > 0);

  const answers = {
    questionOne: {
      question: "Does vr02-surface-link's definition cover semantic-surface pulls, or only shared initial sounds?",
      theEntrysOwnText: `description: "${surfaceLink.description}" — childHint: "${surfaceLink.childHint}"`,
      answer: 'NEITHER reading she offered, exactly: the definition is "grouped by LOOK OR SOUND instead of meaning" — wider than initial sounds (look is covered too), but it is about the FORM OF THE WORDS. It does NOT cover semantic-surface pulls: trumpet-balloon (both blown) and knife-thorn (both pierce) share no look and no sound — their pull is an ASSOCIATION OF MEANING, which is precisely what the entry\'s own text excludes ("instead of meaning"). On the entry as written, the two deferred assignments are LOOSE.',
    },
    questionTwo: {
      question: "Where an entry's text does not support a tier-three assignment, say so.",
      answer: `ALL FIVE tier-three vr-02 surface-link assignments fail the entry's text, not just her two: every tier-three pull is semantic (blown, pierces, gives-light, pourable-liquid, and the -15 pair), and none is a look-or-sound-of-the-word pull. The entry as written supports the tier-one/two assignments (pear-plum, bear-blue — initial sounds) and none of tier three. Either the entry's definition widens by her authoring, or the five rows retag — her ruling, both halves now in front of her.`,
      rows: tier3SurfaceRows,
    },
    observedInPassing: 'vr02-surface-link\'s own childHint carries a shouted MEAN — noted for her reading, not amended; the wording crosses verbatim and the ruling is hers.',
  };

  const artefact = {
    kind: 'twentytwo-vr-entries-for-annie',
    what: 'Phase two supplied from the serving side: the twenty-one unattested VR entries with vr03-same-topic as the attested twenty-second, each with description, child hint, approval state and the rows carrying it — plus the two answers her sitting two made urgent, from the entries and rows this store holds.',
    authority: AUTH,
    deskFindingConfirmed: 'all 22 ids resolve to entries on this side (asserted before emission); the authoring store holds none of them — the VR library is the serving store\'s.',
    wiw12: 'ARMED, NOT RUN: the WIW-12 pair lands when Cowork\'s twenty-five cross; the gate refuses as designed and NAMES where the boundary falls; her 143rd rules both branches (trim to the line-30 portion where the pull survives whole; widen the form to a span where the boundary cuts the pull) — the branch selects itself on the gate\'s naming.',
    entries: entryRows,
    answers,
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('twentytwo-vr-entries-for-annie', sha256(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'twentytwo-vr-entries-for-annie');
  console.log(`entries: ${entryRows.length}; tier-3 surface-link rows examined: ${tier3SurfaceRows.length}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
