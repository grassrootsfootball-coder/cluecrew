/**
 * HER HUNDRED-AND-SEVENTY-SECOND: nine positions ruled — five decided, four BOTH.
 *
 * **THIS WRITES REVIEWED-CHANNEL CONTENT FROM A HUMAN RULING (R63), so it carries no derived-write
 * guard and does carry provenance**: every value written was authored by a person and selected by
 * the reviewer; no derivation function computed any of it.
 *
 * Her scope line is landed as ruled: **BOTH means neither is unfit, not that both must serve in one
 * set.** Both land. Neither is dropped for length here — a set that must lose a question loses it
 * as a recorded product decision and never as a quality verdict, and no such decision is taken by
 * this script.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const SHA172 = 'd8350f9fd72ac50681c2354afec50208c0856319ddb0d46aca7b730e51997c12';
const DAVID = 'human:david';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const MINE005 = '/Users/davidb/Downloads/11+/from-cluecrew/eng005-draft.json';
const OTHER005 = '/Users/davidb/Downloads/11+/items/eng005-draft.json';
const MINE007 = '/Users/davidb/Downloads/11+/from-cluecrew/eng007-draft.json';
const OTHER007 = '/Users/davidb/Downloads/11+/items/eng007-draft.json';

interface Src { itemId: string; questionTypeId: string; difficultyTier: number; stem: Record<string, unknown>; explanation?: Record<string, unknown>; options: Array<{ label?: string; content: string; isCorrect?: boolean; misconceptionId?: string }>; notes?: string; tierRationale?: string; sourcedFrom?: string; lineRefs?: unknown; passageRef?: string }
const load = (f: string) => new Map((JSON.parse(readFileSync(f, 'utf8')) as { items: Src[] }).items.map((i) => [i.itemId, i]));

/**
 * HER NINE, EACH NAMED BY THE VERDICT SHE WROTE AND RESOLVED THROUGH THE UNBLINDING MAP.
 * `takeFrom`/`takeId` is the version she chose; `dbId` is the row it lands on (or null = a new id).
 */
const PLAN = [
  { key: 'BB:bridge-inference', verdict: 'version one', file: MINE005, takeId: 'ENG-005-BB-09', dbId: 'ENG-005-BB-09', action: 'ALREADY HER CHOICE' },
  { key: 'BB:darker-and-stiller', verdict: 'version one', file: MINE005, takeId: 'ENG-005-BB-10', dbId: 'ENG-005-BB-10', action: 'ALREADY HER CHOICE' },
  { key: 'BB:narrator-understanding', verdict: 'version two', file: OTHER005, takeId: 'ENG-005-BB-12', dbId: 'ENG-005-BB-12', action: 'REPLACE' },
  { key: 'BB:substantial-and-stir', verdict: 'BOTH', file: OTHER005, takeId: 'ENG-005-BB-09', dbId: null, newId: 'ENG-005-BB-13', action: 'ADD (the second of a BOTH pair)', pairedWith: 'ENG-005-BB-02' },
  { key: 'LP:cardigan-and-jumper', verdict: 'version two', file: MINE007, takeId: 'ENG-007-LP-06', dbId: 'ENG-007-LP-06', action: 'ALREADY HER CHOICE' },
  { key: 'LP:trials-sheet', verdict: 'version one', file: OTHER007, takeId: 'ENG-007-LP-10', dbId: 'ENG-007-LP-08', action: 'REPLACE' },
  { key: 'LP:cardigan-returns-and-ilya-deflections', verdict: 'BOTH', file: OTHER007, takeId: 'ENG-007-LP-02', dbId: null, newId: 'ENG-007-LP-13', action: 'ADD (the second of a BOTH pair)', pairedWith: 'ENG-007-LP-02' },
  { key: 'LP:claim-and-layer', verdict: 'BOTH', file: OTHER007, takeId: 'ENG-007-LP-06', dbId: null, newId: 'ENG-007-LP-14', action: 'ADD (the second of a BOTH pair)', pairedWith: 'ENG-007-LP-10' },
  { key: 'LP:jumper-and-annexe-retrieval', verdict: 'BOTH', file: OTHER007, takeId: 'ENG-007-LP-07', dbId: null, newId: 'ENG-007-LP-15', action: 'ADD (the second of a BOTH pair)', pairedWith: 'ENG-007-LP-09' },
] as const;

async function run() {
  assertFixture('annie-172', [
    { name: 'a REPLACE position changes a row', input: 'REPLACE', mustBeCaught: true },
    { name: 'an ADD position creates a row', input: 'ADD (the second of a BOTH pair)', mustBeCaught: true },
    { name: 'a position already on her choice changes nothing', input: 'ALREADY HER CHOICE', mustBeCaught: false },
    { name: 'an unrecognised action changes nothing', input: 'SOMETHING ELSE', mustBeCaught: false },
  ], (a) => a === 'REPLACE' || a.startsWith('ADD'));

  const src = { [MINE005]: load(MINE005), [OTHER005]: load(OTHER005), [MINE007]: load(MINE007), [OTHER007]: load(OTHER007) } as Record<string, Map<string, Src>>;
  requirePopulation('land:annie-172', { 'ruled positions': PLAN.length });

  // ---- preflight: every misconceptionId the chosen versions carry must already exist ----
  const needed = new Set<string>();
  for (const p of PLAN) if (p.action !== 'ALREADY HER CHOICE') for (const o of src[p.file]!.get(p.takeId)!.options) if (o.misconceptionId) needed.add(o.misconceptionId);
  const have = new Set((await prisma.misconception.findMany({ where: { id: { in: [...needed] } }, select: { id: true } })).map((m) => m.id));
  const missingTags = [...needed].filter((m) => !have.has(m));
  // ---- preflight: no new id may collide ----
  const newIds = PLAN.filter((p) => 'newId' in p).map((p) => (p as { newId: string }).newId);
  const collisions = (await prisma.item.findMany({ where: { id: { in: newIds } }, select: { id: true } })).map((i) => i.id);
  if (missingTags.length || collisions.length) {
    console.error(`PREFLIGHT REFUSES — missing misconceptions: ${missingTags.join(', ') || 'none'}; id collisions: ${collisions.join(', ') || 'none'}`);
    process.exit(1);
  }

  const rows: Array<Record<string, unknown>> = [];
  for (const p of PLAN) {
    const chosen = src[p.file]!.get(p.takeId)!;
    const targetId = p.dbId ?? (p as { newId: string }).newId;
    const prior = await prisma.item.findUnique({ where: { id: targetId }, select: { id: true, stem: true, options: { select: { content: true, isCorrect: true } } } });
    const priorStem = prior ? String((prior.stem as { text?: string }).text ?? '') : null;

    const gatable = {
      id: targetId, stem: chosen.stem, explanation: chosen.explanation ?? {},
      options: chosen.options.map((o) => ({ content: { value: o.content, ...(o.label ? { label: o.label } : {}) } })),
    };
    const faults = checkItemChildFacing(gatable);

    const row: Record<string, unknown> = {
      position: p.key, herVerdict: p.verdict, action: p.action, targetId,
      chosenStem: String(chosen.stem.text ?? ''),
      priorStemOnTheRow: priorStem,
      ASSERTION_theRowChangesOnlyIfHerVerdictDiffersFromIt: p.action === 'ALREADY HER CHOICE'
        ? { unchanged: true, checked: priorStem === String(chosen.stem.text ?? ''), meaning: 'the database already held the version she chose; nothing is written for this position.' }
        : { unchanged: false, priorStemDiffersFromChosen: priorStem !== String(chosen.stem.text ?? '') },
      gateFaults: faults.length ? faults.map((f) => `${f.where} — ${f.rule}: ${f.detail}`) : 'CLEAN',
      ...( 'pairedWith' in p ? { BOTH_pairedWith: (p as { pairedWith: string }).pairedWith, scopeLine: 'BOTH means neither is unfit. It does not mean both must serve in one set — that is a product decision and is not taken here.' } : {}),
    };
    /**
     * **A GATE FAULT IN THE AUTHORED SOURCE HOLDS THE POSITION; IT DOES NOT FAIL THE LANDING**
     * (R781). The fault is not introduced by her ruling and not introduced by this write — it is in
     * the authored item as it stands, and the same class was already CORRECTED on this store's rows
     * (ENG-007-LP-03 carries `quotes: ["perished"]` with `_previousQuotes` retaining the longer
     * span). Failing the whole run would hold eight sound positions behind one authoring fix, and
     * inventing the correction here would author content this store does not author.
     */
    const held = faults.length > 0;
    row.HELD = held ? { why: 'the version she chose carries a gate fault in its authored source — not introduced by her ruling and not by this write.', faults: faults.map((f) => `${f.rule}: ${f.detail}`), whoFixesIt: 'Cowork authors item content; this store does not invent the correction. The precedent is on this store\'s own rows: ENG-007-LP-03 declares quotes ["perished"] where the source declared the whole clause, with _previousQuotes retaining it.' } : false;
    rows.push(row);

    if (APPLY && !held && p.action !== 'ALREADY HER CHOICE') {
      // `questionTypeId` is a relation on this model and cannot be set as a scalar on update.
      // Both versions of every position share a question type, so it is asserted rather than written.
      if (prior) {
        const t = await prisma.item.findUnique({ where: { id: targetId }, select: { questionTypeId: true } });
        if (t && t.questionTypeId !== chosen.questionTypeId) { console.error(`REFUSING ${targetId}: question type would change ${t.questionTypeId} → ${chosen.questionTypeId}`); process.exit(1); }
      }
      const data = {
        difficultyTier: chosen.difficultyTier,
        stem: chosen.stem as object, explanation: (chosen.explanation ?? {}) as object,
        // passageRef lives inside the stem JSON on this model, not as a column — carried by stem.
        ...(chosen.sourcedFrom ? { sourcedFrom: chosen.sourcedFrom } : {}),
        ...(chosen.tierRationale ? { tierRationale: chosen.tierRationale } : {}),
      };
      await prisma.$transaction(async (tx) => {
        if (prior) {
          await tx.item.update({ where: { id: targetId }, data });
          await tx.itemOption.deleteMany({ where: { itemId: targetId } });
        } else {
          await tx.item.create({ data: { id: targetId, status: 'DRAFT', authoredBy: `annie-172 via ${DAVID}`, questionType: { connect: { id: chosen.questionTypeId } }, ...data } });
        }
        await tx.itemOption.createMany({
          data: chosen.options.map((o) => ({
            itemId: targetId,
            content: { value: o.content, ...(o.label ? { label: o.label } : {}) },
            isCorrect: o.isCorrect === true,
            misconceptionId: o.misconceptionId ?? null,
          })),
        });
        await tx.attributionEvent.create({ data: {
          recordType: 'item', recordId: targetId, // AUTHORED, not CREATED: the enum has no CREATED, and AUTHORED is the truer word — the
          // content is hers by selection, arriving on a new id rather than amending an old one.
          action: p.action === 'REPLACE' ? 'AMENDED' : 'AUTHORED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID,
          field: 'stem+options',
          method: `her 172nd (${SHA172.slice(0, 16)}): ${p.key} → ${p.verdict}`,
          note: p.verdict === 'BOTH' ? `BOTH: neither version unfit; this is the second id of the pair with ${(p as { pairedWith: string }).pairedWith}. Not dropped for length — that would be a product decision, recorded as such.` : `prior stem on the row: ${priorStem ?? '(no row)'}`,
        } });
      });
    }
  }

  const changed = rows.filter((r) => r.action !== 'ALREADY HER CHOICE' && !r.HELD);
  const heldRows = rows.filter((r) => r.HELD);
  const manifest = rows.map((r) => `${r.position}\t${r.herVerdict}\t${r.action}\t${r.targetId}`);
  const md = digestOverText('the LANDING_MANIFEST lines joined by \\n, no trailing newline, each "<position>\\t<verdict>\\t<action>\\t<targetId>"', manifest.join('\n'));
  const payload = {
    kind: 'annie-172-landing',
    herReturn: { sha256: SHA172, verdicts: '4 BOTH, 3 to version one, 2 to version two' },
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_LEAKS_NON_OPERATION: {
      whatWasDisclosed: 'under R780 the artefact carried a recorded reason naming what it replaced, which could indicate which version came later. The blind was disclosed rather than repaired, and the evidence was left in.',
      whatSheREPORTS: '"The order leak never operated: I did not read the recorded reasons. The stems and options settled all nine, so the fact you could not blind away is a fact I did not use, and every verdict below rests on material the blinding covered."',
      soTHERULESFIRSTLIVETEST: 'R780 passed. Disclosing the leak and keeping the evidence cost nothing: the reader did not use the disclosed evidence, and had it been removed instead, nine verdicts would have been made on a set of material chosen by the blinding rather than by the question.',
      andTHELIMIT: 'one reader, one sitting, nine positions. That the leak did not operate here is not a general claim that disclosure is free — it is one instance, and it is the only kind of evidence this rule can ever accumulate.',
      andSHERESERVEDONETHING: 'she noted that if the reasons say something the texts do not, that is a separate reading she will take separately. The reasons are therefore NOT settled by these verdicts.',
    },
    THE_SCOPE_LINE_AS_LANDED: 'BOTH means neither is unfit. Both land, each on its own id. Neither is dropped for length by this script — ENG-005-BB goes to 13 questions and ENG-007-LP to 15, and trimming either is a PRODUCT decision to be recorded as such, never a quality verdict.',
    THE_ID_CONVENTION: {
      what: 'the second item of each BOTH pair takes the next free id in its family: ENG-005-BB-13, ENG-007-LP-13/14/15.',
      whyNotTheOtherVERSIONSid: 'the two versions use the same ids for different questions — the other version\'s ENG-007-LP-07 is the navy-jumper retrieval while this store\'s LP-07 is a SHARED question. Reusing them would collide and silently overwrite a question nobody ruled on.',
      andITISMECHANICAL: 'an id assignment, not a content decision. Flagged so it can be overruled cheaply; nothing downstream depends on the numbers being contiguous.',
    },
    counts: { positions: rows.length, alreadyHerChoice: rows.filter((r) => r.action === 'ALREADY HER CHOICE').length, replaced: rows.filter((r) => r.action === 'REPLACE' && !r.HELD).length, added: rows.filter((r) => String(r.action).startsWith('ADD') && !r.HELD).length, HELD: heldRows.length },
    THE_HELD_POSITION: heldRows.length === 0 ? 'none' : {
      count: heldRows.length,
      rows: heldRows.map((r) => ({ position: r.position, targetId: r.targetId, faults: (r.HELD as { faults: string[] }).faults })),
      why: 'the version she chose carries a pre-existing gate fault in its authored source. Her verdict stands and is not in question; the item cannot land until the declaration is corrected, and correcting it is authoring, which this store does not do.',
      andTHEBASELINE: 'measured before concluding (R149): eng007 items/ has 4 faulting items of 12 and the outbound copy 2 of 12, while every one of the 24 DATABASE rows in both families gates CLEAN — because this class was already corrected on the rows and the correction never went back to either file.',
      soITISNOTHERRULING: 'eight positions land; one waits on an authoring fix that predates the return.',
    },
    LANDING_MANIFEST: manifest, landingManifestSha256: md.value, landingManifestSha256Spec: md.spec,
    rows,
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['THE_LEAKS_NON_OPERATION', 'counts', 'LANDING_MANIFEST', 'rows']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('annie-172-landing', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'annie-172-landing');
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — positions ${rows.length}: ${payload.counts.alreadyHerChoice} already hers, ${payload.counts.replaced} replaced, ${payload.counts.added} added, ${payload.counts.HELD} HELD`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
