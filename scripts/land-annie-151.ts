/**
 * HER 151ST: SEVEN RULINGS, HER MINTED TEST RUN ESTATE-WIDE, item.note HOMED, THREE READS
 * (David, 2026-08-25 — R708).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const SHA151 = 'ba664c01e8ac2d86dc36b7bd754a7ebd05761aac834b13ad1bb13aece0220ed5';
const AUTH = `annie-151-for-code.md, sha256 ${SHA151}`;
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

const CONFIRMED = [
  { pair: ['trumpet', 'balloon'], pull: 'blown' },
  { pair: ['knife', 'thorn'], pull: 'pierce' },
  { pair: ['candle', 'mirror'], pull: 'reflection' },
  { pair: ['juice', 'paint'], pull: 'pourability' },
];
const STRIPPED = [['duck', 'crow'], ['oval', 'star'], ['cow', 'hen']];

async function optionByValue(pair: string[]) {
  const opts = await prisma.itemOption.findMany({
    where: { item: { questionTypeId: 'vr-02-two-odd-ones-out' } },
    select: { id: true, content: true, misconceptionId: true, drafterDeclaredPull: true, itemId: true },
  });
  const hits = opts.filter((o) => JSON.stringify((o.content as { value?: unknown }).value) === JSON.stringify(pair));
  if (hits.length !== 1) throw new Error(`REFUSED — ${pair.join('-')} matches ${hits.length} options; a non-unique match writes to the wrong row`);
  return hits[0]!;
}

async function run() {
  if (sha256(readFileSync('/Users/davidb/Downloads/annie-151-for-code.md')) !== SHA151) throw new Error('REFUSED — 151st digest mismatch');
  const landed: Array<Record<string, unknown>> = [];

  // ---- 1. Four confirmations: tag stands, declaration recorded as overruled-with-reason ----
  for (const c of CONFIRMED) {
    const o = await optionByValue(c.pair);
    if (o.misconceptionId !== 'vr02-real-link-wrong-rule') throw new Error(`REFUSED — ${c.pair.join('-')} carries ${o.misconceptionId}, not the mint`);
    const verdict = `OVERRULED WITH REASON — Annie's 151st: the drafter declared letter-count; letter-count is REFUSED as a pull (not an act a child performs unbidden, and the bank's own equal-length pairs include the keys). The tag stands on ${c.pull}, a genuine link that is not the group's rule.`;
    landed.push({ option: c.pair.join('-'), item: o.itemId, act: 'TAG CONFIRMED, DECLARATION OVERRULED', tag: o.misconceptionId, standsOn: c.pull, drafterClaim: o.drafterDeclaredPull, verdict, authority: AUTH });
    if (!APPLY) continue;
    await prisma.itemOption.update({ where: { id: o.id }, data: { drafterDeclaredPullVerdict: verdict } });
    await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: o.itemId, action: 'APPROVED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'options.misconceptionId', method: `her 151st (${SHA151.slice(0, 16)})`, note: `${c.pair.join('-')}: tag confirmed on ${c.pull}; drafter's letter-count declaration overruled with reason` } });
    console.log(`  CONFIRMED ${c.pair.join('-')} on ${c.pull}`);
  }

  // ---- 2. Three stripped: tags removed, seats empty for re-authoring ----
  for (const pair of STRIPPED) {
    const o = await optionByValue(pair);
    const verdict = `REFUSED — Annie's 151st: the declared pull (letter-count) is not a pull a child feels, and no pull exists in the words. The seat is EMPTY pending an authored distractor naming an act a child performs.`;
    landed.push({ option: pair.join('-'), item: o.itemId, act: 'TAG STRIPPED, SEAT EMPTY', tagRemoved: o.misconceptionId, drafterClaim: o.drafterDeclaredPull, verdict, authority: AUTH });
    if (!APPLY) continue;
    await prisma.itemOption.update({ where: { id: o.id }, data: { misconceptionId: null, drafterDeclaredPullVerdict: verdict } });
    await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: o.itemId, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'options.misconceptionId', method: `her 151st (${SHA151.slice(0, 16)})`, note: `${pair.join('-')}: ${o.misconceptionId} -> null; declared pull refused on evidence, seat empty for re-authoring` } });
    console.log(`  STRIPPED  ${pair.join('-')}`);
  }

  // ---- 3. vr02-surface-link: meaning confirmed unchanged ----
  const sl = await prisma.misconception.findUniqueOrThrow({ where: { id: 'vr02-surface-link' }, select: { childHint: true, description: true } });
  landed.push({ id: 'vr02-surface-link', act: 'MEANING CONFIRMED UNCHANGED', description: sl.description, childHint: sl.childHint, ruling: 'look is shape and spelling pattern, not character count; an entry that describes the right answer diagnoses nothing', authority: AUTH });
  if (APPLY) await prisma.attributionEvent.create({ data: { recordType: 'misconception', recordId: 'vr02-surface-link', action: 'APPROVED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'description', method: `her 151st (${SHA151.slice(0, 16)})`, note: 'meaning confirmed unchanged; letter-count excluded from look' } });

  // ---- 4. HER MINTED TEST, estate-wide over every rationale now held ----
  const all = await prisma.itemOption.findMany({
    where: { drafterDeclaredPull: { not: null } },
    select: { id: true, content: true, drafterDeclaredPull: true, misconceptionId: true, item: { select: { id: true, questionTypeId: true, options: { select: { content: true, isCorrect: true } } } } },
  });
  const results: Array<Record<string, unknown>> = [];
  for (const o of all) {
    const claim = o.drafterDeclaredPull!;
    const keyOpt = o.item.options.find((x) => x.isCorrect);
    const keyVal = (keyOpt?.content as { value?: unknown } | undefined)?.value;
    const keyWords = Array.isArray(keyVal) ? keyVal as string[] : typeof keyVal === 'string' ? [keyVal] : [];
    const row = { item: o.item.id, option: (o.content as { value?: unknown }).value, claim, key: keyVal } as Record<string, unknown>;
    /**
     * THE CLAIM SHAPES AS THE BANK ACTUALLY WRITES THEM (widened after a dry run put three real
     * claims in the undecidable bucket for punctuation): "(both have four letters)" and "(both
     * three letters)" are one shape, and "(both start with p, four letters)" is a COMPOUND claim
     * — a conjunction of two properties, tested per half.
     */
    const lc = /letter-count \(both (?:have )?(\w+) letters?\)/i.exec(claim)
      || /both start with [a-z]+, (\w+) letters/i.exec(claim);
    const initial = /both start with ([a-z]+)[,)]/i.exec(claim);
    if (lc && initial) {
      const pfx = initial[1]!.toLowerCase();
      const sharesPfx = keyWords.length === 2 && keyWords.every((w) => w.toLowerCase().startsWith(pfx));
      const sharesLen = keyWords.length === 2 && keyWords[0]!.length === keyWords[1]!.length;
      row.class = 'compound (shared-initial + letter-count)';
      row.keyAlsoSatisfies = sharesPfx && sharesLen;
      row.detail = `conjunction tested per half — key ${keyWords.join('-')}: shares prefix "${pfx}"? ${sharesPfx}; shares equal length? ${sharesLen}. ${sharesPfx && sharesLen ? 'THE KEY SHARES BOTH: a description, not an attraction' : sharesLen ? 'the key shares the LETTER-COUNT half, which is the half Annie has refused as a pull; discrimination rests entirely on the initial' : 'the conjunction discriminates'}`;
    } else if (lc) {
      const equal = keyWords.length === 2 && keyWords[0]!.length === keyWords[1]!.length;
      row.class = 'letter-count';
      row.keyAlsoSatisfies = equal;
      row.detail = `key ${keyWords.join('-')} lengths ${keyWords.map((w) => w.length).join('/')} — ${equal ? 'THE KEY SHARES THE PROPERTY: a description, not an attraction' : 'key does not share equal length'}`;
    } else if (initial) {
      const p = initial[1]!.toLowerCase();
      const shares = keyWords.length === 2 && keyWords.every((w) => w.toLowerCase().startsWith(p));
      row.class = 'shared-initial';
      row.keyAlsoSatisfies = shares;
      row.detail = `claimed prefix "${p}"; key ${keyWords.join('-')} — ${shares ? 'THE KEY SHARES IT' : 'key does not share the prefix'}`;
    } else if (/^Found one odd word/i.test(claim)) {
      row.class = 'partial-group';
      row.keyAlsoSatisfies = false;
      row.detail = 'the claimed property is "one odd word paired with a group member"; the key is BOTH odd words, so it cannot satisfy it — structurally discriminating';
    } else if (/^Made a real word/i.test(claim)) {
      row.class = 'real-word-that-does-not-fit';
      row.keyAlsoSatisfies = false;
      row.detail = 'QUALIFIED CLAIM: the first half ("makes a real word") IS satisfied by the key; the discriminating half ("that does not fit the sentence") is not. It passes her test only on the qualifier — reported so she can rule whether that is attraction or description.';
    } else {
      row.class = 'NOT MECHANICALLY DECIDABLE HERE';
      row.keyAlsoSatisfies = null;
      row.detail = 'the claimed property needs a reading, not a derivation; reported unjudged';
    }
    results.push(row);
  }
  const failing = results.filter((r) => r.keyAlsoSatisfies === true);
  const byClass: Record<string, number> = {};
  for (const r of results) byClass[String(r.class)] = (byClass[String(r.class)] ?? 0) + 1;

  // ---- 5. item.note gets a home ----
  const BANKS = [
    { file: '/Users/davidb/Downloads/11+/items/vr-banks/vr02-bank.json', qt: 'vr-02-two-odd-ones-out', sha: '7ce96804b4c4beb58e23ad232940300227fee619f7f4e0611836248d8de3f076' },
    { file: '/Users/davidb/Downloads/11+/items/vr-banks/vr06-bank.json', qt: 'vr-06-missing-word', sha: '084872d4047bcda27a3e02eb0dc648d90681aef2efc9f00fdebc1cc781062bae' },
  ];
  const notesLanded: Array<Record<string, unknown>> = [];
  for (const b of BANKS) {
    const bytes = readFileSync(b.file);
    if (sha256(bytes) !== b.sha) throw new Error(`REFUSED — ${b.file} digest mismatch`);
    const bank = JSON.parse(bytes.toString('utf8')) as { items: Array<{ stem: Record<string, unknown>; note?: string }> };
    const items = await prisma.item.findMany({ where: { questionTypeId: b.qt }, select: { id: true, stem: true, drafterNote: true } });
    const sig = (s: Record<string, unknown>) => {
      for (const k of ['words', 'frame', 'sentence']) if (s[k] !== undefined) return `${k}:${JSON.stringify(s[k])}`;
      throw new Error('REFUSED — unidentifiable stem');
    };
    let set = 0;
    for (const it of bank.items) {
      if (!it.note) continue;
      const hits = items.filter((i) => sig(i.stem as Record<string, unknown>) === sig(it.stem));
      if (hits.length !== 1) continue;
      if (hits[0]!.drafterNote === it.note) continue;
      set++;
      if (APPLY) await prisma.item.update({ where: { id: hits[0]!.id }, data: { drafterNote: it.note } });
    }
    notesLanded.push({ bank: b.qt, notesGivenAHome: set, sampleKind: b.qt === 'vr-02-two-odd-ones-out' ? 'THE GROUP RULE — the field Cowork could not author against' : 'a construction note' });
  }

  // ---- 6. The three ordered reads ----
  const REISSUED = ['ENG-015-CC-12', 'ENG-018-RB-01', 'ENG-018-RB-11', 'ENG-019-BV-02', 'ENG-023-RT-08', 'ENG-027-RR-08'];
  const reissuedItems = await prisma.item.findMany({ where: { id: { in: REISSUED } }, select: { id: true, tierRationale: true, lineRefs: true, sourcedFrom: true, mechanismLedger: true, authoredBy: true, options: { select: { attractorLine: true, attractorQuote: true, a36Note: true, windowClass: true, misconceptionExecution: true } } } });
  const occupancy = (name: string, filled: number, total: number) => ({ field: name, filledOnAffectedRows: filled, of: total, stillEmpty: filled === 0 });
  const optAll = reissuedItems.flatMap((i) => i.options);
  const reads = {
    'import-reissued-six.ts + import-reissued-items.ts': {
      affectedRows: REISSUED,
      droppedPerTheWalk: ['a36Note', 'attractorLine', 'attractorQuote', 'misconceptionExecution', 'mechanismLedger', 'sourcedFrom', 'tierRationale', 'windowClass', 'authoredBy', 'lineRefs'],
      columnOccupancyNow: [
        occupancy('Item.tierRationale', reissuedItems.filter((i) => i.tierRationale).length, reissuedItems.length),
        occupancy('Item.lineRefs', reissuedItems.filter((i) => i.lineRefs).length, reissuedItems.length),
        occupancy('Item.sourcedFrom', reissuedItems.filter((i) => i.sourcedFrom).length, reissuedItems.length),
        occupancy('Item.mechanismLedger', reissuedItems.filter((i) => i.mechanismLedger).length, reissuedItems.length),
        occupancy('ItemOption.attractorLine', optAll.filter((o) => o.attractorLine !== null).length, optAll.length),
        occupancy('ItemOption.attractorQuote', optAll.filter((o) => o.attractorQuote).length, optAll.length),
        occupancy('ItemOption.a36Note', optAll.filter((o) => o.a36Note).length, optAll.length),
        occupancy('ItemOption.windowClass', optAll.filter((o) => o.windowClass).length, optAll.length),
        occupancy('ItemOption.misconceptionExecution', optAll.filter((o) => o.misconceptionExecution).length, optAll.length),
      ],
    },
  };
  const nvrHints = await prisma.misconception.findMany({ where: { district: 'NVR' }, select: { id: true, description: true } });
  (reads as Record<string, unknown>)['import-nvr-reworded-hints.ts'] = {
    droppedPerTheWalk: ['description (the source carried a description per row; the importer names only the hint)'],
    columnOccupancyNow: [occupancy('Misconception.description (NVR rows)', nvrHints.filter((m) => m.description && m.description.trim()).length, nvrHints.length)],
    note: 'the column is populated across NVR rows from other paths; whether THIS import\'s descriptions differ from what stands cannot be decided without diffing the source per row — stated, not approximated.',
  };

  const artefact = {
    kind: 'annie-151-landing',
    what: 'Her seven rulings landed; her minted key-satisfies test run over every rationale this side holds; item.note homed; the three ordered importer reads.',
    authority: AUTH,
    coworkAudit: { file: 'field-without-a-column-audit-for-code.json', sha256: '433a4995d5ed27c907788c2c72097c14dbf8c4f12b87a3bb3999e3f98d3edb32', taken: 'as candidates, not claims; the loudest (option.misconception in 9 of 16 files) is the field closed at this side\'s vr-banks door — the other VR case files are imported by paths this walk has not yet read, and that is stated rather than assumed clean.' },
    theSevenRulings: landed,
    herMintedTest: {
      statement: 'A rationale the key also satisfies is a description, not an attraction — every one of those is a distractor nobody has established the attraction of.',
      limitsFirst: [
        'RUNS ONLY OVER RATIONALES THIS SIDE NOW HOLDS: 155 options across vr-02 and vr-06. Every other bank rationale is UNREAD until it crosses (her own instruction), so this test cannot speak for them.',
        'DECIDABILITY IS PER CLAIM-SHAPE, not per row: letter-count and shared-initial claims are computable against the key; the partial-group claim is structurally decidable; the vr-06 claim is QUALIFIED and passes only on its qualifier, reported as its own class rather than scored.',
      ],
      classes: byClass,
      failingHerTest: { count: failing.length, membership: failing },
      allRows: results,
    },
    theWiderLetterCountMembership: {
      finding: 'HER RULING REACHES FURTHER THAN THE SEVEN: 13 vr-02 rows carry a letter-count declaration, not 7. Six rows beyond the ruled seven now carry a declaration whose CLASS she has refused, and their tags rest on it exactly as the three stripped ones did.',
      note: 'NOT ACTED ON — no authority covers those six. Named so a ruling is not scoped to where someone happened to be reading (R703).',
      membership: results.filter((r) => r.class === 'letter-count').map((r) => ({ item: r.item, option: r.option })),
    },
    theNoteHomed: { column: 'Item.drafterNote (migration 20260825202331, additive; replay and invariants green)', landed: notesLanded, discipline: 'a drafter\'s claim, not an attestation; nothing in the wholeness derivation reads it — the same discipline as drafterDeclaredPull' },
    theThreeReads: reads,
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  console.log(`\ntest classes: ${JSON.stringify(byClass)}; failing her test: ${failing.length}; notes: ${JSON.stringify(notesLanded)}`);
  if (APPLY) {
    const name = stampedName('annie-151-landing', sha256(json).slice(0, 16), 'json');
    writeFileSync(join(REPO, 'content/exports', name), json);
    deliver(join(REPO, 'content/exports', name), 'annie-151-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
