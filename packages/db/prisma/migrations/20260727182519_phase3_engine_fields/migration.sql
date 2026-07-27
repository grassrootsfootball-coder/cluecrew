-- AlterTable
ALTER TABLE "CaseFile" ADD COLUMN     "lastPracticedAt" TIMESTAMP(3),
ADD COLUMN     "taughtBackAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "lastUsedMode" TEXT,
ADD COLUMN     "streakWeeks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "calibrationFlaggedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Misconception" ADD COLUMN     "teachback" JSONB;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "engineState" JSONB;
