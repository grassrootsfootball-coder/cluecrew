-- AlterTable
ALTER TABLE "ContentWriteLog" ALTER COLUMN "changedColumns" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "lineRefs" JSONB,
ADD COLUMN     "testedTokens" JSONB;
