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
const SEND_PREFIX = 'MATHSIMPORTOUTBOUND';

function currentSend(): { file: string; ids: Set<string>; ambiguity: string[] } {
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
  const send = currentSend();
  const landed = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, status: true } });
  requirePopulation('check:withdrawn-sends', { 'landed MATHS rows': landed.length, 'ids in the current send': send.ids.size });

  console.log(`check:withdrawn-sends: ${landed.length} landed rows against ${send.ids.size} ids in ${send.file}`);
  if (send.ambiguity.length) {
    console.error(`  **THE SEND NAME RESOLVES TO ${send.ambiguity.length} FILES WITH DIFFERENT BYTES.** Newest chosen by mtime, which is not provenance:`);
    for (const a of send.ambiguity) console.error(`      ${a}`);
    console.error('  A send identified by NAME is a lookup with more than one answer (R799/R803). This is reported, not resolved.');
  }
  const orphans = landed.filter((r) => !send.ids.has(r.id));
  if (orphans.length === 0) {
    console.log('  every landed row is in the current send. No withdrawn or orphaned rows.');
    return;
  }
  console.error(`  LANDED BUT NOT IN THE CURRENT SEND: ${orphans.length}`);
  for (const o of orphans) console.error(`      ${o.id}  [${o.status}]`);
  console.error('  Each is withdrawn, renamed, or from a send nobody remembers. **A row the sending store no longer sends');
  console.error('  must not publish on the strength of having once arrived.**');
  process.exitCode = 1;
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
