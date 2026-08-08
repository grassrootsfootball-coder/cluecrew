/**
 * SPaG SAMPLE SHEETS — the reviewer signs the RULE, not the output (David, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec tsx ../../scripts/export-spag-sample-sheets.ts`
 *
 * One sheet per family: its tier ladder rendered as {tier rule · structural parameters ·
 * number ranges}, and a handful of freshly generated, gated example items per tier so the
 * ladder can be read against real output. Mirrors the maths sample sheets — the ranges are
 * the SAME source the generator enforces (renderNumberRanges over numberRanges), never a
 * hand-typed label. Hash-named, freshness-checked, delivered.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import {
  SPAG_FAMILIES,
  generateSpagSample,
  spagFamilySheetRows,
  spagLadderGaps,
} from '../packages/core/src/english/spag-generator';
import { SPAG_FAMILIES as FAMILIES } from '../packages/core/src/english/spag-families';
import { familyTiers } from '../packages/core/src/maths/generator';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function main(): void {
  const gaps = spagLadderGaps(FAMILIES);
  if (gaps.length) throw new Error(`structural-ladder gate not green: ${JSON.stringify(gaps)}`);

  // Optional argv filter — a family-id substring, so one rebuilt family can go for a check
  // on its own (e.g. `... export-spag-sample-sheets.ts homophone`).
  const filter = process.argv[2];
  const selected = filter ? FAMILIES.filter((f) => f.id.includes(filter)) : FAMILIES;
  if (!selected.length) throw new Error(`no family matches "${filter}"`);
  const FAMILY = filter ? `spag-sample-${filter}` : 'spag-sample-sheets';

  const sections: string[] = [];
  for (const f of selected) {
    const rows = spagFamilySheetRows(f)
      .map((r) => {
        const sp = f.structuralParams(r.tier);
        const spStr = Object.entries(sp).map(([k, v]) => `${k}=${v}`).join(', ');
        return `<tr><td>T${r.tier}</td><td>${esc(r.rule)}</td><td>${esc(spStr)}</td><td class="rng">${esc(r.ranges)}</td></tr>`;
      })
      .join('');
    const examples = familyTiers(f)
      .map((t) => {
        const items = generateSpagSample(f, t, 2, 5);
        const blocks = items
          .map((it) => {
            const opts = it.options
              .map((o) => `<li>${o.isKey ? '<b>✓</b> ' : ''}${esc(o.value)}${o.misconceptionId ? ` <span class="tag">[${esc(o.misconceptionId)}]</span>` : ''}</li>`)
              .join('');
            return `<div class="ex"><p class="stem"><span class="t">T${t}</span> ${esc(it.stem)}</p><ul>${opts}</ul></div>`;
          })
          .join('');
        return blocks;
      })
      .join('');
    sections.push(
      `<section><h2>${esc(f.name)} <span class="sub">${f.subtype} · ${esc(f.franchise)} · ${f.id}</span></h2>` +
        `<table><thead><tr><th>tier</th><th>tier rule</th><th>structural parameters</th><th>number ranges (generator-consumed)</th></tr></thead><tbody>${rows}</tbody></table>` +
        `<h3>Examples</h3>${examples}</section>`,
    );
  }

  const html =
    `<!doctype html><meta charset="utf-8"><title>SPaG sample sheets</title>` +
    `<style>body{font-family:Georgia,serif;max-width:60rem;margin:0 auto;padding:2rem;color:#1a1a1a;line-height:1.5}` +
    `h1{margin-bottom:.2rem}h2{margin:2rem 0 .3rem;border-bottom:2px solid #333}.sub{font:400 .8rem monospace;color:#666}` +
    `table{border-collapse:collapse;width:100%;margin:.5rem 0;font-size:.9rem}th,td{border:1px solid #ccc;padding:.35rem .5rem;text-align:left;vertical-align:top}` +
    `.rng{font-family:monospace;font-size:.85rem}.ex{margin:.4rem 0;padding:.3rem .6rem;border-left:3px solid #ddd}.stem{margin:.2rem 0}` +
    `.t{font:700 .75rem monospace;background:#eee;padding:.05rem .3rem;border-radius:3px}ul{margin:.2rem 0 .4rem 1.2rem}.tag{font:400 .75rem monospace;color:#a00}</style>` +
    `<h1>SPaG generator — ${filter ? esc(selected[0]!.name) + ' (rebuilt for check)' : 'the eleven families'}</h1>` +
    `<p>English on the maths model. Structural-ladder gate: <b>green</b> (${selected.length} of ${FAMILIES.length} families). Ranges shown are the source the generator enforces.</p>` +
    sections.join('');

  const stamp = freshnessStamp(selected.map((f) => ({ id: f.id, tiers: familyTiers(f), rule: familyTiers(f).map(f.tierRule) })), new Date().toISOString());
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'html'));
  writeFileSync(path, html, 'utf8');
  const delivered = deliver(path, FAMILY);
  console.log(`SPaG sample sheets: ${selected.length} of ${FAMILIES.length} families, ladder green → ${delivered}`);
  void SPAG_FAMILIES;
}

main();
