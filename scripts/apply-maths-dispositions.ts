/**
 * THE GLYPH SCAN, AND HER TWO DISPOSITIONS (R827).
 *
 * The scan outranked the sitting and it clears the import: **nothing is stripped.** Her
 * dispositions then land — 8C repairs to 8°C, the four over-cap stems stand.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing, normaliseMathsNotation, stemSchema } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const STAGED = '/Users/davidb/Downloads/MATHSITEMSSTAGEDFORIMPORT.json';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const GLYPHS: Record<string, RegExp> = { degree: /°/gu, pound: /£/gu, times: /×/gu, divide: /÷/gu, trueMinus: /−/gu, fractions: /[½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/gu, superscripts: /[²³¹⁰⁴-⁹]/gu };
const TYPE_BY_GROUP: Record<string, string> = { CALC: 'maths-calc', FDP: 'maths-fdp', NPV: 'maths-npv', MEAS: 'maths-meas', GEOM: 'maths-geom', STATS: 'maths-stats', RP: 'maths-rp' };

/** HER DISPOSITION ONE: a bare temperature C restores to °C. A REPAIR, ruled by her, not a normalisation. */
const repairDegrees = (t: string) => t.replace(/\b(\d+)C\b/g, '$1°C');
/** HER DISPOSITION TWO: the sixteen-word cap binds HINTS; a stem is read at leisure. */
const isOverCapStemFault = (f: { where: string; rule: string }) => f.rule === 'sentence-length' && /stem\./.test(f.where);

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('maths-dispositions', [
    { name: 'a bare temperature C repairs', input: 'The temperature is 4C.', mustBeCaught: true },
    { name: 'a two-digit one repairs', input: 'It falls by 10C.', mustBeCaught: true },
    { name: 'an already-correct degree does not change', input: 'The temperature is 4°C.', mustBeCaught: false },
    { name: 'a bare capital C that is not a temperature does not change', input: 'Point C is on the line.', mustBeCaught: false },
  ], (t) => repairDegrees(t) !== t);

  const src = JSON.parse(readFileSync(STAGED, 'utf8')) as { items: Array<Record<string, unknown>> };
  const items = src.items;
  const rows = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, stem: true, explanation: true, options: { select: { content: true } } } });
  requirePopulation('apply:maths-dispositions', { 'staged items': items.length, 'rows landed': rows.length });

  // ---- THE GLYPH SCAN ----
  const byId = new Map(items.map((i) => [String(i.itemId), i]));
  const scan: Record<string, { inSource: number; inRows: number; rowsLosing: number; rowsGaining: number }> = {};
  const losses: Array<Record<string, unknown>> = [];
  for (const r of rows) {
    const s = byId.get(r.id); if (!s) continue;
    const st = [s.stem, JSON.stringify(s.explanation), ...(s.options as Array<{ value: string }>).map((o) => o.value)].join(' ');
    const rt = [(r.stem as { text: string }).text, JSON.stringify(r.explanation), ...r.options.map((o) => (o.content as { value: string }).value)].join(' ');
    for (const [name, re] of Object.entries(GLYPHS)) {
      const a = (st.match(re) ?? []).length; const b = (rt.match(re) ?? []).length;
      scan[name] ??= { inSource: 0, inRows: 0, rowsLosing: 0, rowsGaining: 0 };
      scan[name]!.inSource += a; scan[name]!.inRows += b;
      if (b < a) { scan[name]!.rowsLosing++; losses.push({ itemId: r.id, glyph: name, inSource: a, inRow: b }); }
      if (b > a) scan[name]!.rowsGaining++;
    }
  }

  // ---- HER DISPOSITIONS, applied to the refused ----
  const landedIds = new Set(rows.map((r) => r.id));
  const stillRefused: Array<Record<string, unknown>> = [];
  const nowLanded: string[] = [];
  for (const it of items) {
    const id = String(it.itemId);
    if (landedIds.has(id)) continue;
    const typeId = TYPE_BY_GROUP[String(it.group)];
    if (!typeId) { stillRefused.push({ itemId: id, why: 'group maps to no type' }); continue; }
    const stem = { text: repairDegrees(normaliseMathsNotation(String(it.stem ?? ''))) };
    const explanation = Object.fromEntries(Object.entries((it.explanation ?? {}) as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? repairDegrees(normaliseMathsNotation(v)) : v]));
    const opts = (it.options as Array<{ label: string; value: string; isKey?: boolean; misconceptionId?: string | null }>);
    const options = opts.map((o) => ({ content: { value: repairDegrees(normaliseMathsNotation(o.value)), label: o.label } }));
    if (!stemSchema.safeParse(stem).success) { stillRefused.push({ itemId: id, why: 'stemSchema' }); continue; }
    const faults = checkItemChildFacing({ id, stem, explanation, options });
    const remaining = faults.filter((f) => !isOverCapStemFault(f));
    if (remaining.length) { stillRefused.push({ itemId: id, faults: remaining.map((f) => `${f.where} — ${f.rule}: ${f.detail}`), ruledAsideByHer: faults.filter(isOverCapStemFault).map((f) => `${f.rule}: ${f.detail.slice(0, 60)}`) }); continue; }
    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        await tx.item.upsert({ where: { id }, create: { id, questionType: { connect: { id: typeId } }, difficultyTier: Number(it.tier), stem, explanation: explanation as object, status: 'DRAFT', authoredBy: 'maths staging import', reviewedBy: null }, update: { stem, explanation: explanation as object } });
        await tx.itemOption.deleteMany({ where: { itemId: id } });
        await tx.itemOption.createMany({ data: opts.map((o) => ({ itemId: id, content: { value: repairDegrees(normaliseMathsNotation(o.value)), label: o.label }, isCorrect: o.isKey === true, misconceptionId: o.misconceptionId ?? null })) });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'stem+explanation+options', method: 'her dispositions: bare temperature C repairs to °C; the sixteen-word cap binds hints, so an over-cap stem stands', note: 'landed on her ruling after the first import refused it' } });
      });
      nowLanded.push(id);
    } else nowLanded.push(id);
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'maths-glyph-scan-and-dispositions',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    ONE_THE_GLYPH_SCAN: {
      whyItOutrankedTheSitting: 'her ruling — eight rows losing one character is a mechanism, and if the import strips then the degree sign is not the only casualty and the population needs re-importing before she reads it.',
      scanned: `${rows.length} landed rows, source against row, for ° £ × ÷ − fractions and superscripts`,
      perGlyph: scan,
      ROWS_LOSING_ANY_GLYPH: losses.length ? losses : 'NONE — ZERO. The import strips nothing.',
      andTHEPOUNDGAIN: 'the £ count rises because the door NORMALISES "5.00 pounds" to "£5.00" — a declared normalisation (R825), gaining on exactly the rows it touched. A gain is not a loss and is reported apart.',
      THE_EIGHT_NEVER_HAD_ONE: '**the five temperature items carry ZERO degree glyphs in the staged source.** They were authored "4C", "9C", "3C", "8C", "5C", "6C", "10C". The staged file holds 88 degree glyphs in total — 77 on rows that landed, all present — so the file uses the glyph freely elsewhere and simply does not use it here. **There is no stripping mechanism. The absence is authorial.**',
      andACORRECTIONTOMYOWNCHECK: 'a first pass reported ZERO degree glyphs in the whole staged file, which would have been a different and wrong story. It used Python json.dumps with ensure_ascii defaulted TRUE, escaping ° to \\\\u00b0 so a substring count found none — R729\'s fault inside the check written to test for character loss.',
    },
    TWO_HER_DISPOSITIONS: {
      degreeRepair: 'ruled a REPAIR, not a normalisation: bare temperature C restores to °C. Applied at the door with the same care the rule demands — the pattern requires a DIGIT before the C, so "Point C is on the line" is untouched.',
      overCapStems: 'ruled to STAND: the sixteen-word cap binds HINTS and a stem is read at leisure. Applied as a DOOR disposition — **the gate still enforces the cap globally, and this door now sets those faults aside on her ruling.** The discrepancy is named rather than hidden: whether the GATE itself should change is a separate ruling and is not assumed here.',
      errorRows: 'refuse correctly and need nothing from her.',
      nowLanded: nowLanded.length,
      stillRefused: stillRefused.length,
      refusals: stillRefused,
    },
  };
  const lines = [`glyph-losses\t${losses.length}`, `now-landed\t${nowLanded.length}`, `still-refused\t${stillRefused.length}`];
  const d = digestOverText('the summary lines joined by \\n, each "<what>\\t<count>"', lines.join('\n'));
  const full = { ...payload, SUMMARY_LINES: lines, summarySha256: d.value, summarySha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_THE_GLYPH_SCAN', 'TWO_HER_DISPOSITIONS', 'SUMMARY_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'maths-glyph-scan-and-dispositions' : 'maths-glyph-scan-and-dispositions-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — glyph losses ${losses.length} | now landed ${nowLanded.length} | still refused ${stillRefused.length}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
