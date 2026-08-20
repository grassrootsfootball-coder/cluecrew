/**
 * THE RIDER THAT OUTRANKS THE RULING: REMOVING A CHECK MUST NOT LEAVE A FIELD WITH NONE
 * (Annie, 2026-08-21 — R379). *"A field nobody checks is how the word cap ran for a month."*
 *
 * The ban list no longer runs on machine declarations. **This ships in the same act, never after**,
 * and asks the questions that actually apply to a declaration: **is the shape valid, does the
 * declared span exist in the text it is declared on, and does the exemption name a rule that
 * exists.** A ban list was never the right instrument for these fields; no instrument at all is
 * worse.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MACHINE_DECLARATION_PATHS } from '../packages/core/src/ban-list-scope';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Rules an exemption may name. Derived from the register, never hand-listed (R57). */
function knownRules(): Set<string> {
  const log = readFileSync(join(REPO_ROOT, 'docs/authoring-calibration-log.md'), 'utf8');
  return new Set([...log.matchAll(/^## (R\d+)/gm)].map((m) => m[1]));
}

async function main() {
  const rules = knownRules();
  const passages = new Map<string, boolean>();
  for (const f of readdirSync(join(REPO_ROOT, 'content/passages'))) {
    if (f.endsWith('.json')) {
      const j = JSON.parse(readFileSync(join(REPO_ROOT, 'content/passages', f), 'utf8')) as { id?: string };
      if (j.id) passages.set(j.id, true);
    }
  }

  const items = await prisma.item.findMany({ select: { id: true, stem: true, explanation: true } });
  const faults: string[] = [];
  let declarations = 0;
  let answerShapes = 0;

  for (const i of items) {
    for (const container of ['stem', 'explanation'] as const) {
      const o = (i[container] ?? {}) as Record<string, unknown>;
      const quotes = o.quotes;
      if (quotes !== undefined && !Array.isArray(quotes)) {
        faults.push(`${i.id} ${container}.quotes is ${typeof quotes}, not an array`);
        continue;
      }
      if (!Array.isArray(quotes)) continue;

      // The text a declaration on this container is ABOUT — the gate's own scoping.
      const texts = container === 'stem'
        ? [o.text, o.prompt, o.sentence, o.question].filter((t): t is string => typeof t === 'string')
        : [o.walkScript, o.walk, o.hintCore].filter((t): t is string => typeof t === 'string');

      quotes.forEach((q, n) => {
        declarations++;
        const at = `${i.id} ${container}.quotes[${n}]`;
        const entry = typeof q === 'string' ? { text: q } : (q as Record<string, unknown>);
        const text = entry.text;
        if (typeof text !== 'string' || text.trim() === '') {
          faults.push(`${at} has no readable text — SHAPE`);
          return;
        }
        // DOES THE DECLARED SPAN EXIST in something on its own container?
        if (!texts.some((t) => t.includes(text.trim()))) {
          faults.push(`${at} declares a span present in no text on ${container} — SPAN: "${text.slice(0, 50)}"`);
        }
        if (entry.passageRef !== undefined) {
          if (typeof entry.passageRef !== 'string') faults.push(`${at} passageRef is not a string — SHAPE`);
          else if (!passages.has(entry.passageRef)) faults.push(`${at} names passage "${entry.passageRef}", which does not exist — REF`);
        }
        // DOES THE EXEMPTION NAME A RULE THAT EXISTS?
        for (const r of Array.isArray(entry.exemptFrom) ? entry.exemptFrom : []) {
          if (typeof r !== 'string') { faults.push(`${at} exemptFrom carries a ${typeof r} — SHAPE`); continue; }
          const cited = r.match(/R\d+/)?.[0];
          if (cited && !rules.has(cited)) faults.push(`${at} exempts on "${r}", and ${cited} has no register entry — RULE`);
        }
        if (entry.rule !== undefined && typeof entry.rule === 'string') {
          const cited = entry.rule.match(/R\d+/)?.[0];
          if (cited && !rules.has(cited)) faults.push(`${at} cites rule "${entry.rule}", which has no register entry — RULE`);
        }
      });

      if (container === 'stem' && o.answerShape !== undefined) {
        answerShapes++;
        if (typeof o.answerShape !== 'string' || !o.answerShape.trim()) {
          faults.push(`${i.id} stem.answerShape is not a non-empty string — SHAPE`);
        }
      }
    }
  }

  requirePopulation('check:declaration-schema', {
    'item(s)': items.length,
    'declaration(s)': declarations,
    'answerShape(s)': answerShapes,
    'path(s) this check now owns': MACHINE_DECLARATION_PATHS.length,
  });

  if (faults.length === 0) {
    console.log('\ncheck:declaration-schema: every declaration is well-shaped, resolves to a span, and cites a rule that exists.');
    return;
  }
  console.error(`\nDECLARATION SCHEMA FAULTS: ${faults.length}`);
  for (const f of faults.slice(0, 40)) console.error(`  ${f}`);
  if (faults.length > 40) console.error(`  … and ${faults.length - 40} more`);
  process.exitCode = 1;
}

void main().finally(() => prisma.$disconnect());
