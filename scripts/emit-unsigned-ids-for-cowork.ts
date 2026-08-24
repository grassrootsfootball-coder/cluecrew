/**
 * THE UNSIGNED ID LIST FOR COWORK (David, 2026-08-24 — R697): ids only, no wordings, no state,
 * as Cowork asked — its partition schema is accepted and both prerequisites now discharged
 * (this list, and the reconciliation artefact ffa3a886…, staged beside it).
 *
 * Provenance is CHECKABLE, not asserted: the ids are read from the live rows this run, and the
 * artefact declares inline the digests of the held files the population reconciles against —
 * the 288 against the door population, the 629 + 34 against the audit, the 5 against the
 * five-acts record.
 *
 * ALSO CARRIES THE CONFIRMATION FOR ANNIE (the next artefact to cross): the eleven doors closed
 * at the timestamp they closed, and reopening is DERIVED, not flagged — she was answered by act,
 * and the record shows the act preceded her rulings.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const OUT = '/Users/davidb/Downloads/11+/from-cluecrew';
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

const SOURCES = {
  doorPopulation: { file: 'door-opening-population-b62edf78e99c67d7.json', sha256: 'b62edf78e99c67d7bb0858b7d75002205da147d14496e87b387ea79818a92f7a' },
  estateAudit: { file: 'estate-audit-12a506a26f93e584.json', sha256: '12a506a26f93e584197b599750f7700459b083aea3aff607985f911767d5da1e' },
  fiveActs: { file: 'five-acts-788c8bf1c79b9e54.json', sha256: '788c8bf1c79b9e54f6d116cc7c4e0775ccb864da2ced6ac2313ad5b9c589c84f' },
  reconciliation: { file: 'doors-hidden-and-reconciled-ffa3a8866de98496.json', sha256: 'ffa3a8866de98496f148c6ddfdbacc99ba8014fd7fa7efb297004c7a800cfd63' },
};

async function run() {
  // Verify every cited file's bytes before declaring its digest (a digest quoted is not a file held).
  for (const [k, s] of Object.entries(SOURCES)) {
    const got = sha256(readFileSync(join(OUT, s.file)));
    if (got !== s.sha256) throw new Error(`REFUSED — ${k} (${s.file}) reads ${got}, declared ${s.sha256}`);
  }
  const unsigned = await prisma.item.findMany({ where: { status: 'DRAFT', reviewedBy: null }, select: { id: true }, orderBy: { id: 'asc' } });
  // Cross-check the 288 subset against the door population file's own rows.
  const door = JSON.parse(readFileSync(join(OUT, SOURCES.doorPopulation.file), 'utf8')) as { sections: Array<{ rows: Array<{ id: string }> }> };
  const doorIds = new Set(door.sections.flatMap((s) => s.rows.map((r) => r.id)));
  const liveSet = new Set(unsigned.map((u) => u.id));
  for (const id of doorIds) if (!liveSet.has(id)) throw new Error(`REFUSED — ${id} is in the door population but not in the live unsigned set`);

  const closedAt = '2026-08-24T21:57:27+01:00';
  const artefact = {
    kind: 'unsigned-ids-for-cowork',
    what: `The full unsigned population as IDS ONLY — no wordings, no state — as Cowork asked. ${unsigned.length} ids, read from the live rows this run. Cowork's partition schema is accepted; its two prerequisites are both discharged: this list, and the reconciliation artefact staged beside it (${SOURCES.reconciliation.file}, sha256 ${SOURCES.reconciliation.sha256}), where 629, 668 and 288 are explained rather than asserted.`,
    method: 'read live: DRAFT ∧ reviewedBy null, ordered by id. Reconciles against held files whose digests are declared inline and were RECOMPUTED over the bytes before declaration:',
    sourceFiles: SOURCES,
    crossChecks: `the door population's 288 ids are all present in this list (asserted this run); the 629 + 34 partition and the 5 demotions are membership-listed in ${SOURCES.estateAudit.file} and ${SOURCES.fiveActs.file}`,
    count: unsigned.length,
    ids: unsigned.map((u) => u.id),
    forAnnie: {
      confirmation: `THE ELEVEN DOORS CLOSED AT THE TIMESTAMP THEY CLOSED: ${closedAt} — the commit landing servableCaseIds at all three serving surfaces (ac6041b5e572fc0cb20cb2f692c6c27c8fda6373). REOPENING IS DERIVED, NOT FLAGGED: the guard reads the live pool at request time, so a door reopens the moment its case's pool holds a LIVE item, with no flag for anyone to remember or forget.`,
      whyStated: 'She has ruled twice for a repair already executed; the record should show she was answered BY ACT rather than by luck — the act preceded the rulings, and this line is the record of that order.',
    },
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('unsigned-ids-for-cowork', sha256(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'unsigned-ids-for-cowork');
  console.log(`ids: ${unsigned.length}; door subset verified; sources recomputed clean`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
