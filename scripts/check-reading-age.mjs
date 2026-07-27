/**
 * Reading-age lint (BUILD-PHASE-4 §5/§8): child-facing authored content must
 * read at age ≤9. A Word card deliberately TEACHES a hard word, so the
 * headword itself is exempt — what we lint is the wording AROUND it:
 *   1. sentences stay short (≤16 words);
 *   2. at most one other long word (4+ syllables) per text.
 * Flesch-Kincaid on 5-word snippets punishes the very word being taught,
 * so it is deliberately not used here.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const MAX_SENTENCE_WORDS = 16;
const MAX_LONG_WORDS = 1;

function syllables(word) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length <= 3) return 1;
  const matches = cleaned.replace(/e$/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 1);
}

const failures = [];

function check(label, text, exemptStem = '') {
  const stem = exemptStem.toLowerCase().slice(0, 6);
  const sentences = text.split(/[.!?]/).map((sentence) => sentence.trim()).filter(Boolean);
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean);
    if (words.length > MAX_SENTENCE_WORDS) {
      failures.push(`${label}: sentence has ${words.length} words (max ${MAX_SENTENCE_WORDS}): "${sentence.slice(0, 60)}…"`);
    }
  }
  const words = text.split(/\s+/).filter(Boolean);
  const longWords = words.filter((word) => {
    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    if (stem && cleaned.startsWith(stem)) return false; // the taught word is exempt
    return syllables(cleaned) >= 4;
  });
  if (longWords.length > MAX_LONG_WORDS) {
    failures.push(`${label}: too many long words around the headword (${longWords.join(', ')})`);
  }
}

const wordsFile = JSON.parse(readFileSync(join(ROOT, 'content/words/words.json'), 'utf8'));
for (const word of wordsFile.words) {
  check(`word:${word.id} definition`, word.definitionChild, word.headword);
  check(`word:${word.id} sentence`, word.sentence, word.headword);
}

for (const file of readdirSync(join(ROOT, 'content/cases'))) {
  if (!file.endsWith('.json')) continue;
  const parsed = JSON.parse(readFileSync(join(ROOT, 'content/cases', file), 'utf8'));
  check(`case:${parsed.case.id} narrative`, parsed.case.narrativeIntro.text);
}

if (failures.length > 0) {
  console.error(`Reading-age lint FAILED (${failures.length}):\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`Reading-age lint passed (${wordsFile.words.length} words + case narratives).`);
