-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('NONE', 'AUTHOR', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BursaryStatus" AS ENUM ('RECEIVED', 'APPROVED', 'DECLINED', 'WAITLISTED');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "reviewNotes" TEXT;

-- AlterTable
ALTER TABLE "ParentAccount" ADD COLUMN     "staffRole" "StaffRole" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "firstPaidAt" TIMESTAMP(3),
ADD COLUMN     "isBursary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastStripeEventAt" TIMESTAMP(3),
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BursaryApplication" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "status" "BursaryStatus" NOT NULL DEFAULT 'RECEIVED',
    "confirmation" TEXT NOT NULL,
    "evidence" BYTEA,
    "evidenceName" TEXT,
    "evidenceMime" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "evidencePurgeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BursaryApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetKind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "examFormat" TEXT NOT NULL,
    "formatSummary" TEXT NOT NULL,
    "typicalTestMonth" TEXT NOT NULL,
    "subjects" "District"[],
    "exampleSchools" JSONB NOT NULL,
    "notes" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "lastVerified" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BursaryApplication_status_createdAt_idx" ON "BursaryApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetKind_targetId_idx" ON "AdminAuditLog"("targetKind", "targetId");

-- AddForeignKey
ALTER TABLE "BursaryApplication" ADD CONSTRAINT "BursaryApplication_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
