/**
 * THE THREE GATES, MEASURED — `pnpm compare:gates`
 *
 * The claim recorded nowhere: the platform generator, the platform import door and Cowork's local
 * screen apply different rules. This runs the same items through every gate REACHABLE FROM THIS
 * REPO and reports where the verdicts differ, rather than asserting that they do.
 */
import { checkChildFacingText, checkItemChildFacing, isBlocking, roleForItemStem } from '../packages/core/src/index';

interface Probe { name: string; item: { id: string; stem: Record<string, unknown>; explanation: Record<string, unknown>; mechanic: string; options: Array<{ content: { value: string } }> } }

const PROBES: Probe[] = [
  {
    name: 'declared passage name (R23)',
    item: {
      id: 'probe-passagename', mechanic: 'comprehension',
      stem: { prompt: 'Which word describes Elizabeth in this paragraph?', passageNames: ['Elizabeth'] },
      explanation: {}, options: [{ content: { value: 'lively' } }],
    },
  },
  {
    name: 'declared quotation in the WALK SCRIPT (R23)',
    item: {
      id: 'probe-scriptquote', mechanic: 'comprehension',
      stem: { prompt: 'What had he done earlier?' },
      explanation: { walkScript: 'He unfastened a rope earlier.', quotes: [{ text: 'unfastened' }] },
      options: [{ content: { value: 'untied it' } }],
    },
  },
  {
    name: 'long word in an OPTION, tested token declared',
    item: {
      id: 'probe-option', mechanic: 'comprehension',
      stem: { prompt: 'Which word means the same?', testedTokens: ['independent'] },
      explanation: {}, options: [{ content: { value: 'independent' } }],
    },
  },
];

/** GATE 1+2b: the whole-item gate — the generator at production, and the REVIEWED/LIVE doors. */
function wholeItemGate(p: Probe): string[] {
  return checkItemChildFacing(p.item).filter(isBlocking).map((f) => `${f.rule}: ${f.detail}`);
}

/**
 * GATE 2a: the SCRIPT import path, as `import-english-items.ts` calls it TODAY — the same
 * whole-item gate, since 2026-08-09. Kept as a separate function rather than deleted so this
 * comparison still has two independent call sites to compare, and would notice them diverging again.
 */
function scriptImportGate(p: Probe): string[] {
  return checkItemChildFacing({
    id: p.item.id, stem: p.item.stem, explanation: p.item.explanation,
    mechanic: p.item.mechanic, options: p.item.options,
  }).filter(isBlocking).map((f) => `${f.rule}: ${f.detail}`);
}

/** The PRE-R23 version this path used to run, kept so the difference stays demonstrable. */
function preR23ScriptGate(p: Probe): string[] {
  const stem = p.item.stem as { prompt?: string; testedTokens?: string[] };
  const expl = p.item.explanation as { quotes?: Array<{ text: string }> };
  const quotedSpans = (expl.quotes ?? []).map((q) => q.text).filter(Boolean);
  const out = [
    ...checkChildFacingText({
      role: roleForItemStem(p.item.mechanic), label: `${p.item.id} stem`, text: String(stem.prompt ?? ''),
      quotedSpans, testedTokens: stem.testedTokens ?? [],
    }),
    ...p.item.options.flatMap((o) =>
      checkChildFacingText({ role: 'item-option', label: `${p.item.id} option`, text: o.content.value, testedTokens: stem.testedTokens ?? [] }),
    ),
  ];
  return out.filter(isBlocking).map((f) => `${f.rule}: ${f.detail}`);
}

let differing = 0;
for (const p of PROBES) {
  const a = wholeItemGate(p);
  const b = scriptImportGate(p);
  const old = preR23ScriptGate(p);
  const same = JSON.stringify(a) === JSON.stringify(b);
  if (!same) differing += 1;
  console.log(`\n${same ? 'AGREE   ' : 'DIFFERS '} ${p.name}`);
  console.log(`  generator + publish doors : ${a.length ? a.join(' | ') : 'clean'}`);
  console.log(`  script import (today)     : ${b.length ? b.join(' | ') : 'clean'}`);
  console.log(`  script import (pre-R23)   : ${old.length ? old.join(' | ') : 'clean'}`);
}
console.log(`\n${PROBES.length} probes · ${differing} where the two reachable gates disagree`);
console.log('Cowork\'s local screen is the THIRD term and is outside this repo — unverified, not closed.');

// Non-zero on divergence, so the two doors cannot drift apart again without CI saying so. The
// original divergence survived because nothing compared them; a comparison nobody runs is the
// same fault one level up.
if (differing > 0) process.exit(1);
