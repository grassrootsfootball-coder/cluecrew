import { prisma } from '../packages/db/src/index';
async function main(){
  await prisma.misconception.upsert({
    where:{ id:'en-vocab-not-this-word' },
    create:{ id:'en-vocab-not-this-word', district:'ENGLISH', description:'Child chooses "a park keeper" for "tramp" where the answer is "a person with no settled home", picking a meaning that belongs to neither sense of the word.', childHint:'Both meanings of this word are close to the sentence. Choose the one it fits.', status:'PROPOSED', proposedBy:'current-reviewer', category:'vocabulary' },
    update:{},
  });
  console.log('PROPOSED en-vocab-not-this-word');
  const sec = await prisma.misconception.findUnique({ where:{ id:'en-vocab-secondary-sense' } });
  console.log('en-vocab-secondary-sense:', sec? sec.status : 'MISSING');
  await prisma.$disconnect();
}
void main();
