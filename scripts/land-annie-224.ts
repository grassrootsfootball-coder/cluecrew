/**
 * THE 224th RETURN: rows 01 and 06 take vr02-answered-the-opposite (a43289dd…).
 *
 * **THIS SCRIPT WRITES CONTENT UNGUARDED.** It transcribes a reviewer ruling, which is what R63
 * says a ruling-applier does: a HUMAN supplied the value, so it needs provenance and not a
 * classify-before-write guard. The provenance is the AttributionEvent each write records.
 *
 * **HER RULING IS A PREDICATE, NOT TWO ROWS.** "Both pairs join two group members and nothing
 * else, so the act these seats record is choosing the two that belong." That is set membership on
 * the stem's own words, and it needed no lexicon — so it went into `tag-write-gate.ts` as
 * `vr02-answered-the-opposite` / `vr02-partial-group` / `vr02-surface-link`, and this script writes
 * only what the gate independently refuses. Screening all 25 rows and 75 seats, the rule selects
 * EXACTLY the two rows she named and nothing else: 59 seats already perform their tag, 14 stay
 * UNDECIDED because whether a link rests on look or sound is a judgement, and 2 refuse.
 *
 * That agreement is the check on the encoding, not a flourish — had the predicate caught a third
 * row it would mean the rule and the ruling differ, and the ruling would win (R173: scrutinise
 * agreement at least as hard as surprise; here the agreement is between two independent things).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkTagWrite, TAG_PREDICATES } from '../packages/core/src/tag-write-gate';
import { requirePopulation } from './lib/population';

const DAVID = 'human:dbamgbade@gmail.com';
const RETURN = pjoin(homedir(), 'Downloads', 'annie-224-for-code.md');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
/** The vr-02 predicates consult no lexicon; passing one that always refuses proves it. */
const noLexicon = () => false;

async function main() {
  const sha224 = sha(readFileSync(RETURN));
  if (!sha224.startsWith('a43289dde57d4ae8')) throw new Error(`the 224th does not verify: ${sha224}`);
  console.log(`land-annie-224 — her 224th verifies at ${sha224.slice(0, 16)}.`);

  const items = await prisma.item.findMany({
    where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true }, orderBy: { id: 'asc' } } },
  });
  requirePopulation('land-annie-224', { 'vr-02 row(s)': items.length });
  const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '');

  const fixes: Array<{ itemId: string; optionId: string; pair: string; from: string; to: string; why: string }> = [];
  let performs = 0, undecided = 0;
  for (const it of items) {
    const key = it.options.find((o) => o.isCorrect);
    if (!key) continue;
    for (const o of it.options.filter((x) => !x.isCorrect)) {
      if (!o.misconceptionId) continue;
      const subj = { stem: it.stem as Record<string, unknown>, optionValue: val(o), keyValue: val(key), misconceptionId: o.misconceptionId };
      const r = checkTagWrite(subj, noLexicon);
      if (r.verdict === 'PERFORMS') { performs += 1; continue; }
      if (r.verdict === 'UNDECIDED') { undecided += 1; continue; }
      const alts = Object.keys(TAG_PREDICATES).filter((m) => m.startsWith('vr02-'))
        .filter((m) => checkTagWrite({ ...subj, misconceptionId: m }, noLexicon).verdict === 'PERFORMS');
      if (alts.length !== 1) throw new Error(`${it.id} ${val(o)}: refused ${o.misconceptionId} and ${alts.length} entries perform — a retag needs exactly one, not a choice made here`);
      fixes.push({ itemId: it.id, optionId: o.id, pair: val(o), from: o.misconceptionId, to: alts[0]!, why: r.why });
    }
  }

  console.log(`  ${performs} seat(s) perform their tag, ${undecided} UNDECIDED (a judgement, not an execution), ${fixes.length} refuse.`);
  const expected = ['bank-vr-02-two-odd-ones-out-01', 'bank-vr-02-two-odd-ones-out-06'];
  const got = fixes.map((f) => f.itemId).sort();
  if (got.length !== 2 || !expected.every((e, i) => got[i] === e)) {
    throw new Error(`the predicate and the ruling disagree. She named rows 01 and 06; the rule selects ${got.join(', ') || 'nothing'}. The ruling wins — do not write.`);
  }
  console.log('  the rule selects EXACTLY the two rows her ruling names.');

  for (const f of fixes) {
    await prisma.$transaction([
      prisma.itemOption.update({ where: { id: f.optionId }, data: { misconceptionId: f.to } }),
      prisma.attributionEvent.create({ data: {
        recordType: 'item', recordId: f.itemId, action: 'AMENDED', reviewerId: 'rev-0001',
        actor: 'Annie', recordedBy: DAVID, field: 'options.misconceptionId',
        method: `her 224th (${sha224.slice(0, 16)}); executed by the vr02 tag-write predicate, which needs no lexicon`,
        note: `${f.pair}: ${f.from} -> ${f.to}. ${f.why}`,
      } }),
    ]);
    console.log(`  RETAGGED ${f.itemId} ${f.pair} : ${f.from} -> ${f.to}`);
  }

  const after = await prisma.itemOption.count({ where: { misconceptionId: 'vr02-answered-the-opposite' } });
  console.log(`  vr02-answered-the-opposite now carries ${after} seat(s).`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
