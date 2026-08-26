/**
 * THE FORTY HOLD UNTIL EACH ROW CARRIES ITS FRAME'S ACCESSIBLE TEXT (David on Annie's flag,
 * 2026-08-26 — R751). Emitted per row, or stated per row that none exists.
 *
 * Her flag, which this answers rather than assumes: **the frame-versus-prose split may be an
 * accessibility difference wearing a quality one.** If the frame is a diagram, a child who cannot
 * see it needs the diagram said; if nothing says it, "the frame is a diagram" is doing work the
 * accessible layer does not deliver, and staging the forty without that fact risks her ruling the
 * accessible form out of the corpus on the strength of a distinction that only exists visually.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gapMarkerSpans } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

async function run() {
  assertFixture('frame-accessible-text', [
    { name: 'a framed sentence yields a frame token', input: 'Please do not SH___ so loudly.', mustBeCaught: true },
    { name: 'a frame with letters both sides yields one token', input: 'The word stops at DE___VE.', mustBeCaught: true },
    { name: 'prose with no frame yields none', input: 'Please do not shout so loudly.', mustBeCaught: false },
    { name: 'a lone underscore pair is still a token', input: 'Ade was the ___ runner.', mustBeCaught: true },
  ], (t) => gapMarkerSpans(t).length > 0);

  const items = await prisma.item.findMany({
    where: { questionTypeId: 'vr-06-missing-word' },
    select: { id: true, status: true, stem: true, explanation: true },
    orderBy: { id: 'asc' },
  });

  const rows = items.map((i) => {
    const stem = i.stem as Record<string, unknown>;
    const sentence = String(stem.sentence ?? '');
    const spans = gapMarkerSpans(sentence);
    const frames = spans.map(([a, b]) => sentence.slice(a, b));
    // EVERY place an accessible text could live for this row, checked by name rather than assumed.
    const candidates = ['accessibleText', 'accessibleSentence', 'spoken', 'spokenForm', 'ariaLabel', 'alt', 'audioText', 'readAloud'];
    const found = candidates.filter((k) => typeof stem[k] === 'string' && String(stem[k]).trim() !== '');
    return {
      id: i.id, status: i.status,
      sentence,
      frameTokens: frames,
      accessibleText: found.length ? Object.fromEntries(found.map((k) => [k, stem[k]])) : null,
      accessibleTextExists: found.length > 0,
      whatAScreenReaderReceives: 'THE LITERAL CHARACTERS, in a plain paragraph. The sentence renders as <p>{sentence}</p> in engines/stowaway.tsx with no role, no aria-label and no visually-hidden gloss, so the frame reaches a screen reader as the characters "' + frames.join('", "') + '" and nothing else — how they are voiced is the reader\'s punctuation setting, which the product neither sets nor knows.',
      stemKeysPresent: Object.keys(stem),
    };
  });

  const withAccessible = rows.filter((r) => r.accessibleTextExists);
  const payload = {
    kind: 'frame-accessible-text',
    RECROSS: 'FOURTH CROSSING. Renamed, with the findings digest inline below and the file digest in the filename. Superseded in scope by the full-population walk (exempt-strings-accessible-text) — these forty are its stem.sentence half.',
    what: 'Per row, the frame tokens and their accessible text — or the statement that none exists. Emitted because the forty hold until this fact is on the record.',
    theFlagBeingAnswered: 'Annie: the frame-versus-prose split may be an accessibility difference wearing a quality one. Staging the forty without this fact risks her ruling the accessible form out of the corpus.',
    THE_ANSWER: {
      rowsExamined: rows.length,
      rowsCarryingAnyAccessibleText: withAccessible.length,
      verdict: withAccessible.length === 0
        ? 'NONE OF THE FORTY CARRIES ACCESSIBLE TEXT FOR ITS FRAME. Every vr-06 stem holds exactly two keys — prompt and sentence — and no accessibility-shaped field exists anywhere on the type: no accessibleText, no spoken form, no ariaLabel, no alt.'
        : `${withAccessible.length} of ${rows.length} carry accessible text; membership below.`,
      andTheRendererAddsNone: 'engines/stowaway.tsx gives the sentence a bare <p>. Its Word component DOES carry role="img" with an aria-label — that is the tiled-word path for letter tiles, and the vr-06 sentence does not use it. So the only surface that could speak the frame is not on this row\'s path.',
      THE_CONSEQUENCE_FOR_HER_RULING: 'the frame/prose distinction this store has been ruling on is, today, VISUAL ONLY. A child using a screen reader receives the same undifferentiated character stream for the frame as for the prose around it, so the exemption that protects the diagram protects nothing she can hear. That does not make the ruling wrong — a diagram a sighted child reads is still a diagram — but it means the accessible form has never existed rather than having been ruled against, and her flag is correct on the evidence.',
      whatWouldChangeIt: 'a spoken form per row, authored, saying what the frame IS — the shape of the thing a sighted child sees. It does not exist and this store does not author it.',
    },
    rows,
  };
  const canonical = (o: unknown): string => {
    if (o === null || typeof o !== 'object') return JSON.stringify(o);
    if (Array.isArray(o)) return `[${o.map(canonical).join(',')}]`;
    return `{${Object.keys(o as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((o as Record<string, unknown>)[k])}`).join(',')}}`;
  };
  /**
   * THE SUBTREE IS NAMED BY THE DOCUMENT'S OWN KEYS (R752). The previous form named aliases —
   * `{control, summary, divergence, strings}` for keys actually called
   * `THE_CONTROL_ANSWERS_FIRST`, `theSummary`, … — and Cowork verified it by GUESSING among four
   * candidate readings, one of which reproduced. A digest names the keys as they appear.
   */
  const subtreeKeys = ['THE_ANSWER', 'rows'] as const;
  const findingsSha256 = sha256(canonical(Object.fromEntries(subtreeKeys.map((k) => [k, (payload as Record<string, unknown>)[k]]))));
  const artefact = {
    ...payload,
    findingsSha256,
    howToCheckThisOnArrival: {
      subtreeKeys,
      subtree: 'an object built from THIS DOCUMENT\'S OWN TOP-LEVEL KEYS, in the order listed in subtreeKeys: {"THE_ANSWER": …, "rows": …}. No renaming, no aliases.',
      spec: 'sha256 over json.dumps(subtree, sort_keys=True, separators=(",",":"), ensure_ascii=False).encode("utf-8") (R729)',
      fileDigest: 'staging line and .sha256 sidecar',
    },
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('frame-accessible-text-fourth-crossing', sha256(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'frame-accessible-text-fourth-crossing');
  console.log(`rows ${rows.length}; with accessible text ${withAccessible.length}; findingsSha256 ${findingsSha256}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
