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
  /** The container the declaration lives on — `stem` or `explanation`. */
  field: string;
  spanText: string;
}

const key = (d: Declaration) => `${d.itemId} ${d.field}`;
const full = (d: Declaration) => `${key(d)} ${d.spanText}`;

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
        if (spanText.trim().length > 0) out.push({ itemId: item.id, field, spanText: spanText.trim() });
      }
    }
  }
  return out;
}

/** Cowork's set, as delivered. Same refusal discipline: an unknown wrapper throws. */
export function readCoworkSet(path: string): Declaration[] {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { declarations?: unknown }).declarations)
      ? (raw as { declarations: unknown[] }).declarations
      : null;
  if (rows === null) {
    throw new Error(
      `check:declaration-sets ABORTED — cannot read ${path}.\n` +
        "  Expected a top-level array, or an object with a 'declarations' array.\n" +
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
    return { itemId, field, spanText: spanText.trim() };
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
      if (side === 'ours' && theirByKey.has(key(d))) {
        for (const other of theirByKey.get(key(d)) ?? []) {
          console.log(`      they declare: "${other.spanText.slice(0, 80)}"`);
        }
      }
    }
  };

  console.log(
    `check:declaration-sets: compared ${ours.length} declaration(s) here against ${theirs.length} from ${theirPath}.`,
  );
  describe('FIELD DECLARED HERE, NOT DECLARED THERE AT ALL', hereOnly, 'ours');
  describe('FIELD DECLARED THERE, NOT DECLARED HERE AT ALL', thereOnly, 'theirs');
  describe('SAME FIELD, SPAN TEXT WE HOLD AND THEY DO NOT', textDiffersOurs, 'ours');
  describe('SAME FIELD, SPAN TEXT THEY HOLD AND WE DO NOT', textDiffersTheirs, 'theirs');

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
