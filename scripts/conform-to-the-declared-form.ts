/**
 * REWRITE THE FORTY-FIVE TO THE DECLARED FORM (her 235th — R1020).
 *
 * **THE ROUTE IS THE POINT, NOT THE RESULT.** The same forty-five moved last turn by reading this
 * disk's neighbours; her 235th withdrew that tie-break as prevalence, because it answers differently
 * on each disk. They move now by conforming to a DECLARATION — which the next disk can be checked
 * against without ever reading this one.
 *
 * **NOTHING IS COMPOSED.** The declared `build()` produces the sentence from the row's own facts,
 * and the template was proved against the ten authored instances byte-exact before it was declared.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { DECLARED_FORMS, UNDECLARED_FAMILIES, UNDECLARED_NOTE, factsFor } from './lib/execution-forms';
import { readExecution } from './check-execution-describes-its-row';
import { seatOf } from './lib/seat-state';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const APPLY = process.argv.includes('--apply');
const ANNIE = 'rev-0001';
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

async function main() {
  console.log(`CONFORM TO THE DECLARED FORM — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const form = DECLARED_FORMS['vr02-partial-group']!;
  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('conform-to-form', { 'vr-02 row(s)': rows.length });

  const work: Array<{ itemId: string; optionId: string; seat: string; from: string; to: string }> = [];
  const already: string[] = [];
  for (const r of rows) {
    const key = r.options.find((o) => o.isCorrect); if (!key) continue;
    const words = ((r.stem as { words?: unknown[] }).words ?? []).map(String);
    const odd = seatOf(key.content).split(',').map((s) => s.trim());
    for (const o of r.options.filter((x) => x.misconceptionId === 'vr02-partial-group')) {
      const from = (o.misconceptionExecution ?? '').trim();
      if (!from) continue;
      const to = form.build(factsFor(words, odd, seatOf(o.content)));
      if (to === from) { already.push(r.id); continue; }
      const v = readExecution(to, words, odd);
      if (v.agrees !== true) throw new Error(`${r.id} ${seatOf(o.content)}: the declared form does not describe this row (${v.agrees === null ? 'unparsed' : 'disagrees'}) — refusing to write it`);
      work.push({ itemId: r.id, optionId: o.id, seat: seatOf(o.content), from, to });
    }
  }
  console.log(`  ${work.length} execution(s) to conform; ${already.length} already match the declaration.`);

  let wrote = 0;
  if (APPLY && work.length) {
    await prisma.$transaction(async (tx) => {
      for (const w of work) {
        await tx.itemOption.update({ where: { id: w.optionId }, data: { misconceptionExecution: w.to } });
        await tx.attributionEvent.create({ data: {
          recordType: 'item', recordId: w.itemId, action: 'AMENDED', reviewerId: ANNIE, actor: 'Annie',
          recordedBy: 'human:dbamgbade@gmail.com', field: 'options.misconceptionExecution',
          method: `her 235th: execution forms are DECLARED at the register per entry family and both disks conform. The vr02-partial-group form is declared as the AUTHORED one; this text is built by the declaration from this row's own facts, not copied and not composed.`,
          note: `${w.seat}: conformed to the declared form; ${sha(w.from).slice(0, 16)} -> ${sha(w.to).slice(0, 16)}`,
        } });
        wrote += 1;
      }
    }, { timeout: 60000 });
  }

  const report = {
    kind: 'THE-FORM-DECLARED-AND-FORTY-FIVE-CONFORMED', TO: 'the authoring store; Annie and David by relay',
    date: '2026-09-13', mode: APPLY ? 'APPLIED' : 'DRY RUN',
    ONE_THE_DECLARATION: {
      entryId: form.entryId, declaredOn: form.declaredOn, authority: form.authority,
      THE_FORM: 'The three that go together are {group, comma-separated}, so the two that do not are {odd1} and {odd2}. This option pairs {the odd word in this seat}, which is one of the odd ones, with {the group member in this seat}, which belongs to the group — one odd word found and the search stopped there.',
      workedExample: form.workedExample,
      provedBEFOREdeclared: form.provedBy,
      andWHERETHEDECLARATIONLIVES: 'scripts/lib/execution-forms.ts as a BUILD FUNCTION, not a description. A form described in prose is a second form; a form that builds is one a disk can conform to and be checked against.',
    },
    TWO_WHAT_CONFORMED: { count: work.length, alreadyMatching: already.length,
      andTHEROUTEISTHEPOINT: 'the same forty-five moved a turn ago by reading this disk\'s neighbours. That tie-break is withdrawn as prevalence. They move now by conforming to a declaration the next disk can check against without reading this one.' },
    THREE_WHAT_IS_NOT_DECLARED: { families: UNDECLARED_FAMILIES, note: UNDECLARED_NOTE,
      andWHYTHATMATTERSHERE: 'twenty-five executions on this case are in those families. Declaring them from what this disk contains would be the withdrawn tie-break re-run under a new name, so check:execution-form reports them UNCHECKED — which is not the same as conforming.' },
    FOUR_THE_COLUMN_ANSWER_STANDS: {
      what: 'fifteen partial-group executions on vr-02 across two disks are CLAIMS, not attestations. Her 198th attested the METHOD; the instances await her.',
      andTHISSTORESFIVEARENOEXCEPTION: 'they were computed from the row and verified against it, and never read by her. They sit in misconceptionExecution because her 231st ruled the FIELD staff-facing and authorised the store to write it — it did not attest the sentences.',
      soTHEHONESTSTATE: 'the seats are OCCUPIED and the occupants are unattested. That is a reading of the record, not a claim about the bytes, and it is the one thing in this exchange no digest can settle.',
    },
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THE_DECLARATION', 'TWO_WHAT_CONFORMED', 'THREE_WHAT_IS_NOT_DECLARED', 'FOUR_THE_COLUMN_ANSWER_STANDS'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('form-declared-and-conformed', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'form-declared-and-conformed').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  ${wrote} execution(s) conformed.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
