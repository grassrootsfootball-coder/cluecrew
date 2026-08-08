import { prisma } from '../packages/db/src/index';
async function main(){
  await prisma.misconception.upsert({
    where:{ id:'en-vocab-not-this-word' },
    create:{ id:'en-vocab-not-this-word', district:'ENGLISH', description:'Child chooses "a park keeper" for "tramp" where the answer is "a person with no settled home", picking a meaning that belongs to neither sense of the word.', childHint:'That meaning belongs to a different word. Read the sentence again.', status:'ACTIVE', proposedBy:'current-reviewer', recordedBy:'human:david@cluecrew.test', approvedBy:'current-reviewer', approvalMethod:'written review — vocabulary in context, annie 2026-08-08', category:'vocabulary' },
    update:{ childHint:'That meaning belongs to a different word. Read the sentence again.', status:'ACTIVE', recordedBy:'human:david@cluecrew.test', approvedBy:'current-reviewer', approvalMethod:'written review — vocabulary in context, annie 2026-08-08' },
  });
  console.log('PROPOSED en-vocab-not-this-word');
  const sec = await prisma.misconception.findUnique({ where:{ id:'en-vocab-secondary-sense' } });
  console.log('en-vocab-secondary-sense:', sec? sec.status : 'MISSING');
  await prisma.$disconnect();
}
void main();
