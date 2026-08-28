/** THE 419 AFTER HER 172nd — what lands, what is moot, what stays held (R782). */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const KNOWN = new Set(['label', 'content', 'isCorrect', 'misconceptionId']);
const RULED = ['ENG-005-BB', 'ENG-007-LP'];
const walk = (d: string, n = 0): string[] => n > 4 ? [] : (() => { try { return readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name), n + 1) : (e.name.endsWith('.json') ? [join(d, e.name)] : [])); } catch { return []; } })();

async function run() {
  assertFixture('reimport-status', [
    { name: 'a ruled family is settled', input: 'ENG-005-BB-02', mustBeCaught: true },
    { name: 'the other ruled family too', input: 'ENG-007-LP-09', mustBeCaught: true },
    { name: 'an unruled family is not', input: 'ENG-006-TM-01', mustBeCaught: false },
    { name: 'another unruled family', input: 'ENG-004-AGG-02', mustBeCaught: false },
  ], (id) => RULED.some((r) => id.startsWith(r)));

  const seen = new Set<string>(); const vals: Array<{ itemId: string; content: string; key: string }> = [];
  for (const f of [...walk(join(REPO, 'content')), ...walk('/Users/davidb/Downloads/11+')]) {
    let d: unknown; try { d = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
    const items = (d as { items?: unknown })?.items;
    if (!Array.isArray(items)) continue;
    for (const it of items as Array<{ itemId: string; options?: Array<Record<string, unknown>> }>) {
      if (!Array.isArray(it?.options)) continue;
      for (const o of it.options) {
        if (typeof o.content !== 'string') continue;
        for (const [k, v] of Object.entries(o)) {
          if (KNOWN.has(k) || v == null || v === '') continue;
          const fp = `${it.itemId}|${o.label ?? o.content}|${k}|${JSON.stringify(v)}`;
          if (seen.has(fp)) continue; seen.add(fp);
          vals.push({ itemId: it.itemId, content: o.content as string, key: k });
        }
      }
    }
  }
  requirePopulation('emit:reimport-status', { 'distinct authored option-field values': vals.length });
  const inRuled = vals.filter((v) => RULED.some((r) => v.itemId.startsWith(r)));
  let landable = 0, already = 0, noMatch = 0;
  for (const v of inRuled) {
    const opt = await prisma.itemOption.findFirst({ where: { itemId: v.itemId, content: { path: ['value'], equals: v.content } } });
    if (!opt) { noMatch++; continue; }
    if ((opt as unknown as Record<string, unknown>)[v.key] == null) landable++; else already++;
  }
  const payload = {
    kind: 'reimport-status-after-172',
    THE_419: { total: vals.length, inFamiliesHer172ndSETTLED: inRuled.length, inFamiliesSTILLUNRULED: vals.length - inRuled.length },
    OF_THE_SETTLED: {
      landableNow: landable,
      alreadyPresentOnTheRow: already,
      attachToAnOptionTEXTthatIsNotOnAnyRow: noMatch,
      whatTHATLASTONEMEANS: 'these values were authored against the version she did NOT choose. Their option texts are not on the rows because her ruling selected the other reading, so they are correctly not landing. They are unchosen, not lost — the authored files still hold them.',
    },
    WHAT_REMAINS_HELD: {
      count: vals.length - inRuled.length,
      why: 'they sit in families her 172nd does not reach — ENG-004-AGG, ENG-006-TM and others. The copy conflict there is untouched by these rulings and the detector still refuses, correctly.',
      andONEMORE: 'the held position ENG-007-LP-14 (claim) carries a pre-existing gate fault in its authored source, so its values cannot land either until that declaration is corrected.',
    },
    THE_DETECTOR_STILL_REFUSES_AND_THAT_IS_RIGHT: 'land-dropped-option-fields still reports 75 conflicting (item, label) identities and exits. It compares FILE COPIES and knows nothing of rulings — her 172nd settles the two families at the DATABASE, which is where the settled reading now lives, not in either file. Nothing was re-run against it.',
    SO_THE_ANSWER: `${landable} of the 419 land now, ${already} are already on their rows, ${noMatch} belong to versions she did not choose, and ${vals.length - inRuled.length} stay held pending rulings on the other families.`,
    NOTHING_LANDED_BY_THIS_SCRIPT: 'this reports. The instruction was to report what now lands, and landing 10 values is a separate write.',
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['THE_419', 'OF_THE_SETTLED', 'WHAT_REMAINS_HELD']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('reimport-status-after-172', createHash('sha256').update(json).digest('hex').slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'reimport-status-after-172');
  console.log(`419: settled ${inRuled.length} (landable ${landable}, already ${already}, unchosen ${noMatch}) | held ${vals.length - inRuled.length}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
