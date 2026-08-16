-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "mechanismLedger" JSONB,
ADD COLUMN     "sourcedFrom" TEXT,
ADD COLUMN     "tierRationale" TEXT;

-- AlterTable
ALTER TABLE "ItemOption" ADD COLUMN     "misconceptionExecution" TEXT,
ADD COLUMN     "senseTarget" TEXT;
