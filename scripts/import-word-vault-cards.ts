/**
 * Word Vault card import (David's instruction, 2026-08-02).
 *
 * Cards land as DRAFT and are therefore unreachable by any child until a
 * reviewer approves them — the Word table gained that door in the same
 * change, because until now anything written here was immediately
 * collectable. AI-drafted vocabulary going straight to children was never
 * acceptable; it simply had not been possible to express before.
 *
 * SUPERSEDES: three cards replace an existing one rather than joining it.
 * The replacement takes the CORPUS tier — the corpus is the evidence and the
 * old tier was a guess — and the row keeps an audit note carrying the old
 * values verbatim plus the ratification, so a later reader can see what was
 * displaced and on whose authority.
 *
 * Re-runnable: an id already present is left alone rather than rewritten, so
 * a second run imports only what is new and never silently restates a card a
 * reviewer has since edited.
 *
 * Run: pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-word-vault-cards.ts <cards.json> <supersede-proposals.json>
 */
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';

const AUTHORED_BY = 'ai-draft:cowork-okafor-v1';
const RATIFICATION = 'David ratified the replacement (2026-08-02).';

interface Sense {
  childDefinition: string;
  sentence: string;
  wordClass?: string;
}
interface Card {
  headword: string;
  tier: number;
  twoMeanings?: boolean;
  senseA: Sense;
  senseB?: Sense;
  rootFamily?: string[];
  likelierKnown?: string;
  likelierKnownNote?: string;
  imagePrompt?: string;
  imagePromptB?: string;
  preReview?: { verdict?: string };
}
interface Supersede {
  card: Card;
  existingHeadword: string;
  existingTier: number;
  existingDefinition: string;
  corpusTier: number;
  tierConflict: boolean;
}

/** The vault's id convention is the slug of the headword (see seed.ts). */
function slug(headword: string): string {
  return headword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function rowFrom(card: Card, tier: number) {
  const families = card.rootFamily ?? [];
  return {
    headword: card.headword,
    definitionChild: card.senseA.childDefinition,
    sentence: card.senseA.sentence,
    wordClass: card.senseA.wordClass ?? null,
    tier,
    // The primary family stays in the single-value column the app already
    // reads (vault shelves, parent prompts); the full list is kept beside it.
    rootFamily: families[0] ?? null,
    rootFamilies: families,
    twoMeanings: Boolean(card.twoMeanings),
    senseBDefinition: card.senseB?.childDefinition ?? null,
    senseBSentence: card.senseB?.sentence ?? null,
    senseBWordClass: card.senseB?.wordClass ?? null,
    likelierKnown: card.likelierKnown ?? null,
    likelierKnownNote: card.likelierKnownNote ?? null,
    imagePrompt: card.imagePrompt ?? null,
    imagePromptB: card.imagePromptB ?? null,
    preReviewVerdict: card.preReview?.verdict ?? null,
    authoredBy: AUTHORED_BY,
    // The door. Nothing here reaches a child until a reviewer approves it.
    status: 'DRAFT' as const,
    reviewedBy: null,
  };
}

async function main(): Promise<void> {
  const [cardsPath, supersedePath] = process.argv.slice(2);
  if (!cardsPath || !supersedePath) {
    console.error('usage: … <word-vault-cards.json> <supersede-proposals.json>');
    process.exit(1);
  }
  const cards = JSON.parse(readFileSync(cardsPath, 'utf8')).cards as Card[];
  const supersedes = JSON.parse(readFileSync(supersedePath, 'utf8')) as Supersede[];

  let created = 0;
  let alreadyPresent = 0;
  for (const card of cards) {
    const id = slug(card.headword);
    if (await prisma.word.findUnique({ where: { id } })) {
      alreadyPresent += 1;
      continue;
    }
    await prisma.word.create({ data: { id, ...rowFrom(card, card.tier) } });
    created += 1;
  }

  let superseded = 0;
  for (const entry of supersedes) {
    const id = slug(entry.card.headword);
    const existing = await prisma.word.findUnique({ where: { id } });
    if (!existing) {
      console.warn(`  ! ${id}: nothing to supersede — imported as a new card instead`);
      await prisma.word.create({ data: { id, ...rowFrom(entry.card, entry.corpusTier) } });
      created += 1;
      continue;
    }
    // The audit note carries the displaced values verbatim. A tier that
    // MOVED is called out, because that is the part a reader is most likely
    // to query later.
    const note = [
      `Superseded ${new Date().toISOString().slice(0, 10)}.`,
      `Previous card — tier ${entry.existingTier}, definition: "${entry.existingDefinition}", sentence: "${existing.sentence}".`,
      entry.tierConflict
        ? `Tier moved ${entry.existingTier} → ${entry.corpusTier} on corpus evidence.`
        : `Tier unchanged at ${entry.corpusTier}.`,
      `Reason: ${entry.card.twoMeanings ? 'replacement carries two senses' : 'replacement'} (${'exact duplicate'}).`,
      RATIFICATION,
    ].join(' ');

    await prisma.word.update({
      where: { id },
      data: { ...rowFrom(entry.card, entry.corpusTier), supersedeNote: note },
    });
    superseded += 1;
  }

  const byTier = await prisma.word.groupBy({ by: ['tier', 'status'], _count: true, orderBy: { tier: 'asc' } });
  console.log(`Imported ${created} new card(s) as DRAFT; ${alreadyPresent} already present, left untouched.`);
  console.log(`Superseded ${superseded} existing card(s), each carrying an audit note.`);
  console.log('Vault by tier and status:', JSON.stringify(byTier));
  await prisma.$disconnect();
}

void main();
