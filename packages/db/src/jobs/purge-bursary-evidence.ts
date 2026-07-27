/**
 * Retention job (BUILD-PHASE-2 §6): bursary evidence is removed 30 days after
 * the decision. Only the encrypted blob and file metadata are cleared; the
 * application row (status, dates) remains for capacity accounting.
 */
import { prisma } from '../index';

export async function purgeBursaryEvidence(now = new Date()): Promise<{ purged: number }> {
  const result = await prisma.bursaryApplication.updateMany({
    where: { evidencePurgeAt: { not: null, lte: now }, evidence: { not: null } },
    data: { evidence: null, evidenceName: null, evidenceMime: null, evidencePurgeAt: null },
  });
  return { purged: result.count };
}

const isDirectRun = process.argv[1]?.endsWith('purge-bursary-evidence.ts');
if (isDirectRun) {
  purgeBursaryEvidence()
    .then(({ purged }) => {
      console.log(`Bursary evidence purge complete: ${purged} application(s) cleared.`);
      return prisma.$disconnect();
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
