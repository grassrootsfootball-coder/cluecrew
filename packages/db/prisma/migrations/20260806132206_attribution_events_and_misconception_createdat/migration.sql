-- CreateEnum
CREATE TYPE "AttributionAction" AS ENUM ('AUTHORED', 'APPROVED', 'AMENDED', 'SIGNED', 'REASSIGNED', 'UNATTRIBUTED');

-- AlterTable
ALTER TABLE "Misconception" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "AttributionEvent" (
    "id" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" "AttributionAction" NOT NULL,
    "actor" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "field" TEXT,
    "note" TEXT,
    "method" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttributionEvent_recordType_recordId_idx" ON "AttributionEvent"("recordType", "recordId");

-- CreateIndex
CREATE INDEX "AttributionEvent_actor_idx" ON "AttributionEvent"("actor");
