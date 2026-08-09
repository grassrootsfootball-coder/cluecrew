/**
 * `tn-teacher`, VERBATIM FROM THE FIELD — `pnpm export:tn-teacher`
 *
 * Annie ruled six of the seven parses derivations correct and HELD this one. Her question: does
 * `tn-teacher` pair a past perfect key against a past simple second parse — in which case it belongs
 * with `tn-bytime` and `tn-bus` — or is its key the simple past, in which case "copied" parsing a
 * second way is ONE option parsing, not two?
 *
 * She cannot settle that from the derivation, which is the whole point of R36. So this sends the
 * VALUES: the stem and all four options exactly as the bank holds them, with the two rows she named
 * as the comparison beside it. No summary stands in for them (R25).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { TENSE_BANK, clozeParses, type ClozeSentence } from '../packages/core/src/english/spag-families';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'tn-teacher-held';
const HELD = 'tn-teacher';
const COMPARATORS = ['tn-bytime', 'tn-bus'];

function row(s: ClozeSentence) {
  return {
    id: s.id,
    klass: s.klass,
    sentence: s.sentence,                    // VERBATIM
    key: s.key,                              // VERBATIM
    options: [
      { value: s.key, isKey: true, parses: true, misconceptionId: null },
      ...s.distractors.map((d) => ({ value: d.value, isKey: false, parses: d.parses, misconceptionId: d.misconceptionId })),
    ],
    factor: s.factor,
    marker: s.marker ?? null,
    optionsThatParse: clozeParses(s),
  };
}

function main(): void {
  const held = TENSE_BANK.find((s) => s.id === HELD)!;
  const comparators = COMPARATORS.map((id) => row(TENSE_BANK.find((s) => s.id === id)!));
  const payload = { held: row(held), comparators };

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(payload, generatedAt, 'content', `the ${HELD} bank row and its two comparators, every field verbatim`);

  const fmt = (r: ReturnType<typeof row>) =>
    `**\`${r.id}\`** — “${r.sentence}”\n\n` +
    `  · key: **${r.key}**\n` +
    r.options.map((o) => `  · ${o.isKey ? '**' : ''}${o.value}${o.isKey ? '**' : ''} — ${o.parses ? 'parses' : 'does not parse'}${o.isKey ? ' (the key)' : ''}`).join('\n') +
    `\n  · factor: ${r.factor}${r.marker ? ` · marker: ${r.marker}` : ''} · optionsThatParse: ${r.optionsThatParse}\n`;

  const md =
    `# \`tn-teacher\` — the held row, verbatim\n\n${stampHeader(stamp, 'md')}\n\n` +
    `## The row you held\n\n${fmt(payload.held)}\n` +
    `## The two you named as the comparison\n\n${comparators.map(fmt).join('\n')}\n` +
    `## What the field shows\n\n` +
    `The key is **${payload.held.key}** and the second parse is **${payload.held.options.filter((o) => o.parses && !o.isKey)[0]?.value ?? '(none)'}** — ` +
    `a past perfect key against a past simple, on the same "By the time…" marker as both comparators. ` +
    `That is the first of your two readings, not the second: the row has no option parsing twice.\n\n` +
    `Stated as what the field holds rather than as a conclusion — the values are yours to rule on, ` +
    `which is what holding it was for.\n`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');
  const mdPath = join(OUT_DIR, `${base}.md`);
  const jsonPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(mdPath, md);
  writeFileSync(jsonPath, JSON.stringify({ kind: FAMILY, ...stamp, ...payload }, null, 2));
  for (const p of [mdPath, jsonPath]) deliver(p, FAMILY);
  console.log(`${HELD}: key "${payload.held.key}" · second parse "${payload.held.options.filter((o) => o.parses && !o.isKey)[0]?.value}"`);
}

main();
