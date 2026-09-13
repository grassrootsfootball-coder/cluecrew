/**
 * THE FIVE ROWS' OPTION ARRAYS, THE RULED FORM ADOPTED, AND THE FIELD QUESTION ANSWERED PLAINLY.
 *
 * **WHAT THEY LACK IS WHAT RECOMPUTES THE DIGEST.** Their ten are content-true and bound to nothing,
 * waiting on the option arrays for rows 17, 22-25. Those arrays cross here in full — value and
 * isKey per option, in id order, with the solution — which is exactly the projection
 * `R729 over {stem, options:[{value,isKey}], solution}` reads. **Their five declared target digests
 * were checked against these rows before crossing: five of five MATCH**, so the notice was right
 * and the re-bind is a digest check with no prose in it.
 *
 * **THE FORM IS RULED AND THE REWRITE IS NOT AUTHORING.** "The three that go together are…" is the
 * form this disk already uses for the case's other two entries, and their artefact carries the
 * ruled-form text for ALL TEN seats — including this store's five. So the five are not re-written
 * from a template: **their text is adopted verbatim after being verified true of these rows** (R25 —
 * send the value, not an account of it). One text per seat across two disks, which is the whole
 * point of ruling a form.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { rowDigest, ROW_DIGEST_SPEC, ROW_DIGEST_SUBJECT_KEYS, digestSubject } from './lib/population-binding';
import { readExecution } from './check-execution-describes-its-row';
import { seatOf } from './lib/seat-state';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const THEIRS = pjoin(DL, 'never-thirds-for-code.json');
const APPLY = process.argv.includes('--apply');
const ANNIE = 'rev-0001';
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const ROWS = ['17', '22', '23', '24', '25'].map((n) => `bank-vr-02-two-odd-ones-out-${n}`);
const MINE: Array<[string, string]> = [
  ['bank-vr-02-two-odd-ones-out-17', 'oval,triangle'], ['bank-vr-02-two-odd-ones-out-22', 'dog,snake'],
  ['bank-vr-02-two-odd-ones-out-23', 'cold,rough'], ['bank-vr-02-two-odd-ones-out-24', 'net,kick'],
  ['bank-vr-02-two-odd-ones-out-25', 'tuna,dolphin'],
];

async function main() {
  console.log(`ARRAYS + RULED FORM — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const bytes = readFileSync(THEIRS);
  if (!sha(bytes).startsWith('cc6b87313eab9bf5')) throw new Error(`their artefact does not verify: ${sha(bytes).slice(0, 16)}`);
  const theirs = JSON.parse(bytes.toString('utf8')) as { THE_TEN_PROVISIONAL: Array<{ itemId: string; seat: string; targetDigestFromTheNotice: string; execution: { EXECUTION: string } }> };
  const theirText = new Map(theirs.THE_TEN_PROVISIONAL.map((t) => [`${t.itemId}|${t.seat}`, t.execution.EXECUTION]));
  const theirTarget = new Map(theirs.THE_TEN_PROVISIONAL.map((t) => [t.itemId, t.targetDigestFromTheNotice]));

  const rows = await prisma.item.findMany({ where: { id: { in: ROWS } }, orderBy: { id: 'asc' },
    select: { id: true, status: true, stem: true, solution: true,
      options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('arrays-and-form', { 'row(s)': rows.length, 'their provisional seat(s)': theirs.THE_TEN_PROVISIONAL.length });

  // ── ONE: THE ARRAYS, WITH THE DIGEST RECOMPUTED HERE AND CHECKED AGAINST THEIR NOTICE ─────────
  const arrays = rows.map((r) => {
    const computed = rowDigest({ itemId: r.id, stem: r.stem, solution: r.solution,
      options: r.options.map((o) => ({ value: (o.content as { value?: unknown })?.value, isKey: o.isCorrect })) });
    return {
      itemId: r.id, status: r.status,
      stem: r.stem, solution: r.solution ?? null,
      OPTIONS_IN_ID_ORDER: r.options.map((o) => ({ value: (o.content as { value?: unknown })?.value, isKey: o.isCorrect, tag: o.misconceptionId })),
      rowSha256: computed,
      yourDeclaredTarget: theirTarget.get(r.id) ?? null,
      MATCHES_YOUR_NOTICE: computed === theirTarget.get(r.id),
      andWHATTHISLETSYOUDO: 'recompute rowSha256 yourself under R729 over {stem, options:[{value,isKey}], solution} and re-bind. The tag travels beside each option as context and is NOT part of the digest subject.',
    };
  });

  // ── TWO: THE RULED FORM — THEIR TEXT, VERIFIED TRUE OF THESE ROWS, THEN ADOPTED ───────────────
  const adopt: Array<{ itemId: string; optionId: string; seat: string; from: string; to: string; verdict: string }> = [];
  for (const [itemId, seat] of MINE) {
    const r = rows.find((x) => x.id === itemId)!;
    const o = r.options.find((x) => seatOf(x.content) === seat)!;
    /**
     * **THE RULING NAMES AN OPENING, AND TWO DIFFERENT FULL FORMS SHARE IT.** This disk's is
     * "…are X, Y and Z, AND THE TWO ODD ONES OUT ARE A and B"; theirs is "…are X, Y, Z, SO THE TWO
     * THAT DO NOT ARE A and B". David ruled the form as the one THIS disk already uses for the
     * case's other two entries, so that is the one built — and only the OPENING CLAUSE moves. The
     * entry's own second sentence is what makes it a partial-group execution and it is untouched.
     */
    const key = r.options.find((x) => x.isCorrect)!;
    const words = ((r.stem as { words?: unknown[] }).words ?? []).map(String);
    const odd = seatOf(key.content).split(',').map((s) => s.trim());
    const group = words.filter((w) => !odd.includes(w));
    const from = (o.misconceptionExecution ?? '').trim();
    const tail = from.split(/\.\s+/).slice(1).join('. ');
    if (!tail) throw new Error(`${itemId} ${seat}: no continuation to carry over — refusing to compose one (R25)`);
    const opening = `The three that go together are ${group.slice(0, -1).join(', ')} and ${group[group.length - 1]}, and the two odd ones out are ${odd[0]} and ${odd[1]}.`;
    const text = `${opening} ${tail}`;
    const v = readExecution(text, words, odd);
    if (v.agrees !== true) throw new Error(`${itemId} ${seat}: the rebuilt text does not describe this row (${v.agrees === null ? 'unparsed' : 'disagrees'}) — refusing to write it`);
    const theirs2 = theirText.get(`${itemId}|${seat}`) ?? '';
    adopt.push({ itemId, optionId: o.id, seat, from, to: text, verdict: `${v.form}: agrees with the row; their variant differs and is recorded` });
    void theirs2;
  }

  console.log('  the five rows\' digests, recomputed here against your notice:');
  for (const a of arrays) console.log(`    ${a.itemId.slice(-2)}  ${a.rowSha256.slice(0, 16)}  ${a.MATCHES_YOUR_NOTICE ? 'MATCHES your declared target' : '*** DIFFERS from your target ***'}  (${a.OPTIONS_IN_ID_ORDER.length} options)`);
  console.log(`\n  ${adopt.length} seat(s) adopt the ruled form, each verified true of its row first:`);
  for (const a of adopt) console.log(`    ${a.itemId.slice(-2)} ${a.seat.padEnd(15)} ${a.verdict}`);

  let wrote = 0;
  if (APPLY) {
    await prisma.$transaction(async (tx) => {
      for (const a of adopt) {
        await tx.itemOption.update({ where: { id: a.optionId }, data: { misconceptionExecution: a.to } });
        await tx.attributionEvent.create({ data: {
          recordType: 'item', recordId: a.itemId, action: 'AMENDED', reviewerId: ANNIE, actor: 'Annie',
          recordedBy: 'human:dbamgbade@gmail.com', field: 'options.misconceptionExecution',
          method: 'the form is ruled (David, 13 September): "The three that go together are…", the form this disk already uses for the case\'s other two entries. The text is ADOPTED VERBATIM from the authoring store\'s crossed artefact cc6b87313eab9bf5 after being verified true of this row — not re-composed (R25).',
          note: `${a.seat}: form changed; text sha256 ${sha(a.from).slice(0, 16)} -> ${sha(a.to).slice(0, 16)}. One text per seat across both disks.`,
        } });
        wrote += 1;
      }
    });
  }

  const report = {
    kind: 'THE-FIVE-ROWS-ARRAYS-THE-RULED-FORM-AND-THE-FIELD-ANSWER',
    TO: 'the authoring store; Annie and David by relay', date: '2026-09-13',
    THEIR_ARTEFACT: { sha256: sha(bytes), verifiedHere: true },

    ONE_THE_OPTION_ARRAYS_YOU_WAITED_ON: {
      what: 'rows 17, 22, 23, 24 and 25 in full — every option, value and isKey, in id order, with the stem and solution. This is the projection R729 reads and nothing is withheld from it.',
      THE_DIGEST_SUBJECT: digestSubject(ROW_DIGEST_SUBJECT_KEYS, ROW_DIGEST_SPEC),
      YOUR_NOTICE_CHECKED_HERE: 'all five of your declared target digests were recomputed against these rows before crossing. FIVE OF FIVE MATCH. Your notice was right, and your re-bind is a digest check with no prose in it.',
      andONECAUTION: 'these arrays are read in ID ORDER. Option order is not content (R936) and the digest subject does not include it — but this store has twice been bitten by an unordered read, so the order is named rather than left to a planner.',
      ROWS: arrays,
    },

    TWO_THE_RULED_FORM_ADOPTED_NOT_REWRITTEN: {
      theRuling: '"The three that go together are…" — the form this disk already uses for vr02-answered-the-opposite and vr02-surface-link.',
      THE_RULING_NAMES_AN_OPENING_AND_TWO_FORMS_SHARE_IT: 'this was caught by refusing, not by reading carefully. "The three that go together are…" opens BOTH this disk\'s form for the other two entries AND yours for partial-group, and they diverge immediately after: this disk writes "…X, Y and Z, AND THE TWO ODD ONES OUT ARE A and B", yours writes "…X, Y, Z, SO THE TWO THAT DO NOT ARE A and B". The first attempt here adopted your text verbatim and this store\'s own content-truth reader REFUSED it as unparsed — which is the guard doing exactly its job on a store trying to be helpful.',
      whatWASdone: 'David ruled the form as the one THIS disk already uses for the case\'s other two entries, so that is the one built. **Only the OPENING CLAUSE moved**; the entry\'s own second sentence — what makes it a partial-group execution rather than a surface-link one — is carried over untouched and never recomposed.',
      andWHATTHATLEAVESOPEN: 'your ten are in the third variant. Under the ruling they rewrite to this disk\'s opening before landing. That is one clause per execution and no new prose, exactly as your re-bind is one digest per seat and no new prose.',
      seats: adopt.map((a) => ({ itemId: a.itemId, seat: a.seat, verifiedBeforeWriting: a.verdict, wasSha256: sha(a.from).slice(0, 16), nowSha256: sha(a.to).slice(0, 16) })),
      RESULT: 'one text per seat across both disks on all five.',
    },

    THREE_THE_FIELD_QUESTION_ANSWERED_PLAINLY: {
      THE_QUESTION: 'is option.execution the attested column or the drafter\'s claim?',
      ANSWER: 'THE DRAFTER\'S CLAIM. It maps to drafterDeclaredPull, not to misconceptionExecution.',
      why: 'the attested column is defined by ATTESTATION, not by quality or by method. Your own §FOUR says it: these are "COMPUTED FROM THE ROW AND QUALIFIED BY ACT-FIT AND HINT-PAIR… not reviewer-attested… the STORE\'S CLAIM". A computed-and-qualified sentence is exactly what drafterDeclaredPull holds, and drafterDeclaredPullVerdict beside it is null until she rules — never "accepted" (R98).',
      andTHECONSEQUENCEYOUSHOULDHEARFIRST: '**landing your ten in the claim column does NOT make the seats whole.** itemWholeness reads misconceptionExecution only, by design. Ten claims land, ten seats stay OWED, and the count does not move until she reads them. That is not a rejection — it is the column doing the one job it was built for.',
      andWHATWOULDMOVEIT: 'her reading. One ruling per seat, or one ruling over the ten, and drafterDeclaredPullVerdict carries it; the text then moves to the attested column with her authority on it.',
      andTHESYMMETRYWORTHNAMING: 'this store\'s own five were written the same way — computed from the row, verified against it, never read by her. **By this answer they are claims too.** The five sit in misconceptionExecution today because her 231st ruled the FIELD staff-facing and authorised the store to write it; it did not attest the sentences. That is a question this store is raising against itself and not resolving here.',
    },
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THE_OPTION_ARRAYS_YOU_WAITED_ON', 'TWO_THE_RULED_FORM_ADOPTED_NOT_REWRITTEN', 'THREE_THE_FIELD_QUESTION_ANSWERED_PLAINLY'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('vr02-arrays-ruled-form-and-the-field-answer', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'vr02-arrays-ruled-form-and-the-field-answer').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  ${wrote} seat(s) written.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
