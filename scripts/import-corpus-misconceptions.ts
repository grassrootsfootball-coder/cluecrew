/**
 * ADDENDUM-E §2 ingestion (standing prompt): corpus-proposed misconceptions
 * land PROPOSED with provenance, unusable until a named reviewer approves.
 * Corpus findings are evidence, not instructions — the approval is the door.
 *
 * Two input forms:
 *   - the §2 artefact contract, `misconception-import.json`:
 *     { misconceptions: [{ id, district, description, childHint,
 *                          sourcePattern, proposedBy, approvedBy }] }
 *     — approvedBy in the FILE is ignored: only a reviewer acting in the CMS
 *       can activate an entry, and honouring a file's claim to approval would
 *       be a door that opens from the outside.
 *   - the earlier pass tables (markdown: proposedId | types | description |
 *     childHint), kept so the pass-1/2 artefacts still import.
 *
 * Re-runnable: existing ids are left ALONE (never silently rewritten), so an
 * appended artefact imports only its new entries. Ids are cited; no source
 * text is copied beyond the analyst's own drafted descriptions.
 *
 * Run: pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-corpus-misconceptions.ts <file> [VR|NVR|MATHS|ENGLISH]
 *      (district argument is required for markdown tables, ignored for JSON,
 *       where each entry carries its own.)
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { prisma } from '../packages/db/src/index';

type District = 'VR' | 'NVR' | 'MATHS' | 'ENGLISH';
const DISTRICTS: District[] = ['VR', 'NVR', 'MATHS', 'ENGLISH'];

interface Proposal {
  id: string;
  district: District;
  description: string;
  childHint: string;
  sourcePattern: string;
}

function fromJson(text: string, file: string): Proposal[] {
  const parsed = JSON.parse(text) as {
    misconceptions?: Array<{
      id: string;
      district: string;
      description: string;
      childHint: string;
      sourcePattern?: string;
    }>;
  };
  if (!Array.isArray(parsed.misconceptions)) {
    throw new Error('not a misconception-import.json (no misconceptions array)');
  }
  return parsed.misconceptions.map((entry) => {
    if (!DISTRICTS.includes(entry.district as District)) {
      throw new Error(`entry ${entry.id}: unknown district "${entry.district}"`);
    }
    return {
      id: entry.id,
      district: entry.district as District,
      description: entry.description,
      childHint: entry.childHint,
      sourcePattern: entry.sourcePattern ?? `corpus:${basename(file)}#${entry.id}`,
    };
  });
}

function fromMarkdownTable(text: string, file: string, district: District | null): Proposal[] {
  if (!district) throw new Error('a markdown proposals table needs a district argument');
  const tableStart = text.indexOf('| proposedId');
  if (tableStart === -1) throw new Error('no proposals table found');
  const rows = text
    .slice(tableStart)
    .split('\n')
    .filter(
      (line) =>
        line.startsWith('|') &&
        !line.startsWith('| proposedId') &&
        !line.startsWith('|--') &&
        !line.startsWith('| ---'),
    )
    .map((line) => line.split('|').map((cell) => cell.trim()).filter(Boolean));

  const proposals: Proposal[] = [];
  for (const row of rows) {
    if (row.length < 4) continue;
    const [proposedId, types, description, childHint] = row;
    const id = proposedId!.replace(/[`*]/g, '');
    if (!/^[a-z0-9-]+$/.test(id)) continue;
    proposals.push({
      id,
      district,
      description: `${description} (types: ${types})`,
      childHint: childHint!,
      sourcePattern: `corpus:${basename(file)}#${id}`,
    });
  }
  return proposals;
}

async function main(): Promise<void> {
  const [file, districtArg] = process.argv.slice(2);
  if (!file) {
    console.error('usage: … <misconception-import.json | proposals.md> [VR|NVR|MATHS|ENGLISH]');
    process.exit(1);
  }
  if (districtArg && !DISTRICTS.includes(districtArg as District)) {
    console.error(`unknown district "${districtArg}"`);
    process.exit(1);
  }
  const text = readFileSync(file, 'utf8');
  const proposals = file.endsWith('.json')
    ? fromJson(text, file)
    : fromMarkdownTable(text, file, (districtArg as District) ?? null);

  const created: Record<string, number> = {};
  const skipped: Record<string, number> = {};
  for (const proposal of proposals) {
    const existing = await prisma.misconception.findUnique({ where: { id: proposal.id } });
    if (existing) {
      skipped[proposal.district] = (skipped[proposal.district] ?? 0) + 1;
      continue;
    }
    await prisma.misconception.create({
      data: {
        id: proposal.id,
        district: proposal.district,
        description: proposal.description,
        childHint: proposal.childHint,
        // The door: PROPOSED entries are structurally unusable by items until
        // a named reviewer approves them in the CMS (Addendum E §2).
        status: 'PROPOSED',
        proposedBy: 'ai-corpus:v1',
        sourcePattern: proposal.sourcePattern,
      },
    });
    created[proposal.district] = (created[proposal.district] ?? 0) + 1;
  }

  const summarise = (counts: Record<string, number>): string =>
    DISTRICTS.filter((district) => counts[district])
      .map((district) => `${district} ${counts[district]}`)
      .join(', ') || 'none';
  console.log(`Imported PROPOSED: ${summarise(created)}`);
  console.log(`Already present, left untouched: ${summarise(skipped)}`);
  await prisma.$disconnect();
}

void main();
