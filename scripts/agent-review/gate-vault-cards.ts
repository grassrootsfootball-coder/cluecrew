/**
 * GATE A VAULT-CARD FILE — the same child-facing gate the Word publish door applies (`checkWordCard`,
 * which carries the banned-vocabulary list, UK spelling and the reading-age lint for role
 * `word-card`), plus the card's own shape rules. One definition of "passes", shared by the drafter's
 * self-check and the lander (R1045). It reads the drafter's file, not a copy of it.
 *
 *   tsx scripts/agent-review/gate-vault-cards.ts content/agent-review/vault/cards-V1.json
 */
import { readFileSync } from 'node:fs';
import { checkWordCard } from '../../packages/core/src/content-gates';

export interface VaultCard {
  headword: string;
  tier: number;
  wordClass: string;
  definitionChild: string;
  sentence: string;
  twoMeanings: boolean;
  senseB?: { definition: string; sentence: string; wordClass: string } | null;
  likelierKnown?: 'A' | 'B' | null;
  likelierKnownNote?: string | null;
  /** The sense the LIVE item(s) on this headword test, and why the tier is what it is. */
  why: string;
}

export const slug = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Every fault on one card. Empty = passes. */
export function gateCard(c: VaultCard): string[] {
  const f: string[] = [];
  if (!c.headword || c.headword !== c.headword.toLowerCase()) f.push('headword must be lower case');
  if (!Number.isInteger(c.tier) || c.tier < 1 || c.tier > 5) f.push(`tier ${c.tier} is not 1-5`);
  if (!c.wordClass) f.push('wordClass missing');
  if (!c.why?.trim()) f.push('why missing');
  for (const [k, s] of [['definitionChild', c.definitionChild], ['sentence', c.sentence], ['senseB.definition', c.senseB?.definition], ['senseB.sentence', c.senseB?.sentence]] as const) {
    if (s === undefined) continue;
    if (!s.trim()) f.push(`${k} empty`);
  }
  if (!/[.?!]$/.test(c.sentence.trim())) f.push('sentence must end on a full stop, ? or !');
  if (c.senseB && !/[.?!]$/.test(c.senseB.sentence.trim())) f.push('senseB.sentence must end on a full stop, ? or !');
  if (!new RegExp(`\\b${c.headword}`, 'i').test(c.sentence)) f.push('sentence does not use the headword');
  if (c.senseB && !new RegExp(`\\b${c.headword}`, 'i').test(c.senseB.sentence)) f.push('senseB.sentence does not use the headword');
  // Schema CHECK: senseB exists whenever twoMeanings is true; likelierKnown is meaningful only then.
  if (c.twoMeanings && !c.senseB) f.push('twoMeanings without senseB');
  if (!c.twoMeanings && c.senseB) f.push('senseB without twoMeanings');
  if (c.twoMeanings && c.likelierKnown !== 'A' && c.likelierKnown !== 'B') f.push('two-sense card needs likelierKnown A or B');
  if (!c.twoMeanings && c.likelierKnown) f.push('likelierKnown on a one-sense card');
  for (const x of checkWordCard({ id: slug(c.headword), headword: c.headword, definitionChild: c.definitionChild, sentence: c.sentence, senseBDefinition: c.senseB?.definition ?? null, senseBSentence: c.senseB?.sentence ?? null })) {
    f.push(`${x.rule}: ${x.detail}`);
  }
  return f;
}

if (process.argv[1]?.endsWith('gate-vault-cards.ts')) {
  const path = process.argv[2];
  if (!path) throw new Error('pass a cards file');
  const cards = (JSON.parse(readFileSync(path, 'utf8')) as { cards: VaultCard[] }).cards;
  if (!cards?.length) throw new Error(`${path}: no cards — an empty file is a failed read, not a clean gate (R173)`);
  let bad = 0;
  for (const c of cards) {
    const f = gateCard(c);
    if (f.length) { bad += 1; console.log(`✗ ${c.headword}\n    ${f.join('\n    ')}`); }
  }
  console.log(`gate-vault-cards: ${cards.length} cards screened, ${cards.length - bad} pass, ${bad} fail`);
  if (bad) process.exitCode = 1;
}
