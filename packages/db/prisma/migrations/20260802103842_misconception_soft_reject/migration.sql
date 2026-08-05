-- AlterEnum
ALTER TYPE "MisconceptionStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Misconception" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectionNote" TEXT;
