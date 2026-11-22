/**
 * TWENTY-FIVE OF YOUR SIXTY ARE ALREADY FIXED HERE (David's instruction, 2026-09-02).
 *
 * The authoring store held all 25 `vr19-shared-letter-miss` seats as tag misfits: the entry's act
 * presupposes a repeated letter and not one of its words has one. **That is correct about the
 * bytes it read** — it is entry-bound against `bb6be0d3`, whose coded words are the
 * pre-regeneration set. This store's rows carry the post-regeneration set her 203rd accepted, and
 * every one of those words repeats a letter.
 *
 * **So those 25 need no ruling. They need executions authored against the CURRENT words.** Only
 * this store can see it, because only this store holds the rows; the batch could declare its
 * binding and could not know ours. The evidence crosses whole — both word lists, the repeat test
 * run on each, and the current key and carriers per row — so the authoring can start from bytes
 * rather than from this sentence.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const DICT = '/usr/share/dict/web2';
const W = new Set(readFileSync(DICT, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
const isWord = (s: string) => W.has(String(s).trim().toLowerCase());
const repeats = (w: string) => [...w].some((c, i) => w.indexOf(c) !== i);

async function main() {
  const batchBytes = readFileSync(pjoin(DL, 'executions-batch-one-for-code.json'));
  const batch = JSON.parse(batchBytes.toString('utf8')) as Record<string, unknown>;
  const holds = Object.values((batch.TWO_WHAT_AUTHORED_AND_WHAT_HELD as { holds: Record<string, Array<Record<string, string>>> }).holds).flat();
  const theirs = holds.filter((h) => h.entryId === 'vr19-shared-letter-miss');

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-19-word-number-codes' }, orderBy: { id: 'asc' },
    select: { id: true, stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('vr19-already-fixed', { 'seat(s) they held': theirs.length, 'vr-19 row(s) here': rows.length });

  const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '');
  const perRow = rows.map((r) => {
    const word = String((r.stem as { prompt?: string }).prompt ?? '').match(/code for ([A-Z]+)/)?.[1] ?? '';
    const key = r.options.find((o) => o.isCorrect);
    const seat = r.options.find((o) => o.misconceptionId === 'vr19-shared-letter-miss');
    const theirHold = theirs.find((h) => h.itemId === r.id);
    const gate = seat ? checkTagWrite({ misconceptionId: 'vr19-shared-letter-miss', stem: r.stem as Record<string, unknown>, keyValue: val(key!), optionValue: val(seat) }, isWord) : null;
    return {
      itemId: r.id,
      theWordNOW: word, itRepeatsALetter: repeats(word),
      theWordTHEYREAD: theirHold ? (theirHold.why!.match(/\b([A-Z]{3,})\b/)?.[1] ?? 'see their hold') : 'not held by them',
      theKeyNOW: val(key!),
      theSeat: seat ? val(seat) : null,
      seatCarriesAnExecutionAlready: !!seat?.misconceptionExecution,
      THE_TAG_GATE_ON_THE_CURRENT_ROW: gate ? gate.verdict : 'no seat carries this entry',
      whyItFits: gate?.why ?? null,
    };
  });

  const nowFits = perRow.filter((p) => p.THE_TAG_GATE_ON_THE_CURRENT_ROW === 'PERFORMS').length;
  const stillNeedExecutions = perRow.filter((p) => p.THE_TAG_GATE_ON_THE_CURRENT_ROW === 'PERFORMS' && !p.seatCarriesAnExecutionAlready).length;

  const report = {
    kind: 'TWENTY-FIVE-OF-YOUR-SIXTY-ARE-ALREADY-FIXED-HERE',
    TO: 'the authoring store; David and Annie by relay',
    date: '2026-09-02',
    YOUR_HOLD_WAS_CORRECT_ABOUT_THE_BYTES_YOU_READ: 'you held all 25 vr19-shared-letter-miss seats because the act presupposes a repeated letter and none of the words you read has one — TAP, PAT, TIP, PIT, SIP, SAT, TAPS, PAST. On bb6be0d3 that is exactly right, and nothing here contradicts it.',
    AND_THE_ROWS_HAVE_MOVED_SINCE: {
      what: 'vr-19 was regenerated so that every coded word repeats a letter — proposed by this store, accepted by her 203rd at the regeneration artefact\'s own digest, and landed before this batch was authored.',
      theWordsNOW: perRow.map((p) => p.theWordNOW),
      allOfThemRepeatALetter: perRow.every((p) => p.itRepeatsALetter),
      theWordsYOUREAD: 'the pre-regeneration set, 0 of which repeat',
    },
    SO_WHAT_YOUR_TWENTY_FIVE_NEED: {
      NOT: 'a tag ruling. The tag now fits: the act it names is performable on every one of these rows.',
      BUT: 'executions authored against the CURRENT words. The seats are empty and the entry is sound on them.',
      tagGateOnCurrentRows: `${nowFits} of ${rows.length} PERFORM`,
      seatsStillNeedingAnExecution: stillNeedExecutions,
    },
    AND_THE_SAME_STALENESS_COST_THE_BATCH_ITS_VR19_EXECUTIONS: 'all 25 vr-19 executions in batch one were refused at this store\'s landing door. Each carries a rowSha256 over the bytes it was authored against; none matches these rows. They describe TAP coding to 146 where the row now asks for PIPS. Re-author them against the words below and they land.',
    THE_ROWS_IN_FULL: perRow,
    andHOWTOAVOIDTHISNEXTTIME: 'the population digest is the guard that worked. Binding to bb6be0d3 was right; what neither store had was a way to know bb6be0d3 had been superseded for one case. A regeneration that lands should cross its own supersession of the population it replaces, and this store owes that.',
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['THE_ROWS_IN_FULL', 'AND_THE_ROWS_HAVE_MOVED_SINCE', 'SO_WHAT_YOUR_TWENTY_FIVE_NEED'];
  Object.assign(clean, findingsDigest(clean, keys));
  const p = pjoin(REPO, 'content/exports', stampedName('vr19-already-fixed-here', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  // THE BLOCK GOES IN BEFORE DELIVERY, so the restamp names bytes that already contain it.
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const landed = deliver(p, 'vr19-already-fixed-here');
  const name = landed.split('/').pop()!;
  const finalSha = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${finalSha}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  console.log(`  their 25 held on words that repeat no letter; here ${nowFits} of ${rows.length} PERFORM the tag`);
  console.log(`  seats still needing an execution: ${stillNeedExecutions}`);
  console.log(`  crossed: ${name}`);
  console.log(`  FILE digest ${finalSha.slice(0, 16)} | FINDINGS digest ${String(clean.findingsSha256).slice(0, 16)} — both named inside the artefact`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
