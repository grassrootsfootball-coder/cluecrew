import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';
const SRC: Array<[string,string]> = [
  ['ENG-001-WIW-10','/Users/davidb/Downloads/ENG001windinwillows (2).json'],
  ['ENG-002-pp-21','/Users/davidb/Downloads/ENG002prideprejudice (1).json'],
];
async function main(){
  for (const [id,path] of SRC){
    const batch = JSON.parse(readFileSync(path,'utf8')) as { items: Array<Record<string, unknown>> };
    const src = batch.items.find(i=>i.itemId===id)!;
    const item = await prisma.item.findUnique({ where:{id} });
    if(!item) continue;
    const ex = { ...((item.explanation ?? {}) as Record<string,unknown>) };
    ex.quotes = src.explanation.quotes;                 // declare where they are USED
    const stem = { ...((item.stem ?? {}) as Record<string,unknown>) };
    stem.quotes = (src.stem?.quotes ?? undefined);       // restore the stem's own declaration only
    if (stem.quotes === undefined) delete stem.quotes;
    await prisma.item.update({ where:{id}, data:{ explanation: ex as never, stem: stem as never } });
    console.log(`${id}: explanation.quotes set (${(src.explanation.quotes??[]).length}); stem.quotes restored to source`);
  }
  await prisma.$disconnect();
}
void main();
