-- AMENDMENT-1 (Pricing V2). Hand-written: the Tier enum changes meaning and
-- existing subscriptions must map onto the new ladder, not be dropped.
--   TWO_YEAR → FULL_24 · ONE_YEAR → FULL_12 · SUMMER stays.
CREATE TYPE "Tier_new" AS ENUM ('FULL_24', 'FULL_12', 'FULL_ROLLING', 'PLUS_ROLLING', 'SUMMER');
ALTER TABLE "Subscription" ALTER COLUMN "tier" TYPE "Tier_new"
  USING (CASE "tier"::text
    WHEN 'TWO_YEAR' THEN 'FULL_24'
    WHEN 'ONE_YEAR' THEN 'FULL_12'
    ELSE 'SUMMER'
  END)::"Tier_new";
DROP TYPE "Tier";
ALTER TYPE "Tier_new" RENAME TO "Tier";

-- The free Crew tier's open cases (§5.1); selection lands via seed + ratification.
ALTER TABLE "Case" ADD COLUMN "freeTier" BOOLEAN NOT NULL DEFAULT false;

-- Crew Plus teacher reviews (§3).
CREATE TYPE "ReviewRecordingStatus" AS ENUM ('QUEUED', 'RECORDED', 'RELEASED', 'CREDITED');
CREATE TABLE "ReviewRecording" (
  "id" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "videoRef" TEXT,
  "checklistAttestedBy" TEXT,
  "spotCheckedBy" TEXT,
  "status" "ReviewRecordingStatus" NOT NULL DEFAULT 'QUEUED',
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewRecording_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReviewRecording_childId_month_key" ON "ReviewRecording"("childId", "month");
CREATE INDEX "ReviewRecording_status_createdAt_idx" ON "ReviewRecording"("status", "createdAt");
ALTER TABLE "ReviewRecording" ADD CONSTRAINT "ReviewRecording_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PlusWaitlistEntry" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlusWaitlistEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlusWaitlistEntry_parentId_key" ON "PlusWaitlistEntry"("parentId");
ALTER TABLE "PlusWaitlistEntry" ADD CONSTRAINT "PlusWaitlistEntry_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
