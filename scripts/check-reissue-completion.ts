/**
 * DID A DESCRIBED ACT ACTUALLY COMPLETE? (David, 2026-08-20 — R356.)
 *
 * **An artefact that describes an act is not the act.** Every guard here watches whether content
 * ARRIVES correctly — gates, digests, sidecars, declaration sets. **None watched whether a named,
 * staged, agreed act COMPLETED.** `REISSUESIXITEMS.json` named six items, one landed, five did not,
 * and the only thing that noticed was `check:item-population` — a check built for something else,
 * six weeks later, by accident.
 *
 * The class reaches further than reissues: **migrations, retag lists, ratify-and-write acts —
 * anything whose whole content is a promise that N things will be true.** This checks the one shape
 * that exists today and is named for the general case.
 *
 * **EVERY ID NEEDS A DISPOSITION, AND THAT IS WHAT MAKES IT SURVIVABLE.** A reissue can legitimately
 * not complete: `ENG-019-BV-02` is held at the door for a fault only Cowork can repair, and holding
 * it is correct. If a legitimately-held item kept this check red, it would be muted inside a week —
 * the failure mode already named twice on this board (`check:staging-queue`, `check:declaration-sets`).
 *
 *   IMPORTED    the id is in the item table. The act completed for this id.
 *   REFUSED     the id is absent AND a disposition records why, with a date and a reason.
 *   UNDISPOSED  the id is absent and NOTHING says why. **This is the fault**, and the only failure.
 *
 * **An UNDISPOSED id is the exact state the five were in for a month**: not imported, not refused,
 * not recorded — simply absent, with an artefact on disk asserting they had been sent.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEDGER = join(REPO_ROOT, 'content/reissue-dispositions.jsonl');
const DOWNLOADS = '/Users/davidb/Downloads';

interface Disposition {
  itemId: string;
  artefact: string;
  disposition: 'REFUSED';
  reason: string;
  recordedOn: string;
  repairableBy: string;
}

/**
 * A DELIVERY carries item CONTENT; a REPORT carries ids and prose. Only a delivery promises that
 * items will exist afterwards, so only a delivery is checked for completion. Derived from the
 * artefact's own shape (R57) — never a hand-kept list of filenames.
 */
function reissueArtefacts(): Array<{ file: string; ids: string[]; date: string }> {
  const dirs = [DOWNLOADS, join(DOWNLOADS, '11+')];
  try {
    for (const d of readdirSync(join(DOWNLOADS, '11+'))) {
      const p = join(DOWNLOADS, '11+', d);
      try {
        if (statSync(p).isDirectory() && !p.endsWith('from-cluecrew')) dirs.push(p);
      } catch { /* unreadable */ }
    }
  } catch { /* no 11+ */ }

  const found: Array<{ file: string; ids: string[]; date: string }> = [];
  for (const dir of dirs) {
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const n of names.filter((x) => x.endsWith('.json'))) {
      const path = join(dir, n);
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(path, 'utf8'));
      } catch {
        continue;
      }
      if (!parsed || typeof parsed !== 'object') continue;
      const rows = (parsed as { items?: unknown }).items;
      if (!Array.isArray(rows) || rows.length === 0) continue;
      // Content-bearing: each row names an item AND carries the item body.
      const ids = rows
        .filter((r): r is { itemId: string; item: unknown } =>
          Boolean(r) && typeof r === 'object'
          && typeof (r as { itemId?: unknown }).itemId === 'string'
          && typeof (r as { item?: unknown }).item === 'object')
        .map((r) => r.itemId);
      if (ids.length === 0) continue;
      let date = 'unknown';
      try {
        date = statSync(path).mtime.toISOString().slice(0, 10);
      } catch { /* keep unknown */ }
      found.push({ file: path.replace(`${DOWNLOADS}/`, ''), ids, date });
    }
  }
  return found;
}

function dispositions(): Map<string, Disposition> {
  const out = new Map<string, Disposition>();
  let text: string;
  try {
    text = readFileSync(LEDGER, 'utf8');
  } catch {
    return out;
  }
  for (const line of text.split('\n').filter((l) => l.trim() !== '')) {
    const d = JSON.parse(line) as Disposition;
    out.set(`${d.artefact}|${d.itemId}`, d);
  }
  return out;
}

async function main() {
  const artefacts = reissueArtefacts();
  const ledger = dispositions();
  const allIds = [...new Set(artefacts.flatMap((a) => a.ids))];
  const present = new Set(
    (await prisma.item.findMany({ where: { id: { in: allIds } }, select: { id: true } })).map((r) => r.id),
  );

  requirePopulation('check:reissue-completion', {
    'reissue artefact(s)': artefacts.length,
    'id(s) they name': allIds.length,
  });

  let undisposed = 0;
  for (const a of artefacts) {
    const imported = a.ids.filter((id) => present.has(id));
    const absent = a.ids.filter((id) => !present.has(id));
    const refused = absent.filter((id) => ledger.has(`${a.file}|${id}`));
    const open = absent.filter((id) => !ledger.has(`${a.file}|${id}`));
    undisposed += open.length;

    console.log(
      `\n${a.file}  (${a.date})\n` +
        `  ${a.ids.length} id(s): ${imported.length} IMPORTED · ${refused.length} REFUSED · ${open.length} UNDISPOSED`,
    );
    for (const id of refused) {
      const d = ledger.get(`${a.file}|${id}`) as Disposition;
      console.log(`    REFUSED     ${id} — ${d.reason}`);
      console.log(`                recorded ${d.recordedOn}, repairable by ${d.repairableBy}`);
    }
    for (const id of open) console.error(`    UNDISPOSED  ${id} — absent, and nothing says why`);
  }

  if (undisposed === 0) {
    console.log(
      '\ncheck:reissue-completion: every id named by a reissue is IMPORTED or REFUSED-with-a-reason.\n' +
        '  A REFUSED id is not a pass and not a failure — it is a recorded decision, which is the\n' +
        '  only thing that keeps this check from being permanently red and therefore muted.',
    );
    await prisma.$disconnect();
    return;
  }

  console.error(
    `\n${undisposed} UNDISPOSED id(s). An artefact on disk says these were sent; they are not here,\n` +
      '  and nothing records a decision about them. **That is the state the five were in for a\n' +
      '  month.** Import it, or record a refusal with its reason — never leave it silent.',
  );
  await prisma.$disconnect();
  process.exitCode = 1;
}

void main();
