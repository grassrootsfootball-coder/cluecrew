/**
 * FAMILY STATUS — GENERATED, NOT MAINTAINED (annie, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/export-family-status.ts`
 *
 * The first of the two artefacts she named. `maths-approved-families-proposal.md` is a family status
 * table kept by hand, and it had drifted in all three ways the drift can go:
 *
 *   - it disagreed with ITSELF — M-inverse is "PROPOSED, needs Annie's four ids" in the rulings
 *     list and "BUILT — the nineteenth" three sections later;
 *   - it predated the signing sitting, so it described 19 generators as built-or-to-build when all
 *     19 are now SIGNED. A reviewer reading it would price a 12–16 hour signing sitting that has
 *     already happened;
 *   - it carried no stamp of any kind, so neither of those was detectable.
 *
 * A status table maintained by hand is a status snapshot that nobody re-runs. So this generates it
 * from the things it describes — `families.ts`, `SPAG_FAMILIES`, and the signature rows — and
 * stamps it as a status artefact. The .md carries the staleness warning in its own first lines
 * (the reviewer-status lesson: a guard in a sidecar is a guard on a file nobody opens).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { MATHS_FAMILIES } from '../packages/core/src/maths/families';
import { familyTiers } from '../packages/core/src/maths/generator';
import { SPAG_FAMILIES } from '../packages/core/src/english/spag-families';
import { familyDepth, familyFingerprint, spagFamilyTiers } from '../packages/core/src/english/spag-fingerprint';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';
import { prisma as defaultPrisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'family-status';

interface Row {
  id: string;
  district: 'MATHS' | 'ENGLISH';
  tiers: string;
  built: boolean;
  signed: boolean;
  /** Is the signature pinned to a fingerprint, and does it still match? */
  pin: 'pinned-ok' | 'moved' | 'unpinned' | 'n/a';
  depth: number | null;
}

export async function buildFamilyStatusSource(prisma: typeof defaultPrisma): Promise<Row[]> {
  const events = await prisma.attributionEvent.findMany({
    where: { action: 'SIGNED', recordType: { contains: 'template-family' } },
  });
  const sig = new Map(events.map((e) => [e.recordId, e]));

  const rows: Row[] = [];
  for (const f of MATHS_FAMILIES) {
    const ev = sig.get(f.id);
    rows.push({
      id: f.id,
      district: 'MATHS',
      tiers: familyTiers(f).map((t) => `T${t}`).join(','),
      built: true,
      signed: Boolean(ev),
      // Maths families have no fingerprint yet — their surface is not hashed here, so a signature
      // cannot be checked against them. Stated, not glossed: an unmeasured guard is not a guard.
      pin: 'n/a',
      depth: null,
    });
  }
  for (const f of SPAG_FAMILIES) {
    const ev = sig.get(f.id);
    const fp = familyFingerprint(f);
    rows.push({
      id: f.id,
      district: 'ENGLISH',
      tiers: spagFamilyTiers(f).map((t) => `T${t}`).join(','),
      built: true,
      signed: Boolean(ev),
      pin: !ev ? 'n/a' : !ev.subjectHash ? 'unpinned' : ev.subjectHash === fp ? 'pinned-ok' : 'moved',
      depth: familyDepth(f).total,
    });
  }
  return rows.sort((a, b) => (a.district === b.district ? a.id.localeCompare(b.id) : a.district.localeCompare(b.district)));
}

async function main(): Promise<void> {
  const prisma = defaultPrisma;
  const rows = await buildFamilyStatusSource(prisma);
  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(rows, generatedAt, 'status', 'every generator family, whether it is built, signed, and still matches its signature');

  const counts = {
    total: rows.length,
    built: rows.filter((r) => r.built).length,
    signed: rows.filter((r) => r.signed).length,
    unsigned: rows.filter((r) => !r.signed).length,
    moved: rows.filter((r) => r.pin === 'moved').length,
    unpinned: rows.filter((r) => r.pin === 'unpinned').length,
    notFingerprinted: rows.filter((r) => r.pin === 'n/a' && r.signed).length,
  };

  const body = rows
    .map((r) => `| ${r.id} | ${r.district} | ${r.tiers} | ${r.built ? 'built' : '—'} | ${r.signed ? 'signed' : 'UNSIGNED'} | ${r.pin} | ${r.depth ?? '—'} |`)
    .join('\n');

  const md =
    `# Family status — generated\n\n${stampHeader(stamp, 'md')}\n\n` +
    `${counts.total} families · ${counts.built} built · ${counts.signed} signed · ${counts.unsigned} unsigned · ` +
    `${counts.moved} moved since signing · ${counts.unpinned} signed but unpinned · ` +
    `${counts.notFingerprinted} signed with no fingerprint available (maths — its generator surface is not hashed yet).\n\n` +
    `"Moved" means the family's generator surface no longer matches the fingerprint recorded when it\n` +
    `was signed: the signature describes a version that no longer exists. "Depth" is measured by\n` +
    `generating to exhaustion, not read off a bank, so it counts ITEMS — an N-keyed family yields two\n` +
    `per bank sentence. Compare with \`pnpm audit:signed-depth\` before quoting a depth figure.\n\n` +
    `| family | district | tiers | build | signature | fingerprint | generable depth |\n` +
    `|---|---|---|---|---|---|---|\n${body}\n`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');
  const mdPath = join(OUT_DIR, `${base}.md`);
  const jsonPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(mdPath, md);
  writeFileSync(jsonPath, JSON.stringify({ kind: FAMILY, ...stamp, counts, rows }, null, 2));
  for (const p of [mdPath, jsonPath]) deliver(p, FAMILY);
  console.log(`${counts.total} families · ${counts.signed} signed · ${counts.moved} moved · ${counts.unpinned} unpinned · ${counts.notFingerprinted} not fingerprinted`);
  await prisma.$disconnect();
}

// Only when run directly — importing this for its source builder must not run the export.
if (process.argv[1]?.endsWith('export-family-status.ts')) void main();
