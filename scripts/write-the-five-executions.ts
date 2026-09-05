/**
 * THE FIVE EXECUTIONS, WRITTEN FROM THE TEMPLATE TWENTY ROWS ALREADY CARRY (her 231st).
 *
 * **HER CONDITIONAL, AND THE CONDITION WAS CHECKED BEFORE THIS RAN.** *"Name the surfaces that
 * render misconceptionExecution. If any child-facing surface renders it, it holds for me. If none
 * does, the store writes the five."* The query returned NONE — three staff surfaces name the field
 * (two admin review tables and one e2e sweep that logs rather than renders), and both child paths
 * load every option column and project it away. `check:execution-not-child-facing` now asserts it,
 * because the fact licenses a store to write and a fact that licenses writing is the worst kind to
 * leave unasserted (R180).
 *
 * **THE SENTENCE IS COMPUTED, NOT COMPOSED.** The template is lifted from a row that already
 * carries it — not retyped — and every blank is filled from the row's own words. If the template
 * cannot be read from a sibling row, this refuses rather than inventing one.
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
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:dbamgbade@gmail.com';
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

async function main() {
  console.log(`WRITE THE FIVE — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const d231 = sha(readFileSync(pjoin(DL, 'annie-231-for-code.md')));
  if (!d231.startsWith('728a4fe81ebb9360')) throw new Error(`the 231st does not verify: ${d231.slice(0, 16)}`);

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, reviewedBy: true, stem: true,
      options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('write-the-five', { 'vr-02 row(s)': rows.length });

  const refusals: string[] = [];
  const assertions: Array<{ assertion: string; result: string; passed: boolean }> = [];
  const assert = (n: string, ok: boolean, r: string) => { assertions.push({ assertion: n, result: r, passed: ok }); if (!ok) refusals.push(`${n} — ${r}`); };
  const val = (o: { content: unknown }) => { const v = (o.content as { value?: unknown })?.value; return Array.isArray(v) ? v.map(String) : String(v).split(',').map((s) => s.trim()); };

  /** THE TEMPLATE, READ FROM A ROW THAT CARRIES IT — never retyped (R25: send the value). */
  const donor = (() => {
    for (const r of rows) for (const o of r.options) {
      if (o.misconceptionId !== 'vr02-partial-group' || !(o.misconceptionExecution ?? '').trim()) continue;
      const key = r.options.find((x) => x.isCorrect)!;
      const words = ((r.stem as { words?: unknown[] }).words ?? []).map(String);
      const odd = val(key); const seat = val(o);
      return { itemId: r.id, text: o.misconceptionExecution!, words, odd,
        group: words.filter((w) => !odd.includes(w)), oddInSeat: seat.filter((w) => odd.includes(w))[0]!, memberInSeat: seat.filter((w) => !odd.includes(w))[0]! };
    }
    return null;
  })();
  assert('a sibling row carries the template, so it is lifted rather than invented', donor !== null,
    donor ? `read from ${donor.itemId}` : 'NO row carries a vr02-partial-group execution — refusing to compose one');
  if (!donor) { console.log(refusals.join('\n')); return; }

  /** Rebuild the donor's own sentence from its own facts. If that does not reproduce it, the
   *  template has been read wrongly and every sentence built from it would be wrong too. */
  const build = (group: string[], odd: string[], oddInSeat: string, memberInSeat: string) =>
    `The group of three is ${list(group)}, so the two odd ones out are ${list(odd)}. `
    + `This option starts from ${oddInSeat}, which is genuinely one of the odd pair, and then takes ${memberInSeat} to go with it — `
    + `but ${memberInSeat} is one of the three that belong together. Only one of these two words sits outside the group.`;
  const rebuilt = build(donor.group, donor.odd, donor.oddInSeat, donor.memberInSeat);
  assert('the template reproduces the donor row\'s own execution exactly', rebuilt === donor.text.trim(),
    rebuilt === donor.text.trim() ? 'byte-identical' : `MISMATCH\n      donor:    ${donor.text}\n      rebuilt:  ${rebuilt}`);

  const gaps: Array<{ itemId: string; optionId: string; seat: string; text: string }> = [];
  for (const r of rows) {
    const key = r.options.find((o) => o.isCorrect);
    if (!key) continue;
    const words = ((r.stem as { words?: unknown[] }).words ?? []).map(String);
    const odd = val(key);
    for (const o of r.options.filter((x) => x.misconceptionId && !(x.misconceptionExecution ?? '').trim())) {
      const seat = val(o);
      const oddInSeat = seat.filter((w) => odd.includes(w));
      const memberInSeat = seat.filter((w) => !odd.includes(w));
      const gate = checkTagWrite({ stem: r.stem as Record<string, unknown>, optionValue: seat.join(','), keyValue: odd.join(','), misconceptionId: o.misconceptionId! }, () => false);
      assert(`${r.id} ${seat.join(',')}: the tag performs, so the sentence describes an act the seat executes`,
        gate.verdict === 'PERFORMS', `${gate.verdict} — ${gate.why}`);
      assert(`${r.id} ${seat.join(',')}: exactly one odd word and one group member, as the template assumes`,
        oddInSeat.length === 1 && memberInSeat.length === 1, `${oddInSeat.length} odd, ${memberInSeat.length} group`);
      if (oddInSeat.length !== 1 || memberInSeat.length !== 1) continue;
      assert(`${r.id}: the seat names the odd word FIRST, which is what "starts from" means`,
        seat[0] === oddInSeat[0], `seat reads ${seat.join(',')}, odd word is ${oddInSeat[0]}`);
      gaps.push({ itemId: r.id, optionId: o.id, seat: seat.join(','),
        text: build(words.filter((w) => !odd.includes(w)), odd, oddInSeat[0]!, memberInSeat[0]!) });
    }
  }
  assert('exactly the five named seats are written, and no other', gaps.length === 5, `${gaps.length} gap(s): ${gaps.map((g) => g.itemId.slice(-2)).join(', ')}`);
  const touched = rows.filter((r) => gaps.some((g) => g.itemId === r.id));
  assert('every row written is DRAFT and unsigned — nothing reviewed is overwritten (R62)',
    touched.every((r) => r.status === 'DRAFT' && !r.reviewedBy), `${touched.filter((r) => r.status !== 'DRAFT' || r.reviewedBy).length} not DRAFT/unsigned`);

  console.log(`  assertions: ${assertions.filter((a) => a.passed).length} of ${assertions.length} pass`);
  for (const a of assertions.filter((x) => !x.passed)) console.log(`   REFUSED — ${a.assertion}: ${a.result}`);
  for (const g of gaps) console.log(`\n  ${g.itemId.slice(-2)} ${g.seat}\n     ${g.text}`);

  let wrote = 0;
  if (refusals.length === 0 && APPLY) {
    await prisma.$transaction(async (tx) => {
      for (const g of gaps) {
        await tx.itemOption.update({ where: { id: g.optionId }, data: { misconceptionExecution: g.text } });
        await tx.attributionEvent.create({ data: {
          recordType: 'item', recordId: g.itemId, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie',
          recordedBy: DAVID, field: 'options.misconceptionExecution',
          method: `her 231st (${d231.slice(0, 16)}): an execution is a staff-facing derivation. The query she set was run — no child-facing surface renders the field — so the store writes the five from the template twenty rows already carry.`,
          note: `${g.seat}: computed from the row's own words, in the form lifted from ${donor.itemId}`,
        } });
        wrote += 1;
      }
    });
  }

  const report = {
    kind: 'THE-QUERY-ANSWERED-AND-THE-FIVE-WRITTEN',
    TO: 'Annie, and the authoring store; by relay through David',
    date: '2026-09-05', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_231st: { sha256: d231, verifiedHere: true },
    ONE_THE_QUERY_ANSWERED: {
      question: 'name every surface that renders misconceptionExecution.',
      ANSWER: 'NO child-facing surface renders it.',
      staffSurfacesThatDO: [
        'apps/web/components/admin/maths-review.tsx:78 — a staff review table cell',
        'apps/web/components/admin/comprehension-review.tsx:162 — a staff review table cell',
        'apps/web/e2e/render-sweep.spec.ts:92 — a staff sweep that LOGS a warning when the field is empty; it never renders it',
      ],
      andTHECHILDPATHSINFULL: [
        'orchestrator.ts:774 serves options as {id, content} — the field is loaded by include and projected away',
        'clue-tap route serves options as {id, label} — same',
        'the walk route selects only {explanation, status} and loads no options at all',
        'the miss path serves childHint via hintToServe/resolveLibraryHint — the library entry\'s hint, never the execution',
      ],
      THE_THING_WORTH_SAYING: 'the field IS loaded on the child path. Both child readers `include` every option column and then project. That is correct today and it is one careless edit from wrong — `options.map((o) => ({ ...o }))` would serve it — so the assertion reads the PROJECTIONS rather than the includes.',
      keptANSWERED: 'pnpm check:execution-not-child-facing, with a carried fixture of two must-catch and two must-be-clean cases. A fact that licenses a store to write is the worst kind to leave unasserted (R180).',
    },
    TWO_THE_FIVE_WRITTEN: {
      howTHESENTENCEWASMADE: 'computed, not composed. The template was LIFTED from a row that already carries it and then used to rebuild that row\'s own execution — byte-identical, or the run refuses, because a template read wrongly would produce five wrong sentences that all look right.',
      donorRow: donor.itemId,
      assertions,
      written: gaps.map((g) => ({ itemId: g.itemId, seat: g.seat, execution: g.text })),
      rowsWritten: wrote,
    },
    THREE_WHAT_THIS_DOES_NOT_TOUCH: 'the sixth seat. bank-vr-02-two-odd-ones-out-17 circle,square is the authoring store\'s withdrawal — it HAS an execution, bound to superseded bytes, and re-writing it is their re-authoring rather than this gap.',
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THE_QUERY_ANSWERED', 'TWO_THE_FIVE_WRITTEN'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('the-query-answered-and-the-five-written', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'the-query-answered-and-the-five-written').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  ${refusals.length ? 'REFUSED' : APPLY ? 'WRITTEN' : 'WOULD WRITE'}: ${wrote} option(s).`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
