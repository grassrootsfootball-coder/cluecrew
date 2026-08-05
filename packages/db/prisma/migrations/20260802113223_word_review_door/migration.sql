-- CreateEnum
CREATE TYPE "WordStatus" AS ENUM ('DRAFT', 'LIVE', 'RETIRED');

-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "authoredBy" TEXT,
ADD COLUMN     "imagePrompt" TEXT,
ADD COLUMN     "imagePromptB" TEXT,
ADD COLUMN     "likelierKnown" TEXT,
ADD COLUMN     "likelierKnownNote" TEXT,
ADD COLUMN     "preReviewVerdict" TEXT,
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "rootFamilies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "senseBDefinition" TEXT,
ADD COLUMN     "senseBSentence" TEXT,
ADD COLUMN     "senseBWordClass" TEXT,
ADD COLUMN     "status" "WordStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "supersedeNote" TEXT,
ADD COLUMN     "twoMeanings" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wordClass" TEXT;

-- CreateIndex
CREATE INDEX "Word_status_tier_idx" ON "Word"("status", "tier");

-- CreateIndex
CREATE INDEX "Word_twoMeanings_status_idx" ON "Word"("twoMeanings", "status");

-- The 120 words that predate the review door were already being served to
-- children, so they are LIVE by definition. Backfilling them explicitly (and
-- naming their provenance) means the DRAFT default is safe to fail closed for
-- everything written from now on.
UPDATE "Word" SET "status" = 'LIVE', "authoredBy" = COALESCE("authoredBy", 'seed')
WHERE "status" = 'DRAFT';

-- A two-sense card without a second sense is a claim the data does not
-- support; the "Two Meanings" pool would draw it and find nothing to ask.
ALTER TABLE "Word"
  ADD CONSTRAINT "word_two_meanings_needs_sense_b"
  CHECK (
    "twoMeanings" = false
    OR ("senseBDefinition" IS NOT NULL AND "senseBSentence" IS NOT NULL)
  );

-- A LIVE card must name the human who approved it (P3 discipline, applied to
-- the vault for the first time).
ALTER TABLE "Word"
  ADD CONSTRAINT "word_live_needs_reviewer"
  CHECK ("status" <> 'LIVE' OR "reviewedBy" IS NOT NULL OR "authoredBy" = 'seed');
