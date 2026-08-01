/**
 * CLI + self-test for the chapter style scanner (Anti-Marker Law). Runs in
 * the content-scan pipeline: scans content/chapters/ (when it exists), and
 * `--self-test` proves every rule fires against the Ch1–3 fixtures — whose
 * violations the story map's own audit predicts.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeChapter, analyzeSeason, verdict } from './chapter-style.mjs';

const ROOT = new URL('..', import.meta.url).pathname;

function loadChapters(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')).chapter);
}

if (process.argv.includes('--self-test')) {
  const fixtures = loadChapters(join(ROOT, 'scripts/fixtures/chapters'));
  if (fixtures.length < 3) {
    console.error('self-test: expected the Ch1–3 fixtures');
    process.exit(1);
  }
  const results = analyzeSeason(fixtures);
  const failures = [];
  const flags = (id, kind) => (results.get(id)?.[kind] ?? []).map((entry) => entry.flag);

  // The map's changelog audit: em-dash overrun + narration dashes (Ch1),
  // an abstraction-tag ("the way important things sometimes are", Ch3),
  // an echo construction (Ch3), triad density.
  if (!flags('s1-ch1', 'hard').includes('em-dash-narration')) failures.push('ch1 narration em dash not caught');
  if (!flags('s1-ch3', 'hard').includes('abstraction-tag')) failures.push('ch3 abstraction tag not caught');
  if (!flags('s1-ch3', 'advisory').includes('echo')) failures.push('ch3 echo construction not caught');
  if (![...results.values()].some((result) => result.advisory.some((entry) => entry.flag === 'triads')))
    failures.push('triad density not caught anywhere');

  // Synthetic checks for rules the fixtures happen not to trip.
  const synthetic = analyzeChapter({
    id: 'synthetic',
    status: 'review',
    styleDismissals: [],
    body: 'Little did you know. It was a testament to courage. You couldn\'t help but smile, feeling a mix of things, the tension palpable and unspoken, in that moment. It all made sense, somehow.',
  });
  for (const expected of ['banned-phrase', 'abstraction-tag']) {
    if (!synthetic.hard.some((violation) => violation.flag === expected)) {
      failures.push(`synthetic ${expected} not caught`);
    }
  }
  // A review-status chapter with an undismissed advisory must block; the
  // same chapter with a logged dismissal must pass.
  const echoChapter = {
    id: 'echo-test',
    status: 'review',
    styleDismissals: [],
    body: 'Somebody got here first. Somebody is always getting there first. '.repeat(4) + 'The rest of the chapter is perfectly ordinary prose that goes on for a while without any drama at all.',
  };
  const blocked = verdict(echoChapter, analyzeChapter(echoChapter));
  if (!blocked.blocked) failures.push('undismissed advisory did not block review');
  const dismissed = verdict(
    { ...echoChapter, styleDismissals: [{ flag: 'echo', note: 'Deliberate rhythm, David approved.' }] },
    analyzeChapter(echoChapter),
  );
  if (dismissed.blocked) failures.push('logged dismissal did not clear the advisory');

  if (failures.length > 0) {
    console.error('Chapter-style self-test FAILED:');
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log('Chapter-style self-test passed: every Anti-Marker rule fires and dismissals gate correctly.');
  process.exit(0);
}

const chapters = loadChapters(join(ROOT, 'content/chapters'));
if (chapters.length === 0) {
  console.log('Chapter style scan: no chapters in /content/chapters yet — nothing to scan.');
  process.exit(0);
}
const results = analyzeSeason(chapters);
let blockedCount = 0;
for (const chapter of chapters) {
  const analysis = results.get(chapter.id);
  const gate = verdict(chapter, analysis);
  const label = `${chapter.id} [${chapter.status}]`;
  if (gate.blocked) {
    blockedCount += 1;
    console.error(`✗ ${label}`);
    for (const reason of gate.reasons) console.error(`    ${reason}`);
  } else {
    const notes = [...analysis.hard, ...analysis.advisory];
    console.log(`✓ ${label}${notes.length > 0 ? ` (${notes.length} draft note(s))` : ''}`);
    if (chapter.status === 'draft') {
      for (const note of notes) console.log(`    draft: ${note.flag} — ${note.detail}`);
    }
  }
}
if (blockedCount > 0) {
  console.error(`Chapter style scan FAILED: ${blockedCount} chapter(s) blocked.`);
  process.exit(1);
}
console.log(`Chapter style scan passed (${chapters.length} chapter(s)).`);
