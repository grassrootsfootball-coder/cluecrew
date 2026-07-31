-- ADDENDUM-E: misconception approval status + the similarity gate columns.
CREATE TYPE "MisconceptionStatus" AS ENUM ('PROPOSED', 'ACTIVE');

-- Existing misconceptions were authored and reviewed through the Phase 2 CMS
-- pipeline, so they default ACTIVE; only corpus imports land PROPOSED.
ALTER TABLE "Misconception" ADD COLUMN "status" "MisconceptionStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Misconception" ADD COLUMN "proposedBy" TEXT;
ALTER TABLE "Misconception" ADD COLUMN "sourcePattern" TEXT;
ALTER TABLE "Misconception" ADD COLUMN "approvedBy" TEXT;

ALTER TABLE "Item" ADD COLUMN "similarityFlaggedAt" TIMESTAMP(3);
ALTER TABLE "Item" ADD COLUMN "similarityScore" DOUBLE PRECISION;
ALTER TABLE "Item" ADD COLUMN "similarityClearedBy" TEXT;
ALTER TABLE "Item" ADD COLUMN "similarityClearNote" TEXT;
