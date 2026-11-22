/**
 * check:execution-describes-its-row — A SUPERSEDED BINDING THAT NO GATE READS IS A CLAIM NOBODY
 * CAN REFUSE (Annie's framing, relayed 2026-09-13 — R1011).
 *
 * **THE GAP THIS CLOSES IS BETWEEN TWO QUESTIONS THAT SOUND LIKE ONE.** `itemWholeness` asks *does
 * an execution EXIST*, and answers yes for all 25 vr-02 rows. The authoring store asks *is the
 * execution bound to CURRENT bytes*, and answers no for ten seats on its disk. **Neither is wrong
 * and neither reads the other's axis** — occupant state is disk-local, so a binding can be stale on
 * one disk and invisible on the other, and no gate anywhere read the second question at all.
 *
 * **BUT A BINDING IS A PROXY AND THE CONTENT IS THE THING.** A row can move without invalidating a
 * sentence about it — a retag moves the digest and changes nothing the sentence says. So this does
 * not screen digests: **it reads what the execution SAYS and compares it with the row as it now
 * stands.** A stale binding whose sentence is still true is a bookkeeping fact; a sentence naming a
 * card that no longer exists is a defect a child could meet through a reviewer's screen.
 *
 * **THE COST IS THE POINT AND IT IS SMALL.** These sentences are templated, so the facts they
 * assert can be parsed back out and compared with the row's own words. Three forms cover every
 * execution in the case. **The check is cheap because the CORPUS is regular, and it says so** — on
 * an execution whose form it cannot parse it reports UNPARSED rather than clean, because 50 of 75
 * read as a clean zero is the subset fault (R595).
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';


/** Each form states the group and/or the odd pair. Whatever a form asserts is what gets compared. */
const FORMS: Array<{ name: string; re: RegExp; group?: (m: RegExpExecArray) => string[]; odd: (m: RegExpExecArray) => string[] }> = [
  { name: 'partial-group', re: /The group of three is ([^,]+), (\S+) and ([^,]+), so the two odd ones out are (\S+) and ([^.]+)\./,
    group: (m) => [m[1]!, m[2]!, m[3]!], odd: (m) => [m[4]!, m[5]!] },
  { name: 'three-that-go-together', re: /The three that go together are ([^,]+), (\S+) and ([^,]+), and the two odd ones out are (\S+) and ([^.]+)\./,
    group: (m) => [m[1]!, m[2]!, m[3]!], odd: (m) => [m[4]!, m[5]!] },
  { name: 'three-that-go-together-theirs', re: /The three that go together are ([^,]+), ([^,]+), ([^,]+), so the two that do not are (\S+) and ([^.]+)\./,
    group: (m) => [m[1]!, m[2]!, m[3]!], odd: (m) => [m[4]!, m[5]!] },
  { name: 'rule-the-three-share', re: /so the two odd ones out are (\S+) and ([^.]+)\./, odd: (m) => [m[1]!, m[2]!] },
];
/**
 * **THE READER READS; IT DOES NOT POLICE FORM.** The authoring store's partial-group executions use
 * a third variant — "X, Y, Z, so the two that do not are…" where this disk uses "X, Y and Z, and
 * the two odd ones out are…". Both assert the same facts and both are testable. Which form the
 * estate USES is a ruling and belongs nowhere near a content-truth check (R585: a by-type zero is a
 * finding about the wording, never about the tagging).
 */
const clean = (s: string) => s.trim().toLowerCase().replace(/[.,]$/, '');

export interface Verdict { form: string | null; agrees: boolean | null; said?: { group?: string[]; odd: string[] }; row?: { group: string[]; odd: string[] } }

export function readExecution(execution: string, words: string[], odd: string[]): Verdict {
  const w = words.map(clean); const o = odd.map(clean);
  const group = w.filter((x) => !o.includes(x));
  for (const f of FORMS) {
    const m = f.re.exec(execution);
    if (!m) continue;
    const saidOdd = f.odd(m).map(clean).sort();
    const saidGroup = f.group ? f.group(m).map(clean).sort() : null;
    const oddOk = saidOdd.join() === [...o].sort().join();
    const groupOk = saidGroup === null || saidGroup.join() === [...group].sort().join();
    return { form: f.name, agrees: oddOk && groupOk,
      said: { ...(saidGroup ? { group: saidGroup } : {}), odd: saidOdd }, row: { group: [...group].sort(), odd: [...o].sort() } };
  }
  return { form: null, agrees: null };
}

async function main() {
  console.log('check:execution-describes-its-row — what the sentence says, against the row as it now stands.');
  assertFixture('execution-describes-row', [
    { name: 'an execution naming a group the row no longer has', mustBeCaught: true,
      input: JSON.stringify({ ex: 'The group of three is apple, pear and plum, so the two odd ones out are van and bus. x', words: ['apple', 'van', 'pear', 'bus', 'kite'], odd: ['van', 'bus'] }) },
    { name: 'an execution naming the wrong odd pair', mustBeCaught: true,
      input: JSON.stringify({ ex: 'The three that go together are red, blue and green, and the two odd ones out are bear and fox. x', words: ['red', 'bear', 'blue', 'wolf', 'green'], odd: ['bear', 'wolf'] }) },
    { name: 'an execution that still describes its row', mustBeCaught: false,
      input: JSON.stringify({ ex: 'The group of three is apple, pear and plum, so the two odd ones out are van and bus. x', words: ['apple', 'van', 'pear', 'bus', 'plum'], odd: ['van', 'bus'] }) },
    { name: 'a form the parser does not know is UNPARSED, never clean', mustBeCaught: false,
      input: JSON.stringify({ ex: 'Some other wording entirely.', words: ['a', 'b', 'c'], odd: ['a', 'b'] }) },
  ], (raw) => {
    const c = JSON.parse(raw) as { ex: string; words: string[]; odd: string[] };
    return readExecution(c.ex, c.words, c.odd).agrees === false;
  });

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('check:execution-describes-its-row', { 'row(s) screened': rows.length });

  const val = (o: { content: unknown }) => { const v = (o.content as { value?: unknown })?.value; return Array.isArray(v) ? v.map(String) : String(v).split(',').map((s) => s.trim()); };
  let agree = 0, disagree = 0, unparsed = 0;
  const faults: string[] = []; const unknownForms: string[] = [];
  for (const r of rows) {
    const key = r.options.find((o) => o.isCorrect); if (!key) continue;
    const words = ((r.stem as { words?: unknown[] }).words ?? []).map(String);
    for (const o of r.options) {
      const ex = (o.misconceptionExecution ?? '').trim(); if (!ex) continue;
      const v = readExecution(ex, words, val(key));
      if (v.agrees === null) { unparsed += 1; unknownForms.push(`${r.id} ${o.misconceptionId}`); continue; }
      if (v.agrees) { agree += 1; continue; }
      disagree += 1;
      faults.push(`${r.id} [${r.status}] ${val(o).join(',')} (${o.misconceptionId})\n      says  group=${v.said?.group?.join(',') ?? '—'} odd=${v.said?.odd.join(',')}\n      row   group=${v.row?.group.join(',')} odd=${v.row?.odd.join(',')}`);
    }
  }

  console.log(`  ${rows.length} row(s); ${agree + disagree + unparsed} execution(s) read.`);
  console.log(`  ${agree} still describe their row | ${disagree} DESCRIBE A ROW THAT NO LONGER EXISTS | ${unparsed} in a form this parser does not know`);
  if (unparsed) { console.log(`  UNPARSED is not clean (R595) — these are unscreened, not passing:`); for (const u of [...new Set(unknownForms)].slice(0, 8)) console.log(`    ${u}`); }
  if (disagree === 0) {
    console.log('\n  No execution contradicts its row. A binding may still be stale — that is a different axis and this does not read it.');
    return;
  }
  console.error(`\n  REFUSED — ${disagree} execution(s) describe a row that no longer exists:`);
  for (const f of faults.slice(0, 10)) console.error(`    ${f}`);
  process.exitCode = 1;
}
/**
 * **ONLY WHEN RUN, NEVER ON IMPORT.** `readExecution` is exported and another script imported it;
 * this file's `main()` then ran inside that script's process and called `$disconnect()` on the
 * shared client mid-transaction — "Engine is not yet connected", from a check that had already
 * passed. A module that acts on import is a door nobody opened.
 */
if (require.main === module) {
  main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
}
