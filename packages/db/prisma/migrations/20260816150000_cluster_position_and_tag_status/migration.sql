-- Item order is FILE POSITION, taken from Cowork's manifest and served unshuffled.
ALTER TABLE "Item" ADD COLUMN "clusterPosition" INTEGER;
-- A provisional tag must not import as a settled one.
ALTER TABLE "ItemOption" ADD COLUMN "tagStatus" TEXT;
