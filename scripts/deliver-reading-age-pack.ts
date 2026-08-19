/**
 * Build and stage two artefacts for Annie's reading: `stream-a-02-railway-children` on its own, and
 * the fifteen Stream A passages carrying no reading verdict.
 *
 * **NO READABILITY FIGURE IS COMPUTED OR PRINTED ANYWHERE IN EITHER FILE, AND THAT IS HER RULING
 * BEING IMPLEMENTED RATHER THAN RECORDED** (R345). A formula measures DECODING; the §6 band is
 * about COMPREHENSION; they come apart hardest on exactly the modern commissioned prose this
 * product writes for itself. A number printed beside a passage becomes the passage's reading age
 * whatever the column is called, so the pack carries none.
 *
 * The passages are asserted complete against source — a reading-age verdict on a truncated passage
 * is a verdict on a different text.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deliver } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO_ROOT, 'content/passages');

interface Passage {
  file: string;
  id: string;
  title: string;
  work: string | null;
  author: string | null;
  preamble: string | null;
  text: string;
  words: number;
  band: Record<string, unknown> | null;
}

function load(file: string): Passage {
  const j = JSON.parse(readFileSync(join(PASSAGES, file), 'utf8')) as Record<string, unknown>;
  const text = j.text ?? j.extract ?? j.body;
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error(
      `deliver-reading-age-pack ABORTED — ${file} has no readable passage text.\n` +
        "  Expected a string at 'text', 'extract' or 'body'. A reading-age verdict on a passage that\n" +
        '  failed to load would be a verdict on nothing, delivered as a verdict on something.',
    );
  }
  const work = j.work as { title?: string; author?: string } | string | undefined;
  return {
    file,
    id: String(j.id),
    title: String(j.sceneTitle ?? j.title ?? j.id),
    work: typeof work === 'string' ? work : (work?.title ?? null),
    author: typeof work === 'object' ? (work?.author ?? null) : null,
    preamble: typeof j.preamble === 'string' ? j.preamble : null,
    text,
    words: text.split(/\s+/).filter(Boolean).length,
    band: (j.band as Record<string, unknown>) ?? null,
  };
}

function quoted(text: string): string {
  return text
    .split('\n')
    .map((l) => (l.trim() ? `> ${l}` : '>'))
    .join('\n');
}

function assertIntact(body: string, ps: Passage[]): void {
  for (const p of ps) {
    if (!body.includes(quoted(p.text))) {
      throw new Error(`deliver-reading-age-pack ABORTED — ${p.file} did not survive rendering intact.`);
    }
  }
}

/** The two-number verdict shape, proposed and not imposed — it follows from her own evidence. */
const VERDICT_SHAPE = [
  '## The verdict shape — proposed, for you to accept or replace',
  '',
  '**Your two passages are the argument for two numbers rather than one.** Wind in the Willows reads',
  'eleven to thirteen: long stacked sentences and words a Year 6 will not hold — **decoding and',
  'comprehension roughly together**. The commissioned passage has short sentences and plain words:',
  '**decoding nine or ten, comprehension twelve or more**, because almost everything that matters is',
  'implied.',
  '',
  '**A single number cannot hold both, and whichever one it holds, it will be read as the other.** So',
  'the proposal is that each verdict carries:',
  '',
  '| field | what it means |',
  '|---|---|',
  '| `decodingAge` | can a child of this age get the words off the page |',
  '| `comprehensionAge` | can a child of this age understand what the passage is doing |',
  '| `why` | in your words — the gap between them is the interesting part |',
  '',
  '**Where the two are far apart, that gap is a fact about the passage worth keeping**, not a',
  'discrepancy to resolve. It is the whole of what your ruling found.',
  '',
  'Replace this shape if it is wrong. It is a proposal from your evidence, not a decision.',
  '',
];

function buildFifteen(ps: Passage[]): string {
  const out: string[] = [
    '# Fifteen Stream A passages, for reading-age verdicts',
    '',
    '**20 August 2026. For Annie.**',
    '',
    `**${ps.length} passages, every one carrying no reading verdict** — \`authoringRead\` is null on all`,
    'fifteen. The other six Stream A passages have been read and are not in this pack.',
    '',
    '**NO READABILITY FIGURE APPEARS ANYWHERE IN THIS FILE, AND THAT IS DELIBERATE.** Your ruling is',
    'implemented here rather than merely recorded: a formula measures **decoding**, the §6 band is',
    'about **comprehension**, and a number printed beside a passage becomes that passage\'s reading age',
    'whatever the column is called. So there is no number to anchor against — only the text.',
    '',
    '**The `band` shown per passage is the COMMISSIONING band**, declared or ratified when the passage',
    'was chosen. It is a length band with a reading-age range attached to it, not a judgement anyone',
    'made by reading the passage. It is shown so you can see what was assumed; it is not a starting',
    'point to adjust from.',
    '',
    '---',
    '',
    ...VERDICT_SHAPE,
    '---',
    '',
    '# The passages',
    '',
  ];
  ps.forEach((p, n) => {
    out.push(`## ${n + 1}. ${p.title}${p.work ? ` — *${p.work}*` : ''}${p.author ? `, ${p.author}` : ''}`, '');
    out.push(`\`${p.id}\` · ${p.words} words`, '');
    if (p.band) {
      const b = p.band as { band?: string; readingAge?: string; basis?: string };
      out.push(
        `*Commissioning band: ${b.band ?? '—'}, stated as ${b.readingAge ?? '—'} (${b.basis ?? '—'}). ` +
          'Assumed at commission, not read.*',
        '',
      );
    }
    if (p.preamble) out.push(`**Preamble the child sees:** ${p.preamble}`, '');
    out.push(quoted(p.text), '', '---', '');
  });
  const body = out.join('\n');
  assertIntact(body, ps);
  return body;
}

function buildRailway(p: Passage): string {
  const out: string[] = [
    '# `stream-a-02-railway-children` — an UNJUDGED passage, with its passage complete',
    '',
    '**20 August 2026. For Annie.**',
    '',
    '**This passage carries ZERO content flags, and that is why it is here on its own.**',
    '',
    '**An empty flag list and an unread passage are the same value.** Twenty-five of the twenty-six',
    'flagged passages carry between one and five flags; this one carries none. That is either a',
    'considered verdict — nothing in it needs flagging — or it was never screened, and **nothing in the',
    'file distinguishes those two.** `contentFlags: []` is a legitimate value, so nothing reports it.',
    '',
    '**It is not being flagged here.** A flag written now by anyone on this side would be a machine or',
    'an agent putting a judgement into a field that reads as a reviewer\'s (R94). It goes to you as an',
    'unjudged passage, and the verdict — including "nothing to flag", which is a real verdict — is',
    'yours.',
    '',
    '**It also carries no reading verdict**, so it appears in the fifteen-passage pack as well. Two',
    'different questions about one passage, deliberately not merged: whether anything in it needs',
    'flagging, and what age can read it.',
    '',
    '---',
    '',
  ];
  out.push(`## ${p.title}${p.work ? ` — *${p.work}*` : ''}${p.author ? `, ${p.author}` : ''}`, '');
  out.push(`\`${p.id}\` · \`${p.file}\` · ${p.words} words · ${p.text.length} characters`, '');
  if (p.preamble) out.push(`**Preamble the child sees:** ${p.preamble}`, '');
  out.push('', '### The passage in full', '', quoted(p.text), '');
  const body = out.join('\n');
  assertIntact(body, [p]);
  return body;
}

const files = readdirSync(PASSAGES)
  .filter((f) => f.startsWith('stream-a') && f.endsWith('.json'))
  .sort();

const unread = files
  .map(load)
  .filter((p) => {
    const j = JSON.parse(readFileSync(join(PASSAGES, p.file), 'utf8')) as Record<string, unknown>;
    return j.authoringRead === undefined || j.authoringRead === null;
  });

requirePopulation('deliver:reading-age-pack', {
  'Stream A passage file(s)': files.length,
  'without a reading verdict': unread.length,
});

if (unread.length !== 15) {
  throw new Error(
    `deliver-reading-age-pack ABORTED — expected 15 passages without a reading verdict, found ${unread.length}.\n` +
      '  The pack is addressed to a named population; delivering a different one under the same name\n' +
      '  is how a reviewer ends up reading a set nobody described.',
  );
}

const railway = unread.find((p) => p.id === 'stream-a-02-railway-children');
if (!railway) throw new Error('deliver-reading-age-pack ABORTED — railway-children not among the unread fifteen.');

const packPath = join(REPO_ROOT, 'content/exports/FIFTEEN-PASSAGES-READING-AGE.md');
const railPath = join(REPO_ROOT, 'content/exports/RAILWAY-CHILDREN-UNJUDGED.md');
writeFileSync(packPath, buildFifteen(unread));
writeFileSync(railPath, buildRailway(railway));
for (const p of [railPath, packPath]) deliver(p);
