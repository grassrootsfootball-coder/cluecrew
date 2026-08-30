/**
 * THE RECEIVING DOOR FOR A WITHDRAWAL NOTICE (Cowork, 2026-08-30 — R903).
 *
 * **Refuse to serve any row whose SUBSTANCE is named in a standing withdrawal; lift only on the
 * named replacement substance.** Keyed on substance, never on id — an id in the notice may also
 * exist in a corrected form the notice does not touch, and an id-keyed door would refuse the repair
 * along with the fault.
 *
 * **THE CANARY IS THE POINT OF THIS FILE.** The notice names the FIELDS of its digest and not the
 * SERIALISATION. Until this door reproduces at least one of the 31 declared digests from bytes it
 * holds, it cannot know whether a row is withdrawn — and a matcher that matches nothing reports
 * exactly what a clean population reports. So: **it screens nothing until it can reproduce a known
 * value, and it exits non-zero saying so.** That is the whole of R60/R61/R173 applied to a door on
 * its first day, rather than after it has passed green for a month.
 *
 * The standing withdrawal is retained in-repo at `content/withdrawals/`, git-tracked, so the notice
 * is an artefact this door reads rather than a message somebody remembers.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { canonicalSubstance, substance } from '../packages/core/src/index';
import { requirePopulation } from './lib/population';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const prisma = new PrismaClient();
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

interface Entry { itemId: string; substanceSha256: string; stem: string; reason: string; liftedBy: string; replacementSubstanceSha256: string | null }

function standingWithdrawals() {
  const dir = join(ROOT, 'content/withdrawals');
  const files = readdirSync(dir).filter((n) => n.endsWith('.json'));
  if (files.length === 0) throw new Error('no standing withdrawal is retained — refusing a blind screen (R173)');
  return files.map((f) => {
    const text = readFileSync(join(dir, f), 'utf8');
    return { file: f, sha256: sha(text), notice: JSON.parse(text) as { WITHDRAWN: Entry[]; theSubstanceSpec: string } };
  });
}

/** Every crossed artefact row, so the canary has known-good bytes to hash. */
function* crossedRows(): Generator<{ itemId: string } & Record<string, unknown>> {
  const dl = join(homedir(), 'Downloads');
  for (const name of readdirSync(dl).filter((n) => n.endsWith('.json'))) {
    let parsed: unknown;
    try { parsed = JSON.parse(readFileSync(join(dl, name), 'utf8')); } catch { continue }
    const walk = function* (o: unknown): Generator<{ itemId: string } & Record<string, unknown>> {
      if (Array.isArray(o)) { for (const v of o) yield* walk(v); return; }
      if (o && typeof o === 'object') {
        const r = o as Record<string, unknown>;
        if (typeof r.itemId === 'string' && Array.isArray(r.options)) yield r as { itemId: string } & Record<string, unknown>;
        for (const v of Object.values(r)) yield* walk(v);
      }
    };
    yield* walk(parsed);
  }
}

async function main() {
  const standing = standingWithdrawals();
  const entries = standing.flatMap((s) => s.notice.WITHDRAWN);
  const declared = new Set<string>([
    ...entries.map((e) => e.substanceSha256),
    ...entries.map((e) => e.replacementSubstanceSha256).filter((v): v is string => !!v),
  ]);

  requirePopulation('check:withdrawn-substance', {
    'standing withdrawal notice(s)': standing.length,
    'withdrawn substance(s) declared': entries.length,
    'digest(s) this door must be able to reproduce': declared.size,
  });

  // ---- THE CANARY: reproduce a declared digest from bytes we hold, or refuse to screen ----------
  let reproduced = 0; const sample: string[] = [];
  for (const row of crossedRows()) {
    const d = sha(canonicalSubstance(row as never));
    if (declared.has(d)) { reproduced += 1; if (sample.length < 3) sample.push(`${row.itemId} -> ${d.slice(0, 16)}`); }
  }
  console.log(`\n  standing withdrawals: ${standing.map((s) => `${s.file} (${s.sha256.slice(0, 16)})`).join(', ')}`);
  console.log(`  substances declared: ${entries.length} withdrawn, ${entries.filter((e) => e.replacementSubstanceSha256).length} with a named replacement`);
  console.log(`  THE SPEC AS SENT: ${standing[0].notice.theSubstanceSpec}`);
  console.log(`\n  CANARY — declared digests this door reproduced from crossed bytes: ${reproduced}`);

  if (reproduced === 0) {
    console.error(
      '\n  THE DOOR IS BUILT AND REFUSES TO ARM.\n'
      + '  It reproduced NONE of the declared digests from any bytes this store holds, so it cannot\n'
      + '  tell a withdrawn substance from a standing one. Two explanations are confounded and this\n'
      + '  store cannot separate them:\n'
      + '    (a) this implementation of substance() encodes the six fields differently from theirs;\n'
      + '    (b) the rows here genuinely differ from every substance named.\n'
      + '  **It screens nothing rather than screening blindly**, because a matcher that matches\n'
      + '  nothing reports exactly what a clean population reports — the fault this register has\n'
      + '  recorded eight times.\n'
      + '  WHAT UNBLOCKS IT, in one line from the sender: their substance() implementation, or ONE\n'
      + '  worked example — the exact input string that hashes to a declared digest.',
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  // ---- ARMED: screen every serving row -----------------------------------------------------------
  const rows = await prisma.item.findMany({
    where: { status: 'LIVE', pool: 'PRACTICE' },
    select: { id: true, stem: true, solution: true, options: { select: { content: true, isCorrect: true } } },
  });
  const lift = new Map(entries.filter((e) => e.replacementSubstanceSha256).map((e) => [e.replacementSubstanceSha256!, e]));
  const withdrawn = new Map(entries.map((e) => [e.substanceSha256, e]));
  const serving = rows.map((r) => ({ id: r.id, digest: sha(canonicalSubstance(r as never)) }));
  const refused = serving.filter((s) => withdrawn.has(s.digest));
  const lifted = serving.filter((s) => lift.has(s.digest));
  console.log(`  reproduced e.g. ${sample.join(', ')}`);
  console.log(`  serving rows screened: ${serving.length} · on a withdrawn substance: ${refused.length} · on a named replacement: ${lifted.length}`);
  for (const r of refused) console.log(`   REFUSE  ${r.id} — ${withdrawn.get(r.digest)!.reason.slice(0, 90)}`);
  if (refused.length) process.exit(1);
  console.log('\n  No serving row stands on a withdrawn substance.');
  await prisma.$disconnect();
}
main().catch(async (e) => { await prisma.$disconnect(); console.error(e); process.exit(1); });
