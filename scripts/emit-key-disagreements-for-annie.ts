/**
 * THE COPIES DISAGREE ABOUT WHICH ANSWER IS RIGHT — FOR THE REVIEWER, NOT FOR A DIRECTORY RULING
 * (David, 2026-08-26 — R765).
 *
 * I proposed naming an authoritative directory and unblocking the import on that. **That is the
 * wrong instrument.** Naming a directory decides which FILE wins; it does not decide which ANSWER
 * is right, and on 24 items the two copies disagree about exactly that. A directory ruling would
 * have settled 48 content questions by provenance — picking the answer that happened to sit in the
 * folder somebody named — and the reviewer is the only party who can settle which answer is right.
 *
 * So this emits the readings side by side and lands NOTHING. The 19 reversed executions stay
 * reversed and re-land only under whichever reading she confirms.
 *
 * **The serving row is shown and is NOT A VOTE.** It is what a child meets today, which is a fact
 * she needs and not evidence about which copy is correct.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const SEARCH = [join(REPO, 'content'), '/Users/davidb/Downloads/11+'];
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

interface Opt { content: string; isCorrect: boolean }
type Reading = Record<string, Opt>;               // label -> option
const readings = new Map<string, Map<string, Reading>>(); // itemId -> file -> reading

function walkJson(dir: string, depth = 0): string[] {
  if (depth > 4) return [];
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walkJson(join(dir, e.name), depth + 1) : (e.name.endsWith('.json') ? [join(dir, e.name)] : []));
  } catch { return []; }
}

function collect() {
  for (const file of SEARCH.flatMap((d) => walkJson(d))) {
    let parsed: unknown;
    try { parsed = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
    const items = (parsed as { items?: unknown })?.items;
    if (!Array.isArray(items) || items.length === 0) continue;
    if (!items.every((i) => i && typeof i === 'object' && 'itemId' in i && Array.isArray((i as { options?: unknown }).options))) continue;
    for (const item of items as Array<Record<string, unknown>>) {
      const reading: Reading = {};
      for (const o of item.options as Array<Record<string, unknown>>) {
        if (typeof o?.content !== 'string') continue;
        reading[String(o.label ?? o.content)] = { content: o.content, isCorrect: o.isCorrect === true };
      }
      if (Object.keys(reading).length === 0) continue;
      if (!readings.has(String(item.itemId))) readings.set(String(item.itemId), new Map());
      readings.get(String(item.itemId))!.set(file.replace(`${REPO}/`, '').replace('/Users/davidb/Downloads/', '~/Downloads/'), reading);
    }
  }
}

async function run() {
  assertFixture('key-disagreements', [
    { name: 'two readings differing on isCorrect is a key disagreement', input: JSON.stringify([{ A: { content: 'x', isCorrect: true } }, { A: { content: 'x', isCorrect: false } }]), mustBeCaught: true },
    { name: 'a flip on a later label is still one', input: JSON.stringify([{ B: { content: 'y', isCorrect: false } }, { B: { content: 'y', isCorrect: true } }]), mustBeCaught: true },
    { name: 'differing wording with the same key is NOT one', input: JSON.stringify([{ A: { content: 'x', isCorrect: true } }, { A: { content: 'x2', isCorrect: true } }]), mustBeCaught: false },
    { name: 'identical readings are not a disagreement', input: JSON.stringify([{ A: { content: 'x', isCorrect: true } }, { A: { content: 'x', isCorrect: true } }]), mustBeCaught: false },
  ], (raw) => {
    const rs = JSON.parse(raw) as Reading[];
    const labels = new Set(rs.flatMap((r) => Object.keys(r)));
    return [...labels].some((l) => new Set(rs.filter((r) => r[l]).map((r) => r[l]!.isCorrect)).size > 1);
  });

  collect();
  const multi = [...readings.entries()].filter(([, byFile]) => byFile.size > 1);
  requirePopulation('emit:key-disagreements', { 'items appearing in two or more authored files': multi.length });

  const keyRows: Array<Record<string, unknown>> = [];
  const wordingRows: Array<Record<string, unknown>> = [];

  for (const [itemId, byFile] of multi.sort(([a], [b]) => a.localeCompare(b))) {
    const files = [...byFile.keys()].sort();
    const labels = [...new Set(files.flatMap((f) => Object.keys(byFile.get(f)!)))].sort();
    let keyDisagree = false, wordingDisagree = false;
    const perLabel = labels.map((label) => {
      const perFile = files.map((f) => ({ file: f, ...(byFile.get(f)![label] ?? { content: null, isCorrect: null }) }));
      const corrects = new Set(perFile.filter((x) => x.isCorrect !== null).map((x) => x.isCorrect));
      const contents = new Set(perFile.filter((x) => x.content !== null).map((x) => x.content));
      if (corrects.size > 1) keyDisagree = true;
      if (contents.size > 1) wordingDisagree = true;
      return {
        label,
        DISAGREES_ABOUT_WHICH_IS_CORRECT: corrects.size > 1,
        DISAGREES_ABOUT_WORDING: contents.size > 1,
        eachFileSays: perFile,
      };
    });
    if (!keyDisagree && !wordingDisagree) continue;

    const serving = await prisma.item.findUnique({
      where: { id: itemId },
      select: { status: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionExecution: true } } },
    });
    const servingRow = serving
      ? {
        NOT_A_VOTE: 'what a child meets today. A fact she needs; not evidence about which copy is right.',
        status: serving.status,
        options: serving.options.map((o) => ({
          label: (o.content as Record<string, unknown>).label ?? null,
          value: (o.content as Record<string, unknown>).value ?? null,
          isCorrect: o.isCorrect,
          carriesExecution: o.misconceptionExecution != null,
        })),
      }
      : { NOT_A_VOTE: 'no row with this id exists in this store.', status: null, options: [] };

    const isMine = (f: string) => f.includes('from-cluecrew');
    const whichEachCallsCorrect = Object.fromEntries(files.map((f) => {
      const r = byFile.get(f)!;
      return [f, Object.entries(r).filter(([, o]) => o.isCorrect).map(([l]) => l)];
    }));

    const row = {
      itemId,
      classification: keyDisagree ? 'DISAGREES ABOUT WHICH ANSWER IS RIGHT' : 'DISAGREES ABOUT WORDING ONLY',
      filesCarryingThisItem: files.map((f) => ({ file: f, side: isMine(f) ? 'THIS STORE — an export of the database, not an independent witness' : 'NOT PRODUCED BY THIS STORE' })),
      THE_TWO_SIDES: 'this store (the serving row and its own export, which agree) against the file this store did not produce. The export mirrors the database, so it is ONE party with two faces, not two witnesses.',
      WHICH_EACH_FILE_CALLS_CORRECT: whichEachCallsCorrect,
      perLabel,
      theServingRow: servingRow,
    };
    /**
     * **R759 CAUGHT ME INSIDE THE ARTEFACT THAT REGISTERS IT.** The first version declared the
     * canonical-JSON spec and computed `JSON.stringify(row, Object.keys(row).sort())` — a REPLACER
     * ARRAY, which filters every nested object to the top-level key names and does not sort. The
     * declared spec did not reproduce the digest. Now it is `canonicalJson`, which is the function
     * the spec describes, so the two cannot disagree.
     */
    const digest = digestOverText(
      'this row as canonical JSON — keys sorted at EVERY level, separators (",",":"), ensure_ascii false — with the rowSha256 and rowSha256Spec fields absent',
      canonicalJson(row),
    );
    const withDigest = { ...row, rowSha256: digest.value, rowSha256Spec: digest.spec };
    (keyDisagree ? keyRows : wordingRows).push(withDigest);
  }

  const payload = {
    kind: 'key-disagreements-for-annie',
    what: 'Items carried by two or more authored files whose copies disagree. Both readings side by side, per label, with which each file calls correct.',
    THE_RULING_THIS_SERVES: 'David, 26 August: the key disagreements go to Annie, not to a directory ruling. A disagreement about which answer is right is a content question, and the reviewer is the only party who can settle it. Nothing lands until she rules.',
    WHY_NOT_A_DIRECTORY_RULING: 'I proposed naming an authoritative directory and unblocking the import on it. That decides which FILE wins; it does not decide which ANSWER is right. It would have settled 48 content questions by provenance — picking whichever answer sat in the folder somebody named.',
    AND_A_SECOND_CORRECTION_TO_MY_OWN_FRAMING: {
      whatISaid: 'two files named eng006-draft.json sit in different directories and disagree.',
      whatIsACTUALLYTRUE: 'ONE of those two directories is ~/Downloads/11+/from-cluecrew — THIS STORE\'S OWN OUTBOUND. All 24 key disagreements are the same single pairing: a copy this store exported, against a file this store did not produce. There are not two authoring copies in play; there is this store and one other file.',
      andWHICHSIDETHEDATABASEISON: 'on all 24, the SERVING ROW agrees with this store\'s exported copy and disagrees with the other file — 24 of 24, no exceptions. The export is a faithful mirror of the database, so it is not a third witness.',
      soTheREALSTATEMENT: 'THE DATABASE — and therefore what a child would meet — DISAGREES WITH THE OTHER FILE ABOUT WHICH ANSWER IS RIGHT, ON 24 ITEMS. That is a two-party content disagreement between this store and an authored source, and it is squarely hers. My earlier framing made it sound like a filing problem between two drafts, which would have made a directory ruling look adequate.',
    },
    THE_FIGURE_CORRECTED: {
      asIStatedIt: '48 key disagreements over 36 items',
      correctly: '48 key disagreements over 24 items',
      whatThe36Was: 'items disagreeing about ANYTHING — 24 about which answer is right, 12 about wording only. I attached the wider item count to the narrower pair count. Same shape as the 553: a true number under a label that widened it.',
    },
    THE_COUNTS: {
      itemsInTwoOrMoreAuthoredFiles: multi.length,
      itemsDisagreeingAboutWHICHISCORRECT: keyRows.length,
      itemsDisagreeingAboutWORDINGONLY: wordingRows.length,
      keyDisagreementPairs: keyRows.reduce((n, r) => n + (r.perLabel as Array<{ DISAGREES_ABOUT_WHICH_IS_CORRECT: boolean }>).filter((l) => l.DISAGREES_ABOUT_WHICH_IS_CORRECT).length, 0),
    },
    NOTHING_LANDED: 'this script writes nothing. The 19 reversed misconceptionExecution values stay reversed and re-land only under whichever reading she confirms.',
    ITEMS_DISAGREEING_ABOUT_THE_ANSWER: keyRows,
    ITEMS_DISAGREEING_ABOUT_WORDING_ONLY: wordingRows,
  };

  const artefact = { ...payload, ...findingsDigest(payload, ['THE_COUNTS', 'ITEMS_DISAGREEING_ABOUT_THE_ANSWER', 'ITEMS_DISAGREEING_ABOUT_WORDING_ONLY']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('key-disagreements-for-annie', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'key-disagreements-for-annie');
  console.log(`items in 2+ files ${multi.length} | key disagreements ${keyRows.length} items | wording-only ${wordingRows.length} items`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
