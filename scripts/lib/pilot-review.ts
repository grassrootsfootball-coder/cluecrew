/**
 * THE ONE SANCTIONED WRITE PATH FOR PILOT CONTENT UNDER ACTIVE REVIEW.
 * David's ruling, 2026-08-11, after a hand-edit to `ENG-004-anne-green-gables.json` reached the
 * right content by coincidence, not by control — the file changed with no actor attached at all,
 * and a hand-edit was indistinguishable from that. Her diagnosis stands: harmless this time is not
 * a control.
 *
 * WHAT THIS CLOSES. Before this, "the file" meant two loose copies in ~/Downloads/11+ with no
 * history, no diff, no author, and no gate — editable by anything with a text editor. There is now
 * exactly one writable copy, and it can only be written through the functions below:
 *
 *   1. It lives in git (`content/pilot-review/`), so every change has a commit, an author, a diff.
 *   2. It is chmod 444 (read-only) at rest. The functions here are the only code that chmods it
 *      writable, and only for the duration of one write. A hand-edit — Read/Write, a stray Python
 *      script, anything outside this file — gets EPERM, not a silent, undetectable change.
 *   3. Every JSON write re-runs the child-facing gate on every item in the batch, through the SAME
 *      `checkItemChildFacing` the generator and the publish doors call (R42) — a ruling cannot
 *      apply text the platform would refuse to serve.
 *   4. Every write appends to `content/pilot-review/RULING-LOG.jsonl`, git-tracked, append-only,
 *      never edited in place — a durable log independent of git history, in case anyone is ever
 *      reading the content without the commits (an export, a stale checkout).
 *   5. `~/Downloads/11+` is no longer a source of truth for anything. It is either something this
 *      repo GENERATES for Cowork to read (`export-pilot-for-cowork.ts`) or something a human
 *      IMPORTS back through a diff-and-gate step (`import-pilot-from-cowork.ts`) — never a file
 *      this repo, or anyone editing it directly, treats as canonical.
 *
 * EMERGENCY OVERRIDE. `emergencyOverridePilotFile` exists because a human will, someday, need to
 * bypass this under time pressure. It is deliberately NOT quiet: it prints an unmissable banner,
 * REQUIRES a reason string (no default), and the log entry is tagged `emergencyOverride: true` so
 * a reader of the log — or a future audit — cannot mistake it for an ordinary ruling. Loud, not
 * silent, is the whole point: the earlier fault was a change nobody could tell apart from noise.
 */
import { chmodSync, appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkItemChildFacing, isBlocking } from '../../packages/core/src/index';

export const PILOT_REVIEW_DIR = resolve(import.meta.dirname, '../../content/pilot-review');
const LOG_PATH = join(PILOT_REVIEW_DIR, 'RULING-LOG.jsonl');

const READ_ONLY = 0o444;
const WRITABLE = 0o644;

export interface PilotItem {
  itemId: string;
  stem: Record<string, unknown>;
  explanation: Record<string, unknown>;
  options: Array<{ label: string; content: string; isCorrect: boolean; misconceptionId?: string | null; misconceptionExecution?: string }>;
  misconceptions?: string[];
  [key: string]: unknown;
}

export interface PilotBatch {
  items: PilotItem[];
  tierDistribution?: Record<string, number>;
  lowestConfidence?: Array<{ itemId: string; why: string }>;
  [key: string]: unknown;
}

interface LogEntry {
  at: string;
  file: string;
  rulingBy: string;
  recordedBy: string;
  description: string;
  itemsTouched: string[];
  gateVerdict: 'clean' | 'blocked' | 'n/a';
  emergencyOverride: boolean;
  reason?: string;
}

function gateOne(item: PilotItem, mechanic: string): string[] {
  return checkItemChildFacing({
    id: item.itemId,
    stem: item.stem,
    explanation: item.explanation,
    mechanic,
    options: item.options.map((o) => ({ content: { value: o.content } })),
  })
    .filter(isBlocking)
    .map((f) => `${f.rule}: ${f.detail}`);
}

/**
 * Gate-checks ONLY the items a ruling touched — found necessary by testing this library against
 * the real file, not designed in from the start. `ENG-004-anne-green-gables.json` carries two
 * KNOWN, already-flagged gate failures (AGG-03, AGG-08) awaiting the reviewer's own redraft; a
 * whole-batch check would have refused every future ruling on this file until those two specific
 * items were fixed, which is backwards — a ruling on AGG-11 must not be held hostage by an
 * unrelated, already-tracked fault on AGG-03. The rule this keeps: a ruling may not INTRODUCE a
 * new failure on what it touches; it is not required to fix failures it didn't create.
 * `reportGateStatus` below is the read-only counterpart that surfaces EVERYTHING, touched or not,
 * so a pre-existing fault is never simply invisible.
 */
function gateCheck(batch: PilotBatch, mechanic: string, itemsTouched: string[]): { itemId: string; failures: string[] }[] {
  const touched = new Set(itemsTouched);
  const blocked: { itemId: string; failures: string[] }[] = [];
  for (const item of batch.items) {
    if (touched.size > 0 && !touched.has(item.itemId)) continue;
    const failures = gateOne(item, mechanic);
    if (failures.length) blocked.push({ itemId: item.itemId, failures });
  }
  return blocked;
}

/** Read-only: every item's gate status, touched or not. Never blocks; just tells the truth. */
export function reportGateStatus(filename: string, mechanic: string): { itemId: string; failures: string[] }[] {
  const batch = readPilotFile(filename);
  return batch.items.map((item) => ({ itemId: item.itemId, failures: gateOne(item, mechanic) })).filter((r) => r.failures.length);
}

function appendLog(entry: LogEntry): void {
  chmodSync(LOG_PATH, WRITABLE);
  appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
  chmodSync(LOG_PATH, READ_ONLY);
}

/**
 * The one write path for the JSON batch. `mutate` receives the parsed batch and edits it in place;
 * `itemsTouched` names what changed, for the log; `mechanic` is what the gate checks against
 * (matches `checkItemChildFacing`'s `mechanic` param). Throws — refuses to write — if the gate
 * blocks an item the ruling TOUCHED — see gateCheck's own comment for why the scope is touched
 * items, not the whole batch. It does not require a ruling to fix faults it didn't create.
 */
export function withPilotFile(
  filename: string,
  opts: { rulingBy: string; recordedBy: string; description: string; itemsTouched: string[]; mechanic: string },
  mutate: (batch: PilotBatch) => void,
): PilotBatch {
  const path = join(PILOT_REVIEW_DIR, filename);
  if (!existsSync(path)) throw new Error(`No canonical pilot file at ${path} — nothing to write through`);

  chmodSync(path, WRITABLE);
  let batch: PilotBatch;
  try {
    batch = JSON.parse(readFileSync(path, 'utf8'));
    mutate(batch);
    const blocked = gateCheck(batch, opts.mechanic, opts.itemsTouched);
    if (blocked.length) {
      throw new Error(
        `Refusing to write ${filename}: ${blocked.length} item(s) fail the child-facing gate after this ruling — ` +
          blocked.map((b) => `${b.itemId} [${b.failures.join('; ')}]`).join(' | '),
      );
    }
    writeFileSync(path, JSON.stringify(batch, null, 2));
  } finally {
    chmodSync(path, READ_ONLY);
  }

  appendLog({
    at: new Date().toISOString(),
    file: filename,
    rulingBy: opts.rulingBy,
    recordedBy: opts.recordedBy,
    description: opts.description,
    itemsTouched: opts.itemsTouched,
    gateVerdict: 'clean',
    emergencyOverride: false,
  });
  console.log(`  WRITTEN via sanctioned path: ${filename} — ${opts.itemsTouched.join(', ')}`);
  return batch;
}

/**
 * A raw-text edit, for the prose notes files (PILOT-NOTES.md / CLUSTER.md). Same discipline as the
 * JSON path: lock at rest, unlock only for the write, log the change. No child-facing gate applies
 * — this is the reviewer's/author's own analysis prose, not content a child meets — but the write
 * is still routed through here so it is never a silent hand-edit, and it still refuses a blind
 * write: the exact text being replaced must be found, or it throws rather than guess.
 */
export function withPilotTextFile(
  filename: string,
  opts: { rulingBy: string; recordedBy: string; description: string },
  oldText: string,
  newText: string,
): void {
  const path = join(PILOT_REVIEW_DIR, filename);
  if (!existsSync(path)) throw new Error(`No canonical pilot file at ${path}`);
  chmodSync(path, WRITABLE);
  try {
    const current = readFileSync(path, 'utf8');
    if (!current.includes(oldText)) throw new Error(`${filename}: expected text not found — refusing a blind write`);
    writeFileSync(path, current.replace(oldText, newText));
  } finally {
    chmodSync(path, READ_ONLY);
  }
  appendLog({
    at: new Date().toISOString(), file: filename, rulingBy: opts.rulingBy, recordedBy: opts.recordedBy,
    description: opts.description, itemsTouched: [], gateVerdict: 'n/a', emergencyOverride: false,
  });
  console.log(`  WRITTEN via sanctioned path: ${filename}`);
}

/**
 * The loud escape hatch. Same mechanics as `withPilotFile`, but skips the gate refusal (still RUNS
 * the gate and records the verdict — it just doesn't block on it) and requires a `reason`. Prints a
 * banner no scrollback should let you miss, and the log entry is unambiguously marked.
 */
export function emergencyOverridePilotFile(
  filename: string,
  opts: { rulingBy: string; recordedBy: string; description: string; itemsTouched: string[]; mechanic: string; reason: string },
  mutate: (batch: PilotBatch) => void,
): PilotBatch {
  if (!opts.reason?.trim()) throw new Error('emergencyOverridePilotFile requires a non-empty reason — there is no silent override');

  console.log('\n' + '#'.repeat(78));
  console.log('# EMERGENCY OVERRIDE — PILOT CONTENT WRITTEN OUTSIDE NORMAL RULING FLOW');
  console.log(`# file:   ${filename}`);
  console.log(`# reason: ${opts.reason}`);
  console.log(`# by:     ${opts.recordedBy}`);
  console.log('#'.repeat(78) + '\n');

  const path = join(PILOT_REVIEW_DIR, filename);
  if (!existsSync(path)) throw new Error(`No canonical pilot file at ${path}`);

  chmodSync(path, WRITABLE);
  let batch: PilotBatch;
  let verdict: 'clean' | 'blocked' = 'clean';
  try {
    batch = JSON.parse(readFileSync(path, 'utf8'));
    mutate(batch);
    const blocked = gateCheck(batch, opts.mechanic, opts.itemsTouched);
    if (blocked.length) {
      verdict = 'blocked';
      console.log(`  GATE WARNING (override proceeding anyway): ${JSON.stringify(blocked)}`);
    }
    writeFileSync(path, JSON.stringify(batch, null, 2));
  } finally {
    chmodSync(path, READ_ONLY);
  }

  appendLog({
    at: new Date().toISOString(),
    file: filename,
    rulingBy: opts.rulingBy,
    recordedBy: opts.recordedBy,
    description: opts.description,
    itemsTouched: opts.itemsTouched,
    gateVerdict: verdict,
    emergencyOverride: true,
    reason: opts.reason,
  });
  console.log(`  WRITTEN via EMERGENCY OVERRIDE: ${filename} — ${opts.itemsTouched.join(', ')}`);
  return batch;
}

/** Read-only — every consumer that just needs current state should use this, not parse the file itself. */
export function readPilotFile(filename: string): PilotBatch {
  return JSON.parse(readFileSync(join(PILOT_REVIEW_DIR, filename), 'utf8'));
}
