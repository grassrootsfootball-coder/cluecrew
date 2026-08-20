/**
 * DO THE TWO STORES DECLARE THE SAME QUOTED SPANS? (David, 2026-08-20 — R341, opening D3.)
 *
 * Both gates key on a DECLARED quoted span and neither store can see the other's declarations.
 * R339 measured the consequence: four texts here have their pass/fail decided by the declaration
 * alone, swinging 11 to 14 words, one of them LIVE. Cowork held a declaration we did not; **both
 * gates were correct and were reading different rows.** Converging the counting rule does not
 * touch that, because the arithmetic decides nothing and the declaration decides everything.
 *
 * **THE FOUR ARE NOT THE POPULATION — THEY ARE THE ONES THAT HAPPEN TO SIT AT A CAP BOUNDARY.**
 * A divergence where the text is comfortably short passes on both sides today and is no less a
 * divergence; it is simply one whose consequence has not been drawn yet. So every divergence is
 * reported, and each is classified by whether it changes a verdict NOW (ACTIVE) or agrees for no
 * reason (LATENT). **A latent divergence becomes active the day someone edits the sentence** —
 * which is a normal thing to do to a stem, and nothing would connect the edit to the refusal.
 *
 * **BOTH DIRECTIONS** (R88, R167): here-not-there, there-not-here, and the third class a
 * one-directional diff misses entirely — SAME item and field, DIFFERENT span text. That one is the
 * worst of the three, because both stores believe they have declared the same thing.
 *
 * **WHEN COWORK'S SET HAS NOT ARRIVED THIS REPORTS NOT RECEIVED, NEVER "0 DIVERGENCES"** (R60).
 * A comparison with nothing to compare against is the archetype of a check that goes blind and
 * prints a green number. It does not FAIL, on check:staging-queue's precedent: a missing inbound
 * artefact is a fact about a human upload channel, not a defect in a commit, and a red CI run on
 * someone else's backlog is switched off within a week. What it must never do is stay invisible.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { textsFrom } from '../packages/core/src/item-content-gate';
import { prisma } from '../packages/db/src/index';
import { deliver, OUTBOUND_DIR } from './lib/export-destination';

const MAX_SENTENCE_WORDS = 16;

/** Repo root from THIS FILE, never `process.cwd()` — pnpm --filter runs this from `packages/db`. */
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export interface Declaration {
  itemId: string;
  /** The container the declaration lives on — `stem` or `explanation`. The JOIN KEY. */
  field: string;
  /**
   * The path exactly as the emitting store wrote it, before normalisation. Carried so the join can
   * normalise WITHOUT the normalisation being invisible — see `reportDepth`.
   */
  fieldPath: string;
  spanText: string;
}

const key = (d: Declaration) => `${d.itemId} ${d.field}`;
const full = (d: Declaration) => `${key(d)} ${d.spanText}`;

/** Segments in a dotted/indexed field path: `stem` -> 1, `stem.quotes[0].text` -> 3. */
const depthOf = (fieldPath: string) => fieldPath.split(/[.[]/).filter(Boolean).length;

/**
 * **THE JOIN COMPARES CONTAINERS, AND SAYS SO WHENEVER THAT LOSES INFORMATION** (David's question,
 * 2026-08-20 — R351, settled BEFORE the first join rather than after it reported).
 *
 * Both stores emit depth 1 today: ours by CONSTRUCTION (`field` comes from a literal two-element
 * loop and cannot be deeper without a code change), Cowork's by OBSERVATION across its 97 rows. So
 * the choice is being made on data that does not yet exercise it, and it can only be made safely by
 * making the losing case LOUD rather than by picking the option that looks more precise.
 *
 * **Joining on the FULL PATH is wrong**: our side cannot emit one, so every deeper path the other
 * store ever sends becomes a field neither absent-here nor absent-there but simply unmatched — the
 * 314-divergence failure of R348, arriving one level down.
 *
 * **Joining on the CONTAINER is right today and has the inverse risk**: `stem.text` and
 * `stem.prompt` collapse to one key, so a span declared against a DIFFERENT sub-field reads as the
 * same field. **That silently converts a class-1 or class-2 divergence into class 3, or into
 * agreement — and class 3 is what the whole check exists to catch.**
 *
 * So: normalise for the join, carry `fieldPath` unnormalised on every row, and report the moment
 * either side emits depth > 1. **A normalisation nobody can see is indistinguishable from data that
 * never needed it.**
 */
function reportDepth(rows: readonly Declaration[], side: string): number {
  const deep = rows.filter((d) => depthOf(d.fieldPath) > 1);
  if (deep.length === 0) return 0;
  console.log(
    `\nDEEPER-THAN-CONTAINER PATHS (${side}): ${deep.length}\n` +
      '  The join compares CONTAINERS, so these were matched on their first segment and any\n' +
      '  sub-field distinction was discarded. Two spans on different sub-fields of one container\n' +
      '  are indistinguishable to this comparison, which can hide an absence or manufacture a\n' +
      '  same-field-different-text finding. **The divergence counts below are not trustworthy for\n' +
      '  these rows until the join key is ruled on.**',
  );
  for (const d of deep.slice(0, 20)) console.log(`  ${d.itemId}  ${d.fieldPath}  ->  joined as ${d.field}`);
  if (deep.length > 20) console.log(`  … and ${deep.length - 20} more`);
  return deep.length;
}

/**
 * The emission's own shape, DERIVED AT WRITE TIME BY THE SAME WALK THAT PRODUCED THE ROWS
 * (Cowork's proposal, adopted both sides — R352).
 *
 * **A shape block computed from the rows cannot drift from the rows.** An announcement in a message
 * can: it is written once, by hand, about data that changes afterwards, and it is read by whoever
 * happened to receive that message. This is read off the artefact itself, so it survives a reader
 * who never saw the announcement — which is every future reader.
 *
 * Nothing here is hand-listed. Key names come from the rows' own keys; the depth histogram and the
 * distinct paths come from the values.
 */
function derivedShape(rows: readonly Declaration[]): Record<string, unknown> {
  const keys = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) keys.add(k);
  const depths: Record<string, number> = {};
  const paths = new Set<string>();
  for (const r of rows) {
    paths.add(r.fieldPath);
    const d = String(depthOf(r.fieldPath));
    depths[d] = (depths[d] ?? 0) + 1;
  }
  return {
    derivedBy: 'check-declaration-sets.ts — the same walk that produced the rows, at write time',
    whyDerived:
      'A shape computed from the rows cannot drift from the rows. An announcement in a message can, ' +
      'and is only known to whoever read that message.',
    rowCount: rows.length,
    rowKeys: [...keys].sort(),
    distinctItems: new Set(rows.map((r) => r.itemId)).size,
    fieldPathDepths: depths,
    distinctFieldPaths: [...paths].sort(),
    joinKey: 'itemId + first segment of the field path (the CONTAINER)',
    joinKeyCaveat:
      'Sub-field distinctions below the container are discarded by the join. Both stores emit ' +
      'depth 1 today; a deeper path is reported, never silently normalised.',
    spanTextEncoding: 'exact substring of some text on the container, whitespace-trimmed at both ends',
  };
}

/**
 * A quote entry is EITHER a bare string OR an object carrying `text`. Both shapes are live in this
 * store — 62 bare strings and 22 objects on `stem.quotes` alone — and anything else THROWS naming
 * what it expected (R173). An unreadable entry silently becoming an empty string would report a
 * declaration as ABSENT, which is precisely the finding this check exists to make.
 */
function spanTextOf(entry: unknown, where: string): string {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object' && typeof (entry as { text?: unknown }).text === 'string') {
    return (entry as { text: string }).text;
  }
  throw new Error(
    `check:declaration-sets ABORTED — unreadable quote entry at ${where}.\n` +
      `  Expected a string, or an object with a string 'text'. Got: ${JSON.stringify(entry)?.slice(0, 120)}.\n` +
      '  Refusing rather than returning empty: an unparsed declaration reads as an ABSENT one, and\n' +
      '  absent-versus-present is the entire subject of this comparison.',
  );
}

/** This store's declaration set, derived by SCANNING the rows (R57) — never a hand-kept list. */
export async function ourDeclarationSet(): Promise<Declaration[]> {
  const items = await prisma.item.findMany({ select: { id: true, stem: true, explanation: true } });
  const out: Declaration[] = [];
  for (const item of items) {
    for (const field of ['stem', 'explanation'] as const) {
      const quotes = (item[field] as { quotes?: unknown } | null)?.quotes;
      if (quotes === undefined || quotes === null) continue;
      if (!Array.isArray(quotes)) {
        throw new Error(
          `check:declaration-sets ABORTED — ${item.id}.${field}.quotes is ${typeof quotes}, not an array.`,
        );
      }
      for (const entry of quotes) {
        const spanText = spanTextOf(entry, `${item.id}.${field}.quotes`);
        // `field` is a literal from the loop above, so OUR depth is 1 by construction — recorded
        // as `fieldPath` all the same, because "it cannot happen" is not a thing an artefact says.
        if (spanText.trim().length > 0) {
          out.push({ itemId: item.id, field, fieldPath: field, spanText: spanText.trim() });
        }
      }
    }
  }
  return out;
}

/**
 * **A FIELD PATH IS NORMALISED TO ITS CONTAINER.** Cowork's set uses DOTTED PATHS
 * (`stem.text`, `explanation.walkScript`, `stem.quotes[0].text`); ours keys on the container the
 * declaration lives on (`stem`, `explanation`). Both name the same thing at different depths.
 *
 * **Left unnormalised this would have reported every one of their 97 spans as a divergence** — a
 * check whose first real run accuses the other store of holding nothing in common, which is the
 * shape of R173: a reader that cannot parse, reporting a fact about the content. The consequence
 * runs the other way too, and is worse: our 157 would ALL read as absent from theirs, and the
 * headline would be total disagreement between two stores that may largely agree.
 */
function containerOf(fieldPath: string): string {
  return fieldPath.split(/[.[]/)[0].trim();
}

/** Cowork's set, as delivered. Same refusal discipline: an unknown wrapper throws. */
export function readCoworkSet(path: string): Declaration[] {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
  // Row-carrying keys we have actually seen, in the order we prefer them. `spans` is Cowork's
  // (2026-08-20); `declarations` is ours. A new one is ADDED here after being seen, never guessed —
  // and an unrecognised wrapper still throws naming what it got, which is how this file was read
  // correctly on its first arrival instead of reporting 97 phantom absences.
  const ROW_KEYS = ['declarations', 'spans'] as const;
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object'
      ? (ROW_KEYS.map((k) => (raw as Record<string, unknown>)[k]).find(Array.isArray) as unknown[] | undefined) ?? null
      : null;
  if (rows === null) {
    throw new Error(
      `check:declaration-sets ABORTED — cannot read ${path}.\n` +
        `  Expected a top-level array, or an object carrying one of: ${ROW_KEYS.join(', ')}.\n` +
        `  Got top-level keys: ${raw && typeof raw === 'object' ? Object.keys(raw).join(', ') : typeof raw}.`,
    );
  }
  return rows.map((r, n) => {
    const o = r as Record<string, unknown>;
    const itemId = o.itemId ?? o.item_id ?? o.id;
    const field = o.field ?? o.container;
    const spanText = o.spanText ?? o.span_text ?? o.text ?? o.span;
    if (typeof itemId !== 'string' || typeof field !== 'string' || typeof spanText !== 'string') {
      throw new Error(
        `check:declaration-sets ABORTED — row ${n} of ${path} is not a declaration.\n` +
          '  Expected string itemId, field and spanText. Got: ' + JSON.stringify(r)?.slice(0, 160),
      );
    }
    return { itemId, field: containerOf(field), fieldPath: field, spanText: spanText.trim() };
  });
}

/** Longest sentence in `text`, counting each declared span present as one unit (R337). */
function longestSentence(text: string, spans: readonly string[]): number {
  let t = text;
  for (const s of spans) {
    if (s.length >= 3 && t.includes(s)) t = t.split(s).join(' quotation ');
  }
  return Math.max(
    0,
    ...t
      .split(/[.!?]/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((s) => s.split(/\s+/).filter(Boolean).filter((w) => /[a-z]/i.test(w)).length),
  );
}

/**
 * Does this divergence change a verdict today? ACTIVE if the cap says different things with and
 * without the span on ANY text of the container; LATENT if every text agrees — which is agreement
 * by sentence length, not by rule.
 *
 * **THIS CALLS THE GATE'S OWN `textsFrom` RATHER THAN NAMING THE FIELDS IT EXPECTS** (R41: a
 * verifier states its source before it runs; R57: never re-list the fields a door reads). The first
 * version read `container.text`, which explanation does not have — its child-facing strings are
 * `hintCore` and `walkScript` — so every explanation-side declaration was labelled *"TEXT NOT IN
 * THIS STORE"*. **That is a claim about the STORE reporting a fact about my READ**, R173's shape,
 * inside the check written to close the divergence R339 found. Fault injection caught it; nothing
 * else would have, because the label sat beside three correctly-found faults.
 */
export function consequenceOf(
  container: unknown,
  spanText: string,
): 'ACTIVE' | 'LATENT' | 'SPAN IN NO TEXT ON THIS CONTAINER' {
  const texts = textsFrom(container, '')
    .filter(([path]) => !path.split('.').some((seg) => seg.startsWith('_previous')))
    .map(([, t]) => t)
    .filter((t) => t.includes(spanText));
  if (texts.length === 0) return 'SPAN IN NO TEXT ON THIS CONTAINER';
  for (const text of texts) {
    const withIt = longestSentence(text, [spanText]) > MAX_SENTENCE_WORDS;
    const without = longestSentence(text, []) > MAX_SENTENCE_WORDS;
    if (withIt !== without) return 'ACTIVE';
  }
  return 'LATENT';
}

/** Their emission's own shape block, if it carries one. Absent is a fact, not a failure. */
function coworkShape(path: string): Record<string, unknown> | null {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const s = (raw as { shape?: unknown }).shape;
    if (s && typeof s === 'object') return s as Record<string, unknown>;
  }
  return null;
}

/** Inbound artefacts land here. Derived by scanning, never hand-listed (R57). */
function inboundDirs(): string[] {
  const root = '/Users/davidb/Downloads';
  const eleven = join(root, '11+');
  const subs = (() => {
    try {
      return readdirSync(eleven)
        .map((d) => join(eleven, d))
        .filter((d) => {
          try {
            return statSync(d).isDirectory();
          } catch {
            return false;
          }
        })
        .filter((d) => !d.endsWith('from-cluecrew'));
    } catch {
      return [];
    }
  })();
  return [root, eleven, ...subs];
}

function findCoworkSet(): string | null {
  for (const dir of inboundDirs()) {
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const n of names) {
      if (/declaration.*set|declared.*span|span.*declaration/i.test(n) && n.endsWith('.json')) {
        return join(dir, n);
      }
    }
  }
  return null;
}

async function main() {
  const ours = await ourDeclarationSet();
  const items = await prisma.item.findMany({
    select: { id: true, stem: true, explanation: true, status: true },
  });
  // The whole container is carried, not one field of it — `consequenceOf` calls the gate's own
  // reader over it. Absence from this map means the ITEM is not in this store, which is a
  // different fact from a span matching no text on a container that IS here.
  const containerFor = new Map<string, { container: unknown; status: string }>();
  for (const i of items) {
    for (const field of ['stem', 'explanation'] as const) {
      if (i[field] !== null && i[field] !== undefined) {
        containerFor.set(`${i.id} ${field}`, { container: i[field], status: i.status });
      }
    }
  }

  // THE RETURN LEG TRAVELS WHETHER OR NOT THEIRS HAS (R88). Ours is exported on every run, so the
  // comparison is never blocked on both sides at once.
  //
  // **STAGED THROUGH `deliver()`, NOT WRITTEN INTO THE OUTBOUND FOLDER** (R255/R265). The first
  // version of this line did the latter, which put a file there with no staging record and no byte
  // digest for the other store to quote back — an artefact that cannot be verified as arrived in
  // either direction. That is the same fault as reporting "sent" for a `cp`, one level up: the
  // mechanism was available and not used.
  const localPath = join(REPO_ROOT, 'content/exports/declaration-set-cluecrew.json');
  writeFileSync(
    localPath,
    JSON.stringify(
      {
        note: 'Every quoted span declared in the ClueCrew store, for both-directions comparison (R341).',
        shape: derivedShape(ours),
        count: ours.length,
        declarations: [...ours].sort((a, b) => full(a).localeCompare(full(b))),
      },
      null,
      2,
    ) + '\n',
  );
  const outPath = existsSync(OUTBOUND_DIR) ? deliver(localPath) : localPath;

  // An explicit path overrides the scan, so the fault-injection below can prove this check bites
  // without writing a synthetic artefact into the shared inbound channel.
  const theirPath = process.argv[2] ?? findCoworkSet();
  if (theirPath === null) {
    console.log(
      "check:declaration-sets: COWORK'S SET HAS NOT ARRIVED — NOT RECEIVED, which is NOT '0 divergences'.\n" +
        `  This store declares ${ours.length} span(s) across ${new Set(ours.map(key)).size} field(s).\n` +
        '  NOTHING WAS COMPARED. A comparison with one side missing asserts nothing at all, and the\n' +
        '  only wrong thing this run could do is print a number that reads like agreement.\n' +
        `  Ours is exported regardless: ${outPath}\n` +
        '  Owed by Cowork: item id, field, span text. Reporting rather than failing — a missing\n' +
        '  inbound artefact is a fact about a human upload channel, not a defect in a commit.',
    );
    await prisma.$disconnect();
    return;
  }

  const theirs = readCoworkSet(theirPath);
  const ourFull = new Set(ours.map(full));
  const theirFull = new Set(theirs.map(full));
  const ourByKey = new Map<string, Declaration[]>();
  const theirByKey = new Map<string, Declaration[]>();
  for (const d of ours) ourByKey.set(key(d), [...(ourByKey.get(key(d)) ?? []), d]);
  for (const d of theirs) theirByKey.set(key(d), [...(theirByKey.get(key(d)) ?? []), d]);

  /**
   * **THE THIRD CLASS IS SYMMETRIC, AND THE FIRST VERSION MADE IT ONE-WAY** — the exact fault it
   * exists to catch, one level up. It read `textDiffers` from OUR side only, so a span COWORK
   * declares on a field we also declare, where our own spans all match, fell through every filter:
   * not `hereOnly` (they have the key), not `thereOnly` (we have the key), not `textDiffers` (our
   * spans were all present in theirs). **A field both stores declare is exactly where a one-way
   * read looks complete**, which is why the class is worse than either absence.
   *
   * So the comparison is a set difference on span text IN BOTH DIRECTIONS, per field.
   */
  const hereOnly = ours.filter((d) => !theirByKey.has(key(d)));
  const thereOnly = theirs.filter((d) => !ourByKey.has(key(d)));
  const textDiffersOurs = ours.filter((d) => theirByKey.has(key(d)) && !theirFull.has(full(d)));
  const textDiffersTheirs = theirs.filter((d) => ourByKey.has(key(d)) && !ourFull.has(full(d)));

  const describe = (label: string, rows: Declaration[], side: 'ours' | 'theirs') => {
    console.log(`\n${label}: ${rows.length}`);
    for (const d of rows) {
      const c = containerFor.get(key(d));
      const consequence = c ? consequenceOf(c.container, d.spanText) : 'ITEM NOT IN THIS STORE';
      const status = c ? c.status : '—';
      console.log(`  [${consequence}] ${d.itemId}.${d.field} (${status})`);
      console.log(`      ${side === 'ours' ? 'we declare' : 'they declare'}: "${d.spanText.slice(0, 80)}"`);
      /**
       * **ONLY PRINT THE OTHER SIDE'S SPAN WHEN IT IS GENUINELY ABSENT HERE.**
       *
       * The first version printed every span the other store held on the same field, directly
       * beneath ours. On the real data that rendered as *we declare "trotted as one trots…" /
       * they declare "exciting stories"* — which reads as two stores disagreeing about one
       * span, and is nothing of the kind: both spans are ours, on a field where they hold one
       * and we hold two. **Every one of the six looked like a conflict and none was.**
       *
       * A true one-sided extra is a real finding; a rival-versions display is a manufactured
       * one, and it is manufactured in the class the check exists to catch.
       */
      const counterparts = (theirByKey.get(key(d)) ?? []).filter((o) => !ourFull.has(full(o)));
      if (side === 'ours' && counterparts.length > 0) {
        for (const other of counterparts) {
          console.log(`      they declare, and we do NOT hold it: "${other.spanText.slice(0, 80)}"`);
        }
      }
    }
  };

  console.log(
    `check:declaration-sets: compared ${ours.length} declaration(s) here against ${theirs.length} from ${theirPath}.`,
  );

  /**
   * **SHAPE BEFORE ROWS** (R352). If the two emissions disagree about their own structure, every
   * row-level number below is a consequence of that disagreement rather than a finding about
   * content — and reporting divergences first would present a structural mismatch as a content
   * dispute, which is the most expensive way for two stores to argue.
   */
  const theirShape = coworkShape(theirPath);
  if (theirShape === null) {
    console.log(
      '\n  Their emission carries NO derived shape block. Ours does. Row comparison proceeds, but\n' +
        '  nothing on their side states its own structure, so a change to it would arrive silently.',
    );
  } else {
    const ourShape = derivedShape(ours);
    const differing = ['rowKeys', 'fieldPathDepths', 'distinctFieldPaths', 'joinKey']
      .filter((k) => JSON.stringify(theirShape[k]) !== JSON.stringify(ourShape[k]) && theirShape[k] !== undefined);
    console.log(
      differing.length === 0
        ? '\n  SHAPE AGREES on every field both emissions declare.'
        : `\n  SHAPE DIFFERS on: ${differing.join(', ')} — read this before the row counts below.`,
    );
    for (const k of differing) {
      console.log(`    ${k}\n      ours:   ${JSON.stringify(ourShape[k])}\n      theirs: ${JSON.stringify(theirShape[k])}`);
    }
  }

  const deepOurs = reportDepth(ours, 'ours');
  const deepTheirs = reportDepth(theirs, 'theirs');
  if (deepOurs === 0 && deepTheirs === 0) {
    console.log(
      '\n  Field paths: all depth 1 on both sides, so the container join discards nothing. Ours is\n' +
        '  depth 1 BY CONSTRUCTION and theirs by observation — the second can change without notice.',
    );
  }
  describe('FIELD DECLARED HERE, NOT DECLARED THERE AT ALL', hereOnly, 'ours');
  describe('FIELD DECLARED THERE, NOT DECLARED HERE AT ALL', thereOnly, 'theirs');
  describe('SAME FIELD, AN EXTRA SPAN HELD HERE ONLY', textDiffersOurs, 'ours');
  describe('SAME FIELD, AN EXTRA SPAN HELD THERE ONLY', textDiffersTheirs, 'theirs');

  const active = [...hereOnly, ...textDiffersOurs, ...textDiffersTheirs].filter((d) => {
    const c = containerFor.get(key(d));
    return c ? consequenceOf(c.container, d.spanText) === 'ACTIVE' : false;
  }).length;
  const total = hereOnly.length + thereOnly.length + textDiffersOurs.length + textDiffersTheirs.length;
  console.log(
    `\nTOTAL DIVERGENCES: ${total} — ${active} ACTIVE (a verdict differs today), ${total - active} LATENT or unmeasurable here.\n` +
      '  A LATENT divergence is two gates agreeing by sentence length, not by rule. It becomes\n' +
      '  ACTIVE the moment someone edits the sentence, and nothing would connect the edit to the\n' +
      '  refusal that follows.',
  );
  /**
   * **FAILS ON ACTIVE, REPORTS ON LATENT.** An ACTIVE divergence is a present fault: the two gates
   * return different verdicts on the same row today, so one store is refusing an item the other
   * serves. A LATENT one is a fault waiting for a sentence to be edited — real, worth seeing, and
   * NOT something to redden a build over, because clearing it needs Cowork to act and a red run on
   * someone else's queue is switched off within a week (check:staging-queue's finding).
   */
  await prisma.$disconnect();
  if (active > 0) process.exitCode = 1;
}

if (process.argv[1]?.endsWith('check-declaration-sets.ts')) void main();
