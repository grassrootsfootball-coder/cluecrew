/**
 * THE DROP CLASS IN REVERSE — a repair that reached the row and never reached the source (R786).
 *
 * `ENG-007-LP-14` could not land because its authored source declares a quoted span that is not
 * literally in the stem. **The same class was corrected on this store's rows months of work ago and
 * the correction never travelled back**, so the files still hold the pre-correction value and every
 * future import from them reintroduces the fault the gate already caught once.
 *
 * **This is a MERGE on ONE FIELD, never a wholesale replace** (CLAUDE.md): it carries `stem.quotes`
 * and nothing else, with the before and after on every row, and it says which field it changed.
 * Where no correction exists on any row, the fault is reported and NOT repaired — Cowork authors
 * item content and this store does not invent the wording.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const walk = (d: string, n = 0): string[] => n > 4 ? [] : (() => { try { return readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name), n + 1) : (e.name.endsWith('.json') ? [join(d, e.name)] : [])); } catch { return []; } })();

async function run() {
  assertFixture('quotes-return', [
    { name: 'a span not literally in the stem is a fault', input: JSON.stringify({ text: "the hat had 'perished'.", quotes: ['perished into a leaf'] }), mustBeCaught: true },
    { name: 'a span broken by inner quote marks is a fault', input: JSON.stringify({ text: "nobody was going to 'claim'.", quotes: ['nobody was going to claim'] }), mustBeCaught: true },
    { name: 'a span literally present is clean', input: JSON.stringify({ text: "the hat had 'perished'.", quotes: ['perished'] }), mustBeCaught: false },
    { name: 'no declared span is clean', input: JSON.stringify({ text: 'plain stem.', quotes: [] }), mustBeCaught: false },
  ], (raw) => { const s = JSON.parse(raw) as { text: string; quotes: string[] }; return s.quotes.some((q) => !s.text.includes(q)); });

  const rows = await prisma.item.findMany({ select: { id: true, stem: true } });
  const corrected = rows.filter((r) => (r.stem as Record<string, unknown>)?._previousQuotes);
  requirePopulation('emit:quotes-return', { 'rows carrying a quotes correction': corrected.length });

  const files = [...walk(join(REPO, 'content')), ...walk('/Users/davidb/Downloads/11+')];
  const fileState = (itemId: string) => {
    const out: Array<{ file: string; holds: unknown }> = [];
    for (const f of files) {
      let d: unknown; try { d = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
      const items = (d as { items?: unknown })?.items;
      if (!Array.isArray(items)) continue;
      for (const it of items as Array<{ itemId: string; stem?: { quotes?: unknown } }>) {
        if (it?.itemId === itemId) out.push({ file: f.replace(`${REPO}/`, '').replace('/Users/davidb/Downloads/', '~/Downloads/'), holds: it.stem?.quotes ?? null });
      }
    }
    return out;
  };

  const CARRY_BACK = corrected.map((r) => {
    const stem = r.stem as Record<string, unknown>;
    const now = stem.quotes; const was = stem._previousQuotes;
    const inFiles = fileState(r.id);
    return {
      itemId: r.id, field: 'stem.quotes',
      correctedOnTheRowTo: now, theValueItReplaced: was,
      whyTheCorrectionWasMade: 'the child-facing gate requires a declared quoted span to appear LITERALLY in the stem text. The replaced value did not, because the stem quotes the word inside the span.',
      everyFileCarryingThisItem: inFiles,
      stale: inFiles.filter((f) => canonicalJson(f.holds) !== canonicalJson(now)).length,
      carried: inFiles.filter((f) => canonicalJson(f.holds) === canonicalJson(now)).length,
    };
  });

  // Faults in the authored sources for which NO correction exists on any row.
  const NOT_REPAIRED: Array<Record<string, unknown>> = [];
  const correctedIds = new Set(corrected.map((r) => r.id));
  for (const f of files) {
    let d: unknown; try { d = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
    const items = (d as { items?: unknown })?.items;
    if (!Array.isArray(items)) continue;
    for (const it of items as Array<{ itemId: string; stem?: Record<string, unknown>; explanation?: unknown; options?: Array<{ content: string; label?: string }> }>) {
      if (!it?.stem || !Array.isArray(it.options) || correctedIds.has(it.itemId)) continue;
      const faults = checkItemChildFacing({ id: it.itemId, stem: it.stem, explanation: it.explanation ?? {}, options: it.options.map((o) => ({ content: { value: o.content, ...(o.label ? { label: o.label } : {}) } })) });
      const quoteFaults = faults.filter((x) => /quoted span/.test(x.detail));
      if (!quoteFaults.length) continue;
      if (NOT_REPAIRED.some((n) => n.itemId === it.itemId)) continue;
      NOT_REPAIRED.push({
        itemId: it.itemId, field: 'stem.quotes',
        declares: it.stem.quotes, stemText: String(it.stem.text ?? ''),
        faults: quoteFaults.map((x) => x.detail),
        NO_CORRECTION_EXISTS: 'no row anywhere carries a corrected value for this item, so there is nothing to carry back. The fault is reported, not repaired.',
        thePrecedentIfCowORKWANTSIT: 'ENG-007-LP-03 declares quotes ["perished"] where the source declared the whole clause, with _previousQuotes retaining it. The shape is: declare the shortest span that appears LITERALLY in the stem.',
        whyItMattersNOW: it.itemId === 'ENG-007-LP-06' ? 'this is the source of the HELD position ENG-007-LP-14 in her 172nd landing. Eight positions landed; this one waits on this declaration.' : 'it will refuse at the door on any future import.',
      });
    }
  }

  const manifest = [...CARRY_BACK.map((c) => `CARRY-BACK\t${c.itemId}\t${c.field}`), ...NOT_REPAIRED.map((n) => `FAULT-ONLY\t${n.itemId}\t${n.field}`)];
  const md = digestOverText('the MANIFEST lines joined by \\n, no trailing newline, each "<kind>\\t<itemId>\\t<field>"', manifest.join('\n'));
  const payload = {
    kind: 'quotes-corrections-return',
    what: 'stem.quotes corrections that were made on this store\'s rows and never travelled back to the authored files — plus the source faults for which no correction exists anywhere.',
    THE_CLASS: 'THE DROP CLASS IN REVERSE. R758 was a field authored at the source and dropped at this store\'s door. This is the mirror: a repair made at this store that reached the row and never reached the source. Both directions leave the two stores disagreeing, and neither reports itself.',
    ITISAMERGEONONEFIELD: 'this carries stem.quotes and nothing else, with the before and the after on every row, and it names the field it changes. It is not a wholesale replace of any file (CLAUDE.md), and nothing outside stem.quotes is proposed.',
    counts: {
      correctionsToCarryBack: CARRY_BACK.length,
      staleFileCopies: CARRY_BACK.reduce((n, c) => n + c.stale, 0),
      alreadyCarried: CARRY_BACK.reduce((n, c) => n + c.carried, 0),
      sourceFaultsWithNoCorrectionAnywhere: NOT_REPAIRED.length,
    },
    NOT_REPAIRED_HERE: 'where no row holds a correction there is nothing to carry back, so the fault is reported and left. Cowork authors item content; this store does not invent the wording (CLAUDE.md).',
    CARRY_BACK, NOT_REPAIRED,
    MANIFEST: manifest, manifestSha256: md.value, manifestSha256Spec: md.spec,
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['counts', 'CARRY_BACK', 'NOT_REPAIRED', 'MANIFEST']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('quotes-corrections-return', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'quotes-corrections-return');
  console.log(`carry-back ${CARRY_BACK.length} (stale copies ${payload.counts.staleFileCopies}, carried ${payload.counts.alreadyCarried}) | source faults with no correction ${NOT_REPAIRED.length}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
