/**
 * RETAG-AS-RELEASE — `pnpm check:retag-releases`
 *
 * ANNIE'S GENERALISATION: MOVING A DEPENDENCY DOES NOT DISCHARGE IT. R105 found it once — three
 * ENG-001 items retagged off a RETIRED tag onto an ACTIVE one were released, and two moved onto a
 * PROPOSED one and were reported as released anyway. She asked for the sweep because the reporting
 * shape that produced it would not produce it only once.
 *
 * WHAT THIS ANSWERS THAT COWORK'S REPORT CANNOT. `RETAGDEPENDENCYREPORT.txt` finds every retag on
 * record — 36, from `_previousMisconceptionId` and `_previousMechanism` — and that half is theirs,
 * because the retag history lives in their store and the shadow fields do not cross (they are
 * PROPOSED exceptions on our side). But its STATE column is, in its own words, "what CODE HAS SAID,
 * relayed in conversation. No export artefact has reached this side, so every state here is
 * REPORTED, not read." Twelve of its 36 rows are UNKNOWN for that reason alone.
 *
 * So: THEY SUPPLY THE POPULATION, WE SUPPLY THE STATE. Every successor is resolved against the
 * library table directly. Nothing here is relayed.
 *
 * AND WE CHECK A SECOND THING THEY CANNOT: whether the retag actually LANDED. Cowork's row says
 * what an option is believed to depend on now. Our store says what it does depend on. A retag that
 * was authored but never crossed looks identical, from their side, to one that did.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'retag-releases-english';
const REPORT = process.argv[2] ?? '/Users/davidb/Downloads/RETAGDEPENDENCYREPORT.txt';

interface Row { itemId: string; opt: string; dependsOn: string; theirState: string; movedOff: string }

/** Cowork's fixed-width table. Parsed by shape; a line that does not match is REPORTED, never skipped. */
function parseReport(text: string): { rows: Row[]; unparsed: string[] } {
  const rows: Row[] = [];
  const unparsed: string[] = [];
  let inTable = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('item ')) { inTable = true; continue; }
    if (!inTable) continue;
    if (!line.trim()) break;
    const m = line.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(ACTIVE|PROPOSED|RETIRED|UNKNOWN)\s+(\S+)\s*$/);
    if (m) rows.push({ itemId: m[1]!, opt: m[2]!, dependsOn: m[3]!, theirState: m[4]!, movedOff: m[5]! });
    else unparsed.push(line);
  }
  return { rows, unparsed };
}

async function main(): Promise<void> {
  const { rows, unparsed } = parseReport(readFileSync(REPORT, 'utf8'));
  requirePopulation('check:retag-releases', { 'retags in the report': rows.length });
  if (unparsed.length) {
    console.error(`REFUSED: ${unparsed.length} line(s) in the table did not parse. A row this cannot read is`);
    console.error('a retag it would silently omit, and a short sweep reads exactly like a clean one.');
    for (const u of unparsed) console.error(`  ? ${u}`);
    process.exit(1);
  }

  const lib = await prisma.misconception.findMany({ select: { id: true, status: true } });
  const statusById = new Map(lib.map((m) => [m.id, m.status]));

  // What each named option ACTUALLY depends on in this store, so "landed" is measured not assumed.
  const items = await prisma.item.findMany({
    where: { id: { in: [...new Set(rows.map((r) => r.itemId))] } },
    include: { options: true },
  });
  const optionTag = new Map<string, string | null>();
  const itemsPresent = new Set(items.map((i) => i.id));
  for (const it of items) {
    for (const o of it.options) {
      optionTag.set(`${it.id}|${(o.content as { label?: string })?.label ?? ''}`, o.misconceptionId);
    }
  }

  const resolved = rows.map((r) => {
    const ourState = statusById.get(r.dependsOn) ?? 'NO-LIBRARY-ROW';
    // A ledger row is not an option; there is nothing on an item to compare it against.
    const isLedger = r.opt === '(ledger)';
    const key = `${r.itemId}|${r.opt}`;
    const landed = isLedger ? 'N/A — ledger row, not an option'
      : !itemsPresent.has(r.itemId) ? 'ITEM NOT IN THIS STORE'
        : !optionTag.has(key) ? 'OPTION NOT FOUND'
          : optionTag.get(key) === r.dependsOn ? 'LANDED'
            : `DISAGREES — store has ${optionTag.get(key) ?? '(no tag)'}`;
    return {
      ...r,
      ourState,
      released: ourState === 'ACTIVE',
      // Their state vs ours. UNKNOWN on their side is not a disagreement — it is the absence this
      // sweep exists to fill — so it is counted separately from a genuine contradiction.
      // A DISAGREEMENT AND A STALE ARTEFACT ARE NOT THE SAME THING, and the first version of this
      // called both CONTRADICTS. The moment the reviewer approved nine entries, eleven rows flipped
      // to "contradiction" without anything being wrong — their report is a point-in-time file and
      // this reads live state. PROPOSED-then-ACTIVE is the expected direction of travel and is
      // reported as OVERTAKEN; only a difference that cannot be explained by an approval since is a
      // genuine disagreement. A check that cries wolf on its own good news gets ignored.
      stateAgreement: r.theirState === 'UNKNOWN' ? 'THEY HAD NO STATE'
        : r.theirState === ourState ? 'AGREES'
          : r.theirState === 'PROPOSED' && ourState === 'ACTIVE'
            ? `OVERTAKEN — they said PROPOSED, approved since; store says ACTIVE`
            : `CONTRADICTS — they said ${r.theirState}, store says ${ourState}`,
      landed,
    };
  });

  const released = resolved.filter((r) => r.released);
  const notReleased = resolved.filter((r) => !r.released);
  const filledIn = resolved.filter((r) => r.theirState === 'UNKNOWN');
  const contradictions = resolved.filter((r) => r.stateAgreement.startsWith('CONTRADICTS'));
  const overtaken = resolved.filter((r) => r.stateAgreement.startsWith('OVERTAKEN'));
  const notLanded = resolved.filter((r) => r.landed.startsWith('DISAGREES') || r.landed === 'OPTION NOT FOUND');

  const bySuccessor = new Map<string, { state: string; count: number; items: string[] }>();
  for (const r of resolved) {
    const e = bySuccessor.get(r.dependsOn) ?? { state: r.ourState, count: 0, items: [] };
    e.count += 1; e.items.push(`${r.itemId}-${r.opt}`);
    bySuccessor.set(r.dependsOn, e);
  }

  const generatedAt = new Date().toISOString();
  const body = {
    kind: FAMILY,
    note:
      'Every retag on record, with the successor\'s state read from the library table rather than '
      + 'relayed. Cowork supplies the population (the retag history lives in their store); this '
      + 'supplies the state, and additionally whether each retag actually landed here.',
    generatedAt,
    source: { file: REPORT.split('/').pop(), retagsRead: rows.length },
    headline: {
      released: released.length,
      notReleased: notReleased.length,
      theyHadNoState: filledIn.length,
      overtakenByAnApprovalSince: overtaken.length,
      contradictions: contradictions.length,
      retagsThatDidNotLandHere: notLanded.length,
    },
    bySuccessor: [...bySuccessor].map(([id, v]) => ({ successor: id, ourState: v.state, retags: v.count, items: v.items }))
      .sort((a, b) => b.retags - a.retags),
    retags: resolved,
    limits: [
      'A retag that left neither _previousMisconceptionId nor _previousMechanism is invisible to the '
      + 'population, and the population is Cowork\'s. Nothing here can widen it — this sweep can only '
      + 'be as complete as the history they kept.',
      'RELEASED means the successor is ACTIVE, which clears the tag route ONLY. An item can be '
      + 'released here and still refuse a verdict on child-facing copy: see check:verdict-refusals.',
    ],
  };
  const stamp = artefactStamp(body, generatedAt, 'status',
    'every recorded retag with its successor state read from the library table', ['retags', 'bySuccessor']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ ...body, stamp }, null, 2));
  deliver(path, FAMILY);

  console.log(`check:retag-releases: ${rows.length} retag(s) read from ${REPORT.split('/').pop()}, `
    + `${lib.length} library rows consulted.\n`);
  console.log(`  ${released.length} RELEASED (successor ACTIVE) · ${notReleased.length} NOT RELEASED\n`);
  console.log('  BY SUCCESSOR, state read from the library table:');
  for (const s of body.bySuccessor) {
    const mark = s.ourState === 'ACTIVE' ? ' ' : '✗';
    console.log(`  ${mark} ${String(s.retags).padStart(3)}  ${s.successor.padEnd(34)} ${s.ourState}`);
  }
  console.log(`\n  ${filledIn.length} row(s) Cowork could not state — now resolved:`);
  for (const [id, v] of [...bySuccessor].filter(([, v]) => v.state)) {
    const theirs = resolved.filter((r) => r.dependsOn === id && r.theirState === 'UNKNOWN');
    if (theirs.length) console.log(`      ${String(theirs.length).padStart(2)}  ${id.padEnd(34)} -> ${v.state}`);
  }
  if (overtaken.length) {
    console.log(`\n  ${overtaken.length} row(s) OVERTAKEN — their report predates an approval, not a disagreement.`);
  }
  if (contradictions.length) {
    console.log(`\n  ${contradictions.length} CONTRADICTION(S) between the two stores:`);
    for (const c of contradictions) console.log(`      ${c.itemId}-${c.opt}  ${c.stateAgreement}`);
  }
  if (notLanded.length) {
    console.log(`\n  ${notLanded.length} retag(s) that did NOT land in this store:`);
    for (const n of notLanded) console.log(`      ${n.itemId}-${n.opt} -> ${n.dependsOn}: ${n.landed}`);
  } else {
    console.log('\n  Every retag with an option to check against LANDED here.');
  }
  await prisma.$disconnect();
}

void main();
