/**
 * The chapter style scanner (STORY MAP rule 10 — the Anti-Marker Law,
 * David's list, enforced in CI alongside banned-vocab/claims).
 *
 * HARD budgets (block review submission — a chapter in status review or
 * released fails the build):
 *   - em dashes ≤2 per chapter, and ZERO in narration (dialogue-interruption
 *     only — an em dash is "in dialogue" when it sits inside double quotes);
 *   - banned phrases: "little did", "testament to", "couldn't help but",
 *     "a mix of", "palpable", "unspoken", "in that moment";
 *   - abstraction-tag endings: "...the way X sometimes/always are",
 *     "...as if the world itself", a sentence trailing off on "somehow".
 *
 * ADVISORY flags (require a logged dismissal note in styleDismissals to
 * proceed past draft):
 *   - triads: list-of-three constructions beyond 1 per chapter;
 *   - echo constructions ("Somebody X. Somebody ... X-ing");
 *   - phrase memory: any 4+ word phrase repeated across chapters in a season.
 *
 * The scanner catches patterns; the novelist catches soul — David's
 * read-aloud pass remains the final filter.
 */

const BANNED_PHRASES = [
  'little did',
  'testament to',
  "couldn't help but",
  'a mix of',
  'palpable',
  'unspoken',
  'in that moment',
];

const STOPWORDS = new Set(
  'the a an and or but of to in on at for with you your it its is are was were be been i he she they them his her this that there here as by from not no'.split(' '),
);

/** Text with dialogue (double-quoted spans, straight or curly) removed. */
function narrationOnly(body) {
  return body.replace(/"[^"]*"|“[^”]*”/g, ' ');
}

function sentences(body) {
  return body
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function analyzeChapter(chapter) {
  const hard = [];
  const advisory = [];
  const body = chapter.body;

  // Em dashes.
  const dashCount = (body.match(/—/g) ?? []).length;
  if (dashCount > 2) {
    hard.push({ flag: 'em-dash-budget', detail: `${dashCount} em dashes (budget 2)` });
  }
  const narrationDashes = (narrationOnly(body).match(/—/g) ?? []).length;
  if (narrationDashes > 0) {
    hard.push({
      flag: 'em-dash-narration',
      detail: `${narrationDashes} em dash(es) in narration (dialogue-interruption only)`,
    });
  }

  // Banned phrases.
  for (const phrase of BANNED_PHRASES) {
    if (body.toLowerCase().includes(phrase)) {
      hard.push({ flag: 'banned-phrase', detail: `"${phrase}"` });
    }
  }

  // Abstraction-tag endings.
  for (const sentence of sentences(body)) {
    if (/the way [^.!?]{1,60}\b(sometimes|always)\b [^.!?]{0,30}(are|is|do|does)\b/i.test(sentence)) {
      hard.push({ flag: 'abstraction-tag', detail: sentence.slice(0, 80) });
    }
    if (/as if the world itself/i.test(sentence)) {
      hard.push({ flag: 'abstraction-tag', detail: sentence.slice(0, 80) });
    }
    if (/\bsomehow[.!?]?$/i.test(sentence)) {
      hard.push({ flag: 'abstraction-tag', detail: `trailing "somehow": ${sentence.slice(0, 60)}` });
    }
  }

  // Triads: list-of-three constructions beyond one per chapter.
  const triads = (body.match(/,[^,.!?\n]{2,60},\s+(and|or)\s+[^,.!?\n]{2,80}[.!?]/gi) ?? []).length;
  if (triads > 1) {
    advisory.push({ flag: 'triads', detail: `${triads} list-of-three constructions (budget 1)` });
  }

  // Echo constructions: consecutive sentences opening on the same indefinite
  // subject, the second running progressive.
  const parts = sentences(body);
  for (let i = 0; i + 1 < parts.length; i += 1) {
    const opener = /^(Somebody|Someone|Nobody|Something)\b/i.exec(parts[i]);
    if (opener && new RegExp(`^${opener[1]}\\b`, 'i').test(parts[i + 1]) && /\w+ing\b/.test(parts[i + 1])) {
      advisory.push({ flag: 'echo', detail: `${parts[i].slice(0, 50)} / ${parts[i + 1].slice(0, 50)}` });
    }
  }

  return { hard, advisory };
}

/** Normalised 4-word shingles for the cross-chapter phrase memory. */
function shingles(body) {
  const words = body
    .toLowerCase()
    .replace(/\[\[|\]\]/g, '')
    .replace(/[^a-z' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const out = new Set();
  for (let i = 0; i + 3 < words.length; i += 1) {
    const gram = words.slice(i, i + 4);
    if (gram.every((word) => STOPWORDS.has(word))) continue;
    out.add(gram.join(' '));
  }
  return out;
}

/** Season-level pass: per-chapter checks + repeated-phrase advisories. */
export function analyzeSeason(chapters) {
  const results = new Map(chapters.map((chapter) => [chapter.id, analyzeChapter(chapter)]));
  const seen = new Map(); // shingle → first chapter id
  for (const chapter of chapters) {
    for (const gram of shingles(chapter.body)) {
      const first = seen.get(gram);
      if (first && first !== chapter.id) {
        results.get(chapter.id).advisory.push({
          flag: 'phrase-memory',
          detail: `"${gram}" also in ${first}`,
        });
      } else if (!first) {
        seen.set(gram, chapter.id);
      }
    }
  }
  return results;
}

/**
 * The gate: hard violations block review/released chapters outright;
 * advisories block unless a dismissal note names the flag.
 */
export function verdict(chapter, analysis) {
  if (chapter.status === 'draft') return { blocked: false, reasons: [] };
  const reasons = analysis.hard.map((violation) => `HARD ${violation.flag}: ${violation.detail}`);
  const dismissed = new Set((chapter.styleDismissals ?? []).map((entry) => entry.flag));
  for (const flag of analysis.advisory) {
    if (!dismissed.has(flag.flag)) {
      reasons.push(`ADVISORY undismissed ${flag.flag}: ${flag.detail}`);
    }
  }
  return { blocked: reasons.length > 0, reasons };
}
