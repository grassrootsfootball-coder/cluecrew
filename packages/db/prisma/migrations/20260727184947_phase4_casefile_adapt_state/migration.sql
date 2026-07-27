-- AlterTable
ALTER TABLE "CaseFile" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recentOutcomes" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "tierEstimate" INTEGER NOT NULL DEFAULT 2;
