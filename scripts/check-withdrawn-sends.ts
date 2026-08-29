/**
 * NO INSTRUMENT HERE WATCHED FOR A WITHDRAWN SEND (R839). This is it.
 *
 * Twenty rows from a withdrawn 196-row send were landed and serving-eligible. **Five more escaped
 * only because a house-rule gate happened to refuse them** — nothing was looking for them, and the
 * gate that caught them was screening for banned vocabulary.
 *
 * The watch is one subtraction: **every landed row whose id is absent from the CURRENT send.** A
 * row here that the sending store no longer sends is either withdrawn, renamed, or from a send
 * nobody remembers — and all three want a human before anything publishes.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const DOWN = '/Users/davidb/Downloads';
/**
    * **EVERY SEND, NOT ONE SEND** (R841). The first version watched `MATHSIMPORTOUTBOUND` alone and
    * fired on 14 rows legitimately imported from the AMENDED SOURCE — a second send it did not know
    * about. A row is orphaned when it is in NO send, not when it is absent from the one the check
    * happens to name. Widening the reference is not resolving the ambiguity: the check still refuses
    * to say which send is current, and still reports every name that resolves to more than one file.
    */
const SEND_FILES = ['MATHSIMPORTOUTBOUND', 'amended-maths-source-for-code', 'AMENDEDMATHSSOURCECROSSING'];
const SEND_PREFIX = 'MATHSIMPORTOUTBOUND';

/** Every id named by any send file on this disk, with the ambiguity reported per family. */
function allSends(): { ids: Set<string>; perFamily: string[]; ambiguity: string[] } {
  const ids = new Set<string>(); const perFamily: string[] = []; const ambiguity: string[] = [];
  const idsIn = (o: unknown, out: Set<string>) => {
    if (Array.isArray(o)) { for (const x of o) idsIn(x, out); return; }
    if (o && typeof o === 'object') {
      const r = o as Record<string, unknown>;
      if (typeof r.itemId === 'string') out.add(r.itemId);
      for (const v of Object.values(r)) idsIn(v, out);
    }
  };
  for (const fam of SEND_FILES) {
    const files = readdirSync(DOWN).filter((f) => f.startsWith(fam) && f.endsWith('.json'));
    if (!files.length) continue;
    const digests = new Set<string>();
    const famIds = new Set<string>();
    for (const f of files) {
      const bytes = readFileSync(join(DOWN, f));
      digests.add(createHash('sha256').update(bytes).digest('hex'));
      try { idsIn(JSON.parse(bytes.toString('utf8')), famIds); } catch { /* not a send this reader parses */ }
    }
    for (const i of famIds) ids.add(i);
    perFamily.push(`${fam}: ${files.length} file(s), ${digests.size} distinct digest(s), ${famIds.size} ids`);
    if (digests.size > 1) ambiguity.push(`${fam} resolves to ${digests.size} different documents under one name`);
  }
  if (ids.size === 0) throw new Error('no send file found — refusing rather than treating an empty send as "nothing landed in error" (R173)');
  return { ids, perFamily, ambiguity };
}

function unusedCurrentSend(): { file: string; ids: Set<string>; ambiguity: string[] } {
  const candidates = readdirSync(DOWN).filter((f) => f.startsWith(SEND_PREFIX) && f.endsWith('.json'));
  const withDigest = candidates.map((f) => {
    const bytes = readFileSync(join(DOWN, f));
    return { f, sha: createHash('sha256').update(bytes).digest('hex'), mtime: statSync(join(DOWN, f)).mtimeMs, bytes };
  }).sort((a, b) => b.mtime - a.mtime);
  if (withDigest.length === 0) throw new Error(`no send file matching ${SEND_PREFIX}* — refusing rather than treating an empty send as "nothing landed in error" (R173)`);
  const distinct = new Set(withDigest.map((x) => x.sha));
  const chosen = withDigest[0]!;
  const parsed = JSON.parse(chosen.bytes.toString('utf8')) as { items: Array<{ itemId: string }> };
  return {
    file: `${chosen.f} (${chosen.sha.slice(0, 16)})`,
    ids: new Set(parsed.items.map((i) => i.itemId)),
    ambiguity: distinct.size > 1 ? withDigest.map((x) => `${x.f} ${x.sha.slice(0, 16)}`) : [],
  };
}

async function main() {
  void unusedCurrentSend;
  const send = allSends();
  const landed = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, status: true } });
  requirePopulation('check:withdrawn-sends', { 'landed MATHS rows': landed.length, 'ids across every send on this disk': send.ids.size });

  console.log(`check:withdrawn-sends: ${landed.length} landed rows against ${send.ids.size} ids across every send on this disk`);
  for (const f of send.perFamily) console.log(`      ${f}`);
  if (send.ambiguity.length) {
    console.error('  **A SEND NAME RESOLVES TO MORE THAN ONE DOCUMENT:**');
    for (const a of send.ambiguity) console.error(`      ${a}`);
    console.error('  A send identified by NAME is a lookup with more than one answer (R799/R803).');
    console.error('  **REPORTED, NOT RESOLVED** — this check does not pick, and does not use mtime to pick.');
  }
  const orphans = landed.filter((r) => !send.ids.has(r.id));
  if (orphans.length === 0) {
    console.log('  every landed row is named by some send on this disk. No withdrawn or orphaned rows.');
    return;
  }
  console.error(`  LANDED BUT NOT IN THE CURRENT SEND: ${orphans.length}`);
  for (const o of orphans) console.error(`      ${o.id}  [${o.status}]`);
  console.error('  Each is withdrawn, renamed, or from a send nobody remembers. **A row the sending store no longer sends');
  console.error('  must not publish on the strength of having once arrived.**');
  process.exitCode = 1;
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
