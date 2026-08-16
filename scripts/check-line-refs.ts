/**
 * THE LINE-REFERENCE GATE — `pnpm check:line-refs`
 *
 * Resolves every line citation in the English bank against the passage it
 * cites: item stems (structured `lineRefs`, plus any prose citation) and walk
 * scripts (prose citations only — a script has no structured field, which is
 * exactly why its references went unchecked for three rounds).
 *
 * Same policy as the database content gate, for the same reason: a citation
 * on a SERVING item is wrong in front of a child and fails the build; one on
 * a DRAFT item is a queue of work and is reported. The rules themselves live
 * in packages/core/src/line-refs.ts, shared and tested.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkLineRefs, type LineRefFailure, type CitablePassage } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const PASSAGE_DIR = resolve(import.meta.dirname, '../content/passages');

function loadPassages(): Map<string, CitablePassage> {
  const out = new Map<string, CitablePassage>();
  for (const entry of readdirSync(PASSAGE_DIR)) {
    if (!entry.endsWith('.json')) continue;
    const passage = JSON.parse(readFileSync(join(PASSAGE_DIR, entry), 'utf8')) as CitablePassage;
    out.set(passage.id, passage);
  }
  return out;
}

async function main(): Promise<void> {
  const passages = loadPassages();
  const serving: LineRefFailure[] = [];
  const draft: LineRefFailure[] = [];
  let checked = 0;
  let citing = 0;
  /** Bare-string quotes: present, deliberately unplaced, and counted rather than silently skipped. */
  let placeless = 0;

  const items = await prisma.item.findMany({ include: { questionType: true } });
  const absent: string[] = [];
  for (const item of items) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const passageRef = stem.passageRef as string | undefined;
    if (!passageRef) continue;
    checked += 1;
    const passage = passages.get(passageRef);
    // ITEM LEVEL, with the stem as the pre-migration fallback. R77 moved lineRefs off the stem
    // and this gate went on reading `stem.lineRefs` — it found an empty array on every row and
    // silently checked no citations at all, while still printing "146 items citing a passage".
    // A migration that empties a field must be followed to every reader of it.
    const itemRefs = Array.isArray(item.lineRefs) ? (item.lineRefs as number[]) : null;
    const lineRefs = itemRefs ?? (Array.isArray(stem.lineRefs) ? (stem.lineRefs as number[]) : []);
    const gapRef = typeof stem.gapRef === 'number' ? stem.gapRef : undefined;
    /**
     * A BARE STRING IN A QUOTES ARRAY IS A DECLARED CONVENTION, NOT A MALFORMED OBJECT.
     *
     * Cowork's CHECK 8 documents it: a bare string declares A TEXT AND NOT A PLACE, and is checked
     * for PRESENCE ONLY — there is no citation to verify because none was claimed. 63 of them exist
     * across the district; this store holds 10, and every quotes array on both sides is uniformly
     * one shape or the other, never mixed. That consistency is what distinguishes a form from a leak.
     *
     * This gate reported all 10 as "declared quote(s) carry no text" — a reader scoped to one store
     * calling a convention a defect, which is Delivery 51's lesson exactly. The near-miss was
     * NORMALISING them, which would have destroyed the distinction between "quotes this text at
     * these lines" and "quotes this text, claiming no place".
     *
     * A malformed OBJECT — one with no usable `text` — is still a fault, and still fails.
     */
    const rawQuotes = Array.isArray(stem.quotes) ? (stem.quotes as Array<unknown>) : [];
    const placelessQuotes = rawQuotes.filter((q) => typeof q === 'string' && q.trim().length > 0).length;
    const textlessQuotes = rawQuotes.filter(
      (q) => typeof q !== 'string' && (typeof (q as { text?: unknown })?.text !== 'string'
        || !String((q as { text?: unknown }).text).trim()),
    ).length;
    if (textlessQuotes > 0) {
      absent.push(`${item.id}: ${textlessQuotes} declared quote(s) carry no text`);
    }
    // Only PLACED quotes are checked against lines. A bare string declares no place, so verifying
    // it against a line range would be inventing a claim its author did not make.
    const declaredQuotes = rawQuotes
      .filter((q): q is { text: string } =>
        typeof q === 'object' && q !== null && typeof (q as { text?: unknown }).text === 'string'
        && String((q as { text: string }).text).trim().length > 0)
      .map((q) => q.text);
    placeless += placelessQuotes;

    // The prompt is the text every citation in this stem is checked against. Missing is a fault.
    //
    // BOTH NAMES, because the store holds both. This gate read only `stem.prompt` and 96 of 164
    // ENG items carry `stem.text` — the cluster door's name — so it could not check a single one
    // of them. It said so loudly rather than passing them, which is the fixed behaviour working;
    // but a gate that names one of two live field names screens the half it happens to know. That
    // is the same collision class as atLines/lineRefs, one layer down.
    const prompt = typeof stem.prompt === 'string' ? stem.prompt
      : typeof stem.text === 'string' ? stem.text : null;
    if (prompt === null) {
      absent.push(`${item.id}: neither stem.prompt nor stem.text is a string — nothing to check citations against`);
      continue;
    }
    const bucket = item.status === 'LIVE' ? serving : draft;

    // R23 limit 1 — a declared passage NAME must actually be the passage's name. Verified here,
    // against the passage file, exactly as a quotation is. A name we invent for a worked example
    // is our word and gets reworded; declaring it must not be a way to smuggle one past the
    // ceiling. A declaration that does not resolve is REPORTED, never silently honoured.
    const declaredNames = Array.isArray(stem.passageNames)
      ? (stem.passageNames as string[]).filter((n) => typeof n === 'string' && n.trim())
      : [];
    if (declaredNames.length) {
      const body = passage
        ? passage.numberedLines.map((l) => l.text).join(' ').toLowerCase()
        : '';
      for (const name of declaredNames) {
        if (!passage) {
          bucket.push({ where: `item:${item.id} stem.passageNames`, rule: 'line-ref', detail: `declares passage name "${name}" but passage ${passageRef} is missing` });
        } else if (!new RegExp(`\\b${name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(body)) {
          bucket.push({ where: `item:${item.id} stem.passageNames`, rule: 'line-ref', detail: `declares passage name "${name}", which does not appear in ${passageRef}` });
        }
      }
    }

    bucket.push(
      ...checkLineRefs({
        label: `item:${item.id} stem`,
        passageRef,
        passage,
        lineRefs,
        gapRef,
        // ABSENCE FAILS, IT DOES NOT READ AS EMPTY (David, 2026-08-13). This was
        // `(stem.prompt as string) ?? ''`: an item with no prompt handed the citation gate an
        // empty string, which cites nothing, so it passed. This is the gate for the whole
        // citation programme and it was reading a missing prompt as a clean one.
        text: prompt,
        declaredQuotes,
      }),
    );

    const explanation = (item.explanation ?? {}) as Record<string, unknown>;
    for (const field of ['walkScript', 'walk', 'hintCore'] as const) {
      const text = explanation[field];
      if (typeof text !== 'string' || !text.trim()) continue;
      const found = checkLineRefs({ label: `item:${item.id} explanation.${field}`, passageRef, passage, text });
      if (found.length > 0 || /\bline\b/i.test(text)) citing += 1;
      bucket.push(...found);
    }
  }

  requirePopulation('check:line-refs', { passages: passages.size, 'items citing a passage': checked });
  console.log(
    `Line-reference gate: ${passages.size} passages · ${checked} item(s) citing a passage · ` +
      `${citing} explanation field(s) naming a line · ${placeless} placeless quote(s) present-only (Cowork CHECK 8).`,
  );

  // ABSENT FIELDS FAIL. A stem the gate could not read is not a stem the gate cleared, and the
  // count above must not be quoted as coverage of it.
  if (absent.length > 0) {
    console.error(`\n${absent.length} item(s) could not be checked — a field the gate reads is ABSENT:`);
    for (const a of absent) console.error(`  x ${a}`);
    console.error(
      '\nAbsence is not emptiness. These items were skipped, not passed, and the figure above\n' +
        'does not cover them. Fix the stem or withdraw the item; do not default the field.',
    );
    process.exitCode = 1;
  }

  const report = (name: string, failures: LineRefFailure[]): void => {
    if (failures.length === 0) return;
    const byRule = failures.reduce<Record<string, number>>((acc, failure) => {
      acc[failure.rule] = (acc[failure.rule] ?? 0) + 1;
      return acc;
    }, {});
    console.log(
      `\n${name}: ${failures.length} — ` +
        Object.entries(byRule).map(([rule, count]) => `${rule}: ${count}`).join(', '),
    );
    for (const failure of failures) console.log(`  · ${failure.where}: ${failure.detail}`);
  };

  report('DRAFT backlog (not serving, not blocking)', draft);

  if (serving.length > 0) {
    console.error(`\nSERVING content FAILED the line-reference gate (${serving.length}):`);
    for (const failure of serving) console.error(`  ✗ ${failure.where}: ${failure.detail}`);
    console.error('\nA child is being sent to the wrong place. Fix it or take it out of service.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`\n${draft.length === 0 ? 'Every line reference resolves.' : 'Nothing serving cites a bad line.'}`);
  await prisma.$disconnect();
}

void main();
