-- CreateEnum
CREATE TYPE "ItemPool" AS ENUM ('PRACTICE', 'MOCK');

-- CreateEnum
CREATE TYPE "MockSittingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- DropIndex
DROP INDEX "Item_questionTypeId_status_idx";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "pool" "ItemPool" NOT NULL DEFAULT 'PRACTICE';

-- CreateTable
CREATE TABLE "MockSitting" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "servedItemIds" JSONB NOT NULL,
    "sectionTimings" JSONB NOT NULL,
    "responses" JSONB NOT NULL,
    "status" "MockSittingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "stateVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockSitting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MockSitting_childId_blueprintId_status_idx" ON "MockSitting"("childId", "blueprintId", "status");

-- CreateIndex
CREATE INDEX "MockSitting_childId_createdAt_idx" ON "MockSitting"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "Item_questionTypeId_status_pool_idx" ON "Item"("questionTypeId", "status", "pool");

-- AddForeignKey
ALTER TABLE "MockSitting" ADD CONSTRAINT "MockSitting_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
