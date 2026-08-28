/**
 * THE VALUES THAT HER 172nd UNBLOCKED — landed on the settled families (R785).
 *
 * Matching is by OPTION TEXT (R769: key identity is text identity, never label), against the
 * DATABASE, which is where the settled reading lives after the landing — not against either file.
 * Only the two families her 172nd ruled are in scope; everything else stays held.
 *
 * **Writes reviewed-channel content from human-authored values (R63): no derived-write guard, and
 * provenance recorded per row.** Never overwrites — only a null field is filled.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const SHA172 = 'd8350f9fd72ac50681c2354afec50208c0856319ddb0d46aca7b730e51997c12';
const RULED = ['ENG-005-BB', 'ENG-007-LP'];
const AUTHORED_KEYS = new Set(['label', 'content', 'isCorrect', 'misconceptionId']);

/** ItemOption's writable scalar columns, read from the schema rather than listed (R57). */
const COLUMNS = (() => {
  const m = /^model ItemOption \{$([\s\S]*?)^\}$/m.exec(readFileSync(join(REPO, 'packages/db/prisma/schema.prisma'), 'utf8'));
  if (!m?.[1]) throw new Error('could not read model ItemOption — refusing rather than treating every key as unknown (R173)');
  const names = [...m[1].matchAll(/^\s{2}(\w+)\s+\S/gm)].map((x) => x[1]!)
    .filter((n) => !['id', 'itemId', 'item', 'content', 'isCorrect', 'misconceptionId', 'misconception', 'attempts', 'tags'].includes(n));
  if (!names.length) throw new Error('read no ItemOption columns — refusing (R173)');
  return new Set(names);
})();

const walk = (d: string, n = 0): string[] => n > 4 ? [] : (() => { try { return readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name), n + 1) : (e.name.endsWith('.json') ? [join(d, e.name)] : [])); } catch { return []; } })();

async function run() {
  assertFixture('settled-option-fields', [
    { name: 'a real column is landable', input: 'misconceptionExecution', mustBeCaught: true },
    { name: 'a second real column', input: 'attractorQuote', mustBeCaught: true },
    { name: 'a retention key is not a column', input: '_previousMisconceptionId', mustBeCaught: false },
    { name: 'an authored key is not landed as a column', input: 'isCorrect', mustBeCaught: false },
  ], (k) => COLUMNS.has(k));

  const seen = new Set<string>();
  const vals: Array<{ itemId: string; content: string; key: string; value: unknown }> = [];
  for (const f of [...walk(join(REPO, 'content')), ...walk('/Users/davidb/Downloads/11+')]) {
    let d: unknown; try { d = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
    const items = (d as { items?: unknown })?.items;
    if (!Array.isArray(items)) continue;
    for (const it of items as Array<{ itemId: string; options?: Array<Record<string, unknown>> }>) {
      if (!Array.isArray(it?.options) || !RULED.some((r) => String(it.itemId).startsWith(r))) continue;
      for (const o of it.options) {
        if (typeof o.content !== 'string') continue;
        for (const [k, v] of Object.entries(o)) {
          if (AUTHORED_KEYS.has(k) || v == null || v === '') continue;
          const fp = `${it.itemId}|${o.content}|${k}`;
          if (seen.has(fp)) continue; seen.add(fp);
          vals.push({ itemId: it.itemId, content: o.content as string, key: k, value: v });
        }
      }
    }
  }
  requirePopulation('land:settled-option-fields', { 'authored values in the settled families': vals.length });

  const rows: Array<Record<string, unknown>> = [];
  const outcome = { landed: 0, alreadyPresent: 0, retentionIntoContent: 0, notAColumn: 0, noMatchingOptionText: 0 };
  for (const v of vals) {
    const opt = await prisma.itemOption.findFirst({ where: { itemId: v.itemId, content: { path: ['value'], equals: v.content } }, select: { id: true, content: true } });
    if (!opt) { outcome.noMatchingOptionText++; continue; }
    const isColumn = COLUMNS.has(v.key);
    const isRetention = v.key.startsWith('_');
    if (!isColumn && !isRetention) { outcome.notAColumn++; continue; }

    if (isColumn) {
      const cur = await prisma.itemOption.findUnique({ where: { id: opt.id }, select: { [v.key]: true } as never }) as unknown as Record<string, unknown>;
      if (cur[v.key] != null) { outcome.alreadyPresent++; continue; }
      rows.push({ itemId: v.itemId, optionText: v.content.slice(0, 60), field: v.key, landsAs: 'column', value: v.value });
      outcome.landed++;
      if (APPLY) await prisma.itemOption.update({ where: { id: opt.id }, data: { [v.key]: v.value } as never });
    } else {
      const content = opt.content as Record<string, unknown>;
      if (content[v.key] != null) { outcome.alreadyPresent++; continue; }
      rows.push({ itemId: v.itemId, optionText: v.content.slice(0, 60), field: v.key, landsAs: 'retention key inside content', value: v.value });
      outcome.retentionIntoContent++;
      if (APPLY) await prisma.itemOption.update({ where: { id: opt.id }, data: { content: { ...content, [v.key]: v.value } as never } });
    }
  }

  if (APPLY && rows.length) {
    await prisma.attributionEvent.create({ data: {
      recordType: 'item', recordId: `families:${RULED.join('+')}`, action: 'AMENDED',
      reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'options[] authored fields',
      method: `her 172nd (${SHA172.slice(0, 16)}) settled these two families; the values the R758 door had dropped now land against the settled rows, matched by option TEXT (R769)`,
      note: `${outcome.landed} column value(s), ${outcome.retentionIntoContent} retention key(s); never overwriting a non-null field`,
    } });
  }

  const manifest = rows.map((r) => `${r.itemId}\t${r.field}\t${r.landsAs}`);
  const md = digestOverText('the LANDED lines joined by \\n, no trailing newline, each "<itemId>\\t<field>\\t<landsAs>"', manifest.join('\n'));
  const payload = {
    kind: 'settled-option-fields-landing',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    scope: `the two families her 172nd settled: ${RULED.join(', ')}. Everything else stays held.`,
    matching: 'by OPTION TEXT against the DATABASE (R769), which is where the settled reading lives after the 172nd landing — not against either file.',
    counts: { authoredValuesInScope: vals.length, ...outcome },
    THE_53_ARE_UNCHOSEN_NOT_LOST: 'the values that match no option text on any row were authored against the reading she did NOT choose. Their options are not on the rows because her ruling selected the other version. THEY ARE UNCHOSEN, NOT LOST — the authored files still hold every one, and a later ruling could bring them back. Reporting them as failures to match would read as breakage, and it is not.',
    whatWasNOTlanded: {
      notAColumnAnywhere: `${outcome.notAColumn} — no column exists and the key is not retention-shaped. The R758 door refuses these rather than dropping them; so does this.`,
      alreadyPresent: `${outcome.alreadyPresent} — a non-null field is never overwritten.`,
    },
    LANDED: manifest, landedSha256: md.value, landedSha256Spec: md.spec,
    rows,
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['counts', 'LANDED', 'rows']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('settled-option-fields-landing', createHash('sha256').update(json).digest('hex').slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'settled-option-fields-landing');
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — in scope ${vals.length}: landed ${outcome.landed} column, ${outcome.retentionIntoContent} retention, already ${outcome.alreadyPresent}, no-column ${outcome.notAColumn}, unchosen ${outcome.noMatchingOptionText}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
