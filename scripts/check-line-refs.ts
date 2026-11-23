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
import {
  checkAttractorDefeater,
  checkLineRefs,
  quoteLinesOutsideWindow,
  type CitablePassage,
  type LineRefFailure,
} from '@cluecrew/core';
import { CHECK_GOVERNS, checkGoverns, kindOfItem } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { declareMayBeEmpty, requirePopulation } from './lib/population';

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
  /** CHECK 11 violations: a quote span reaching outside its item's window. */
  let containmentFailures = 0;
  /** Quote spans actually screened for containment — a zero here is not a pass. */
  let containmentChecked = 0;
  /** Addendum 36 pairs actually screened, and the rules they broke. */
  let adChecked = 0;
  let adFailures = 0;

  const items = await prisma.item.findMany({ include: { questionType: true, options: { orderBy: { id: 'asc' } } } });
  const absent: string[] = [];
  /**
   * THE THREE CAUSES, COUNTED APART (R165). This loop opened `if (!passageRef) continue` and skipped
   * 18 of ENG-003's items in silence — not exempt, not unscreened, named nowhere. `continue` is the
   * `|| true` of a loop body.
   *
   * NOT APPLICABLE is now a stated verdict, from the declared kind: this check governs
   * `comprehension` only, and a SPaG item is outside its remit BY DECLARATION rather than by
   * falling through a guard.
   */
  const notApplicable: string[] = [];
  const inScopeCitingNothing: string[] = [];
  for (const item of items) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const passageRef = stem.passageRef as string | undefined;
    // KIND FIRST. A check absent from the map governs everything; this one declares comprehension.
    if (item.id.startsWith('ENG-') && !checkGoverns('check:line-refs', kindOfItem(item.id))) {
      notApplicable.push(item.id);
      continue;
    }
    if (!passageRef) continue;
    checked += 1;
    // IN THE POPULATION AND VERIFYING NOTHING. Counted apart from an item that cites and resolves —
    // the headline called all 354 "items citing a passage" while 313 cited anything.
    const citesLines = (Array.isArray(item.lineRefs) && (item.lineRefs as unknown[]).length > 0)
      || (Array.isArray(stem.lineRefs) && (stem.lineRefs as unknown[]).length > 0);
    if (!citesLines) inScopeCitingNothing.push(item.id);
    const passage = passages.get(passageRef);
    // ITEM LEVEL, with the stem as the pre-migration fallback. R77 moved lineRefs off the stem
    // and this gate went on reading `stem.lineRefs` — it found an empty array on every row and
    // silently checked no citations at all, while still printing "146 items citing a passage".
    // A migration that empties a field must be followed to every reader of it.
    const itemRefs = Array.isArray(item.lineRefs) ? (item.lineRefs as number[]) : null;
    const lineRefs = itemRefs ?? (Array.isArray(stem.lineRefs) ? (stem.lineRefs as number[]) : []);
    // gapIndex is the ruled name (R209); gapRef accepted while any old artefact still carries it.
    const gapRef = typeof stem.gapIndex === 'number' ? stem.gapIndex
      : typeof stem.gapRef === 'number' ? stem.gapRef : undefined;
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
    // CHECK 11 — CONTAINMENT, NOT EQUALITY. The quote span must sit INSIDE the item window; the
    // two are different facts and agreed on six items by coincidence.
    for (const q of rawQuotes) {
      if (typeof q !== 'object' || q === null) continue;
      const qr = (q as { lineRefs?: unknown }).lineRefs;
      if (lineRefs.length && Array.isArray(qr) && qr.length) containmentChecked += 1;
      const outside = quoteLinesOutsideWindow(lineRefs, Array.isArray(qr) ? (qr as number[]) : null);
      if (outside.length > 0) {
        containmentFailures += 1;
        bucket.push({
          where: `item:${item.id} stem.quotes`,
          rule: 'quote-span-not-contained',
          detail: `quote cites line(s) ${outside.join(', ')}, which are outside the item window ${lineRefs.join(', ')}`,
        });
      }
    }

    /**
     * `bucket` IS DECLARED HERE BECAUSE THE ADDENDUM 36 LOOP BELOW USES IT.
     *
     * It was declared 26 lines further down, after this loop — a temporal dead zone, so
     * `check:line-refs` THREW on its first item and **has not run since commit 30d5f33**, the
     * commit that added the Addendum 36 loop. It is in CI, and a crashing step is not a passing
     * one; nothing reported it because the failure was a stack trace rather than a finding.
     *
     * Found while deferring passage-citation verification TO this check (R152) — which is the
     * only reason anyone ran it.
     */
    const bucket = item.status === 'LIVE' ? serving : draft;

    // ADDENDUM 36 — the attractor/defeater pair on each option's execution note.
    for (const o of item.options) {
      if (o.attractorLine == null && o.defeaterLine == null) continue;
      adChecked += 1;
      for (const reason of checkAttractorDefeater({
        itemLineRefs: lineRefs, attractorLine: o.attractorLine, defeaterLine: o.defeaterLine, defeatedByAbsence: o.defeatedByAbsence, windowClass: o.windowClass,
      })) {
        adFailures += 1;
        bucket.push({ where: `item:${item.id} option ${o.id}`, rule: 'attractor-defeater', detail: reason });
      }
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

  requirePopulation('check:line-refs', { passages: passages.size, 'items with a passage': checked });
  /**
   * THREE CAUSES, THREE LINES (David's ruling, 2026-08-17). The headline called all 354 "items
   * citing a passage" when 313 cited anything, 41 were in the population citing nothing, and 18
   * were outside it without a word.
   */
  const actuallyCiting = checked - inScopeCitingNothing.length;
  console.log(
    `Line-reference gate: ${passages.size} passages · ${checked} item(s) carrying a passage, `
    + `of which ${actuallyCiting} CITE LINES this gate can verify.`,
  );
  console.log(
    `  ${inScopeCitingNothing.length} in scope and CITING NOTHING — carried a passageRef, cited no `
    + 'line, so nothing about them was verified here.',
  );
  console.log(
    `  ${notApplicable.length} NOT APPLICABLE by declared kind — this check governs `
    + `${(CHECK_GOVERNS['check:line-refs'] ?? ['every kind']).join(', ')}, and these are outside it `
    + 'BY DECLARATION rather than by falling through a guard.',
  );
  console.log(
    `  ${citing} explanation field(s) naming a line · ${placeless} placeless quote(s) present-only (Cowork CHECK 8).`,
  );
    console.log(
      `  CHECK 11 containment: ${containmentChecked} quote span(s) screened against an item window · `
      + `${containmentFailures} reaching outside it`
      + (containmentChecked === 0 ? ' — NOTHING WAS SCREENED, so this asserts nothing.' : '.'),
  );

  // R61: a population that may LEGITIMATELY be empty says so once, in writing, with the reason,
  // printed on every empty run so a temporary gap cannot decay into a green tick.
  declareMayBeEmpty(
    'Addendum 36 attractor/defeater',
    'options carrying an attractor/defeater pair',
    adChecked,
    'The columns landed 2026-08-16 and the backfill is scoped separately — no option carries a pair '
      + 'yet. Remove this declaration the moment the first one does.',
  );
  if (adFailures > 0) {
    console.log(`  Addendum 36: ${adFailures} broken rule(s) across ${adChecked} screened pair(s).`);
  }

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
