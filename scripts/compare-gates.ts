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

/** GATE 2a: the SCRIPT import path, as `import-english-items.ts` actually calls it. */
function scriptImportGate(p: Probe): string[] {
  const stem = p.item.stem as { prompt?: string; testedTokens?: string[] };
  const expl = p.item.explanation as { quotes?: Array<{ text: string }>; walkScript?: string };
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

for (const p of PROBES) {
  const a = wholeItemGate(p);
  const b = scriptImportGate(p);
  const same = JSON.stringify(a) === JSON.stringify(b);
  console.log(`\n${same ? 'SAME    ' : 'DIFFERS '} ${p.name}`);
  console.log(`  whole-item gate (generator + publish door): ${a.length ? a.join(' | ') : 'clean'}`);
  console.log(`  script import path                        : ${b.length ? b.join(' | ') : 'clean'}`);
}
