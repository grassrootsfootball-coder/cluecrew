/**
 * THE CLAIM LEDGER: which claims about a text has a reader compared with that text? (Annie, R370.)
 *
 * **She has ruled the gap in kind unclosable by any instrument**, and the ledger exists because of
 * that rather than in spite of it: *"Comparing a claim to a text is reading, and a machine doing it
 * would be substituting a string test for a judgement — which is the substitution that found
 * thirty-two where I found eight and cannot find the thirty-third."*
 *
 * **So this counts, it does not check.** It enumerates every claim-about-a-text in the store, joins
 * each to whether a reader has compared it, and orders the unread by REACHABILITY. *"Then the
 * population of unchecked claims is countable, orderable by reachability, and visible as a number
 * instead of being invisible as a kind. That is the same move as the pin, one level up, and it is
 * the only honest instrument for a property whose only instrument is a person."*
 *
 * **THE CLASS IS LARGER THAN FLAGS AND THE LEDGER COVERS ALL OF IT** — her scope, not the 61:
 *
 *   flag reasons              a claim about what is in a passage
 *   curation notes            a claim about why this extract and not another
 *   band justifications       a claim about what the passage demands of a reader
 *   misconception descriptions  a claim about what the items tagged with it do
 *   walk scripts              a claim about what a cited line says
 *
 * A LEDGER ROW IS WRITTEN BY A PERSON, NEVER BY THIS SCRIPT. The script finds the claims and reports
 * which have no row; only a reader who has read both can add one.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { declareMayBeEmpty, requirePopulation } from './lib/population';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEDGER = join(REPO_ROOT, 'content/claim-ledger.jsonl');
const PASSAGES = join(REPO_ROOT, 'content/passages');

interface Claim {
  claimId: string;
  kind: string;
  aboutText: string;
  reachable: number;
}

interface LedgerRow {
  claimId: string;
  comparedBy: string;
  comparedOn: string;
  verdict: string;
}

function ledger(): Map<string, LedgerRow> {
  const out = new Map<string, LedgerRow>();
  if (!existsSync(LEDGER)) return out;
  for (const line of readFileSync(LEDGER, 'utf8').split('\n').filter((l) => l.trim())) {
    const r = JSON.parse(line) as LedgerRow;
    out.set(r.claimId, r);
  }
  return out;
}

async function main() {
  const claims: Claim[] = [];

  const items = await prisma.item.findMany({ select: { id: true, stem: true, explanation: true, status: true } });
  const liveBehind = new Map<string, number>();
  for (const i of items) {
    const seen = new Set<string>();
    for (const c of [i.stem, i.explanation]) {
      const q = (c as { quotes?: unknown })?.quotes;
      if (Array.isArray(q)) {
        for (const e of q) {
          if (e && typeof e === 'object' && typeof (e as { passageRef?: unknown }).passageRef === 'string') {
            seen.add((e as { passageRef: string }).passageRef);
          }
        }
      }
    }
    for (const r of seen) if (i.status === 'LIVE') liveBehind.set(r, (liveBehind.get(r) ?? 0) + 1);
  }

  // Passage-borne claims: flag reasons, curation notes, band justifications.
  for (const file of readdirSync(PASSAGES).filter((f) => f.endsWith('.json'))) {
    const j = JSON.parse(readFileSync(join(PASSAGES, file), 'utf8')) as Record<string, unknown>;
    const id = String(j.id);
    const reach = liveBehind.get(id) ?? 0;
    const flags = Array.isArray(j.contentFlags) ? j.contentFlags : [];
    flags.forEach((f, n) => {
      claims.push({ claimId: `${id}#flag[${n}].reason`, kind: 'flag reason', aboutText: id, reachable: reach });
    });
    if (typeof j.curationNotes === 'string' && j.curationNotes.trim()) {
      claims.push({ claimId: `${id}#curationNotes`, kind: 'curation note', aboutText: id, reachable: reach });
    }
    const band = j.band as { why?: unknown } | undefined;
    if (band && typeof band.why === 'string' && band.why.trim()) {
      claims.push({ claimId: `${id}#band.why`, kind: 'band justification', aboutText: id, reachable: reach });
    }
  }

  // Walk scripts: a claim about what a cited line says.
  for (const i of items) {
    const w = (i.explanation as { walkScript?: unknown })?.walkScript;
    if (typeof w === 'string' && w.trim()) {
      claims.push({
        claimId: `${i.id}#explanation.walkScript`, kind: 'walk script vs cited lines',
        aboutText: i.id, reachable: i.status === 'LIVE' ? 1 : 0,
      });
    }
  }

  // Misconception descriptions: a claim about what the items tagged with it do.
  const miscs = await prisma.misconception.findMany({ select: { id: true, description: true } });
  // Counted from the items we already hold rather than a groupBy, so the tag count and the option
  // rows come from one read of one source.
  const withOptions = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });
  const tagCount = new Map<string, number>();
  for (const i of withOptions) {
    for (const o of i.options) {
      const m = (o as { misconceptionId?: string | null }).misconceptionId;
      if (m) tagCount.set(m, (tagCount.get(m) ?? 0) + 1);
    }
  }
  for (const m of miscs) {
    if (typeof m.description === 'string' && m.description.trim()) {
      claims.push({
        claimId: `${m.id}#description`, kind: 'misconception vs tagged items',
        aboutText: `${tagCount.get(m.id) ?? 0} tagged option(s)`, reachable: tagCount.get(m.id) ?? 0,
      });
    }
  }

  const rows = ledger();
  // The CLAIMS must not be empty — an empty one means the walk is broken, not that the store has
  // no prose. The LEDGER legitimately is, on day one and for as long as nobody has read: it fills
  // one row at a time by a person, so an empty ledger is a true report of an unstarted read (R61).
  requirePopulation('report:claim-ledger', { 'claim(s) about a text': claims.length });
  declareMayBeEmpty(
    'report:claim-ledger', 'ledger row(s)', rows.size,
    'A row is written only by a reader who has compared a claim with its text. Nobody has yet, so '
    + 'the ledger is empty and every claim below is UNREAD. That is the finding, not a failure — '
    + 'and it is the number this report exists to make visible.',
  );

  const byKind = new Map<string, { total: number; compared: number; reachableUnread: number }>();
  for (const c of claims) {
    const k = byKind.get(c.kind) ?? { total: 0, compared: 0, reachableUnread: 0 };
    k.total++;
    if (rows.has(c.claimId)) k.compared++;
    else if (c.reachable > 0) k.reachableUnread++;
    byKind.set(c.kind, k);
  }

  console.log('\nCLAIMS ABOUT A TEXT — compared by a reader, or not yet\n');
  console.log('  kind                            total  compared  UNREAD & REACHABLE');
  for (const [kind, k] of [...byKind].sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${kind.padEnd(30)} ${String(k.total).padStart(5)} ${String(k.compared).padStart(9)} ${String(k.reachableUnread).padStart(19)}`);
  }
  const total = claims.length;
  const compared = claims.filter((c) => rows.has(c.claimId)).length;
  console.log(`  ${'TOTAL'.padEnd(30)} ${String(total).padStart(5)} ${String(compared).padStart(9)} ${String(claims.filter((c) => !rows.has(c.claimId) && c.reachable > 0).length).padStart(19)}`);

  const queue = claims.filter((c) => !rows.has(c.claimId) && c.reachable > 0)
    .sort((a, b) => b.reachable - a.reachable).slice(0, 12);
  if (queue.length > 0) {
    console.log('\n  Ordered by reachability — the read starts where the children are:');
    for (const c of queue) console.log(`    ${String(c.reachable).padStart(3)} LIVE  ${c.claimId}`);
  }

  console.log(
    '\n  THIS COUNTS; IT DOES NOT CHECK. Comparing a claim to a text is reading, and a machine doing\n' +
      '  it would substitute a string test for the judgement. A ledger row is written by a person who\n' +
      '  has read both — never by this script. What it buys is that the unread population is a NUMBER\n' +
      '  instead of a kind nobody can see.',
  );
  await prisma.$disconnect();
}

void main();
