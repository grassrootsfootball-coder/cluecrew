/**
 * STRIP THE ADDED QUOTATION MARKS FROM NINE CLOZE CARRIERS — Annie's sixth return, 2026-08-19.
 *
 * **HER RULING, AND HER MEASUREMENT SUPERSEDES MINE.** She settled the carrier count by direct
 * measurement — presented carrier against declared span, item by item over all sixteen: NINE add a
 * wrapper the span does not have (A1, A2, A5, B1, B2, B4, B5, B6, B8); SEVEN carry the vehicle's
 * own marks; nothing unresolved. My five passes gave five numbers and are superseded whole.
 *
 * **THE PROPERTY, WHICH IS THE POINT — a mark appears in a cloze stem IF AND ONLY IF it appears in
 * the vehicle at that span.** Asserted here before and after, and by `check:cloze-gaps` afterwards,
 * so the strip is testable rather than trusted. No replacement device: she ruled the marks come off
 * and nothing goes in their place.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';

const P = resolve(import.meta.dirname, '../content/passages');
const WRITE = process.argv.includes('--write');

/** Her nine, by id. Read from her ruling, never recomputed from my own superseded audit. */
const STRIP = [
  'ENG-003-A-CZ-A1', 'ENG-003-A-CZ-A2', 'ENG-003-A-CZ-A5', 'ENG-003-A-CZ-B1', 'ENG-003-A-CZ-B2',
  'ENG-003-A-CZ-B4', 'ENG-003-A-CZ-B5', 'ENG-003-A-CZ-B6', 'ENG-003-A-CZ-B8',
];

const SEP = ' — ';
const OPEN = /^[“"]/;
const CLOSE = /[”"]$/;

/** Does the VEHICLE quote the sentence holding this gap? The exact test: locate its own marker. */
function vehicleQuotesSpan(body: string, gapIndex: number): boolean {
  const at = body.indexOf(`___(${gapIndex})___`);
  if (at < 0) throw new Error(`vehicle carries no ___(${gapIndex})___ marker`);
  const before = body.slice(0, at);
  const start = Math.max(before.lastIndexOf('\n'), before.lastIndexOf('. '));
  const after = body.slice(at);
  const rel = ['. ', '\n'].map((d) => { const k = after.indexOf(d); return k < 0 ? after.length : k; });
  const sentence = body.slice(start + 1, at + Math.min(...rel));
  return /[“"]/.test(sentence);
}

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { questionTypeId: 'en-spag-cloze' },
    select: { id: true, stem: true },
    orderBy: { id: 'asc' },
  });
  const vehicles = new Map<string, string>();
  for (const it of items) {
    const ref = String((it.stem as { passageRef?: unknown }).passageRef);
    if (!vehicles.has(ref)) vehicles.set(ref, JSON.parse(readFileSync(`${P}/${ref}.json`, 'utf8')).body as string);
  }

  let stripped = 0;
  const violations: string[] = [];
  for (const it of items) {
    const stem = { ...(it.stem as Record<string, unknown>) };
    const text = String(stem.text ?? '');
    const cut = text.indexOf(SEP);
    if (cut < 0) { violations.push(`${it.id}: no separator; cannot isolate the carrier`); continue; }
    const head = text.slice(0, cut);
    let carrier = text.slice(cut + SEP.length).trim();
    const gapIndex = stem.gapIndex as number;
    const quotedInVehicle = vehicleQuotesSpan(vehicles.get(String(stem.passageRef))!, gapIndex);

    if (STRIP.includes(it.id)) {
      if (quotedInVehicle) {
        // HER LIST AND THE VEHICLE DISAGREE — report, never adapt. Her measurement governs the
        // ruling; a disagreement is a finding for her, not something to reconcile silently.
        violations.push(`${it.id}: ruled for stripping, but the vehicle DOES quote this span`);
        continue;
      }
      const had = OPEN.test(carrier) || CLOSE.test(carrier);
      carrier = carrier.replace(OPEN, '').replace(CLOSE, '').trim();
      if (had) {
        stem.text = `${head}${SEP}${carrier}`;
        if (WRITE) await prisma.item.update({ where: { id: it.id }, data: { stem: stem as object } });
        stripped += 1;
        console.log(`  ${WRITE ? 'STRIPPED' : 'would strip'} ${it.id}`);
      }
    }
  }

  // THE PROPERTY, ASSERTED OVER ALL SIXTEEN — not only the nine touched.
  const after = await prisma.item.findMany({
    where: { questionTypeId: 'en-spag-cloze' }, select: { id: true, stem: true }, orderBy: { id: 'asc' },
  });
  const breaches: string[] = [];
  for (const it of after) {
    const stem = it.stem as Record<string, unknown>;
    const text = String(stem.text ?? '');
    const carrier = text.slice(text.indexOf(SEP) + SEP.length).trim();
    const marked = OPEN.test(carrier);
    const inVehicle = vehicleQuotesSpan(vehicles.get(String(stem.passageRef))!, stem.gapIndex as number);
    if (marked !== inVehicle) breaches.push(`${it.id}: stem ${marked ? 'HAS' : 'has no'} mark, vehicle ${inVehicle ? 'HAS' : 'has no'} mark`);
  }

  console.log(`\n${WRITE ? 'applied' : 'dry run'}: ${stripped} of ${STRIP.length} carrier(s) stripped.`);
  console.log('\nTHE PROPERTY — a mark appears in a cloze stem IFF it appears in the vehicle at that span:');
  console.log(`  ${after.length - breaches.length} of ${after.length} hold${breaches.length ? '' : ' — property TRUE across the set'}`);
  for (const b of breaches) console.log(`    x ${b}`);
  for (const v of violations) console.log(`  ! ${v}`);
  await prisma.$disconnect();
  process.exit(violations.length ? 1 : 0);
}

void main();
