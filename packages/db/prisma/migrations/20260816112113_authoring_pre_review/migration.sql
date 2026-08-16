-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "authoringPreReview" JSONB,
ADD COLUMN     "authoringPreReviewHash" TEXT;
