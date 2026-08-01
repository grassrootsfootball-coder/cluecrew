/**
 * ADDENDUM-E §2 ingestion (standing prompt): corpus-proposed misconceptions
 * land PROPOSED with provenance, unusable until a named reviewer approves.
 * Parses the pass-1/pass-2 proposal tables (proposedId | types/engines |
 * description | childHint draft); ids are cited, source text never copied
 * beyond the analyst's own drafted descriptions.
 *
 * Run: pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-corpus-misconceptions.ts <file> <district>
 */
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';

async function main(): Promise<void> {
  const [file, district] = process.argv.slice(2);
  if (!file || !['VR', 'NVR'].includes(district ?? '')) {
    console.error('usage: … <proposals.md> <VR|NVR>');
    process.exit(1);
  }
  const text = readFileSync(file, 'utf8');
  const tableStart = text.indexOf('| proposedId');
  if (tableStart === -1) throw new Error('no proposals table found');
  const rows = text
    .slice(tableStart)
    .split('\n')
    .filter((line) => line.startsWith('|') && !line.startsWith('| proposedId') && !line.startsWith('|--') && !line.startsWith('| ---'))
    .map((line) => line.split('|').map((cell) => cell.trim()).filter(Boolean));

  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    if (row.length < 4) continue;
    const [proposedId, types, description, childHint] = row;
    const id = proposedId!.replace(/[`*]/g, '');
    if (!/^[a-z0-9-]+$/.test(id)) continue;
    const existing = await prisma.misconception.findUnique({ where: { id } });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.misconception.create({
      data: {
        id,
        district: district as 'VR' | 'NVR',
        description: `${description} (types: ${types})`,
        childHint: childHint!,
        status: 'PROPOSED',
        proposedBy: 'ai-corpus:v1',
        sourcePattern: `corpus:${file.split('/').pop()}#${id}`,
      },
    });
    created += 1;
  }
  console.log(`${district}: ${created} PROPOSED misconception(s) imported, ${skipped} already present.`);
  await prisma.$disconnect();
}

void main();
