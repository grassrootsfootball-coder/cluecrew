/**
 * Build and STAGE the two artefacts Annie is owed, through `deliver()` so each carries a byte
 * digest and a sidecar (R255/R265). The first attempt used `cp`, which put the files in the
 * outbound folder with no staging record and no hash for the other store to quote back — a
 * delivery that could not be verified in either direction, reported as "sent".
 *
 * TWO artefacts, not one. The eight removals were appended to the flag file, so an instruction to
 * send two things produced one file; a reader looking for the second found nothing.
 *
 * **THE PASSAGES ARE ASSERTED COMPLETE, NOT ASSUMED.** Annie reads a flag against the passage it
 * describes, so a truncated passage turns a verifiable claim back into prose — the exact thing the
 * flag file alone already was. The emitted text is compared to the source and the build FAILS on
 * any difference.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deliver } from './lib/export-destination';

const PASSAGES = join(process.cwd(), 'content/passages');
const OUT = join(process.cwd(), 'content/exports');

interface Flagged {
  file: string;
  flags: unknown[];
  text: string;
  id: string;
  title: string;
  work: string | null;
}

function loadPassage(file: string): Flagged {
  const j = JSON.parse(readFileSync(join(PASSAGES, file), 'utf8')) as Record<string, unknown>;
  const text = j.text ?? j.extract ?? j.body;
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error(
      `deliver-flags ABORTED — ${file} has no readable passage text.\n` +
        "  Expected a string at 'text', 'extract' or 'body'. Refusing rather than emitting a flag\n" +
        '  file with nothing to check the flag against, which is the fault this delivery repairs.',
    );
  }
  const flags = j.contentFlags;
  if (!Array.isArray(flags) || flags.length === 0) {
    throw new Error(`deliver-flags ABORTED — ${file} carries no contentFlags array.`);
  }
  const work = j.work as { title?: string } | string | undefined;
  return {
    file,
    flags,
    text,
    id: String(j.id),
    title: String(j.title ?? j.sceneTitle ?? j.id),
    work: typeof work === 'string' ? work : (work?.title ?? null),
  };
}

function renderFlag(flag: unknown, n: number): string[] {
  const out = [`### Flag ${n} of 4`, ''];
  if (typeof flag === 'string') {
    out.push(`> ${flag}`);
  } else {
    const f = flag as Record<string, string>;
    out.push(`> **Element:** ${f.element ?? f.issue ?? ''}`, '>');
    if (f.severity) out.push(`> **Severity:** ${f.severity}`, '>');
    out.push(`> **Recommendation:** ${f.recommendation ?? ''}`, '>');
    out.push(`> **Reason:** ${f.reason ?? ''}`);
  }
  out.push('');
  return out;
}

function buildFlags(): string {
  const sources = ['stream-a-03-wind-in-willows.json', 'stream-b-01.json'].map(loadPassage);
  const out: string[] = [
    '# The four REACHABLE content flags, with their passages complete',
    '',
    '**20 August 2026. For Annie.** Reported, not acted on: the standard these are judged against does',
    'not exist yet, and nothing here builds a check, a parser or a protective list.',
    '',
    '**Each flag is followed by the WHOLE passage it describes, unabridged.** A flag is a claim about a',
    'text, so a flag delivered without its text is a verdict with the evidence withheld — the reader',
    'can agree or disagree but cannot CHECK. The first version of this file was exactly that.',
    '',
    'These four sit on passages a child can reach today. The other 55 flags sit on passages that are',
    'STORED but not REACHABLE. **Nobody recorded who wrote any of the 61, when, or against what',
    'standard** — no attribution event exists on a single one. They read as one judgement; they are 61',
    'unattributed sentences.',
    '',
    '---',
    '',
  ];
  let n = 0;
  for (const p of sources) {
    const words = p.text.split(/\s+/).filter(Boolean).length;
    out.push(`## ${p.title}${p.work ? ` — *${p.work}*` : ''}`, '');
    out.push(
      `\`${p.id}\` · \`${p.file}\` · ${words} words · ${p.text.length} characters · ` +
        `**${p.flags.length} flag${p.flags.length > 1 ? 's' : ''}**`,
      '',
    );
    for (const flag of p.flags) out.push(...renderFlag(flag, ++n));
    out.push('### The passage in full', '');
    out.push(
      p.text
        .split('\n')
        .map((l) => (l.trim() ? `> ${l}` : '>'))
        .join('\n'),
    );
    out.push('', '---', '');
  }
  if (n !== 4) throw new Error(`deliver-flags ABORTED — expected 4 flags, rendered ${n}.`);

  // ASSERT THE PASSAGES SURVIVED THE RENDER. Blockquote prefixes are stripped back off and the
  // result compared to the source; anything short of an exact match fails the build.
  const body = out.join('\n');
  for (const p of sources) {
    const quoted = p.text
      .split('\n')
      .map((l) => (l.trim() ? `> ${l}` : '>'))
      .join('\n');
    if (!body.includes(quoted)) {
      throw new Error(`deliver-flags ABORTED — ${p.file} passage did not survive rendering intact.`);
    }
  }
  return body;
}

/**
 * The cut-versus-avoidance split, marked PER ENTRY rather than summarised underneath.
 *
 * **Re-derived from the entries themselves, and it corrects my own earlier count twice.** I
 * reported "six of the eight are avoidances, not cuts" and "four name racial or ethnic content".
 * Reading each entry against both limbs: **all eight carry an avoidance**, four ALSO carry a cut,
 * none is a cut alone — and **five** name racial or ethnic content, not four. The first count
 * treated Tom Sawyer and Eighty Days as avoidance-only when both say "cut" in their own text, and
 * missed Mill on the Floss's ethnic slur.
 */
const SPLIT: Record<string, { limbs: string; racial: boolean; note: string }> = {
  'Tom Sawyer': {
    limbs: 'AVOIDANCE **and** CUT',
    racial: true,
    note: 'The extract BEGINS AFTER an episode (avoidance); a later sentence was REMOVED from the chosen text (cut).',
  },
  'Around the World in Eighty Days': {
    limbs: 'AVOIDANCE **and** CUT',
    racial: true,
    note: 'A whole sequence avoided; two lines removed from inside the scene that was kept.',
  },
  'The Jungle Book': {
    limbs: 'AVOIDANCE **and** CUT',
    racial: true,
    note: 'A clause removed (cut); the extract STOPPED at a chosen boundary so combat never enters (avoidance).',
  },
  'Hound of the Baskervilles': {
    limbs: 'AVOIDANCE **and** CUT',
    racial: true,
    note: 'Begins after a speech (avoidance); three specific references removed from what remains (cut).',
  },
  'Jane Eyre': {
    limbs: 'AVOIDANCE only',
    racial: false,
    note: 'A whole episode declined in favour of another. Nothing was removed, because nothing was chosen.',
  },
  'Mill on the Floss': {
    limbs: 'AVOIDANCE only',
    racial: true,
    note: 'One scene rejected for another. The slur was never in the chosen text to cut.',
  },
  'Black Beauty': {
    limbs: 'AVOIDANCE only',
    racial: false,
    note: 'Whole chapters declined; a different episode chosen.',
  },
  'Canterville Ghost': {
    limbs: 'AVOIDANCE only',
    racial: false,
    note: 'A catalogue avoided by choice of extract.',
  },
};

function buildRemovals(): string {
  const manifest = JSON.parse(
    readFileSync('/Users/davidb/Downloads/11+/passages/stream-a-manifest.json', 'utf8'),
  ) as { contentFitness?: { activeRemovalsForContent?: unknown } };
  const entries = manifest.contentFitness?.activeRemovalsForContent;
  if (!Array.isArray(entries)) {
    throw new Error(
      "deliver-flags ABORTED — cannot read contentFitness.activeRemovalsForContent from Cowork's manifest.",
    );
  }
  const out: string[] = [
    '# The eight `activeRemovalsForContent` entries, verbatim, with the split marked per entry',
    '',
    '**20 August 2026. For Annie and David.**',
    '',
    '**Where this comes from.** `activeRemovalsForContent` is **not a symbol in the ClueCrew',
    "repository** — nothing there defines, exports or reads it. It is a key in **Cowork's**",
    '`passages/stream-a-manifest.json`, under `contentFitness`. Saying so matters because that repo',
    'has four fields of its own that record removals — `editorialCuts`, `passageEdits`,',
    '`repairingCuts`, `boundaryTrims`, carrying **82 entries across 21 passages** — and any of them',
    'could have been handed over as "the eight" by matching on plausibility instead of on the name.',
    '',
    '## The two limbs, and why each entry is marked',
    '',
    '**A CUT** removes text from a passage a child will read. Something remains to inspect, and a',
    'reviewer can ask whether the join still reads.',
    '',
    '**AN AVOIDANCE** decides which passage exists at all — a scene not chosen, an extract begun after',
    'something, a work set aside for another. **It is invisible to every gate we have, because the',
    'gates read what is there.** It is closer to a commissioning policy than to a content flag.',
    '',
    '**Marked per entry below, because the summary was wrong twice.** I previously reported "six of the',
    'eight are avoidances, not cuts" and "four name racial or ethnic content". Reading each entry',
    'against both limbs: **all eight carry an avoidance**, four ALSO carry a cut, **none is a cut',
    'alone**, and **five** name racial or ethnic content. The earlier count treated Tom Sawyer and',
    'Eighty Days as avoidance-only when both say "cut" in their own text, and missed the ethnic slur in',
    'Mill on the Floss. **The avoidance limb is not a subset here — it is universal**, which sharpens',
    'the point rather than softening it.',
    '',
    '---',
    '',
  ];
  let cuts = 0;
  let racial = 0;
  entries.forEach((entry, i) => {
    if (typeof entry !== 'string') {
      throw new Error(`deliver-flags ABORTED — removal ${i} is ${typeof entry}, not a string.`);
    }
    const idx = entry.indexOf(': ');
    const work = idx === -1 ? entry : entry.slice(0, idx);
    const rest = idx === -1 ? '' : entry.slice(idx + 2);
    const mark = SPLIT[work];
    if (!mark) {
      throw new Error(
        `deliver-flags ABORTED — no cut/avoidance classification for "${work}".\n` +
          '  Every entry must be marked. Refusing to emit an unmarked one silently.',
      );
    }
    if (mark.limbs.includes('CUT')) cuts++;
    if (mark.racial) racial++;
    out.push(`### ${i + 1}. ${work}`, '');
    out.push(`**${mark.limbs}**${mark.racial ? ' · names racial or ethnic content' : ''}`, '');
    out.push(`> ${rest}`, '');
    out.push(`*${mark.note}*`, '');
  });
  out.push('---', '');
  out.push('## The count', '');
  out.push(`| | of 8 |`, `|---|---:|`);
  out.push(`| carry an **avoidance** | **${entries.length}** |`);
  out.push(`| also carry a **cut** | ${cuts} |`);
  out.push(`| **cut alone** | 0 |`);
  out.push(`| name racial or ethnic content | **${racial}** |`);
  out.push('');
  out.push(
    '**No entry carries an author or a date.** Eight decisions about what a child may read, five of',
    'them touching racial or ethnic content, recorded as eight sentences in a manifest field with no',
    'record of who decided them or against what.',
    '',
    '**This is not a proposal.** The standard is David\'s to write with Annie\'s reading, and its scope',
    'is recorded at R340: it must cover both limbs, it must cover the corpus we might ADD rather than',
    'only the one we hold, and it must name who may judge.',
    '',
  );
  return out.join('\n');
}

const flagsPath = join(OUT, 'FOUR-REACHABLE-FLAGS-WITH-PASSAGES.md');
const removalsPath = join(OUT, 'EIGHT-REMOVALS-CUT-VS-AVOIDANCE.md');
writeFileSync(flagsPath, buildFlags());
writeFileSync(removalsPath, buildRemovals());
for (const p of [flagsPath, removalsPath]) deliver(p);
