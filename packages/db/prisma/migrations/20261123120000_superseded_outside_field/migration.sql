-- R358 / R1042: superseded values move OUT of the field they replaced, into a sibling column.
-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "superseded" JSONB;

-- AlterTable
ALTER TABLE "ItemOption" ADD COLUMN     "superseded" JSONB;
